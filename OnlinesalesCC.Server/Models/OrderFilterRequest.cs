using System;

namespace OnlinesalesCC.Server.Models
{
  /// <summary>
  /// Request model for filtering orders
  /// </summary>
  public class OrderFilterRequest : PaginationRequest
  {
    /// <summary>
    /// Filter by article number
    /// </summary>
    public int? ArtikelNr { get; set; }

    /// <summary>
    /// Filter by order number
    /// </summary>
    public long? BestellNr { get; set; }

    /// <summary>
    /// Filter by order status
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Filter by HRS Text (partial match)
    /// </summary>
    public string? Hrs { get; set; }

    /// <summary>
    /// Filter by article name (partial match)
    /// </summary>
    public string? Artikel { get; set; }

    /// <summary>
    /// Filter by WGR number
    /// </summary>
    public string? WgrNo { get; set; }

    /// <summary>
    /// Filter orders from this date
    /// </summary>
    public DateTime? FromDate { get; set; }

    /// <summary>
    /// Filter orders until this date
    /// </summary>
    public DateTime? ToDate { get; set; }
  }
}