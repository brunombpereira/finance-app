using FinanceApp.Api.Data;
using FinanceApp.Api.Dtos;
using FinanceApp.Api.Models;
using FinanceApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Controllers;

[Authorize]
public class InvestmentsController : ApiControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPriceProvider _prices;

    public InvestmentsController(AppDbContext db, IPriceProvider prices)
    {
        _db = db;
        _prices = prices;
    }

    [HttpGet]
    public async Task<ActionResult<InvestmentsSummaryDto>> GetAll(CancellationToken ct)
    {
        var investments = await _db.Investments
            .Where(i => i.UserId == UserId)
            .OrderBy(i => i.Symbol)
            .ToListAsync(ct);

        var priceBySymbol = await FetchPricesAsync(investments.Select(i => i.Symbol), ct);
        var items = investments.Select(i => ToDto(i, priceBySymbol.GetValueOrDefault(i.Symbol))).ToList();

        var totals = items
            .Where(i => i.CurrentValue.HasValue)
            .GroupBy(i => i.Currency)
            .Select(g =>
            {
                var cost = g.Sum(i => i.CostBasis);
                var value = g.Sum(i => i.CurrentValue!.Value);
                var pl = value - cost;
                var plPct = cost > 0 ? pl / cost * 100m : 0m;
                return new CurrencyTotalDto(g.Key, cost, value, pl, plPct);
            })
            .OrderBy(t => t.Currency)
            .ToList();

        return Ok(new InvestmentsSummaryDto(items, totals));
    }

    [HttpPost]
    public async Task<ActionResult<InvestmentDto>> Create(InvestmentInputDto dto, CancellationToken ct)
    {
        var inv = new Investment
        {
            UserId = UserId,
            Symbol = dto.Symbol.Trim().ToUpperInvariant(),
            Name = dto.Name.Trim(),
            Quantity = dto.Quantity,
            AvgCost = dto.AvgCost,
            Currency = dto.Currency.Trim().ToUpperInvariant(),
            Notes = dto.Notes,
        };
        _db.Investments.Add(inv);
        await _db.SaveChangesAsync(ct);

        var price = await _prices.GetCurrentPriceAsync(inv.Symbol, ct);
        return CreatedAtAction(nameof(GetAll), new { id = inv.Id }, ToDto(inv, price));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<InvestmentDto>> Update(int id, InvestmentInputDto dto, CancellationToken ct)
    {
        var inv = await _db.Investments.FirstOrDefaultAsync(i => i.Id == id && i.UserId == UserId, ct);
        if (inv is null) return NotFound();

        inv.Symbol = dto.Symbol.Trim().ToUpperInvariant();
        inv.Name = dto.Name.Trim();
        inv.Quantity = dto.Quantity;
        inv.AvgCost = dto.AvgCost;
        inv.Currency = dto.Currency.Trim().ToUpperInvariant();
        inv.Notes = dto.Notes;
        await _db.SaveChangesAsync(ct);

        var price = await _prices.GetCurrentPriceAsync(inv.Symbol, ct);
        return Ok(ToDto(inv, price));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var inv = await _db.Investments.FirstOrDefaultAsync(i => i.Id == id && i.UserId == UserId, ct);
        if (inv is null) return NotFound();

        _db.Investments.Remove(inv);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private async Task<Dictionary<string, CurrentPrice>> FetchPricesAsync(
        IEnumerable<string> symbols,
        CancellationToken ct)
    {
        var distinct = symbols.Distinct().ToList();
        var tasks = distinct.ToDictionary(s => s, s => _prices.GetCurrentPriceAsync(s, ct));
        await Task.WhenAll(tasks.Values);
        return tasks
            .Where(t => t.Value.Result is not null)
            .ToDictionary(t => t.Key, t => t.Value.Result!);
    }

    private static InvestmentDto ToDto(Investment i, CurrentPrice? price)
    {
        var costBasis = i.Quantity * i.AvgCost;
        decimal? currentValue = price is null ? null : i.Quantity * price.Price;
        decimal? pl = currentValue.HasValue ? currentValue.Value - costBasis : null;
        decimal? plPct = pl.HasValue && costBasis > 0 ? pl.Value / costBasis * 100m : null;
        return new InvestmentDto(
            i.Id, i.Symbol, i.Name, i.Quantity, i.AvgCost, i.Currency, i.Notes, i.CreatedAt,
            price?.Price, currentValue, costBasis, pl, plPct, price?.FetchedAt);
    }
}
