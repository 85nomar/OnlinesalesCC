using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OnlinesalesCC.Server.Models;

[Table("OrderTickets")]
public class OrderTicket
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString(); // Using string ID to match client format

    [Required]
    public int TicketId { get; set; }

    [Required]
    public int ArtikelNr { get; set; }

    [Required]
    public int BestellNr { get; set; }

    [Required]
    public string Comment { get; set; } = string.Empty;

    [Required]
    public string ByUser { get; set; } = "System User";

    [Required]
    public string Entrydate { get; set; } = DateTime.UtcNow.ToString("O"); // ISO 8601 format to match client
}
