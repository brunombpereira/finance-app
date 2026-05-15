using System.Security.Claims;
using FinanceApp.Api.Controllers;
using FinanceApp.Api.Data;
using FinanceApp.Api.Dtos;
using FinanceApp.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApp.Tests;

public class ReportsControllerTests
{
    private const string UserId = "user-1";

    private static ReportsController BuildController(AppDbContext db)
        => new(db)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(
                        new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, UserId)])),
                },
            },
        };

    private static (int catIn, int catEx, int acc) Seed(AppDbContext db)
    {
        var income = new Category { UserId = UserId, Name = "Salário", Type = TransactionType.Income, Color = "#10b981", Icon = "wallet" };
        var expense = new Category { UserId = UserId, Name = "Mercearia", Type = TransactionType.Expense, Color = "#ef4444", Icon = "shopping" };
        var account = new Account { UserId = UserId, Name = "Conta", Type = AccountType.Checking };
        db.Categories.AddRange(income, expense);
        db.Accounts.Add(account);
        db.SaveChanges();
        return (income.Id, expense.Id, account.Id);
    }

    [Fact]
    public async Task Get_AggregatesIncomeAndExpenseForRange()
    {
        using var db = TestDbContextFactory.Create();
        var (catIn, catEx, acc) = Seed(db);
        db.Transactions.AddRange(
            new Transaction { UserId = UserId, Amount = 1000m, Date = new DateOnly(2026, 3, 1), Type = TransactionType.Income, CategoryId = catIn, AccountId = acc },
            new Transaction { UserId = UserId, Amount = 200m, Date = new DateOnly(2026, 3, 10), Type = TransactionType.Expense, CategoryId = catEx, AccountId = acc },
            new Transaction { UserId = UserId, Amount = 50m, Date = new DateOnly(2026, 2, 28), Type = TransactionType.Expense, CategoryId = catEx, AccountId = acc });   // outside
        await db.SaveChangesAsync();
        var controller = BuildController(db);

        var result = await controller.Get(new DateOnly(2026, 3, 1), new DateOnly(2026, 3, 31), default);

        var summary = Assert.IsType<ReportSummaryDto>(Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(1000m, summary.TotalIncome);
        Assert.Equal(200m, summary.TotalExpense);
        Assert.Equal(800m, summary.Net);
    }

    [Fact]
    public async Task Get_ComputesPreviousPeriodTotals()
    {
        using var db = TestDbContextFactory.Create();
        var (catIn, catEx, acc) = Seed(db);
        // March: 1000 income, 200 expense; February (same-length prev window): 500 income, 100 expense.
        db.Transactions.AddRange(
            new Transaction { UserId = UserId, Amount = 1000m, Date = new DateOnly(2026, 3, 15), Type = TransactionType.Income, CategoryId = catIn, AccountId = acc },
            new Transaction { UserId = UserId, Amount = 200m, Date = new DateOnly(2026, 3, 20), Type = TransactionType.Expense, CategoryId = catEx, AccountId = acc },
            new Transaction { UserId = UserId, Amount = 500m, Date = new DateOnly(2026, 2, 10), Type = TransactionType.Income, CategoryId = catIn, AccountId = acc },
            new Transaction { UserId = UserId, Amount = 100m, Date = new DateOnly(2026, 2, 15), Type = TransactionType.Expense, CategoryId = catEx, AccountId = acc });
        await db.SaveChangesAsync();
        var controller = BuildController(db);

        var result = await controller.Get(new DateOnly(2026, 3, 1), new DateOnly(2026, 3, 31), default);

        var summary = Assert.IsType<ReportSummaryDto>(Assert.IsType<OkObjectResult>(result.Result).Value);
        // Previous window is the 31 days immediately before March 1 — covers all of Feb plus a bit of Jan.
        Assert.Equal(500m, summary.PrevTotalIncome);
        Assert.Equal(100m, summary.PrevTotalExpense);
    }

    [Fact]
    public async Task Get_RejectsInvertedRange()
    {
        using var db = TestDbContextFactory.Create();
        Seed(db);
        var controller = BuildController(db);

        var result = await controller.Get(new DateOnly(2026, 5, 1), new DateOnly(2026, 4, 1), default);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Get_GroupsByCategoryOrderedByAmount()
    {
        using var db = TestDbContextFactory.Create();
        var (catIn, catEx, acc) = Seed(db);
        var rent = new Category { UserId = UserId, Name = "Renda", Type = TransactionType.Expense, Color = "#f59e0b", Icon = "home" };
        db.Categories.Add(rent);
        await db.SaveChangesAsync();
        db.Transactions.AddRange(
            new Transaction { UserId = UserId, Amount = 50m, Date = new DateOnly(2026, 3, 5), Type = TransactionType.Expense, CategoryId = catEx, AccountId = acc },
            new Transaction { UserId = UserId, Amount = 500m, Date = new DateOnly(2026, 3, 6), Type = TransactionType.Expense, CategoryId = rent.Id, AccountId = acc });
        _ = catIn;
        await db.SaveChangesAsync();
        var controller = BuildController(db);

        var result = await controller.Get(new DateOnly(2026, 3, 1), new DateOnly(2026, 3, 31), default);

        var summary = Assert.IsType<ReportSummaryDto>(Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(2, summary.TopExpenses.Count);
        Assert.Equal("Renda", summary.TopExpenses[0].Name);          // ordered desc by amount
        Assert.Equal(500m, summary.TopExpenses[0].Amount);
    }
}
