using FinanceApp.Api.Data;
using FinanceApp.Api.Dtos;
using FinanceApp.Api.Models;
using FinanceApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Controllers;

public class AuthController : ApiControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly TokenService _tokenService;
    private readonly IEmailSender _emailSender;
    private readonly IConfiguration _config;
    private readonly AppDbContext _db;

    public AuthController(
        UserManager<AppUser> userManager,
        TokenService tokenService,
        IEmailSender emailSender,
        IConfiguration config,
        AppDbContext db)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _emailSender = emailSender;
        _config = config;
        _db = db;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
    {
        if (await _userManager.FindByEmailAsync(dto.Email) is not null)
            return Conflict(new { message = "Já existe uma conta com este email." });

        var user = new AppUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            DisplayName = dto.DisplayName,
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        _db.Categories.AddRange(DefaultCategories.For(user.Id));
        _db.Accounts.AddRange(DefaultAccounts.For(user.Id));
        await _db.SaveChangesAsync();

        return await BuildResponseAsync(user);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user is null || !await _userManager.CheckPasswordAsync(user, dto.Password))
            return Unauthorized(new { message = "Email ou password inválidos." });

        return await BuildResponseAsync(user);
    }

    // Exchanges a valid refresh token for a fresh access token, rotating the refresh token.
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh(RefreshDto dto)
    {
        var existing = await _db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == dto.RefreshToken);
        if (existing is null || !existing.IsActive || existing.User is null)
            return Unauthorized(new { message = "Sessão inválida. Inicia sessão novamente." });

        existing.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await BuildResponseAsync(existing.User);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshDto dto)
    {
        var token = await _db.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == dto.RefreshToken);
        if (token is not null && token.RevokedAt is null)
        {
            token.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
        return NoContent();
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
    {
        var user = await _userManager.FindByIdAsync(UserId);
        if (user is null) return Unauthorized();

        var result = await _userManager.ChangePasswordAsync(
            user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded)
            return BadRequest(new
            {
                message = "Password atual incorreta ou nova password inválida.",
            });

        return NoContent();
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user is not null)
        {
            var resetToken = new PasswordResetToken
            {
                UserId = user.Id,
                Token = TokenService.GenerateSecureToken(),
                ExpiresAt = DateTime.UtcNow.AddHours(1),
            };
            _db.PasswordResetTokens.Add(resetToken);
            await _db.SaveChangesAsync();

            var frontendUrl = _config["App:FrontendUrl"]
                ?? $"{Request.Scheme}://{Request.Host}";
            var link = $"{frontendUrl}/reset-password?token={resetToken.Token}";
            await _emailSender.SendAsync(
                user.Email!,
                "Recuperar a tua password — Nexo Finance",
                $"Olá {user.DisplayName},\n\n" +
                "Pediste para recuperar a tua password. Clica no link para definires uma " +
                $"nova (válido 1 hora):\n{link}\n\nSe não foste tu, ignora este email.");
        }

        // Always 200 — never reveal whether an email is registered.
        return Ok(new
        {
            message = "Se o email existir, enviámos um link para recuperar a password.",
        });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
    {
        var resetToken = await _db.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == dto.Token);
        if (resetToken is null || !resetToken.IsActive || resetToken.User is null)
            return BadRequest(new { message = "Link inválido ou expirado." });

        var user = resetToken.User;
        var identityToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, identityToken, dto.NewPassword);
        if (!result.Succeeded)
            return BadRequest(new { message = "Não foi possível redefinir a password." });

        resetToken.UsedAt = DateTime.UtcNow;
        // A password reset invalidates every existing session.
        var activeTokens = await _db.RefreshTokens
            .Where(t => t.UserId == user.Id && t.RevokedAt == null)
            .ToListAsync();
        foreach (var token in activeTokens)
            token.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private async Task<AuthResponseDto> BuildResponseAsync(AppUser user)
    {
        var (token, expiresAt) = _tokenService.CreateAccessToken(user);
        var refreshToken = await _tokenService.CreateRefreshTokenAsync(user.Id);
        return new AuthResponseDto(
            token, refreshToken.Token, user.Email!, user.DisplayName, expiresAt);
    }
}
