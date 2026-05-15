using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.Models;

// Moves money between two of the user's accounts. Not a transaction:
// it has no category and does not count as income or expense.
public class Transfer
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public AppUser? User { get; set; }

    public int FromAccountId { get; set; }
    public Account? FromAccount { get; set; }

    public int ToAccountId { get; set; }
    public Account? ToAccount { get; set; }

    public decimal Amount { get; set; }

    public DateOnly Date { get; set; }

    [MaxLength(280)]
    public string Note { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
