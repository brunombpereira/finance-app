using FinanceApp.Api.Data;
using FinanceApp.Api.Models;
using FinanceApp.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Tests;

public class RecurringServiceTests
{
    private const string UserId = "user-1";

    private static (Category category, Account account) Seed(AppDbContext db)
    {
        var category = new Category
        {
            UserId = UserId,
            Name = "Salário",
            Type = TransactionType.Income,
        };
        var account = new Account
        {
            UserId = UserId,
            Name = "Conta à ordem",
            Type = AccountType.Checking,
        };
        db.Categories.Add(category);
        db.Accounts.Add(account);
        db.SaveChanges();
        return (category, account);
    }

    [Fact]
    public async Task MaterializeForUser_CreatesTransactionsForEachDueOccurrence()
    {
        using var db = TestDbContextFactory.Create();
        var (category, account) = Seed(db);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        db.RecurringTransactions.Add(new RecurringTransaction
        {
            UserId = UserId,
            Amount = 1500m,
            Type = TransactionType.Income,
            CategoryId = category.Id,
            AccountId = account.Id,
            DayOfMonth = 1,
            Active = true,
            StartDate = today.AddMonths(-3),
        });
        await db.SaveChangesAsync();

        var service = new RecurringService(db);
        await service.MaterializeForUserAsync(UserId);

        var transactions = await db.Transactions.Where(t => t.UserId == UserId).ToListAsync();
        Assert.NotEmpty(transactions);
        Assert.All(transactions, t => Assert.Equal(1500m, t.Amount));
        Assert.All(transactions, t => Assert.Equal(1, t.Date.Day));
        Assert.All(transactions, t => Assert.Equal(account.Id, t.AccountId));
    }

    [Fact]
    public async Task MaterializeForUser_IsIdempotent()
    {
        using var db = TestDbContextFactory.Create();
        var (category, account) = Seed(db);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        db.RecurringTransactions.Add(new RecurringTransaction
        {
            UserId = UserId,
            Amount = 50m,
            Type = TransactionType.Expense,
            CategoryId = category.Id,
            AccountId = account.Id,
            DayOfMonth = 10,
            Active = true,
            StartDate = today.AddMonths(-2),
        });
        await db.SaveChangesAsync();

        var service = new RecurringService(db);
        await service.MaterializeForUserAsync(UserId);
        var countAfterFirst = await db.Transactions.CountAsync();

        await service.MaterializeForUserAsync(UserId);
        var countAfterSecond = await db.Transactions.CountAsync();

        Assert.Equal(countAfterFirst, countAfterSecond);
    }

    [Fact]
    public async Task MaterializeForUser_IgnoresInactiveRules()
    {
        using var db = TestDbContextFactory.Create();
        var (category, account) = Seed(db);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        db.RecurringTransactions.Add(new RecurringTransaction
        {
            UserId = UserId,
            Amount = 99m,
            Type = TransactionType.Expense,
            CategoryId = category.Id,
            AccountId = account.Id,
            DayOfMonth = 5,
            Active = false,
            StartDate = today.AddMonths(-6),
        });
        await db.SaveChangesAsync();

        var service = new RecurringService(db);
        await service.MaterializeForUserAsync(UserId);

        Assert.Empty(await db.Transactions.ToListAsync());
    }

    [Fact]
    public async Task MaterializeForUser_DoesNotCreateFutureOccurrences()
    {
        using var db = TestDbContextFactory.Create();
        var (category, account) = Seed(db);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        db.RecurringTransactions.Add(new RecurringTransaction
        {
            UserId = UserId,
            Amount = 200m,
            Type = TransactionType.Expense,
            CategoryId = category.Id,
            AccountId = account.Id,
            DayOfMonth = 15,
            Active = true,
            StartDate = today.AddMonths(2),
        });
        await db.SaveChangesAsync();

        var service = new RecurringService(db);
        await service.MaterializeForUserAsync(UserId);

        Assert.Empty(await db.Transactions.ToListAsync());
    }

    [Fact]
    public async Task MaterializeForUser_UpdatesLastRunDate()
    {
        using var db = TestDbContextFactory.Create();
        var (category, account) = Seed(db);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var rule = new RecurringTransaction
        {
            UserId = UserId,
            Amount = 30m,
            Type = TransactionType.Expense,
            CategoryId = category.Id,
            AccountId = account.Id,
            DayOfMonth = 1,
            Active = true,
            StartDate = today.AddMonths(-1),
        };
        db.RecurringTransactions.Add(rule);
        await db.SaveChangesAsync();

        var service = new RecurringService(db);
        await service.MaterializeForUserAsync(UserId);

        Assert.NotNull(rule.LastRunDate);
        Assert.True(rule.LastRunDate <= today);
    }
}
