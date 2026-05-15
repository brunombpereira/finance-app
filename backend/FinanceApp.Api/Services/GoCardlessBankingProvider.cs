using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FinanceApp.Api.Dtos;

namespace FinanceApp.Api.Services;

// GoCardless Bank Account Data — free tier for personal use, supports
// PSD2-compliant banks across the EU (including Millennium BCP, CGD,
// Santander PT, Novobanco, …). Credentials are obtained at
// https://bankaccountdata.gocardless.com/.
public class GoCardlessBankingProvider : IBankingProvider
{
    private const string BaseUrl = "https://bankaccountdata.gocardless.com/api/v2";

    private readonly HttpClient _http;
    private readonly ILogger<GoCardlessBankingProvider> _logger;
    private readonly string? _secretId;
    private readonly string? _secretKey;

    // Access tokens last 24h; we refresh ~5 min early.
    private string? _accessToken;
    private DateTime _accessExpiresAt;
    private readonly SemaphoreSlim _tokenLock = new(1, 1);

    public GoCardlessBankingProvider(
        HttpClient http,
        IConfiguration config,
        ILogger<GoCardlessBankingProvider> logger)
    {
        _http = http;
        _logger = logger;
        _secretId = config["GoCardless:SecretId"] ?? Environment.GetEnvironmentVariable("GOCARDLESS_SECRET_ID");
        _secretKey = config["GoCardless:SecretKey"] ?? Environment.GetEnvironmentVariable("GOCARDLESS_SECRET_KEY");
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_secretId) && !string.IsNullOrWhiteSpace(_secretKey);

    public async Task<IReadOnlyList<InstitutionDto>> ListInstitutionsAsync(string country, CancellationToken ct = default)
    {
        await EnsureTokenAsync(ct);
        using var resp = await _http.GetAsync($"{BaseUrl}/institutions/?country={Uri.EscapeDataString(country)}", ct);
        resp.EnsureSuccessStatusCode();
        using var stream = await resp.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
        var list = new List<InstitutionDto>();
        foreach (var inst in doc.RootElement.EnumerateArray())
        {
            list.Add(new InstitutionDto(
                inst.GetProperty("id").GetString() ?? "",
                inst.GetProperty("name").GetString() ?? "",
                inst.TryGetProperty("logo", out var logo) ? logo.GetString() : null,
                inst.TryGetProperty("countries", out var cs)
                    ? cs.EnumerateArray().Select(c => c.GetString() ?? "").Where(s => s.Length > 0).ToList()
                    : []));
        }
        return list;
    }

    public async Task<RequisitionCreatedDto> CreateRequisitionAsync(
        string institutionId, string redirectUrl, string reference, CancellationToken ct = default)
    {
        await EnsureTokenAsync(ct);
        var body = new { redirect = redirectUrl, institution_id = institutionId, reference };
        using var resp = await _http.PostAsJsonAsync($"{BaseUrl}/requisitions/", body, ct);
        resp.EnsureSuccessStatusCode();
        using var stream = await resp.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
        return new RequisitionCreatedDto(
            doc.RootElement.GetProperty("id").GetString() ?? "",
            doc.RootElement.GetProperty("link").GetString() ?? "");
    }

    public async Task<RequisitionStatus> GetRequisitionAsync(string requisitionId, CancellationToken ct = default)
    {
        await EnsureTokenAsync(ct);
        using var resp = await _http.GetAsync($"{BaseUrl}/requisitions/{Uri.EscapeDataString(requisitionId)}/", ct);
        resp.EnsureSuccessStatusCode();
        using var stream = await resp.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
        var accounts = doc.RootElement.TryGetProperty("accounts", out var arr)
            ? arr.EnumerateArray().Select(a => a.GetString() ?? "").Where(s => s.Length > 0).ToList()
            : [];
        return new RequisitionStatus(
            doc.RootElement.GetProperty("id").GetString() ?? "",
            doc.RootElement.GetProperty("status").GetString() ?? "CR",
            accounts);
    }

    private async Task EnsureTokenAsync(CancellationToken ct)
    {
        if (!IsConfigured)
            throw new InvalidOperationException("GoCardless não está configurado (faltam GOCARDLESS_SECRET_ID/SECRET_KEY).");

        if (_accessToken is not null && DateTime.UtcNow < _accessExpiresAt)
        {
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);
            return;
        }

        await _tokenLock.WaitAsync(ct);
        try
        {
            if (_accessToken is not null && DateTime.UtcNow < _accessExpiresAt)
                return;

            using var resp = await _http.PostAsJsonAsync(
                $"{BaseUrl}/token/new/",
                new { secret_id = _secretId, secret_key = _secretKey },
                ct);
            resp.EnsureSuccessStatusCode();
            using var stream = await resp.Content.ReadAsStreamAsync(ct);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
            _accessToken = doc.RootElement.GetProperty("access").GetString();
            var lifetime = doc.RootElement.TryGetProperty("access_expires", out var exp) ? exp.GetInt32() : 86400;
            _accessExpiresAt = DateTime.UtcNow.AddSeconds(lifetime - 300);
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);
            _logger.LogInformation("GoCardless token refreshed; expires at {ExpiresAt}", _accessExpiresAt);
        }
        finally
        {
            _tokenLock.Release();
        }
    }
}
