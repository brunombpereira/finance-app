namespace FinanceApp.Api.Services;

// Default IEmailSender: writes the email (including any links) to the application log.
// This keeps the password-reset flow fully functional without an email provider —
// in production, register a real IEmailSender instead.
public class LoggingEmailSender : IEmailSender
{
    private readonly ILogger<LoggingEmailSender> _logger;

    public LoggingEmailSender(ILogger<LoggingEmailSender> logger) => _logger = logger;

    public Task SendAsync(string to, string subject, string body)
    {
        _logger.LogInformation(
            "[EMAIL] To: {To}\nSubject: {Subject}\n{Body}", to, subject, body);
        return Task.CompletedTask;
    }
}
