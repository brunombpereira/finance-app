using FinanceApp.Api.Data;
using FinanceApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Services;

// Turns recurring rules into concrete Transaction rows. Idempotent: each call
// only creates occurrences that are due (up to today) and not yet materialized.
public class RecurringService
{
    private readonly AppDbContext _db;

    public RecurringService(AppDbContext db) => _db = db;

    public async Task MaterializeForUserAsync(string userId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var rules = await _db.RecurringTransactions
            .Where(r => r.UserId == userId && r.Active)
            .ToListAsync();
        if (rules.Count == 0) return;

        var created = new List<Transaction>();
        foreach (var rule in rules)
        {
            var cursor = rule.LastRunDate is { } last
                ? new DateOnly(last.Year, last.Month, rule.DayOfMonth).AddMonths(1)
                : FirstOccurrence(rule.StartDate, rule.DayOfMonth);

            while (cursor <= today)
            {
                created.Add(new Transaction
                {
                    UserId = userId,
                    Amount = rule.Amount,
                    Date = cursor,
                    Type = rule.Type,
                    CategoryId = rule.CategoryId,
                    AccountId = rule.AccountId,
                    Note = rule.Note,
                });
                rule.LastRunDate = cursor;
                cursor = cursor.AddMonths(1);
            }
        }

        if (created.Count > 0)
        {
            _db.Transactions.AddRange(created);
            await _db.SaveChangesAsync();
        }
    }

    public async Task MaterializeAllAsync()
    {
        var userIds = await _db.RecurringTransactions
            .Where(r => r.Active)
            .Select(r => r.UserId)
            .Distinct()
            .ToListAsync();

        foreach (var userId in userIds)
            await MaterializeForUserAsync(userId);
    }

    private static DateOnly FirstOccurrence(DateOnly start, int dayOfMonth)
    {
        var candidate = new DateOnly(start.Year, start.Month, dayOfMonth);
        return candidate < start ? candidate.AddMonths(1) : candidate;
    }
}
