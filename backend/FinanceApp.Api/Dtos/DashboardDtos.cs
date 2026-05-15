using FinanceApp.Api.Models;

namespace FinanceApp.Api.Dtos;

public record CategorySpendDto(int CategoryId, string CategoryName, string Color, decimal Amount);

public record MonthlyPointDto(int Year, int Month, decimal Income, decimal Expense);

public record MonthlyNetWorthDto(int Year, int Month, decimal NetWorth);

public record CategoryChangeDto(
    int CategoryId,
    string CategoryName,
    string Color,
    decimal ThisMonth,
    decimal LastMonth);

public record AccountSummaryDto(
    int Id,
    string Name,
    AccountType Type,
    string Color,
    string Icon,
    decimal Balance);

public record DashboardSummaryDto(
    decimal NetWorth,
    decimal MonthIncome,
    decimal MonthExpense,
    decimal LastMonthIncome,
    decimal LastMonthExpense,
    decimal ProjectedMonthEnd,
    int Year,
    int Month,
    IReadOnlyList<AccountSummaryDto> Accounts,
    IReadOnlyList<CategorySpendDto> SpendingByCategory,
    IReadOnlyList<MonthlyPointDto> MonthlyTrend,
    IReadOnlyList<MonthlyNetWorthDto> NetWorthTrend,
    IReadOnlyList<CategoryChangeDto> TopCategoryChanges);
