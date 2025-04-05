using System;

namespace OnlinesalesCC.Server.Models
{
  /// <summary>
  /// Request model for filtering grouped orders
  /// </summary>
  public class OrderGroupedFilterRequest : PaginationRequest
  {
    /// <summary>
    /// Filter by article number
    /// </summary>
    public int? ArtikelNr { get; set; }

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
    /// Minimum number of orders
    /// </summary>
    public int? MinAnzahl { get; set; }

    /// <summary>
    /// Filter orders from this date
    /// </summary>
    public DateTime? FromDate { get; set; }

    /// <summary>
    /// Filter orders until this date
    /// </summary>
    public DateTime? ToDate { get; set; }

    /// <summary>
    /// Filter by minimum number of tickets
    /// </summary>
    public int? MinAnzahlTickets { get; set; }
  }
}