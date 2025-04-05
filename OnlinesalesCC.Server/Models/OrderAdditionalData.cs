using System;
using System.Collections.Generic;

namespace OnlinesalesCC.Server.Models
{
  public partial class OrderAdditionalData
  {
    public int Id { get; set; }
    public int ArtikelNr { get; set; }
    public string? NewDeliveryDate { get; set; }
    public string? OriginalDeliveryDate { get; set; }
    public string? Notes { get; set; }

    // Navigation property for related alternative items
    // Not mapped to the database directly, but used for API responses
    public ICollection<AlternativeItemResponse>? AlternativeItems { get; set; }
  }
}