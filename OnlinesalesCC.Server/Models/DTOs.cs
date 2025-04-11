using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OnlinesalesCC.Server.Models
{
    #region Common DTOs
    // PaginatedResponse<T> removed - use PaginatedResponse in PaginationModels.cs
    #endregion

    #region Orders DTOs
    // OrderFilterRequest and OrderGroupedFilterRequest removed - use classes in respective dedicated files
    #endregion

    #region Tickets DTOs
    // Currently, the OrderTicket class is used directly with no specific DTOs
    #endregion

    #region Notifications DTOs

    /// <summary>
    /// Email notification request
    /// </summary>
    public class EmailNotification
    {
        public string To { get; set; } = string.Empty;
        public List<string>? Cc { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public bool IsHtml { get; set; } = true;
    }

    #endregion

    #region Orders Additional Data DTOs

    /// <summary>
    /// Request for delivery date update
    /// </summary>
    public class DeliveryDateUpdate
    {
        [Required]
        public string NewDeliveryDate { get; set; } = string.Empty;
        public string? OriginalDeliveryDate { get; set; }
    }

    /// <summary>
    /// Alternative item request
    /// </summary>
    public class AlternativeItemRequest
    {
        [Required]
        public int ArtikelNr { get; set; }

        [Required]
        public string Artikel { get; set; } = string.Empty;
    }

    /// <summary>
    /// Alternative item response
    /// </summary>
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

    #endregion
}