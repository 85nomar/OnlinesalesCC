using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OnlinesalesCC.Server.Models;
using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace OnlinesalesCC.Server.Controllers
{
  [ApiController]
  [Route("api/notifications")]
  public class NotificationsController : ControllerBase
  {
    private readonly IConfiguration _configuration;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(IConfiguration configuration, ILogger<NotificationsController> logger)
    {
      _configuration = configuration;
      _logger = logger;
    }

    /// <summary>
    /// Send email notification
    /// </summary>
    [HttpPost("email")]
    public async Task<IActionResult> SendEmail([FromBody] EmailNotification notification)
    {
      if (notification == null || string.IsNullOrEmpty(notification.To) ||
          string.IsNullOrEmpty(notification.Subject) || string.IsNullOrEmpty(notification.Body))
      {
        return BadRequest("Email notification data is incomplete");
      }

      try
      {
        // Get SMTP settings from configuration
        var smtpServer = _configuration["SmtpSettings:Server"] ?? "localhost";
        var smtpPort = int.Parse(_configuration["SmtpSettings:Port"] ?? "25");
        var smtpUsername = _configuration["SmtpSettings:Username"];
        var smtpPassword = _configuration["SmtpSettings:Password"];
        var smtpEnableSsl = bool.Parse(_configuration["SmtpSettings:EnableSsl"] ?? "false");
        var fromAddress = _configuration["SmtpSettings:FromAddress"] ?? "mmch.engineering@mediamarkt.ch";

        using (var smtpClient = new SmtpClient(smtpServer))
        {
          smtpClient.Port = smtpPort;
          
          // Only set credentials if username is provided
          if (!string.IsNullOrEmpty(smtpUsername) && !string.IsNullOrEmpty(smtpPassword))
          {
            smtpClient.Credentials = new NetworkCredential(smtpUsername, smtpPassword);
          }
          
          smtpClient.EnableSsl = smtpEnableSsl;

          var mailMessage = new MailMessage
          {
            From = new MailAddress(fromAddress),
            Subject = notification.Subject,
            Body = notification.Body,
            IsBodyHtml = notification.IsHtml
          };

          mailMessage.To.Add(notification.To);

          // Add CC recipients if any
          if (notification.Cc != null)
          {
            foreach (var cc in notification.Cc)
            {
              if (!string.IsNullOrEmpty(cc))
              {
                mailMessage.CC.Add(cc);
              }
            }
          }

          _logger.LogInformation($"Sending email to {notification.To} with subject: {notification.Subject}");
          await smtpClient.SendMailAsync(mailMessage);
          
          return Ok(new { message = "Email sent successfully" });
        }
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, $"Failed to send email to {notification.To}: {ex.Message}");
        return StatusCode(500, $"Failed to send email: {ex.Message}");
      }
    }
  }
}