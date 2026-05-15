using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.Models;

public class Transaction
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public AppUser? User { get; set; }

    public decimal Amount { get; set; }

    public DateOnly Date { get; set; }

    public TransactionType Type { get; set; }

    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    public int AccountId { get; set; }
    public Account? Account { get; set; }

    [MaxLength(280)]
    public string Note { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
