using FinanceApp.Api.Data;
using FinanceApp.Api.Dtos;
using FinanceApp.Api.Models;
using FinanceApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Controllers;

[Authorize]
public class RecurringController : ApiControllerBase
{
    private readonly AppDbContext _db;
    private readonly RecurringService _recurring;

    public RecurringController(AppDbContext db, RecurringService recurring)
    {
        _db = db;
        _recurring = recurring;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RecurringTransactionDto>>> GetAll()
    {
        // Catch up any due occurrences before returning the rules.
        await _recurring.MaterializeForUserAsync(UserId);

        var rules = await _db.RecurringTransactions
            .Where(r => r.UserId == UserId)
            .Include(r => r.Category)
            .Include(r => r.Account)
            .OrderByDescending(r => r.Active)
            .ThenBy(r => r.DayOfMonth)
            .Select(r => new RecurringTransactionDto(
                r.Id, r.Amount, r.Type, r.CategoryId,
                r.Category!.Name, r.Category.Color, r.Category.Icon,
                r.AccountId, r.Account!.Name,
                r.DayOfMonth, r.Note, r.Active, r.StartDate, r.LastRunDate))
            .ToListAsync();
        return Ok(rules);
    }

    [HttpPost]
    public async Task<ActionResult<RecurringTransactionDto>> Create(RecurringTransactionInputDto dto)
    {
        var category = await _db.Categories
            .FirstOrDefaultAsync(c => c.Id == dto.CategoryId && c.UserId == UserId);
        if (category is null)
            return BadRequest(new { message = "Categoria inválida." });

        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == dto.AccountId && a.UserId == UserId);
        if (account is null)
            return BadRequest(new { message = "Conta inválida." });

        var rule = new RecurringTransaction
        {
            UserId = UserId,
            Amount = dto.Amount,
            Type = dto.Type,
            CategoryId = dto.CategoryId,
            AccountId = dto.AccountId,
            DayOfMonth = dto.DayOfMonth,
            Note = dto.Note ?? string.Empty,
            Active = dto.Active,
            StartDate = dto.StartDate,
        };
        _db.RecurringTransactions.Add(rule);
        await _db.SaveChangesAsync();

        // Materialize immediately so past-due occurrences appear right away.
        await _recurring.MaterializeForUserAsync(UserId);

        return CreatedAtAction(nameof(GetAll), new { id = rule.Id }, ToDto(rule, category, account));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<RecurringTransactionDto>> Update(
        int id, RecurringTransactionInputDto dto)
    {
        var rule = await _db.RecurringTransactions
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (rule is null) return NotFound();

        var category = await _db.Categories
            .FirstOrDefaultAsync(c => c.Id == dto.CategoryId && c.UserId == UserId);
        if (category is null)
            return BadRequest(new { message = "Categoria inválida." });

        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == dto.AccountId && a.UserId == UserId);
        if (account is null)
            return BadRequest(new { message = "Conta inválida." });

        rule.Amount = dto.Amount;
        rule.Type = dto.Type;
        rule.CategoryId = dto.CategoryId;
        rule.AccountId = dto.AccountId;
        rule.DayOfMonth = dto.DayOfMonth;
        rule.Note = dto.Note ?? string.Empty;
        rule.Active = dto.Active;
        rule.StartDate = dto.StartDate;
        await _db.SaveChangesAsync();

        return Ok(ToDto(rule, category, account));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var rule = await _db.RecurringTransactions
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (rule is null) return NotFound();

        _db.RecurringTransactions.Remove(rule);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static RecurringTransactionDto ToDto(RecurringTransaction r, Category c, Account a) =>
        new(r.Id, r.Amount, r.Type, r.CategoryId, c.Name, c.Color, c.Icon,
            r.AccountId, a.Name, r.DayOfMonth, r.Note, r.Active, r.StartDate, r.LastRunDate);
}
