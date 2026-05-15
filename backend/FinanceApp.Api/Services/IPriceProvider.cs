namespace FinanceApp.Api.Services;

public record CurrentPrice(string Symbol, decimal Price, string Currency, DateTime FetchedAt);

public interface IPriceProvider
{
    Task<CurrentPrice?> GetCurrentPriceAsync(string symbol, CancellationToken ct = default);
}
