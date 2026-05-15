using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.Dtos;

public record RegisterDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    [Required, MaxLength(80)] string DisplayName);

public record LoginDto(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record AuthResponseDto(
    string Token,
    string RefreshToken,
    string Email,
    string DisplayName,
    DateTime ExpiresAt);

public record RefreshDto([Required] string RefreshToken);

public record ChangePasswordDto(
    [Required] string CurrentPassword,
    [Required, MinLength(6)] string NewPassword);

public record ForgotPasswordDto([Required, EmailAddress] string Email);

public record ResetPasswordDto(
    [Required] string Token,
    [Required, MinLength(6)] string NewPassword);
