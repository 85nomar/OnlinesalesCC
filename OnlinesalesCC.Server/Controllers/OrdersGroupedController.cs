using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using OnlinesalesCC.Server.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;

namespace OnlinesalesCC.Server.Controllers
{
  [ApiController]
  [Route("api/orders")]
  public class OrdersGroupedController : ControllerBase
  {
    private readonly string connectionString;
    private readonly IConfiguration _configuration;

    public OrdersGroupedController(IConfiguration configuration)
    {
      _configuration = configuration;
      connectionString = _configuration.GetConnectionString("DefaultConnection");

      // Ensure TrustServerCertificate is set
      if (!connectionString.Contains("TrustServerCertificate=True"))
      {
        connectionString += ";TrustServerCertificate=True";
      }

      // Disable encryption to bypass SSL validation
      if (!connectionString.Contains("Encrypt=False"))
      {
        connectionString += ";Encrypt=False";
      }
    }

    /// <summary>
    /// Get paginated and filtered grouped orders
    /// </summary>
    [HttpGet("grouped")]
    public IActionResult GetGrouped([FromQuery] OrderGroupedFilterRequest filter)
    {
      try
      {
        if (filter == null)
        {
          filter = new OrderGroupedFilterRequest();
        }

        // Add logging to debug pagination parameters
        Console.WriteLine($"Received pagination request: Page={filter.Page}, PageSize={filter.PageSize}, SortBy={filter.SortBy}, SortDirection={filter.SortDirection}");

        var result = new List<OpenOrdersGrouped>();
        int totalCount = 0;

        // Check if we should use pagination or just return all data for backward compatibility
        bool usePagination = Request.Query.ContainsKey("page") || Request.Query.ContainsKey("pageSize");
        Console.WriteLine($"Using pagination: {usePagination}");

        using (var connection = new SqlConnection(connectionString))
        {
          connection.Open();

          if (usePagination)
          {
            try
            {
              // Get total count for pagination metadata
              using (var command = new SqlCommand(BuildCountQuery(filter), connection))
              {
                AddFilterParameters(command, filter);
                totalCount = (int)command.ExecuteScalar();
                Console.WriteLine($"Total count: {totalCount}");
              }

              // Get paginated data
              string dataQuery = BuildDataQuery(filter);
              Console.WriteLine($"Data query: {dataQuery}");

              using (var command = new SqlCommand(dataQuery, connection))
              {
                // Add filter parameters (which now excludes pagination parameters)
                AddFilterParameters(command, filter);

                // Add pagination parameters separately to avoid duplication
                command.Parameters.AddWithValue("@Skip", filter.Skip);
                command.Parameters.AddWithValue("@PageSize", filter.PageSize);

                using (var reader = command.ExecuteReader())
                {
                  while (reader.Read())
                  {
                    var order = MapOrderFromReader(reader);
                    result.Add(order);
                  }
                }
              }

              // Create paginated response
              var paginatedResponse = new PaginatedResponse<OpenOrdersGrouped>(
                  result,
                  totalCount,
                  filter.Page,
                  filter.PageSize);

              return Ok(paginatedResponse);
            }
            catch (Exception ex)
            {
              Console.WriteLine($"Error in paginated query execution: {ex.Message}");
              Console.WriteLine($"Stack trace: {ex.StackTrace}");

              // Fall back to non-paginated query as a safety measure
              result.Clear();
              usePagination = false;
            }
          }

          if (!usePagination)
          {
            // Backward compatibility mode - return all data
            using (var command = new SqlCommand(@"
                WITH ArtikelBestellungen AS (
                    SELECT
                        op.PROD_ORG_ID AS ArtikelNr,
                        wwsza.HRS_TEXT AS Hrs,
                        wwsza.ART_BEZ AS Artikel,
                        wwsza.WGR_NO AS WgrNo,
                        SUM(op.ORDERED_QTY) AS Anzahl,
                        MIN(oh.CREATE_TS) AS Erstelldatum
                    FROM Order_Header AS oh
                    INNER JOIN Order_POS AS op ON oh.SALES_ORDER_NO = op.SALES_ORDER_NO
                    INNER JOIN OnlineShop.dbo.WWS_ZENTRAL_ARTIKEL AS wwsza ON op.PROD_ORG_ID = wwsza.ART_NO
                    WHERE NOT op.STATUS IN (
                            'ORDER_COMPLETED',
                            'CANCELLED',
                            'RETURN_RECEIVED',
                            'RETURN_CREATED',
                            'SHIPPED'
                        )
                        AND NOT op.STATUS LIKE '%PICK%'
                        AND oh.CREATE_TS > '2024-01-01'
                    GROUP BY op.PROD_ORG_ID, wwsza.HRS_TEXT, wwsza.ART_BEZ, wwsza.WGR_NO
                )
                SELECT
                    a.ArtikelNr,
                    a.Hrs,
                    a.Artikel,
                    a.WgrNo,
                    a.Anzahl,
                    a.Erstelldatum,
                    MAX(ot.Entrydate) AS Entrydate,
                    COUNT(ot.TicketID) AS AnzahlTickets
                FROM ArtikelBestellungen AS a
                LEFT JOIN Order_Tickets AS ot
                    ON a.ArtikelNr = ot.ArtikelNr
                    AND ot.Entrydate > a.Erstelldatum
                GROUP BY a.ArtikelNr, a.Hrs, a.Artikel, a.WgrNo, a.Anzahl, a.Erstelldatum
                ORDER BY a.Anzahl DESC", connection))
            {
              using (var reader = command.ExecuteReader())
              {
                while (reader.Read())
                {
                  var order = MapOrderFromReader(reader);
                  result.Add(order);
                }
              }
            }

            return Ok(result);
          }
        }

        // This should never be reached, but add a fallback return
        return Ok(result);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Unhandled error in GetGrouped(): {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return StatusCode(500, $"Internal server error: {ex.Message}");
      }
    }

    // Helper method to map a reader row to an OpenOrdersGrouped object
    private OpenOrdersGrouped MapOrderFromReader(SqlDataReader reader)
    {
      return new OpenOrdersGrouped
      {
        ArtikelNr = reader.GetInt32(reader.GetOrdinal("ArtikelNr")),
        Hrs = reader["Hrs"] != DBNull.Value ? reader["Hrs"].ToString() : null,
        Artikel = reader["Artikel"] != DBNull.Value ? reader["Artikel"].ToString() : null,
        WgrNo = reader["WgrNo"] != DBNull.Value ? reader["WgrNo"].ToString() : null,
        Anzahl = reader["Anzahl"] != DBNull.Value ?
                reader.GetInt32(reader.GetOrdinal("Anzahl")) : null,
        Erstelldatum = reader["Erstelldatum"] != DBNull.Value ?
                (DateTime?)reader.GetDateTime(reader.GetOrdinal("Erstelldatum")) : null,
        // Check if the column exists in the result set
        Entrydate = HasColumn(reader, "Entrydate") && reader["Entrydate"] != DBNull.Value ?
                (DateTime?)reader.GetDateTime(reader.GetOrdinal("Entrydate")) : null,
        AnzahlTickets = reader.GetInt32(reader.GetOrdinal("AnzahlTickets"))
      };
    }

    [HttpGet("grouped/by-itemnr/{artikelNr:int}")]
    public IActionResult GetByArtikelNr(int artikelNr)
    {
      if (artikelNr <= 0)
      {
        return BadRequest("Invalid article number");
      }

      OpenOrdersGrouped? result = null;

      try
      {
        // Revert back to using ADO.NET to avoid EF Core mapping issues
        using (var connection = new SqlConnection(connectionString))
        {
          connection.Open();

          using (var command = new SqlCommand("EXECUTE dbo.Open_Orders_GroupedArtikel", connection))
          {
            using (var reader = command.ExecuteReader())
            {
              while (reader.Read())
              {
                // Check if this row matches our article number
                if (reader.GetInt32(reader.GetOrdinal("ArtikelNr")) == artikelNr)
                {
                  result = new OpenOrdersGrouped
                  {
                    ArtikelNr = reader.GetInt32(reader.GetOrdinal("ArtikelNr")),
                    Hrs = reader["Hrs"] != DBNull.Value ? reader["Hrs"].ToString() : null,
                    Artikel = reader["Artikel"] != DBNull.Value ? reader["Artikel"].ToString() : null,
                    WgrNo = reader["WgrNo"] != DBNull.Value ? reader["WgrNo"].ToString() : null,
                    Anzahl = reader["Anzahl"] != DBNull.Value ?
                            reader.GetInt32(reader.GetOrdinal("Anzahl")) : null,
                    Erstelldatum = reader["Erstelldatum"] != DBNull.Value ?
                            (DateTime?)reader.GetDateTime(reader.GetOrdinal("Erstelldatum")) : null,
                    // Check if the column exists in the result set
                    Entrydate = HasColumn(reader, "Entrydate") && reader["Entrydate"] != DBNull.Value ?
                            (DateTime?)reader.GetDateTime(reader.GetOrdinal("Entrydate")) : null,
                    AnzahlTickets = reader.GetInt32(reader.GetOrdinal("AnzahlTickets"))
                  };

                  break; // Found our match, no need to continue
                }
              }
            }
          }
        }

        if (result == null)
        {
          return NotFound();
        }

        return Ok(result);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Unhandled error in GetByArtikelNr(): {ex.Message}");
        return StatusCode(500, "Internal server error");
      }
    }

    // Helper method to check if a column exists in the result set
    private bool HasColumn(SqlDataReader reader, string columnName)
    {
      for (int i = 0; i < reader.FieldCount; i++)
      {
        if (reader.GetName(i).Equals(columnName, StringComparison.OrdinalIgnoreCase))
          return true;
      }
      return false;
    }

    [HttpGet("with-additional-data")]
    public IActionResult GetWithAdditionalData()
    {
      try
      {
        var result = new List<OrderWithAdditionalDataResponse>();

        // Get grouped orders using the stored procedure
        using (var connection = new SqlConnection(connectionString))
        {
          connection.Open();

          using (var command = new SqlCommand("EXECUTE dbo.Open_Orders_GroupedArtikel", connection))
          {
            using (var reader = command.ExecuteReader())
            {
              while (reader.Read())
              {
                try
                {
                  var order = new OrderWithAdditionalDataResponse
                  {
                    ArtikelNr = reader.GetInt32(reader.GetOrdinal("ArtikelNr")),
                    Hrs = reader["Hrs"] != DBNull.Value ? reader["Hrs"].ToString() : null,
                    Artikel = reader["Artikel"] != DBNull.Value ? reader["Artikel"].ToString() : null,
                    WgrNo = reader["WgrNo"] != DBNull.Value ? reader["WgrNo"].ToString() : null,
                    Anzahl = reader["Anzahl"] != DBNull.Value ?
                          reader.GetInt32(reader.GetOrdinal("Anzahl")) : 0,
                    Erstelldatum = reader["Erstelldatum"] != DBNull.Value ?
                          reader.GetDateTime(reader.GetOrdinal("Erstelldatum")).ToString("yyyy-MM-dd") : string.Empty,
                    AnzahlTickets = reader.GetInt32(reader.GetOrdinal("AnzahlTickets"))
                  };

                  result.Add(order);
                }
                catch (Exception mapEx)
                {
                  Console.WriteLine($"Error mapping order data: {mapEx.Message}");
                }
              }
            }
          }
        }

        // Get additional data and alternative items
        using (var context = new FomdbNewContext())
        {
          try
          {
            var additionalData = context.OrderAdditionalData.ToList();
            var alternativeItems = context.OrderAlternativeItems.ToList();

            // Combine the data
            foreach (var order in result)
            {
              var additional = additionalData.FirstOrDefault(a => a.ArtikelNr == order.ArtikelNr);
              if (additional != null)
              {
                order.NewDeliveryDate = additional.NewDeliveryDate;
                order.OriginalDeliveryDate = additional.OriginalDeliveryDate;
                order.Notes = additional.Notes;
              }

              var alternatives = alternativeItems
                  .Where(a => a.OrderArtikelNr == order.ArtikelNr)
                  .Select(a => new AlternativeItemResponse
                  {
                    ArtikelNr = a.AlternativeArtikelNr,
                    Artikel = a.AlternativeArtikel
                  })
                  .ToList();

              order.AlternativeItems = alternatives;
            }
          }
          catch (Exception ex)
          {
            Console.WriteLine($"Error retrieving additional data: {ex.Message}");
            // Continue with just the order data
          }
        }

        return Ok(result);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Unhandled error in GetWithAdditionalData(): {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return StatusCode(500, "Internal server error");
      }
    }

    [HttpGet("with-additional-data/{artikelNr:int}")]
    public IActionResult GetWithAdditionalDataByArtikelNr(int artikelNr)
    {
      if (artikelNr <= 0)
      {
        return BadRequest("Invalid article number");
      }

      try
      {
        OrderWithAdditionalDataResponse? order = null;

        // Get the specific grouped order using the stored procedure
        using (var connection = new SqlConnection(connectionString))
        {
          connection.Open();

          using (var command = new SqlCommand("EXECUTE dbo.Open_Orders_GroupedArtikel", connection))
          {
            using (var reader = command.ExecuteReader())
            {
              while (reader.Read())
              {
                // Filter by article number
                if (reader.GetInt32(reader.GetOrdinal("ArtikelNr")) == artikelNr)
                {
                  try
                  {
                    order = new OrderWithAdditionalDataResponse
                    {
                      ArtikelNr = reader.GetInt32(reader.GetOrdinal("ArtikelNr")),
                      Hrs = reader["Hrs"] != DBNull.Value ? reader["Hrs"].ToString() : null,
                      Artikel = reader["Artikel"] != DBNull.Value ? reader["Artikel"].ToString() : null,
                      WgrNo = reader["WgrNo"] != DBNull.Value ? reader["WgrNo"].ToString() : null,
                      Anzahl = reader["Anzahl"] != DBNull.Value ?
                            reader.GetInt32(reader.GetOrdinal("Anzahl")) : 0,
                      Erstelldatum = reader["Erstelldatum"] != DBNull.Value ?
                            reader.GetDateTime(reader.GetOrdinal("Erstelldatum")).ToString("yyyy-MM-dd") : string.Empty,
                      AnzahlTickets = reader.GetInt32(reader.GetOrdinal("AnzahlTickets"))
                    };

                    break; // Found our match, no need to continue
                  }
                  catch (Exception mapEx)
                  {
                    Console.WriteLine($"Error mapping order data: {mapEx.Message}");
                  }
                }
              }
            }
          }
        }

        if (order == null)
        {
          return NotFound($"No grouped order found for article {artikelNr}");
        }

        // Get additional data and alternative items
        using (var context = new FomdbNewContext())
        {
          try
          {
            // Find additional data for this article
            var additional = context.OrderAdditionalData
                .FirstOrDefault(a => a.ArtikelNr == artikelNr);

            if (additional != null)
            {
              order.NewDeliveryDate = additional.NewDeliveryDate;
              order.OriginalDeliveryDate = additional.OriginalDeliveryDate;
              order.Notes = additional.Notes;
            }

            // Find alternative items for this article
            var alternatives = context.OrderAlternativeItems
                .Where(a => a.OrderArtikelNr == artikelNr)
                .Select(a => new AlternativeItemResponse
                {
                  ArtikelNr = a.AlternativeArtikelNr,
                  Artikel = a.AlternativeArtikel
                })
                .ToList();

            order.AlternativeItems = alternatives;
          }
          catch (Exception ex)
          {
            Console.WriteLine($"Error retrieving additional data: {ex.Message}");
            // Continue with just the order data
          }
        }

        return Ok(order);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Unhandled error in GetWithAdditionalDataByArtikelNr(): {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return StatusCode(500, "Internal server error");
      }
    }

    #region Helper Methods

    /// <summary>
    /// Build the SQL query to count total filtered records
    /// </summary>
    private string BuildCountQuery(OrderGroupedFilterRequest filter)
    {
      var sql = new StringBuilder(@"
        WITH ArtikelBestellungen AS (
            SELECT
                op.PROD_ORG_ID AS ArtikelNr,
                wwsza.HRS_TEXT AS Hrs,
                wwsza.ART_BEZ AS Artikel,
                wwsza.WGR_NO AS WgrNo,
                SUM(op.ORDERED_QTY) AS Anzahl,
                MIN(oh.CREATE_TS) AS Erstelldatum
            FROM Order_Header AS oh
            INNER JOIN Order_POS AS op ON oh.SALES_ORDER_NO = op.SALES_ORDER_NO
            INNER JOIN OnlineShop.dbo.WWS_ZENTRAL_ARTIKEL AS wwsza ON op.PROD_ORG_ID = wwsza.ART_NO
            WHERE NOT op.STATUS IN (
                    'ORDER_COMPLETED',
                    'CANCELLED',
                    'RETURN_RECEIVED',
                    'RETURN_CREATED',
                    'SHIPPED'
                )
                AND NOT op.STATUS LIKE '%PICK%'
                AND oh.CREATE_TS > '2024-01-01'");

      // Apply WHERE clause filters to the base data
      AppendFilterConditions(sql, filter);

      // Close the CTE
      sql.Append(@" GROUP BY op.PROD_ORG_ID, wwsza.HRS_TEXT, wwsza.ART_BEZ, wwsza.WGR_NO
          )");

      // The count query needs to be restructured to count the final grouped result
      sql.Append(@"
      SELECT COUNT(*)
      FROM (
          SELECT a.ArtikelNr
          FROM ArtikelBestellungen AS a
          LEFT JOIN Order_Tickets AS ot
              ON a.ArtikelNr = ot.ArtikelNr
              AND ot.Entrydate > a.Erstelldatum
          GROUP BY a.ArtikelNr, a.Hrs, a.Artikel, a.WgrNo, a.Anzahl, a.Erstelldatum");

      // Add HAVING clause for ticket count filter
      if (filter.MinAnzahlTickets.HasValue)
      {
        sql.Append(" HAVING COUNT(ot.TicketID) >= @MinAnzahlTickets");
      }

      // Close the subquery
      sql.Append(") AS CountQuery");

      return sql.ToString();
    }

    /// <summary>
    /// Build the SQL query to get paginated and filtered data
    /// </summary>
    private string BuildDataQuery(OrderGroupedFilterRequest filter)
    {
      var sql = new StringBuilder();

      // Start with the common WITH clause for the base data
      sql.Append(@"
          WITH ArtikelBestellungen AS (
              SELECT
                  op.PROD_ORG_ID AS ArtikelNr,
                  wwsza.HRS_TEXT AS Hrs,
                  wwsza.ART_BEZ AS Artikel,
                  wwsza.WGR_NO AS WgrNo,
                  SUM(op.ORDERED_QTY) AS Anzahl,
                  MIN(oh.CREATE_TS) AS Erstelldatum
              FROM Order_Header AS oh
              INNER JOIN Order_POS AS op ON oh.SALES_ORDER_NO = op.SALES_ORDER_NO
              INNER JOIN OnlineShop.dbo.WWS_ZENTRAL_ARTIKEL AS wwsza ON op.PROD_ORG_ID = wwsza.ART_NO
              WHERE NOT op.STATUS IN (
                      'ORDER_COMPLETED',
                      'CANCELLED',
                      'RETURN_RECEIVED',
                      'RETURN_CREATED',
                      'SHIPPED'
                  )
                  AND NOT op.STATUS LIKE '%PICK%'
                  AND oh.CREATE_TS > '2024-01-01'
      ");

      // Apply WHERE clause filters to the base data
      AppendFilterConditions(sql, filter);

      // Close the CTE and start the main query
      sql.Append(@"
              GROUP BY op.PROD_ORG_ID, wwsza.HRS_TEXT, wwsza.ART_BEZ, wwsza.WGR_NO
          )
          SELECT 
              a.ArtikelNr,
              a.Hrs,
              a.Artikel,
              a.WgrNo,
              a.Anzahl,
              a.Erstelldatum,
              MAX(ot.Entrydate) AS Entrydate,
              COUNT(ot.TicketID) AS AnzahlTickets
          FROM ArtikelBestellungen AS a
          LEFT JOIN Order_Tickets AS ot
              ON a.ArtikelNr = ot.ArtikelNr
              AND ot.Entrydate > a.Erstelldatum
          GROUP BY a.ArtikelNr, a.Hrs, a.Artikel, a.WgrNo, a.Anzahl, a.Erstelldatum
      ");

      // Add WHERE clause for ticket count filter if specified
      if (filter.MinAnzahlTickets.HasValue)
      {
        sql.Append(" HAVING COUNT(ot.TicketID) >= @MinAnzahlTickets");
      }

      // Add ORDER BY clause
      string sortColumn = GetSortColumn(filter.SortBy);
      string sortDirection = filter.SortDirection?.ToLower() == "desc" ? "DESC" : "ASC";
      sql.Append($" ORDER BY {sortColumn} {sortDirection}");

      // Add pagination - Use SQL Server 2012+ syntax for OFFSET/FETCH NEXT
      sql.Append(" OFFSET @Skip ROWS FETCH NEXT @PageSize ROWS ONLY");

      return sql.ToString();
    }

    /// <summary>
    /// Append WHERE conditions based on filter criteria
    /// </summary>
    private void AppendFilterConditions(StringBuilder sql, OrderGroupedFilterRequest filter)
    {
      bool hasFilter = false;

      // For use inside the CTE
      if (filter.ArtikelNr.HasValue)
      {
        sql.Append(hasFilter ? " AND" : " AND");
        sql.Append(" op.PROD_ORG_ID = @ArtikelNr");
        hasFilter = true;
      }

      if (!string.IsNullOrEmpty(filter.Hrs))
      {
        sql.Append(hasFilter ? " AND" : " AND");
        sql.Append(" wwsza.HRS_TEXT LIKE @Hrs");
        hasFilter = true;
      }

      if (!string.IsNullOrEmpty(filter.Artikel))
      {
        sql.Append(hasFilter ? " AND" : " AND");
        sql.Append(" wwsza.ART_BEZ LIKE @Artikel");
        hasFilter = true;
      }

      if (!string.IsNullOrEmpty(filter.WgrNo))
      {
        sql.Append(hasFilter ? " AND" : " AND");
        sql.Append(" wwsza.WGR_NO = @WgrNo");
        hasFilter = true;
      }

      if (filter.MinAnzahl.HasValue)
      {
        sql.Append(hasFilter ? " AND" : " AND");
        sql.Append(" op.ORDERED_QTY >= @MinAnzahl");
        hasFilter = true;
      }

      if (filter.FromDate.HasValue)
      {
        sql.Append(hasFilter ? " AND" : " AND");
        sql.Append(" oh.CREATE_TS >= @FromDate");
        hasFilter = true;
      }

      if (filter.ToDate.HasValue)
      {
        sql.Append(hasFilter ? " AND" : " AND");
        sql.Append(" oh.CREATE_TS <= @ToDate");
        hasFilter = true;
      }
    }

    /// <summary>
    /// Add parameters for the SQL query based on filter values
    /// </summary>
    private void AddFilterParameters(SqlCommand command, OrderGroupedFilterRequest filter)
    {
      // Add parameters for WHERE conditions
      if (filter.ArtikelNr.HasValue)
      {
        command.Parameters.AddWithValue("@ArtikelNr", filter.ArtikelNr.Value);
      }

      if (!string.IsNullOrEmpty(filter.Hrs))
      {
        command.Parameters.AddWithValue("@Hrs", $"%{filter.Hrs}%");
      }

      if (!string.IsNullOrEmpty(filter.Artikel))
      {
        command.Parameters.AddWithValue("@Artikel", $"%{filter.Artikel}%");
      }

      if (!string.IsNullOrEmpty(filter.WgrNo))
      {
        command.Parameters.AddWithValue("@WgrNo", filter.WgrNo);
      }

      if (filter.MinAnzahl.HasValue)
      {
        command.Parameters.AddWithValue("@MinAnzahl", filter.MinAnzahl.Value);
      }

      if (filter.FromDate.HasValue)
      {
        command.Parameters.AddWithValue("@FromDate", filter.FromDate.Value);
      }

      if (filter.ToDate.HasValue)
      {
        command.Parameters.AddWithValue("@ToDate", filter.ToDate.Value);
      }

      if (filter.MinAnzahlTickets.HasValue)
      {
        command.Parameters.AddWithValue("@MinAnzahlTickets", filter.MinAnzahlTickets.Value);
      }

      // Do NOT add pagination parameters here, as they will be added separately in the query execution
    }

    /// <summary>
    /// Map sort property to SQL column
    /// </summary>
    private string GetSortColumn(string sortBy)
    {
      if (string.IsNullOrEmpty(sortBy))
      {
        return "a.Anzahl"; // Default sort column
      }

      return sortBy.ToLower() switch
      {
        "artikelnr" => "a.ArtikelNr",
        "hrs" => "a.Hrs",
        "artikel" => "a.Artikel",
        "wgrno" => "a.WgrNo",
        "anzahl" => "a.Anzahl",
        "erstelldatum" => "a.Erstelldatum",
        "entrydate" => "MAX(ot.Entrydate)",
        "anzahltickets" => "COUNT(ot.TicketID)",
        _ => "a.Anzahl"
      };
    }

    #endregion
  }
}