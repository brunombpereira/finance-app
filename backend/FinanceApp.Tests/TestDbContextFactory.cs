using FinanceApp.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Tests;

internal static class TestDbContextFactory
{
    // Each call gets an isolated in-memory database.
    public static AppDbContext Create()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }
}
