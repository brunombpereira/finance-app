using FinanceApp.Api.Data;
using FinanceApp.Api.Dtos;
using FinanceApp.Api.Models;
using FinanceApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Controllers;

[Authorize]
public class TransactionsController : ApiControllerBase
{
    private const int MaxPageSize = 100;

    private readonly AppDbContext _db;
    private readonly RecurringService _recurring;

    public TransactionsController(AppDbContext db, RecurringService recurring)
    {
        _db = db;
        _recurring = recurring;
    }

    [HttpGet]
    public async Task<ActionResult<PagedTransactionsDto>> GetAll(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] int? categoryId,
        [FromQuery] int? accountId,
        [FromQuery] TransactionType? type,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        // Ensure any due recurring transactions exist before listing.
        await _recurring.MaterializeForUserAsync(UserId);

        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = _db.Transactions
            .Where(t => t.UserId == UserId)
            .Include(t => t.Category)
            .Include(t => t.Account)
            .AsQueryable();

        if (from is not null) query = query.Where(t => t.Date >= from);
        if (to is not null) query = query.Where(t => t.Date <= to);
        if (categoryId is not null) query = query.Where(t => t.CategoryId == categoryId);
        if (accountId is not null) query = query.Where(t => t.AccountId == accountId);
        if (type is not null) query = query.Where(t => t.Type == type);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search.Trim()}%";
            query = query.Where(t =>
                EF.Functions.ILike(t.Note, pattern) ||
                EF.Functions.ILike(t.Category!.Name, pattern));
        }

        var total = await query.CountAsync();
        var totalIncome = await query
            .Where(t => t.Type == TransactionType.Income).SumAsync(t => (decimal?)t.Amount) ?? 0m;
        var totalExpense = await query
            .Where(t => t.Type == TransactionType.Expense).SumAsync(t => (decimal?)t.Amount) ?? 0m;

        var items = await query
            .OrderByDescending(t => t.Date).ThenByDescending(t => t.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TransactionDto(
                t.Id, t.Amount, t.Date, t.Type,
                t.CategoryId, t.Category!.Name, t.Category.Color, t.Category.Icon,
                t.AccountId, t.Account!.Name, t.Note))
            .ToListAsync();

        return Ok(new PagedTransactionsDto(items, total, totalIncome, totalExpense, page, pageSize));
    }

    [HttpPost]
    public async Task<ActionResult<TransactionDto>> Create(TransactionInputDto dto)
    {
        var category = await _db.Categories
            .FirstOrDefaultAsync(c => c.Id == dto.CategoryId && c.UserId == UserId);
        if (category is null)
            return BadRequest(new { message = "Categoria inválida." });

        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == dto.AccountId && a.UserId == UserId);
        if (account is null)
            return BadRequest(new { message = "Conta inválida." });

        var transaction = new Transaction
        {
            UserId = UserId,
            Amount = dto.Amount,
            Date = dto.Date,
            Type = dto.Type,
            CategoryId = dto.CategoryId,
            AccountId = dto.AccountId,
            Note = dto.Note ?? string.Empty,
        };
        _db.Transactions.Add(transaction);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = transaction.Id },
            ToDto(transaction, category, account));
    }

    // Bulk insert — used by the CSV statement import. All rows are validated up front
    // and inserted in a single SaveChanges so the import is all-or-nothing.
    [HttpPost("bulk")]
    public async Task<ActionResult<object>> ImportBulk(List<TransactionInputDto> dtos)
    {
        if (dtos is null || dtos.Count == 0)
            return BadRequest(new { message = "Não há transações para importar." });

        var categoryIds = await _db.Categories
            .Where(c => c.UserId == UserId)
            .Select(c => c.Id)
            .ToHashSetAsync();
        var accountIds = await _db.Accounts
            .Where(a => a.UserId == UserId)
            .Select(a => a.Id)
            .ToHashSetAsync();

        foreach (var dto in dtos)
        {
            if (!categoryIds.Contains(dto.CategoryId))
                return BadRequest(new { message = "Categoria inválida numa das linhas." });
            if (!accountIds.Contains(dto.AccountId))
                return BadRequest(new { message = "Conta inválida numa das linhas." });
        }

        var transactions = dtos.Select(dto => new Transaction
        {
            UserId = UserId,
            Amount = dto.Amount,
            Date = dto.Date,
            Type = dto.Type,
            CategoryId = dto.CategoryId,
            AccountId = dto.AccountId,
            Note = dto.Note ?? string.Empty,
        }).ToList();

        _db.Transactions.AddRange(transactions);
        await _db.SaveChangesAsync();

        return Ok(new { imported = transactions.Count });
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TransactionDto>> Update(int id, TransactionInputDto dto)
    {
        var transaction = await _db.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == UserId);
        if (transaction is null) return NotFound();

        var category = await _db.Categories
            .FirstOrDefaultAsync(c => c.Id == dto.CategoryId && c.UserId == UserId);
        if (category is null)
            return BadRequest(new { message = "Categoria inválida." });

        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == dto.AccountId && a.UserId == UserId);
        if (account is null)
            return BadRequest(new { message = "Conta inválida." });

        transaction.Amount = dto.Amount;
        transaction.Date = dto.Date;
        transaction.Type = dto.Type;
        transaction.CategoryId = dto.CategoryId;
        transaction.AccountId = dto.AccountId;
        transaction.Note = dto.Note ?? string.Empty;
        await _db.SaveChangesAsync();

        return Ok(ToDto(transaction, category, account));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var transaction = await _db.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == UserId);
        if (transaction is null) return NotFound();

        _db.Transactions.Remove(transaction);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static TransactionDto ToDto(Transaction t, Category c, Account a) =>
        new(t.Id, t.Amount, t.Date, t.Type, t.CategoryId, c.Name, c.Color, c.Icon,
            t.AccountId, a.Name, t.Note);
}
