using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.Models;

public class Investment
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public AppUser? User { get; set; }

    // Yahoo Finance ticker (e.g., "AAPL", "VWCE.DE", "BTC-EUR").
    [Required, MaxLength(20)]
    public string Symbol { get; set; } = string.Empty;

    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    public decimal Quantity { get; set; }

    // Per-unit cost in `Currency` — used for cost basis and P&L.
    public decimal AvgCost { get; set; }

    [Required, MaxLength(3)]
    public string Currency { get; set; } = "USD";

    [MaxLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
