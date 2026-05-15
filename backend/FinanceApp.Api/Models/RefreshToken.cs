using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.Models;

// A long-lived token the client exchanges for a fresh access token.
// Stored server-side so it can be revoked (logout, password change).
public class RefreshToken
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public AppUser? User { get; set; }

    [Required, MaxLength(128)]
    public string Token { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? RevokedAt { get; set; }

    public bool IsActive => RevokedAt is null && ExpiresAt > DateTime.UtcNow;
}
