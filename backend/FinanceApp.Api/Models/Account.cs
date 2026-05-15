using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.Models;

// A place where money sits — checking, savings, cash, credit card.
// The balance is not stored; it is derived from InitialBalance plus the
// transactions and transfers that touch the account.
public class Account
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public AppUser? User { get; set; }

    [Required, MaxLength(60)]
    public string Name { get; set; } = string.Empty;

    public AccountType Type { get; set; }

    public decimal InitialBalance { get; set; }

    [MaxLength(20)]
    public string Color { get; set; } = "#6366f1";

    [MaxLength(40)]
    public string Icon { get; set; } = "wallet";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
