using FinanceApp.Api.Data;
using FinanceApp.Api.Dtos;
using FinanceApp.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Controllers;

[Authorize]
public class BudgetsController : ApiControllerBase
{
    private readonly AppDbContext _db;

    public BudgetsController(AppDbContext db) => _db = db;

    // Returns budgets for a given month (defaults to the current month),
    // each enriched with how much has already been spent in its category.
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BudgetDto>>> GetForMonth(
        [FromQuery] int? year, [FromQuery] int? month)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var y = year ?? today.Year;
        var m = month ?? today.Month;

        var budgets = await _db.Budgets
            .Where(b => b.UserId == UserId && b.Year == y && b.Month == m)
            .Include(b => b.Category)
            .ToListAsync();

        var monthStart = new DateOnly(y, m, 1);
        var monthEnd = monthStart.AddMonths(1);

        var spentByCategory = await _db.Transactions
            .Where(t => t.UserId == UserId
                && t.Type == TransactionType.Expense
                && t.Date >= monthStart && t.Date < monthEnd)
            .GroupBy(t => t.CategoryId)
            .Select(g => new { CategoryId = g.Key, Spent = g.Sum(t => t.Amount) })
            .ToDictionaryAsync(x => x.CategoryId, x => x.Spent);

        var result = budgets
            .OrderBy(b => b.Category!.Name)
            .Select(b => new BudgetDto(
                b.Id, b.CategoryId, b.Category!.Name, b.Category.Color, b.Category.Icon,
                b.Year, b.Month, b.LimitAmount,
                spentByCategory.GetValueOrDefault(b.CategoryId, 0m)))
            .ToList();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<BudgetDto>> Create(BudgetInputDto dto)
    {
        var category = await _db.Categories
            .FirstOrDefaultAsync(c => c.Id == dto.CategoryId && c.UserId == UserId);
        if (category is null)
            return BadRequest(new { message = "Categoria inválida." });

        var exists = await _db.Budgets.AnyAsync(b => b.UserId == UserId
            && b.CategoryId == dto.CategoryId && b.Year == dto.Year && b.Month == dto.Month);
        if (exists)
            return Conflict(new { message = "Já existe um orçamento para esta categoria neste mês." });

        var budget = new Budget
        {
            UserId = UserId,
            CategoryId = dto.CategoryId,
            Year = dto.Year,
            Month = dto.Month,
            LimitAmount = dto.LimitAmount,
        };
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetForMonth), new { year = budget.Year, month = budget.Month },
            new BudgetDto(budget.Id, budget.CategoryId, category.Name, category.Color, category.Icon,
                budget.Year, budget.Month, budget.LimitAmount, 0m));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<BudgetDto>> Update(int id, BudgetInputDto dto)
    {
        var budget = await _db.Budgets
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == UserId);
        if (budget is null) return NotFound();

        budget.LimitAmount = dto.LimitAmount;
        await _db.SaveChangesAsync();

        return Ok(new BudgetDto(budget.Id, budget.CategoryId, budget.Category!.Name,
            budget.Category.Color, budget.Category.Icon, budget.Year, budget.Month,
            budget.LimitAmount, 0m));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var budget = await _db.Budgets.FirstOrDefaultAsync(b => b.Id == id && b.UserId == UserId);
        if (budget is null) return NotFound();

        _db.Budgets.Remove(budget);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
