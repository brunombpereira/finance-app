using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.Models;

public class Budget
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public AppUser? User { get; set; }

    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    public int Year { get; set; }

    public int Month { get; set; }

    public decimal LimitAmount { get; set; }
}
