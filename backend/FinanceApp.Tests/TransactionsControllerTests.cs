using System.Security.Claims;
using FinanceApp.Api.Controllers;
using FinanceApp.Api.Data;
using FinanceApp.Api.Dtos;
using FinanceApp.Api.Models;
using FinanceApp.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Tests;

public class TransactionsControllerTests
{
    private const string UserId = "user-1";

    private static TransactionsController BuildController(AppDbContext db)
    {
        var controller = new TransactionsController(db, new RecurringService(db))
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
        return controller;
    }

    private static (int categoryId, int accountId) Seed(AppDbContext db)
    {
        var category = new Category { UserId = UserId, Name = "Alimentação", Type = TransactionType.Expense };
        var account = new Account { UserId = UserId, Name = "Conta à ordem", Type = AccountType.Checking };
        db.Categories.Add(category);
        db.Accounts.Add(account);
        db.SaveChanges();
        return (category.Id, account.Id);
    }

    [Fact]
    public async Task ImportBulk_CreatesAllRows()
    {
        using var db = TestDbContextFactory.Create();
        var (categoryId, accountId) = Seed(db);
        var controller = BuildController(db);

        var rows = new List<TransactionInputDto>
        {
            new(10m, new DateOnly(2026, 1, 5), TransactionType.Expense, categoryId, accountId, "a"),
            new(20m, new DateOnly(2026, 1, 6), TransactionType.Expense, categoryId, accountId, "b"),
        };

        var result = await controller.ImportBulk(rows);

        Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(2, await db.Transactions.CountAsync());
    }

    [Fact]
    public async Task ImportBulk_RejectsInvalidCategory()
    {
        using var db = TestDbContextFactory.Create();
        var (_, accountId) = Seed(db);
        var controller = BuildController(db);

        var rows = new List<TransactionInputDto>
        {
            new(10m, new DateOnly(2026, 1, 5), TransactionType.Expense, 9999, accountId, ""),
        };

        var result = await controller.ImportBulk(rows);

        Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Empty(await db.Transactions.ToListAsync());
    }

    [Fact]
    public async Task ImportBulk_RejectsInvalidAccount()
    {
        using var db = TestDbContextFactory.Create();
        var (categoryId, _) = Seed(db);
        var controller = BuildController(db);

        var rows = new List<TransactionInputDto>
        {
            new(10m, new DateOnly(2026, 1, 5), TransactionType.Expense, categoryId, 9999, ""),
        };

        var result = await controller.ImportBulk(rows);

        Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Empty(await db.Transactions.ToListAsync());
    }

    [Fact]
    public async Task ImportBulk_RejectsEmptyList()
    {
        using var db = TestDbContextFactory.Create();
        Seed(db);
        var controller = BuildController(db);

        var result = await controller.ImportBulk([]);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }
}
