using FinanceApp.Api.Data;
using FinanceApp.Api.Dtos;
using FinanceApp.Api.Models;
using FinanceApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Controllers;

[Authorize]
public class AccountsController : ApiControllerBase
{
    private readonly AppDbContext _db;
    private readonly AccountService _accounts;

    public AccountsController(AppDbContext db, AccountService accounts)
    {
        _db = db;
        _accounts = accounts;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AccountDto>>> GetAll()
    {
        var accounts = await _db.Accounts
            .Where(a => a.UserId == UserId)
            .OrderBy(a => a.Type).ThenBy(a => a.Name)
            .ToListAsync();

        var balances = await _accounts.GetBalancesAsync(UserId);

        return Ok(accounts.Select(a => new AccountDto(
            a.Id, a.Name, a.Type, a.InitialBalance,
            balances.GetValueOrDefault(a.Id, a.InitialBalance), a.Color, a.Icon)));
    }

    [HttpPost]
    public async Task<ActionResult<AccountDto>> Create(AccountInputDto dto)
    {
        var account = new Account
        {
            UserId = UserId,
            Name = dto.Name,
            Type = dto.Type,
            InitialBalance = dto.InitialBalance,
            Color = string.IsNullOrWhiteSpace(dto.Color) ? "#6366f1" : dto.Color,
            Icon = string.IsNullOrWhiteSpace(dto.Icon) ? "wallet" : dto.Icon,
        };
        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = account.Id }, ToDto(account, account.InitialBalance));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<AccountDto>> Update(int id, AccountInputDto dto)
    {
        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == UserId);
        if (account is null) return NotFound();

        account.Name = dto.Name;
        account.Type = dto.Type;
        account.InitialBalance = dto.InitialBalance;
        account.Color = string.IsNullOrWhiteSpace(dto.Color) ? account.Color : dto.Color;
        account.Icon = string.IsNullOrWhiteSpace(dto.Icon) ? account.Icon : dto.Icon;
        await _db.SaveChangesAsync();

        var balance = await _accounts.GetBalanceAsync(UserId, account.Id);
        return Ok(ToDto(account, balance));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == UserId);
        if (account is null) return NotFound();

        var hasTransactions = await _db.Transactions.AnyAsync(t => t.AccountId == id);
        var hasTransfers = await _db.Transfers
            .AnyAsync(t => t.FromAccountId == id || t.ToAccountId == id);
        var hasRecurring = await _db.RecurringTransactions.AnyAsync(r => r.AccountId == id);
        if (hasTransactions || hasTransfers || hasRecurring)
            return Conflict(new
            {
                message = "Não é possível apagar uma conta com transações, transferências ou regras recorrentes associadas.",
            });

        _db.Accounts.Remove(account);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static AccountDto ToDto(Account a, decimal balance) =>
        new(a.Id, a.Name, a.Type, a.InitialBalance, balance, a.Color, a.Icon);
}
