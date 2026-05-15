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

        var transactions = await _db.Transactions
            .Where(t => t.UserId == UserId && t.Date >= from && t.Date <= to)
            .Include(t => t.Category)
            .ToListAsync(ct);

        var totalIncome = transactions.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
        var totalExpense = transactions.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);

        // Previous equivalent window: same length, immediately before `from`.
        var periodDays = to.DayNumber - from.DayNumber + 1;
        var prevFrom = from.AddDays(-periodDays);
        var prevTo = from.AddDays(-1);
        var prevTotals = await _db.Transactions
            .Where(t => t.UserId == UserId && t.Date >= prevFrom && t.Date <= prevTo)
            .GroupBy(t => t.Type)
            .Select(g => new { Type = g.Key, Amount = g.Sum(t => t.Amount) })
            .ToListAsync(ct);
        var prevIncome = prevTotals.SingleOrDefault(t => t.Type == TransactionType.Income)?.Amount ?? 0m;
        var prevExpense = prevTotals.SingleOrDefault(t => t.Type == TransactionType.Expense)?.Amount ?? 0m;

        // Walk full calendar months inside the range so months with no activity show as zeros.
        var monthly = new List<MonthlyTotalDto>();
        var cursor = new DateOnly(from.Year, from.Month, 1);
        while (cursor <= to)
        {
            var next = cursor.AddMonths(1);
            var inMonth = transactions.Where(t => t.Date >= cursor && t.Date < next).ToList();
            monthly.Add(new MonthlyTotalDto(
                cursor.Year, cursor.Month,
                inMonth.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount),
                inMonth.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount)));
            cursor = next;
        }

        var topExpenses = GroupByCategory(transactions, TransactionType.Expense);
        var topIncome = GroupByCategory(transactions, TransactionType.Income);

        return Ok(new ReportSummaryDto(
            from, to, totalIncome, totalExpense, totalIncome - totalExpense,
            prevIncome, prevExpense, prevIncome - prevExpense,
            monthly, topExpenses, topIncome));
    }

    private static List<CategoryAmountDto> GroupByCategory(
        IEnumerable<Transaction> transactions,
        TransactionType type)
        => transactions
            .Where(t => t.Type == type && t.Category is not null)
            .GroupBy(t => new { t.CategoryId, t.Category!.Name, t.Category.Color })
            .Select(g => new CategoryAmountDto(g.Key.CategoryId, g.Key.Name, g.Key.Color, g.Sum(t => t.Amount)))
            .OrderByDescending(c => c.Amount)
            .ToList();
}
