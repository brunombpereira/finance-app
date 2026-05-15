using FinanceApp.Api.Models;

namespace FinanceApp.Api.Services;

public static class DefaultCategories
{
    public static IEnumerable<Category> For(string userId) =>
    [
        new() { UserId = userId, Name = "Salário", Type = TransactionType.Income, Color = "#16a34a", Icon = "wallet" },
        new() { UserId = userId, Name = "Outros rendimentos", Type = TransactionType.Income, Color = "#0ea5e9", Icon = "plus-circle" },
        new() { UserId = userId, Name = "Alimentação", Type = TransactionType.Expense, Color = "#f97316", Icon = "utensils" },
        new() { UserId = userId, Name = "Habitação", Type = TransactionType.Expense, Color = "#8b5cf6", Icon = "home" },
        new() { UserId = userId, Name = "Transportes", Type = TransactionType.Expense, Color = "#0ea5e9", Icon = "car" },
        new() { UserId = userId, Name = "Lazer", Type = TransactionType.Expense, Color = "#ec4899", Icon = "gamepad" },
        new() { UserId = userId, Name = "Saúde", Type = TransactionType.Expense, Color = "#ef4444", Icon = "heart" },
        new() { UserId = userId, Name = "Compras", Type = TransactionType.Expense, Color = "#eab308", Icon = "shopping-bag" },
        new() { UserId = userId, Name = "Outros", Type = TransactionType.Expense, Color = "#64748b", Icon = "tag" },
    ];
}
