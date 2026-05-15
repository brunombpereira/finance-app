using FinanceApp.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Transfer> Transfers => Set<Transfer>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<SavingsGoal> SavingsGoals => Set<SavingsGoal>();
    public DbSet<RecurringTransaction> RecurringTransactions => Set<RecurringTransaction>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<Investment> Investments => Set<Investment>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Account>(e =>
        {
            e.Property(a => a.InitialBalance).HasPrecision(14, 2);
            e.HasOne(a => a.User)
                .WithMany(u => u.Accounts)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(a => a.UserId);
        });

        builder.Entity<Transfer>(e =>
        {
            e.Property(t => t.Amount).HasPrecision(14, 2);
            e.HasOne(t => t.User)
                .WithMany(u => u.Transfers)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(t => t.FromAccount)
                .WithMany()
                .HasForeignKey(t => t.FromAccountId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(t => t.ToAccount)
                .WithMany()
                .HasForeignKey(t => t.ToAccountId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(t => new { t.UserId, t.Date });
        });

        builder.Entity<Category>(e =>
        {
            e.HasOne(c => c.User)
                .WithMany(u => u.Categories)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(c => new { c.UserId, c.Name, c.Type }).IsUnique();
        });

        builder.Entity<Transaction>(e =>
        {
            e.Property(t => t.Amount).HasPrecision(14, 2);
            e.HasOne(t => t.User)
                .WithMany(u => u.Transactions)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(t => t.Category)
                .WithMany(c => c.Transactions)
                .HasForeignKey(t => t.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(t => t.Account)
                .WithMany(a => a.Transactions)
                .HasForeignKey(t => t.AccountId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(t => new { t.UserId, t.Date });
        });

        builder.Entity<Budget>(e =>
        {
            e.Property(b => b.LimitAmount).HasPrecision(14, 2);
            e.HasOne(b => b.User)
                .WithMany(u => u.Budgets)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(b => b.Category)
                .WithMany(c => c.Budgets)
                .HasForeignKey(b => b.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(b => new { b.UserId, b.CategoryId, b.Year, b.Month }).IsUnique();
        });

        builder.Entity<SavingsGoal>(e =>
        {
            e.Property(g => g.TargetAmount).HasPrecision(14, 2);
            e.Property(g => g.CurrentAmount).HasPrecision(14, 2);
            e.HasOne(g => g.User)
                .WithMany(u => u.SavingsGoals)
                .HasForeignKey(g => g.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(g => g.Account)
                .WithMany()
                .HasForeignKey(g => g.AccountId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<RecurringTransaction>(e =>
        {
            e.Property(r => r.Amount).HasPrecision(14, 2);
            e.HasOne(r => r.User)
                .WithMany(u => u.RecurringTransactions)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(r => r.Category)
                .WithMany()
                .HasForeignKey(r => r.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(r => r.Account)
                .WithMany()
                .HasForeignKey(r => r.AccountId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(r => new { r.UserId, r.Active });
        });

        builder.Entity<RefreshToken>(e =>
        {
            e.HasOne(t => t.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(t => t.Token).IsUnique();
        });

        builder.Entity<PasswordResetToken>(e =>
        {
            e.HasOne(t => t.User)
                .WithMany(u => u.PasswordResetTokens)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(t => t.Token).IsUnique();
        });

        builder.Entity<Investment>(e =>
        {
            e.Property(i => i.Quantity).HasPrecision(18, 6);
            e.Property(i => i.AvgCost).HasPrecision(18, 4);
            e.HasOne(i => i.User)
                .WithMany(u => u.Investments)
                .HasForeignKey(i => i.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(i => new { i.UserId, i.Symbol });
        });
    }
}
