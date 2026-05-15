using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.Dtos;

public record TransferDto(
    int Id,
    int FromAccountId,
    string FromAccountName,
    int ToAccountId,
    string ToAccountName,
    decimal Amount,
    DateOnly Date,
    string Note);

public record TransferInputDto(
    [Range(0.01, 9999999999.99)] decimal Amount,
    int FromAccountId,
    int ToAccountId,
    DateOnly Date,
    [MaxLength(280)] string Note);
