using FinanceApp.Api.Models;

namespace FinanceApp.Api.Services;

public static class DefaultAccounts
{
    public static IEnumerable<Account> For(string userId) =>
    [
        new()
        {
            UserId = userId,
            Name = "Conta à ordem",
            Type = AccountType.Checking,
            InitialBalance = 0m,
            Color = "#6366f1",
            Icon = "wallet",
        },
        new()
        {
            UserId = userId,
            Name = "Poupança",
            Type = AccountType.Savings,
            InitialBalance = 0m,
            Color = "#10b981",
            Icon = "piggy-bank",
        },
    ];
}
