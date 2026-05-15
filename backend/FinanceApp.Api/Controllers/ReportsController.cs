using FinanceApp.Api.Data;
using FinanceApp.Api.Dtos;
using FinanceApp.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Controllers;

[Authorize]
public class ReportsController : ApiControllerBase
{
    private readonly AppDbContext _db;

    public ReportsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<ReportSummaryDto>> Get(
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to,
        CancellationToken ct)
    {
        if (from > to)
            return BadRequest(new { message = "A data inicial tem de ser anterior à final." });
        if (to.DayNumber - from.DayNumber > 365 * 5)
            return BadRequest(new { message = "Período demasiado longo (máximo 5 anos)." });

        // All aggregations run as SQL GROUP BY — for "Este ano" with thousands of
        // transactions the controller stays bounded to ~24 + N_categories rows.

        // Year/month/type totals — covers the monthly breakdown and the overall totals.
        var monthlyAgg = await _db.Transactions
            .Where(t => t.UserId == UserId && t.Date >= from && t.Date <= to)
            .GroupBy(t => new { t.Date.Year, t.Date.Month, t.Type })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                g.Key.Type,
                Total = g.Sum(t => t.Amount),
            })
            .ToListAsync(ct);

        // Category breakdowns for the period — joined via the category nav.
        var categoryAgg = await _db.Transactions
            .Where(t => t.UserId == UserId && t.Date >= from && t.Date <= to)
            .GroupBy(t => new { t.CategoryId, Name = t.Category!.Name, Color = t.Category.Color, t.Type })
            .Select(g => new
            {
                g.Key.CategoryId,
                g.Key.Name,
                g.Key.Color,
                g.Key.Type,
                Total = g.Sum(t => t.Amount),
            })
            .ToListAsync(ct);

        // Previous equivalent window: same length, immediately before `from`.
        var periodDays = to.DayNumber - from.DayNumber + 1;
        var prevFrom = from.AddDays(-periodDays);
        var prevTo = from.AddDays(-1);
        var prevAgg = await _db.Transactions
            .Where(t => t.UserId == UserId && t.Date >= prevFrom && t.Date <= prevTo)
            .GroupBy(t => t.Type)
            .Select(g => new { Type = g.Key, Total = g.Sum(t => t.Amount) })
            .ToListAsync(ct);

        var totalIncome = monthlyAgg.Where(m => m.Type == TransactionType.Income).Sum(m => m.Total);
        var totalExpense = monthlyAgg.Where(m => m.Type == TransactionType.Expense).Sum(m => m.Total);
        var prevIncome = prevAgg.SingleOrDefault(t => t.Type == TransactionType.Income)?.Total ?? 0m;
        var prevExpense = prevAgg.SingleOrDefault(t => t.Type == TransactionType.Expense)?.Total ?? 0m;

        // Walk calendar months in range so empty months show as zeros.
        var monthly = new List<MonthlyTotalDto>();
        var cursor = new DateOnly(from.Year, from.Month, 1);
        while (cursor <= to)
        {
            var income = monthlyAgg
                .Where(m => m.Year == cursor.Year && m.Month == cursor.Month && m.Type == TransactionType.Income)
                .Sum(m => m.Total);
            var expense = monthlyAgg
                .Where(m => m.Year == cursor.Year && m.Month == cursor.Month && m.Type == TransactionType.Expense)
                .Sum(m => m.Total);
            monthly.Add(new MonthlyTotalDto(cursor.Year, cursor.Month, income, expense));
            cursor = cursor.AddMonths(1);
        }

        var topExpenses = categoryAgg
            .Where(c => c.Type == TransactionType.Expense)
            .Select(c => new CategoryAmountDto(c.CategoryId, c.Name, c.Color, c.Total))
            .OrderByDescending(c => c.Amount)
            .ToList();
        var topIncome = categoryAgg
            .Where(c => c.Type == TransactionType.Income)
            .Select(c => new CategoryAmountDto(c.CategoryId, c.Name, c.Color, c.Total))
            .OrderByDescending(c => c.Amount)
            .ToList();

        return Ok(new ReportSummaryDto(
            from, to, totalIncome, totalExpense, totalIncome - totalExpense,
            prevIncome, prevExpense, prevIncome - prevExpense,
            monthly, topExpenses, topIncome));
    }
}
