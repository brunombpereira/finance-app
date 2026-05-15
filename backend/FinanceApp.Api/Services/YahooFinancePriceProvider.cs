using System.Collections.Concurrent;
using System.Text.Json;

namespace FinanceApp.Api.Services;

// Public Yahoo Finance chart endpoint — no API key required. Prices are cached
// per-process for `CacheDuration` to keep dashboard/portfolio renders snappy.
public class YahooFinancePriceProvider : IPriceProvider
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(10);
    private static readonly ConcurrentDictionary<string, CurrentPrice> _cache = new();

    private readonly HttpClient _http;
    private readonly ILogger<YahooFinancePriceProvider> _logger;

    public YahooFinancePriceProvider(HttpClient http, ILogger<YahooFinancePriceProvider> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<CurrentPrice?> GetCurrentPriceAsync(string symbol, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(symbol)) return null;

        if (_cache.TryGetValue(symbol, out var cached)
            && DateTime.UtcNow - cached.FetchedAt < CacheDuration)
            return cached;

        try
        {
            var url = $"https://query1.finance.yahoo.com/v8/finance/chart/{Uri.EscapeDataString(symbol)}?interval=1d&range=1d";
            using var resp = await _http.GetAsync(url, ct);
            if (!resp.IsSuccessStatusCode)
            {
                _logger.LogWarning("Yahoo Finance returned {Status} for {Symbol}", resp.StatusCode, symbol);
                return null;
            }

            using var stream = await resp.Content.ReadAsStreamAsync(ct);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
            var meta = doc.RootElement
                .GetProperty("chart").GetProperty("result")[0]
                .GetProperty("meta");

            var price = meta.GetProperty("regularMarketPrice").GetDecimal();
            var currency = meta.TryGetProperty("currency", out var c) ? (c.GetString() ?? "USD") : "USD";

            var result = new CurrentPrice(symbol, price, currency, DateTime.UtcNow);
            _cache[symbol] = result;
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch price for {Symbol}", symbol);
            return null;
        }
    }
}
