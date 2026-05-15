using System.ComponentModel.DataAnnotations;
using FinanceApp.Api.Models;

namespace FinanceApp.Api.Dtos;

public record AccountDto(
    int Id,
    string Name,
    AccountType Type,
    decimal InitialBalance,
    decimal Balance,
    string Color,
    string Icon);

public record AccountInputDto(
    [Required, MaxLength(60)] string Name,
    AccountType Type,
    [Range(-9999999999.99, 9999999999.99)] decimal InitialBalance,
    [MaxLength(20)] string Color,
    [MaxLength(40)] string Icon);
