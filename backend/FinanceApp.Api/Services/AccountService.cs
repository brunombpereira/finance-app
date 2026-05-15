using FinanceApp.Api.Data;
using FinanceApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Services;

// Computes account balances. The balance is never stored — it is derived from the
// account's initial balance plus the transactions and transfers that touch it.
public class AccountService
{
    private readonly AppDbContext _db;

    public AccountService(AppDbContext db) => _db = db;

    // Returns accountId -> current balance for all of the user's accounts.
    public async Task<Dictionary<int, decimal>> GetBalancesAsync(string userId)
    {
        var accounts = await _db.Accounts
            .Where(a => a.UserId == userId)
            .Select(a => new { a.Id, a.InitialBalance })
            .ToListAsync();

        var txnTotals = await _db.Transactions
            .Where(t => t.UserId == userId)
            .GroupBy(t => t.AccountId)
            .Select(g => new
            {
                AccountId = g.Key,
                Income = g.Sum(t => t.Type == TransactionType.Income ? t.Amount : 0m),
                Expense = g.Sum(t => t.Type == TransactionType.Expense ? t.Amount : 0m),
            })
            .ToDictionaryAsync(x => x.AccountId);

        var transfersOut = await _db.Transfers
            .Where(t => t.UserId == userId)
            .GroupBy(t => t.FromAccountId)
            .Select(g => new { AccountId = g.Key, Total = g.Sum(t => t.Amount) })
            .ToDictionaryAsync(x => x.AccountId, x => x.Total);

        var transfersIn = await _db.Transfers
            .Where(t => t.UserId == userId)
            .GroupBy(t => t.ToAccountId)
            .Select(g => new { AccountId = g.Key, Total = g.Sum(t => t.Amount) })
            .ToDictionaryAsync(x => x.AccountId, x => x.Total);

        var balances = new Dictionary<int, decimal>();
        foreach (var account in accounts)
        {
            var balance = account.InitialBalance;
            if (txnTotals.TryGetValue(account.Id, out var t)) balance += t.Income - t.Expense;
            if (transfersIn.TryGetValue(account.Id, out var inAmount)) balance += inAmount;
            if (transfersOut.TryGetValue(account.Id, out var outAmount)) balance -= outAmount;
            balances[account.Id] = balance;
        }
        return balances;
    }

    public async Task<decimal> GetBalanceAsync(string userId, int accountId)
    {
        var balances = await GetBalancesAsync(userId);
        return balances.GetValueOrDefault(accountId, 0m);
    }
}
