using MailKit.Net.Smtp;
using MimeKit;

namespace Web_Api_Proyecto.Services;

public class EmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task EnviarCorreoAsync(string to, string subject, string body)
    {
        var host = _config["Email:SmtpHost"];
        if (string.IsNullOrWhiteSpace(host))
        {
            _logger.LogInformation("SMTP no configurado. Correo simulado a {To}: {Subject}\n{Body}", to, subject, body);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Chostito", _config["Email:From"] ?? "noreply@chostito.com"));
        message.To.Add(new MailboxAddress("", to));
        message.Subject = subject;
        var builder = new BodyBuilder();
        if (body.TrimStart().StartsWith("<"))
        {
            builder.HtmlBody = body;
        }
        else
        {
            builder.TextBody = body;
        }
        message.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(host, int.Parse(_config["Email:SmtpPort"] ?? "587"), MailKit.Security.SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(_config["Email:Username"], _config["Email:Password"]);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
        _logger.LogInformation("Correo enviado a {To}: {Subject}", to, subject);
    }
}
