using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.Models;

public class Category
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public AppUser? User { get; set; }

    [Required, MaxLength(60)]
    public string Name { get; set; } = string.Empty;

    public TransactionType Type { get; set; }

    [MaxLength(20)]
    public string Color { get; set; } = "#64748b";

    [MaxLength(40)]
    public string Icon { get; set; } = "tag";

    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public ICollection<Budget> Budgets { get; set; } = new List<Budget>();
}
