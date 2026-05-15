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

        var transactions = await _db.Transactions
            .Where(t => t.UserId == UserId)
            .Include(t => t.Category)
            .ToListAsync();

        var monthTx = transactions.Where(t => t.Date >= monthStart && t.Date < monthEnd).ToList();
        var monthIncome = monthTx.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
        var monthExpense = monthTx.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);

        var lastMonthTx = transactions
            .Where(t => t.Date >= lastMonthStart && t.Date < monthStart)
            .ToList();
        var lastMonthIncome = lastMonthTx
            .Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
        var lastMonthExpense = lastMonthTx
            .Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);

        var spendingByCategory = monthTx
            .Where(t => t.Type == TransactionType.Expense)
            .GroupBy(t => new { t.CategoryId, t.Category!.Name, t.Category.Color })
            .Select(g => new CategorySpendDto(g.Key.CategoryId, g.Key.Name, g.Key.Color, g.Sum(t => t.Amount)))
            .OrderByDescending(c => c.Amount)
            .ToList();

        // Income/expense per month for the last 6 months.
        var trend = new List<MonthlyPointDto>();
        var netWorthTrend = new List<MonthlyNetWorthDto>();
        for (var i = 0; i < 6; i++)
        {
            var pointStart = trendStart.AddMonths(i);
            var pointEnd = pointStart.AddMonths(1);
            var pointTx = transactions.Where(t => t.Date >= pointStart && t.Date < pointEnd).ToList();
            trend.Add(new MonthlyPointDto(
                pointStart.Year,
                pointStart.Month,
                pointTx.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount),
                pointTx.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount)));

            // Net worth at the end of this month (or today, for the current month).
            // Transfers never change total net worth, so only transactions matter.
            var cutoff = pointEnd.AddDays(-1) > today ? today : pointEnd.AddDays(-1);
            var upTo = transactions.Where(t => t.Date <= cutoff).ToList();
            var netWorthAtCutoff = initialBalanceTotal
                + upTo.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount)
                - upTo.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);
            netWorthTrend.Add(new MonthlyNetWorthDto(pointStart.Year, pointStart.Month, netWorthAtCutoff));
        }

        // Top category movers: expense per category, this month vs last month.
        var thisMonthByCat = monthTx
            .Where(t => t.Type == TransactionType.Expense)
            .GroupBy(t => t.CategoryId)
            .ToDictionary(g => g.Key, g => g.Sum(t => t.Amount));
        var lastMonthByCat = lastMonthTx
            .Where(t => t.Type == TransactionType.Expense)
            .GroupBy(t => t.CategoryId)
            .ToDictionary(g => g.Key, g => g.Sum(t => t.Amount));
        var categoryInfo = transactions
            .Where(t => t.Category is not null)
            .GroupBy(t => t.CategoryId)
            .ToDictionary(g => g.Key, g => g.First().Category!);
        var topCategoryChanges = thisMonthByCat.Keys
            .Union(lastMonthByCat.Keys)
            .Where(id => categoryInfo.ContainsKey(id))
            .Select(id => new CategoryChangeDto(
                id,
                categoryInfo[id].Name,
                categoryInfo[id].Color,
                thisMonthByCat.GetValueOrDefault(id, 0m),
                lastMonthByCat.GetValueOrDefault(id, 0m)))
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
