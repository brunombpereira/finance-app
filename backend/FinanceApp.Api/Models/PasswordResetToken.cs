using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.Models;

// A short-lived, single-use token sent by email so a user can reset a forgotten password.
public class PasswordResetToken
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public AppUser? User { get; set; }

    [Required, MaxLength(128)]
    public string Token { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UsedAt { get; set; }

    public bool IsActive => UsedAt is null && ExpiresAt > DateTime.UtcNow;
}
