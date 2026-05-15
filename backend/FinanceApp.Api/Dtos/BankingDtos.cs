using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.Dtos;

public record InstitutionDto(string Id, string Name, string? Logo, IReadOnlyList<string> Countries);

public record CreateRequisitionDto(
    [Required, MaxLength(80)] string InstitutionId);

public record RequisitionCreatedDto(string RequisitionId, string Link);

public record BankConnectionDto(
    int Id,
    string InstitutionId,
    string InstitutionName,
    string? InstitutionLogo,
    string Status,
    int LinkedAccountCount,
    DateTime CreatedAt,
    DateTime? LinkedAt,
    DateTime? LastSyncedAt);

public record FinalizeConnectionDto([Required, MaxLength(80)] string RequisitionId);
