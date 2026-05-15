namespace FinanceApp.Api.Dtos;

public record CategoryAmountDto(int CategoryId, string Name, string Color, decimal Amount);

public record MonthlyTotalDto(int Year, int Month, decimal Income, decimal Expense);

public record ReportSummaryDto(
    DateOnly From,
    DateOnly To,
    decimal TotalIncome,
    decimal TotalExpense,
    decimal Net,
    // Same-length window immediately before `From` — for period-over-period deltas.
    decimal PrevTotalIncome,
    decimal PrevTotalExpense,
    decimal PrevNet,
    IReadOnlyList<MonthlyTotalDto> Monthly,
    IReadOnlyList<CategoryAmountDto> TopExpenses,
    IReadOnlyList<CategoryAmountDto> TopIncome);
