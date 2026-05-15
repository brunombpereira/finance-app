using FinanceApp.Api.Data;
using FinanceApp.Api.Dtos;
using FinanceApp.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Controllers;

[Authorize]
public class TransfersController : ApiControllerBase
{
    private readonly AppDbContext _db;

    public TransfersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TransferDto>>> GetAll()
    {
        var transfers = await _db.Transfers
            .Where(t => t.UserId == UserId)
            .Include(t => t.FromAccount)
            .Include(t => t.ToAccount)
            .OrderByDescending(t => t.Date).ThenByDescending(t => t.Id)
            .Select(t => new TransferDto(
                t.Id, t.FromAccountId, t.FromAccount!.Name,
                t.ToAccountId, t.ToAccount!.Name, t.Amount, t.Date, t.Note))
            .ToListAsync();
        return Ok(transfers);
    }

    [HttpPost]
    public async Task<ActionResult<TransferDto>> Create(TransferInputDto dto)
    {
        var error = await ValidateAccounts(dto);
        if (error is not null) return BadRequest(new { message = error });

        var transfer = new Transfer
        {
            UserId = UserId,
            FromAccountId = dto.FromAccountId,
            ToAccountId = dto.ToAccountId,
            Amount = dto.Amount,
            Date = dto.Date,
            Note = dto.Note ?? string.Empty,
        };
        _db.Transfers.Add(transfer);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = transfer.Id }, await ToDto(transfer));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TransferDto>> Update(int id, TransferInputDto dto)
    {
        var transfer = await _db.Transfers.FirstOrDefaultAsync(t => t.Id == id && t.UserId == UserId);
        if (transfer is null) return NotFound();

        var error = await ValidateAccounts(dto);
        if (error is not null) return BadRequest(new { message = error });

        transfer.FromAccountId = dto.FromAccountId;
        transfer.ToAccountId = dto.ToAccountId;
        transfer.Amount = dto.Amount;
        transfer.Date = dto.Date;
        transfer.Note = dto.Note ?? string.Empty;
        await _db.SaveChangesAsync();

        return Ok(await ToDto(transfer));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var transfer = await _db.Transfers.FirstOrDefaultAsync(t => t.Id == id && t.UserId == UserId);
        if (transfer is null) return NotFound();

        _db.Transfers.Remove(transfer);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<string?> ValidateAccounts(TransferInputDto dto)
    {
        if (dto.FromAccountId == dto.ToAccountId)
            return "A conta de origem e de destino têm de ser diferentes.";

        var ownedAccountIds = await _db.Accounts
            .Where(a => a.UserId == UserId
                && (a.Id == dto.FromAccountId || a.Id == dto.ToAccountId))
            .Select(a => a.Id)
            .ToListAsync();
        if (ownedAccountIds.Count != 2)
            return "Conta de origem ou de destino inválida.";

        return null;
    }

    private async Task<TransferDto> ToDto(Transfer transfer)
    {
        var names = await _db.Accounts
            .Where(a => a.Id == transfer.FromAccountId || a.Id == transfer.ToAccountId)
            .ToDictionaryAsync(a => a.Id, a => a.Name);
        return new TransferDto(
            transfer.Id,
            transfer.FromAccountId, names.GetValueOrDefault(transfer.FromAccountId, ""),
            transfer.ToAccountId, names.GetValueOrDefault(transfer.ToAccountId, ""),
            transfer.Amount, transfer.Date, transfer.Note);
    }
}
