using FinanceApp.Api.Data;
using FinanceApp.Api.Models;
using FinanceApp.Api.Services;

namespace FinanceApp.Tests;

public class AccountServiceTests
{
    private const string UserId = "user-1";

    private static Category SeedCategory(AppDbContext db, TransactionType type)
    {
        var category = new Category { UserId = UserId, Name = $"Cat-{type}", Type = type };
        db.Categories.Add(category);
        db.SaveChanges();
        return category;
    }

    [Fact]
    public async Task GetBalances_EmptyAccount_ReturnsInitialBalance()
    {
        using var db = TestDbContextFactory.Create();
        var account = new Account
        {
            UserId = UserId,
            Name = "Poupança",
            Type = AccountType.Savings,
            InitialBalance = 200m,
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var balances = await new AccountService(db).GetBalancesAsync(UserId);

        Assert.Equal(200m, balances[account.Id]);
    }

    [Fact]
    public async Task GetBalances_AppliesIncomeAndExpense()
    {
        using var db = TestDbContextFactory.Create();
        var account = new Account
        {
            UserId = UserId,
            Name = "Conta à ordem",
            Type = AccountType.Checking,
            InitialBalance = 100m,
        };
        db.Accounts.Add(account);
        var income = SeedCategory(db, TransactionType.Income);
        var expense = SeedCategory(db, TransactionType.Expense);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        db.Transactions.AddRange(
            new Transaction
            {
                UserId = UserId,
                AccountId = account.Id,
                CategoryId = income.Id,
                Type = TransactionType.Income,
                Amount = 50m,
                Date = today,
            },
            new Transaction
            {
                UserId = UserId,
                AccountId = account.Id,
                CategoryId = expense.Id,
                Type = TransactionType.Expense,
                Amount = 30m,
                Date = today,
            });
        await db.SaveChangesAsync();

        var balances = await new AccountService(db).GetBalancesAsync(UserId);

        // 100 + 50 - 30
        Assert.Equal(120m, balances[account.Id]);
    }

    [Fact]
    public async Task GetBalances_AppliesTransfersBetweenAccounts()
    {
        using var db = TestDbContextFactory.Create();
        var checking = new Account
        {
            UserId = UserId,
            Name = "Conta à ordem",
            Type = AccountType.Checking,
            InitialBalance = 100m,
        };
        var savings = new Account
        {
            UserId = UserId,
            Name = "Poupança",
            Type = AccountType.Savings,
            InitialBalance = 0m,
        };
        db.Accounts.AddRange(checking, savings);
        await db.SaveChangesAsync();

        db.Transfers.Add(new Transfer
        {
            UserId = UserId,
            FromAccountId = checking.Id,
            ToAccountId = savings.Id,
            Amount = 40m,
            Date = DateOnly.FromDateTime(DateTime.UtcNow),
        });
        await db.SaveChangesAsync();

        var balances = await new AccountService(db).GetBalancesAsync(UserId);

        Assert.Equal(60m, balances[checking.Id]);
        Assert.Equal(40m, balances[savings.Id]);
    }
}
