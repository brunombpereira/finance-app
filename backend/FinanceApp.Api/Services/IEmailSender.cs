namespace FinanceApp.Api.Services;

// Sends transactional emails (password reset, …). Swap the implementation for a real
// provider (SendGrid, Resend, SMTP) in production — see LoggingEmailSender.
public interface IEmailSender
{
    Task SendAsync(string to, string subject, string body);
}
