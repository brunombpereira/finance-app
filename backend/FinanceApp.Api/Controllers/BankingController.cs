using FinanceApp.Api.Data;
using FinanceApp.Api.Dtos;
using FinanceApp.Api.Models;
using FinanceApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Controllers;

[Authorize]
public class BankingController : ApiControllerBase
{
    private readonly AppDbContext _db;
    private readonly IBankingProvider _provider;
    private readonly IConfiguration _config;

    public BankingController(AppDbContext db, IBankingProvider provider, IConfiguration config)
    {
        _db = db;
        _provider = provider;
        _config = config;
    }

    /// <summary>Indicates whether the banking feature is wired up server-side.</summary>
    [HttpGet("status")]
    public IActionResult Status() => Ok(new { configured = _provider.IsConfigured });

    [HttpGet("institutions")]
    public async Task<ActionResult<IReadOnlyList<InstitutionDto>>> ListInstitutions(
        [FromQuery] string country = "PT",
        CancellationToken ct = default)
    {
        if (!_provider.IsConfigured) return ServiceUnavailable();
        return Ok(await _provider.ListInstitutionsAsync(country, ct));
    }

    [HttpPost("requisitions")]
    public async Task<ActionResult<RequisitionCreatedDto>> CreateRequisition(
        CreateRequisitionDto dto,
        CancellationToken ct = default)
    {
        if (!_provider.IsConfigured) return ServiceUnavailable();

        var frontendUrl = _config["App:FrontendUrl"] ?? $"{Request.Scheme}://{Request.Host}";
        var redirect = $"{frontendUrl}/app/settings?banking=callback";
        var reference = Guid.NewGuid().ToString("N");

        var created = await _provider.CreateRequisitionAsync(dto.InstitutionId, redirect, reference, ct);

        // We can't fetch institution metadata cheaply here, so store the id; the
        // finalize call will refresh the name via the requisition response.
        var connection = new BankConnection
        {
            UserId = UserId,
            Provider = "GoCardless",
            InstitutionId = dto.InstitutionId,
            InstitutionName = dto.InstitutionId,    // overwritten on finalize
            RequisitionId = created.RequisitionId,
            Status = "CR",
        };
        _db.BankConnections.Add(connection);
        await _db.SaveChangesAsync(ct);

        return Ok(created);
    }

    [HttpPost("finalize")]
    public async Task<ActionResult<BankConnectionDto>> Finalize(
        FinalizeConnectionDto dto,
        CancellationToken ct = default)
    {
        if (!_provider.IsConfigured) return ServiceUnavailable();

        var connection = await _db.BankConnections
            .FirstOrDefaultAsync(c => c.RequisitionId == dto.RequisitionId && c.UserId == UserId, ct);
        if (connection is null) return NotFound();

        var status = await _provider.GetRequisitionAsync(dto.RequisitionId, ct);
        connection.Status = status.Status;
        connection.AccountIds = string.Join(',', status.AccountIds);
        if (status.Status == "LN" && connection.LinkedAt is null)
            connection.LinkedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Ok(ToDto(connection));
    }

    [HttpGet("connections")]
    public async Task<ActionResult<IReadOnlyList<BankConnectionDto>>> ListConnections(CancellationToken ct)
    {
        var connections = await _db.BankConnections
            .Where(c => c.UserId == UserId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);
        return Ok(connections.Select(ToDto).ToList());
    }

    [HttpDelete("connections/{id:int}")]
    public async Task<IActionResult> DeleteConnection(int id, CancellationToken ct)
    {
        var connection = await _db.BankConnections
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId, ct);
        if (connection is null) return NotFound();
        _db.BankConnections.Remove(connection);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static BankConnectionDto ToDto(BankConnection c) => new(
        c.Id, c.InstitutionId, c.InstitutionName, c.InstitutionLogo, c.Status,
        string.IsNullOrEmpty(c.AccountIds) ? 0 : c.AccountIds.Split(',').Length,
        c.CreatedAt, c.LinkedAt, c.LastSyncedAt);

    private static ObjectResult ServiceUnavailable() =>
        new(new { message = "Integração bancária não está configurada no servidor." })
        {
            StatusCode = StatusCodes.Status503ServiceUnavailable,
        };
}
