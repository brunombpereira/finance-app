using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.Dtos;

public record InvestmentDto(
    int Id,
    string Symbol,
    string Name,
    decimal Quantity,
    decimal AvgCost,
    string Currency,
    string? Notes,
    DateTime CreatedAt,
    // Live valuation fields — null when the price provider couldn't fetch a price.
    decimal? CurrentPrice,
    decimal? CurrentValue,
    decimal CostBasis,
    decimal? ProfitLoss,
    decimal? ProfitLossPct,
    DateTime? PriceFetchedAt);

public record InvestmentInputDto(
    [Required, MaxLength(20)] string Symbol,
    [Required, MaxLength(120)] string Name,
    [Range(0.000001, 999999999)] decimal Quantity,
    [Range(0, 9999999999.99)] decimal AvgCost,
    [Required, MaxLength(3)] string Currency,
    [MaxLength(500)] string? Notes);

// One row per currency present in the portfolio, totalling positions in that currency.
public record CurrencyTotalDto(
    string Currency,
    decimal CostBasis,
    decimal CurrentValue,
    decimal ProfitLoss,
    decimal ProfitLossPct);

public record InvestmentsSummaryDto(
    IReadOnlyList<InvestmentDto> Items,
    IReadOnlyList<CurrencyTotalDto> Totals);
