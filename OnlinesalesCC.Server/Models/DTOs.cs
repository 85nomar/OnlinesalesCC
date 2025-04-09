using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OnlinesalesCC.Server.Models
{
  // DTO for delivery date updates
  public class DeliveryDateUpdate
  {
    [Required]
    public string NewDeliveryDate { get; set; } = string.Empty;
    public string? OriginalDeliveryDate { get; set; }
  }

  // Request DTO for adding alternative items
  public class AlternativeItemRequest
  {
    [Required]
    public int ArtikelNr { get; set; }

    [Required]
    public string Artikel { get; set; } = string.Empty;
  }

  // Response DTO for alternative items
  public class AlternativeItemResponse
  {
    [Key] // Add this attribute to mark this as a key property
    public int ArtikelNr { get; set; }  // Same as AlternativeArtikelNr for client compatibility
    public string Artikel { get; set; } = string.Empty;  // Same as AlternativeArtikel for client compatibility
  }

  // Combined response DTO for orders with additional data
  public class OrderWithAdditionalDataResponse
  {
    // Order properties
    public int ArtikelNr { get; set; }
    public string? Hrs { get; set; }
    public string? Artikel { get; set; }
    public string? WgrNo { get; set; }
    public int Anzahl { get; set; }
    public string Erstelldatum { get; set; } = string.Empty;
    public int AnzahlTickets { get; set; }

    // Additional data properties
    public string? NewDeliveryDate { get; set; }
    public string? OriginalDeliveryDate { get; set; }
    public string? Notes { get; set; }

    // Alternative items
    public List<AlternativeItemResponse> AlternativeItems { get; set; } = new List<AlternativeItemResponse>();
  }

  // Email notification DTO
  public class EmailNotification
  {
    [Required]
    public string To { get; set; } = string.Empty;
    public string[] Cc { get; set; } = Array.Empty<string>();
    [Required]
    public string Subject { get; set; } = string.Empty;
    [Required]
    public string Body { get; set; } = string.Empty;
    public bool IsHtml { get; set; } = true;
  }
}