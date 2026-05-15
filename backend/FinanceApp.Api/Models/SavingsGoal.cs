using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.Models;

public class SavingsGoal
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public AppUser? User { get; set; }

    [Required, MaxLength(80)]
    public string Name { get; set; } = string.Empty;

    public decimal TargetAmount { get; set; }

    // Manual progress, used only when the goal is not linked to an account.
    public decimal CurrentAmount { get; set; }

    // When set, the goal's progress is derived from this savings account's balance.
    public int? AccountId { get; set; }
    public Account? Account { get; set; }

    public DateOnly? TargetDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
