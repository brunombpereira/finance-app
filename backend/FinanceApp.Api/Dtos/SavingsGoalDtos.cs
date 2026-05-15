using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.Dtos;

public record SavingsGoalDto(
    int Id,
    string Name,
    decimal TargetAmount,
    // For linked goals this is the balance of the linked account; otherwise the manual value.
    decimal CurrentAmount,
    int? AccountId,
    string? AccountName,
    DateOnly? TargetDate,
    DateTime CreatedAt);

public record SavingsGoalInputDto(
    [Required, MaxLength(80)] string Name,
    [Range(0.01, 9999999999.99)] decimal TargetAmount,
    // Ignored when AccountId is set — progress then comes from the account balance.
    [Range(0, 9999999999.99)] decimal CurrentAmount,
    int? AccountId,
    DateOnly? TargetDate);

// For unlinked goals, bumps the manual progress. For linked goals, FromAccountId is
// required and the contribution is recorded as a transfer into the linked account.
public record ContributionDto(
    [Range(0.01, 9999999999.99)] decimal Amount,
    int? FromAccountId);
