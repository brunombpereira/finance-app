using System.ComponentModel.DataAnnotations;
using FinanceApp.Api.Models;

namespace FinanceApp.Api.Dtos;

public record TransactionDto(
    int Id,
    decimal Amount,
    DateOnly Date,
    TransactionType Type,
    int CategoryId,
    string CategoryName,
    string CategoryColor,
    string CategoryIcon,
    int AccountId,
    string AccountName,
    string Note);

public record TransactionInputDto(
    [Range(0.01, 9999999999.99)] decimal Amount,
    DateOnly Date,
    TransactionType Type,
    int CategoryId,
    int AccountId,
    [MaxLength(280)] string Note);

public record PagedTransactionsDto(
    IReadOnlyList<TransactionDto> Items,
    int Total,
    // Totals over the whole filtered set, not just the current page.
    decimal TotalIncome,
    decimal TotalExpense,
    int Page,
    int PageSize);
