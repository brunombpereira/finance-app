using FinanceApp.Api.Data;
using FinanceApp.Api.Dtos;
using FinanceApp.Api.Models;
using FinanceApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Controllers;

[Authorize]
public class DashboardController : ApiControllerBase
{
    private readonly AppDbContext _db;
    private readonly AccountService _accounts;
    private readonly RecurringService _recurring;

    public DashboardController(AppDbContext db, AccountService accounts, RecurringService recurring)
    {
        _db = db;
        _accounts = accounts;
        _recurring = recurring;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary()
    {
        // Materialize due recurring transactions so every number below is consistent.
        await _recurring.MaterializeForUserAsync(UserId);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var monthStart = new DateOnly(today.Year, today.Month, 1);
        var monthEnd = monthStart.AddMonths(1);
        var lastMonthStart = monthStart.AddMonths(-1);
        var trendStart = monthStart.AddMonths(-5);

        // Accounts + net worth.
        var accounts = await _db.Accounts
            .Where(a => a.UserId == UserId)
            .OrderBy(a => a.Type).ThenBy(a => a.Name)
            .ToListAsync();
        var balances = await _accounts.GetBalancesAsync(UserId);
        var accountSummaries = accounts
            .Select(a => new AccountSummaryDto(
                a.Id, a.Name, a.Type, a.Color, a.Icon,
                balances.GetValueOrDefault(a.Id, a.InitialBalance)))
            .ToList();
        var netWorth = accountSummaries.Sum(a => a.Balance);
        var initialBalanceTotal = accounts.Sum(a => a.InitialBalance);

        // Monthly totals for the trend range (last 6 months including current) —
        // ~36 rows max, computed entirely in SQL.
        var monthlyAgg = await _db.Transactions
            .Where(t => t.UserId == UserId && t.Date >= trendStart)
            .GroupBy(t => new { t.Date.Year, t.Date.Month, t.Type })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                g.Key.Type,
                Total = g.Sum(t => t.Amount),
            })
            .ToListAsync();

        // Net worth at the end of each trend month needs the running total of
        // every transaction before that month — fetch the pre-trend totals once.
        var beforeTrendAgg = await _db.Transactions
            .Where(t => t.UserId == UserId && t.Date < trendStart)
            .GroupBy(t => t.Type)
            .Select(g => new { Type = g.Key, Total = g.Sum(t => t.Amount) })
            .ToListAsync();
        var beforeTrendIncome = beforeTrendAgg.SingleOrDefault(x => x.Type == TransactionType.Income)?.Total ?? 0m;
        var beforeTrendExpense = beforeTrendAgg.SingleOrDefault(x => x.Type == TransactionType.Expense)?.Total ?? 0m;

        // Category breakdown for this month — expenses only.
        var categoryThisMonth = await _db.Transactions
            .Where(t => t.UserId == UserId && t.Date >= monthStart && t.Date < monthEnd && t.Type == TransactionType.Expense)
            .GroupBy(t => new { t.CategoryId, Name = t.Category!.Name, Color = t.Category.Color })
            .Select(g => new { g.Key.CategoryId, g.Key.Name, g.Key.Color, Total = g.Sum(t => t.Amount) })
            .ToListAsync();

        // Same shape for last month — feeds the "top category changes" widget.
        var categoryLastMonth = await _db.Transactions
            .Where(t => t.UserId == UserId && t.Date >= lastMonthStart && t.Date < monthStart && t.Type == TransactionType.Expense)
            .GroupBy(t => new { t.CategoryId, Name = t.Category!.Name, Color = t.Category.Color })
            .Select(g => new { g.Key.CategoryId, g.Key.Name, g.Key.Color, Total = g.Sum(t => t.Amount) })
            .ToListAsync();

        decimal SumMonth(int year, int month, TransactionType type) => monthlyAgg
            .Where(m => m.Year == year && m.Month == month && m.Type == type)
            .Sum(m => m.Total);

        var monthIncome = SumMonth(today.Year, today.Month, TransactionType.Income);
        var monthExpense = SumMonth(today.Year, today.Month, TransactionType.Expense);
        var lastMonthIncome = SumMonth(lastMonthStart.Year, lastMonthStart.Month, TransactionType.Income);
        var lastMonthExpense = SumMonth(lastMonthStart.Year, lastMonthStart.Month, TransactionType.Expense);

        var spendingByCategory = categoryThisMonth
            .Select(c => new CategorySpendDto(c.CategoryId, c.Name, c.Color, c.Total))
            .OrderByDescending(c => c.Amount)
            .ToList();

        // 6-month income/expense trend.
        var trend = new List<MonthlyPointDto>();
        var netWorthTrend = new List<MonthlyNetWorthDto>();
        for (var i = 0; i < 6; i++)
        {
            var pointStart = trendStart.AddMonths(i);
            trend.Add(new MonthlyPointDto(
                pointStart.Year,
                pointStart.Month,
                SumMonth(pointStart.Year, pointStart.Month, TransactionType.Income),
                SumMonth(pointStart.Year, pointStart.Month, TransactionType.Expense)));

            // Net worth at month end = initial balances + every income up to that point
            // minus every expense up to that point. Transfers don't move total net worth.
            var incomeUpTo = beforeTrendIncome + monthlyAgg
                .Where(m => m.Type == TransactionType.Income &&
                            (m.Year < pointStart.Year || (m.Year == pointStart.Year && m.Month <= pointStart.Month)))
                .Sum(m => m.Total);
            var expenseUpTo = beforeTrendExpense + monthlyAgg
                .Where(m => m.Type == TransactionType.Expense &&
                            (m.Year < pointStart.Year || (m.Year == pointStart.Year && m.Month <= pointStart.Month)))
                .Sum(m => m.Total);
            netWorthTrend.Add(new MonthlyNetWorthDto(
                pointStart.Year, pointStart.Month,
                initialBalanceTotal + incomeUpTo - expenseUpTo));
        }

        // Top category movers: union of this/last month, ordered by absolute delta.
        var byId = new Dictionary<int, (string Name, string Color, decimal This, decimal Last)>();
        foreach (var c in categoryThisMonth)
            byId[c.CategoryId] = (c.Name, c.Color, c.Total, 0m);
        foreach (var c in categoryLastMonth)
        {
            byId.TryGetValue(c.CategoryId, out var existing);
            byId[c.CategoryId] = (c.Name, c.Color, existing.This, c.Total);
        }
        var topCategoryChanges = byId
            .Select(kv => new CategoryChangeDto(kv.Key, kv.Value.Name, kv.Value.Color, kv.Value.This, kv.Value.Last))
            .OrderByDescending(c => Math.Abs(c.ThisMonth - c.LastMonth))
            .Take(4)
            .ToList();

        // Projected net worth at month end: current net worth plus recurring rules
        // that are still due later this month.
        var rules = await _db.RecurringTransactions
            .Where(r => r.UserId == UserId && r.Active)
            .ToListAsync();
        var projectedDelta = 0m;
        foreach (var rule in rules)
        {
            var occurrence = new DateOnly(today.Year, today.Month, rule.DayOfMonth);
            if (occurrence > today && occurrence >= rule.StartDate)
                projectedDelta += rule.Type == TransactionType.Income ? rule.Amount : -rule.Amount;
        }

        return Ok(new DashboardSummaryDto(
            netWorth,
            monthIncome,
            monthExpense,
            lastMonthIncome,
            lastMonthExpense,
            netWorth + projectedDelta,
            today.Year,
            today.Month,
            accountSummaries,
            spendingByCategory,
            trend,
            netWorthTrend,
            topCategoryChanges));
    }
}
