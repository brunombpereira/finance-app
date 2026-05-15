using FinanceApp.Api.Data;
using FinanceApp.Api.Dtos;
using FinanceApp.Api.Models;
using FinanceApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Controllers;

[Authorize]
public class GoalsController : ApiControllerBase
{
    private readonly AppDbContext _db;
    private readonly AccountService _accounts;

    public GoalsController(AppDbContext db, AccountService accounts)
    {
        _db = db;
        _accounts = accounts;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SavingsGoalDto>>> GetAll()
    {
        var goals = await _db.SavingsGoals
            .Where(g => g.UserId == UserId)
            .Include(g => g.Account)
            .OrderBy(g => g.TargetDate ?? DateOnly.MaxValue).ThenBy(g => g.Name)
            .ToListAsync();

        var balances = await _accounts.GetBalancesAsync(UserId);
        return Ok(goals.Select(g => ToDto(g, balances)));
    }

    [HttpPost]
    public async Task<ActionResult<SavingsGoalDto>> Create(SavingsGoalInputDto dto)
    {
        var account = await ResolveLinkedAccount(dto.AccountId);
        if (dto.AccountId is not null && account is null)
            return BadRequest(new { message = "Conta de poupança inválida." });

        var goal = new SavingsGoal
        {
            UserId = UserId,
            Name = dto.Name,
            TargetAmount = dto.TargetAmount,
            // A linked goal's progress comes from the account, so ignore the manual value.
            CurrentAmount = dto.AccountId is null ? dto.CurrentAmount : 0m,
            AccountId = dto.AccountId,
            TargetDate = dto.TargetDate,
        };
        _db.SavingsGoals.Add(goal);
        await _db.SaveChangesAsync();
        goal.Account = account;

        var balances = await _accounts.GetBalancesAsync(UserId);
        return CreatedAtAction(nameof(GetAll), new { id = goal.Id }, ToDto(goal, balances));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<SavingsGoalDto>> Update(int id, SavingsGoalInputDto dto)
    {
        var goal = await _db.SavingsGoals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == UserId);
        if (goal is null) return NotFound();

        var account = await ResolveLinkedAccount(dto.AccountId);
        if (dto.AccountId is not null && account is null)
            return BadRequest(new { message = "Conta de poupança inválida." });

        goal.Name = dto.Name;
        goal.TargetAmount = dto.TargetAmount;
        goal.CurrentAmount = dto.AccountId is null ? dto.CurrentAmount : 0m;
        goal.AccountId = dto.AccountId;
        goal.TargetDate = dto.TargetDate;
        await _db.SaveChangesAsync();
        goal.Account = account;

        var balances = await _accounts.GetBalancesAsync(UserId);
        return Ok(ToDto(goal, balances));
    }

    [HttpPost("{id:int}/contribute")]
    public async Task<ActionResult<SavingsGoalDto>> Contribute(int id, ContributionDto dto)
    {
        var goal = await _db.SavingsGoals
            .Include(g => g.Account)
            .FirstOrDefaultAsync(g => g.Id == id && g.UserId == UserId);
        if (goal is null) return NotFound();

        if (goal.AccountId is null)
        {
            // Unlinked goal — bump the manual progress.
            goal.CurrentAmount += dto.Amount;
        }
        else
        {
            // Linked goal — record the contribution as a transfer into the account.
            if (dto.FromAccountId is null)
                return BadRequest(new { message = "Escolhe a conta de origem da contribuição." });
            if (dto.FromAccountId == goal.AccountId)
                return BadRequest(new { message = "A conta de origem tem de ser diferente da conta da meta." });

            var fromOwned = await _db.Accounts
                .AnyAsync(a => a.Id == dto.FromAccountId && a.UserId == UserId);
            if (!fromOwned)
                return BadRequest(new { message = "Conta de origem inválida." });

            _db.Transfers.Add(new Transfer
            {
                UserId = UserId,
                FromAccountId = dto.FromAccountId.Value,
                ToAccountId = goal.AccountId.Value,
                Amount = dto.Amount,
                Date = DateOnly.FromDateTime(DateTime.UtcNow),
                Note = $"Contribuição para a meta \"{goal.Name}\"",
            });
        }

        await _db.SaveChangesAsync();

        var balances = await _accounts.GetBalancesAsync(UserId);
        return Ok(ToDto(goal, balances));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var goal = await _db.SavingsGoals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == UserId);
        if (goal is null) return NotFound();

        _db.SavingsGoals.Remove(goal);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<Account?> ResolveLinkedAccount(int? accountId)
    {
        if (accountId is null) return null;
        return await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == UserId);
    }

    private static SavingsGoalDto ToDto(SavingsGoal g, IReadOnlyDictionary<int, decimal> balances)
    {
        // Linked goals show the account balance as progress; unlinked use the stored value.
        var current = g.AccountId is { } accountId
            ? balances.GetValueOrDefault(accountId, 0m)
            : g.CurrentAmount;
        return new SavingsGoalDto(
            g.Id, g.Name, g.TargetAmount, current,
            g.AccountId, g.Account?.Name, g.TargetDate, g.CreatedAt);
    }
}
