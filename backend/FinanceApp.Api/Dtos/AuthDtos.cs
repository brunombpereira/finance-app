using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.Dtos;

public record RegisterDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    [Required, MaxLength(80)] string DisplayName);

public record LoginDto(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record AuthResponseDto(string Token, string Email, string DisplayName, DateTime ExpiresAt);
