using Microsoft.AspNetCore.Mvc;
using OnlinesalesCC.Server.Models;
using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace OnlinesalesCC.Server.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class NotificationsController : ControllerBase
  {
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
        // Example implementation - this would need to be configured with your SMTP settings
        using (var smtpClient = new SmtpClient("your-smtp-server"))
        {
          smtpClient.Port = 587;
          smtpClient.Credentials = new NetworkCredential("your-username", "your-password");
          smtpClient.EnableSsl = true;

          var mailMessage = new MailMessage
          {
            From = new MailAddress("mmch.engineering@mediamarkt.ch"),
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

          await smtpClient.SendMailAsync(mailMessage);
          return Ok(new { message = "Email sent successfully" });
        }
      }
      catch (Exception ex)
      {
        return StatusCode(500, $"Failed to send email: {ex.Message}");
      }
    }
  }
}