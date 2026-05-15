using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.Models;

// A rule that materializes into a Transaction on a given day each month
// (e.g. salary on the 1st, rent on the 5th).
public class RecurringTransaction
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public AppUser? User { get; set; }

    public decimal Amount { get; set; }

    public TransactionType Type { get; set; }

    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    public int AccountId { get; set; }
    public Account? Account { get; set; }

    // Day of the month the transaction recurs on (1-28 to stay valid every month).
    public int DayOfMonth { get; set; }

    [MaxLength(280)]
    public string Note { get; set; } = string.Empty;

    public bool Active { get; set; } = true;

    public DateOnly StartDate { get; set; }

    // Last occurrence date that was materialized into a Transaction.
    public DateOnly? LastRunDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
