using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.Dtos;

public record BudgetDto(
    int Id,
    int CategoryId,
    string CategoryName,
    string CategoryColor,
    string CategoryIcon,
    int Year,
    int Month,
    decimal LimitAmount,
    decimal SpentAmount);

public record BudgetInputDto(
    int CategoryId,
    [Range(2000, 2100)] int Year,
    [Range(1, 12)] int Month,
    [Range(0.01, 9999999999.99)] decimal LimitAmount);
