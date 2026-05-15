using FinanceApp.Api.Dtos;

namespace FinanceApp.Api.Services;

public record RequisitionStatus(string Id, string Status, IReadOnlyList<string> AccountIds);

public interface IBankingProvider
{
    /// <summary>True when the provider has credentials configured.</summary>
    bool IsConfigured { get; }

    Task<IReadOnlyList<InstitutionDto>> ListInstitutionsAsync(string country, CancellationToken ct = default);

    Task<RequisitionCreatedDto> CreateRequisitionAsync(string institutionId, string redirectUrl, string reference, CancellationToken ct = default);

    Task<RequisitionStatus> GetRequisitionAsync(string requisitionId, CancellationToken ct = default);
}
