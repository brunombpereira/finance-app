using System.ComponentModel.DataAnnotations;
using FinanceApp.Api.Models;

namespace FinanceApp.Api.Dtos;

public record CategoryDto(int Id, string Name, TransactionType Type, string Color, string Icon);

public record CategoryInputDto(
    [Required, MaxLength(60)] string Name,
    TransactionType Type,
    [MaxLength(20)] string Color,
    [MaxLength(40)] string Icon);
