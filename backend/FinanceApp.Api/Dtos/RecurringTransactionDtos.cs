using System.ComponentModel.DataAnnotations;
using FinanceApp.Api.Models;

namespace FinanceApp.Api.Dtos;

public record RecurringTransactionDto(
    int Id,
    decimal Amount,
    TransactionType Type,
    int CategoryId,
    string CategoryName,
    string CategoryColor,
    string CategoryIcon,
    int AccountId,
    string AccountName,
    int DayOfMonth,
    string Note,
    bool Active,
    DateOnly StartDate,
    DateOnly? LastRunDate);

public record RecurringTransactionInputDto(
    [Range(0.01, 9999999999.99)] decimal Amount,
    TransactionType Type,
    int CategoryId,
    int AccountId,
    [Range(1, 28)] int DayOfMonth,
    [MaxLength(280)] string Note,
    bool Active,
    DateOnly StartDate);
