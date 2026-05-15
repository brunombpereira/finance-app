using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.Models;

// One row per requisition (institution authorisation) created via GoCardless.
// Linked accounts are stored as a JSON-serialisable string of comma-separated ids
// to keep the model shape simple — we don't query into them.
public class BankConnection
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public AppUser? User { get; set; }

    [Required, MaxLength(40)]
    public string Provider { get; set; } = "GoCardless";

    [Required, MaxLength(80)]
    public string InstitutionId { get; set; } = string.Empty;

    [Required, MaxLength(120)]
    public string InstitutionName { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? InstitutionLogo { get; set; }

    // GoCardless requisition id — opaque token used to fetch the linked accounts.
    [Required, MaxLength(80)]
    public string RequisitionId { get; set; } = string.Empty;

    // Status from the provider: CR (created), LN (linked), EX (expired), etc.
    [Required, MaxLength(16)]
    public string Status { get; set; } = "CR";

    // Comma-separated GoCardless account ids.
    [MaxLength(2000)]
    public string AccountIds { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LinkedAt { get; set; }
    public DateTime? LastSyncedAt { get; set; }
}
