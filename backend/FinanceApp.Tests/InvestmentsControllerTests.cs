using System.Security.Claims;
using FinanceApp.Api.Controllers;
using FinanceApp.Api.Data;
using FinanceApp.Api.Dtos;
using FinanceApp.Api.Models;
using FinanceApp.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApp.Tests;

public class InvestmentsControllerTests
{
    private const string UserId = "user-1";

    private sealed class StubPriceProvider(decimal? price, string currency = "USD") : IPriceProvider
    {
        public Task<CurrentPrice?> GetCurrentPriceAsync(string symbol, CancellationToken ct = default)
            => Task.FromResult(price is null
                ? null
                : new CurrentPrice(symbol, price.Value, currency, DateTime.UtcNow));
    }

    private static InvestmentsController BuildController(AppDbContext db, IPriceProvider prices)
        => new(db, prices)
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

    [Fact]
    public async Task GetAll_ComputesProfitLossUsingLivePrice()
    {
        using var db = TestDbContextFactory.Create();
        db.Investments.Add(new Investment
        {
            UserId = UserId, Symbol = "AAPL", Name = "Apple",
            Quantity = 10m, AvgCost = 150m, Currency = "USD",
        });
        await db.SaveChangesAsync();
        var controller = BuildController(db, new StubPriceProvider(200m));

        var result = await controller.GetAll(default);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var summary = Assert.IsType<InvestmentsSummaryDto>(ok.Value);
        var item = Assert.Single(summary.Items);
        Assert.Equal(1500m, item.CostBasis);          // 10 * 150
        Assert.Equal(2000m, item.CurrentValue);       // 10 * 200
        Assert.Equal(500m, item.ProfitLoss);
        var total = Assert.Single(summary.Totals);
        Assert.Equal("USD", total.Currency);
        Assert.Equal(500m, total.ProfitLoss);
    }

    [Fact]
    public async Task GetAll_HandlesMissingPrice()
    {
        using var db = TestDbContextFactory.Create();
        db.Investments.Add(new Investment
        {
            UserId = UserId, Symbol = "UNKNOWN", Name = "Unknown",
            Quantity = 1m, AvgCost = 50m, Currency = "EUR",
        });
        await db.SaveChangesAsync();
        var controller = BuildController(db, new StubPriceProvider(null));

        var result = await controller.GetAll(default);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var summary = Assert.IsType<InvestmentsSummaryDto>(ok.Value);
        var item = Assert.Single(summary.Items);
        Assert.Equal(50m, item.CostBasis);
        Assert.Null(item.CurrentValue);
        Assert.Null(item.ProfitLoss);
        Assert.Empty(summary.Totals);                 // no currency totals without prices
    }

    [Fact]
    public async Task Create_NormalisesSymbolAndCurrency()
    {
        using var db = TestDbContextFactory.Create();
        var controller = BuildController(db, new StubPriceProvider(100m, "USD"));

        var result = await controller.Create(
            new InvestmentInputDto("  aapl ", "Apple", 5m, 100m, "usd", null),
            default);

        Assert.IsType<CreatedAtActionResult>(result.Result);
        var saved = Assert.Single(db.Investments);
        Assert.Equal("AAPL", saved.Symbol);
        Assert.Equal("USD", saved.Currency);
    }

    [Fact]
    public async Task GetAll_GroupsTotalsPerCurrency()
    {
        using var db = TestDbContextFactory.Create();
        db.Investments.Add(new Investment
        {
            UserId = UserId, Symbol = "AAPL", Name = "Apple",
            Quantity = 1m, AvgCost = 100m, Currency = "USD",
        });
        db.Investments.Add(new Investment
        {
            UserId = UserId, Symbol = "VWCE", Name = "Vanguard FTSE",
            Quantity = 2m, AvgCost = 100m, Currency = "EUR",
        });
        await db.SaveChangesAsync();
        // Stub returns 150 for whichever symbol; both positions are valued at 150 per unit.
        var controller = BuildController(db, new StubPriceProvider(150m));

        var result = await controller.GetAll(default);

        var summary = Assert.IsType<InvestmentsSummaryDto>(
            Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(2, summary.Totals.Count);
        var usd = summary.Totals.Single(t => t.Currency == "USD");
        var eur = summary.Totals.Single(t => t.Currency == "EUR");
        Assert.Equal(50m, usd.ProfitLoss);     // 150 - 100
        Assert.Equal(100m, eur.ProfitLoss);    // 2*(150-100)
    }
}
