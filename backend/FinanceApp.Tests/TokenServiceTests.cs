using FinanceApp.Api.Models;
using FinanceApp.Api.Services;
using Microsoft.Extensions.Configuration;

namespace FinanceApp.Tests;

public class TokenServiceTests
{
    private static IConfiguration BuildConfig() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "a-test-signing-key-long-enough-for-hmac-sha256",
                ["Jwt:Issuer"] = "FinanceApp",
                ["Jwt:Audience"] = "FinanceAppClient",
                ["Jwt:ExpiryMinutes"] = "15",
                ["Jwt:RefreshTokenDays"] = "30",
            })
            .Build();

    [Fact]
    public void GenerateSecureToken_ReturnsDistinctNonEmptyValues()
    {
        var a = TokenService.GenerateSecureToken();
        var b = TokenService.GenerateSecureToken();

        Assert.False(string.IsNullOrWhiteSpace(a));
        Assert.NotEqual(a, b);
    }

    [Fact]
    public void CreateAccessToken_ProducesTokenWithFutureExpiry()
    {
        using var db = TestDbContextFactory.Create();
        var service = new TokenService(BuildConfig(), db);

        var (token, expiresAt) = service.CreateAccessToken(
            new AppUser { Id = "user-1", Email = "a@b.com", DisplayName = "A" });

        Assert.False(string.IsNullOrWhiteSpace(token));
        Assert.True(expiresAt > DateTime.UtcNow);
    }

    [Fact]
    public async Task CreateRefreshToken_PersistsAnActiveTokenForThirtyDays()
    {
        using var db = TestDbContextFactory.Create();
        var service = new TokenService(BuildConfig(), db);

        var refreshToken = await service.CreateRefreshTokenAsync("user-1");

        Assert.Equal("user-1", refreshToken.UserId);
        Assert.True(refreshToken.IsActive);
        Assert.Null(refreshToken.RevokedAt);
        // ~30 days out, allowing a small window for execution time.
        Assert.True(refreshToken.ExpiresAt > DateTime.UtcNow.AddDays(29));
        Assert.True(refreshToken.ExpiresAt < DateTime.UtcNow.AddDays(31));
        Assert.Single(db.RefreshTokens);
    }
}
