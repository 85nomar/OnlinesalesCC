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
  [Route("api/[controller]")]
  public class OrdersController : ControllerBase
  {
    private readonly string connectionString;
    private readonly IConfiguration _configuration;

    public OrdersController(IConfiguration configuration)
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
    /// Get paginated and filtered orders
    /// </summary>
    /// <param name="filter">Filter and pagination parameters</param>
    /// <returns>Paginated list of orders</returns>
    [HttpGet]
    public IActionResult Get([FromQuery] OrderFilterRequest filter)
    {
      try
      {
        if (filter == null)
        {
          filter = new OrderFilterRequest();
        }

        // Add logging to debug pagination parameters
        Console.WriteLine($"Orders Controller - Received pagination request: Page={filter.Page}, PageSize={filter.PageSize}, SortBy={filter.SortBy}, SortDirection={filter.SortDirection}");

        var result = new List<OpenOrders>();
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
              // First get total count of all matching records
              using (var command = new SqlCommand("EXECUTE dbo.Open_Orders_Artikel_Count", connection))
              {
                // We could add filter parameters here if the stored procedure supports them
                totalCount = (int)command.ExecuteScalar();
                Console.WriteLine($"Total count: {totalCount}");
              }

              // Then get paginated data with another stored procedure call
              using (var command = new SqlCommand("EXECUTE dbo.Open_Orders_Artikel_Paged @Skip, @PageSize, @SortColumn, @SortDirection", connection))
              {
                // Add pagination parameters
                int skip = (filter.Page - 1) * filter.PageSize;
                command.Parameters.AddWithValue("@Skip", skip);
                command.Parameters.AddWithValue("@PageSize", filter.PageSize);

                // Add sorting parameters
                string sortColumn = string.IsNullOrEmpty(filter.SortBy) ? "Erstelldatum" : filter.SortBy;
                string sortDirection = filter.SortDirection?.ToLower() == "desc" ? "DESC" : "ASC";
                command.Parameters.AddWithValue("@SortColumn", sortColumn);
                command.Parameters.AddWithValue("@SortDirection", sortDirection);

                // Execute and map results
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
              var paginatedResponse = new PaginatedResponse<OpenOrders>(
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

              // Fall back to non-paginated query if we have an error with the paginated version
              result.Clear();
              usePagination = false;
            }
          }

          if (!usePagination)
          {
            // Backward compatibility mode - use the existing stored procedure
            // But ensure we still honor the page size if possible
            int pageSize = filter.PageSize > 0 ? filter.PageSize : 25; // Default to 25 if not specified

            // Using direct SQL query for better control over filtering and pagination
            string sql = @"
              SELECT 
                  oh.ORIG_SALES_ORDER_NO AS BestellNr,
                  oh.CREATE_TS AS Erstelldatum,
                  op.PROD_ORG_ID AS ArtikelNr,
                  wwsza.HRS_TEXT AS Hrs,
                  wwsza.ART_BEZ AS Artikel,
                  wwsza.WGR_NO AS WgrNo,
                  op.ORDERED_QTY AS Anzahl,
                  op.STATUS AS BestellStatus
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
              ORDER BY oh.CREATE_TS DESC
              OFFSET 0 ROWS
              FETCH NEXT @PageSize ROWS ONLY";

            using (var command = new SqlCommand(sql, connection))
            {
              command.Parameters.AddWithValue("@PageSize", pageSize);

              using (var reader = command.ExecuteReader())
              {
                while (reader.Read())
                {
                  var order = MapOrderFromReader(reader);
                  result.Add(order);
                }
              }
            }

            // Get total count for backward compatibility
            string countSql = @"
              SELECT COUNT(*)
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
              AND NOT op.STATUS LIKE '%PICK%'";

            using (var countCommand = new SqlCommand(countSql, connection))
            {
              totalCount = (int)countCommand.ExecuteScalar();
            }

            // Return paginated response format for consistency
            var paginatedResponse = new PaginatedResponse<OpenOrders>(
                result,
                totalCount,
                1, // Default to first page in backward compatibility mode
                pageSize);

            return Ok(paginatedResponse);
          }
        }

        // This should never be reached, but add a fallback return
        return Ok(result);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Unhandled error in Get(): {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return StatusCode(500, $"Internal server error: {ex.Message}");
      }
    }

    // Helper method to map a reader row to an OpenOrders object
    private OpenOrders MapOrderFromReader(SqlDataReader reader)
    {
      return new OpenOrders
      {
        BestellNr = reader.GetInt64(reader.GetOrdinal("BestellNr")),
        Erstelldatum = reader["Erstelldatum"] != DBNull.Value ?
                (DateTime?)reader.GetDateTime(reader.GetOrdinal("Erstelldatum")) : null,
        ArtikelNr = reader.GetInt32(reader.GetOrdinal("ArtikelNr")),
        Hrs = reader["Hrs"] != DBNull.Value ? reader["Hrs"].ToString() : null,
        Artikel = reader["Artikel"] != DBNull.Value ? reader["Artikel"].ToString() : null,
        WgrNo = reader["WgrNo"] != DBNull.Value ? reader["WgrNo"].ToString() : null,
        Anzahl = reader["Anzahl"] != DBNull.Value ?
                reader.GetInt32(reader.GetOrdinal("Anzahl")) : null,
        BestellStatus = reader["BestellStatus"] != DBNull.Value ? reader["BestellStatus"].ToString() : null
      };
    }

    [HttpGet("by-itemnr/{artikelNr:int}")]
    public IActionResult GetByArtikelNr(int artikelNr)
    {
      if (artikelNr <= 0)
      {
        return BadRequest("Invalid item number");
      }

      Console.WriteLine($"Searching for orders with item number: {artikelNr}");
      var result = new List<OpenOrders>();

      try
      {
        using (var connection = new SqlConnection(connectionString))
        {
          connection.Open();

          // Use direct SQL query with parameter for best performance
          string sql = @"
            SELECT 
                oh.ORIG_SALES_ORDER_NO AS BestellNr,
                oh.CREATE_TS AS Erstelldatum,
                op.PROD_ORG_ID AS ArtikelNr,
                wwsza.HRS_TEXT AS Hrs,
                wwsza.ART_BEZ AS Artikel,
                wwsza.WGR_NO AS WgrNo,
                op.ORDERED_QTY AS Anzahl,
                op.STATUS AS BestellStatus
            FROM Order_Header AS oh
            INNER JOIN Order_POS AS op ON oh.SALES_ORDER_NO = op.SALES_ORDER_NO
            INNER JOIN OnlineShop.dbo.WWS_ZENTRAL_ARTIKEL AS wwsza ON op.PROD_ORG_ID = wwsza.ART_NO
            WHERE op.PROD_ORG_ID = @artikelNr
            AND NOT op.STATUS IN (
                'ORDER_COMPLETED',
                'CANCELLED',
                'RETURN_RECEIVED',
                'RETURN_CREATED',
                'SHIPPED'
            )
            AND NOT op.STATUS LIKE '%PICK%'
            ORDER BY oh.CREATE_TS DESC";

          using (var command = new SqlCommand(sql, connection))
          {
            command.Parameters.AddWithValue("@artikelNr", artikelNr);
            
            // Set timeouts - increase from default 30 seconds to ensure completion
            command.CommandTimeout = 60; // 60 seconds
            
            Console.WriteLine($"Executing direct SQL query for item: {artikelNr}");

            using (var reader = command.ExecuteReader())
            {
              int count = 0;
              while (reader.Read())
              {
                count++;
                var order = MapOrderFromReader(reader);
                result.Add(order);
              }
              Console.WriteLine($"Found {count} matching orders for item {artikelNr}");
            }
          }
        }

        if (result.Count == 0)
        {
          Console.WriteLine($"No orders found for item: {artikelNr}");
          return NotFound();
        }

        Console.WriteLine($"Returning {result.Count} orders for item: {artikelNr}");
        return Ok(result);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error in GetByArtikelNr({artikelNr}): {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return StatusCode(500, "Internal server error");
      }
    }

    [HttpGet("by-ordernr/{bestellNr:long}")]
    public IActionResult GetByBestellNr(long bestellNr)
    {
      if (bestellNr <= 0)
      {
        return BadRequest("Invalid order number");
      }

      Console.WriteLine($"Searching for order with bestellNr: {bestellNr}");
      var result = new List<OpenOrders>();

      try
      {
        using (var connection = new SqlConnection(connectionString))
        {
          connection.Open();

          // Use direct parameterized SQL query for better performance
          string sql = @"
                SELECT 
                    oh.ORIG_SALES_ORDER_NO AS BestellNr,
                    oh.CREATE_TS AS Erstelldatum,
                    op.PROD_ORG_ID AS ArtikelNr,
                    wwsza.HRS_TEXT AS Hrs,
                    wwsza.ART_BEZ AS Artikel,
                    wwsza.WGR_NO AS WgrNo,
                    op.ORDERED_QTY AS Anzahl,
                    op.STATUS AS BestellStatus
                FROM Order_Header AS oh
                INNER JOIN Order_POS AS op ON oh.SALES_ORDER_NO = op.SALES_ORDER_NO
                INNER JOIN OnlineShop.dbo.WWS_ZENTRAL_ARTIKEL AS wwsza ON op.PROD_ORG_ID = wwsza.ART_NO
                WHERE oh.ORIG_SALES_ORDER_NO = @BestellNr
                AND NOT op.STATUS IN (
                    'ORDER_COMPLETED',
                    'CANCELLED',
                    'RETURN_RECEIVED',
                    'RETURN_CREATED',
                    'SHIPPED'
                )
                AND NOT op.STATUS LIKE '%PICK%'
                ORDER BY oh.CREATE_TS DESC";

          using (var command = new SqlCommand(sql, connection))
          {
            // Add parameter for order number
            command.Parameters.AddWithValue("@BestellNr", bestellNr);
            
            // Set timeouts - increase from default 30 seconds to ensure completion
            command.CommandTimeout = 60; // 60 seconds
            
            Console.WriteLine($"Executing direct SQL query for order: {bestellNr}");
            
            using (var reader = command.ExecuteReader())
            {
              int count = 0;
              while (reader.Read())
              {
                count++;
                var order = MapOrderFromReader(reader);
                result.Add(order);
              }
              Console.WriteLine($"Found {count} matching rows in database for order {bestellNr}");
            }
          }
        }

        if (result.Count == 0)
        {
          Console.WriteLine($"No orders found for bestellNr: {bestellNr}");
          return NotFound();
        }

        Console.WriteLine($"Found {result.Count} orders for bestellNr: {bestellNr}");
        return Ok(result);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error in GetByBestellNr({bestellNr}): {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return StatusCode(500, "Internal server error");
      }
    }

    #region Helper Methods

    /// <summary>
    /// Build the SQL query to count total filtered records
    /// </summary>
    private string BuildCountQuery(OrderFilterRequest filter)
    {
      var sql = new StringBuilder(@"
                SELECT COUNT(*)
                FROM Order_Header AS oh
                INNER JOIN Order_POS AS op ON oh.SALES_ORDER_NO = op.SALES_ORDER_NO
                INNER JOIN OnlineShop.dbo.WWS_ZENTRAL_ARTIKEL AS wwsza ON op.PROD_ORG_ID = wwsza.ART_NO
                WHERE 1=1");

      AppendFilterConditions(sql, filter);

      return sql.ToString();
    }

    /// <summary>
    /// Build the SQL query to get paginated and filtered data
    /// </summary>
    private string BuildDataQuery(OrderFilterRequest filter)
    {
      var orderBy = string.IsNullOrEmpty(filter.SortBy) ? "oh.CREATE_TS" : GetSortColumn(filter.SortBy);
      var sortDirection = filter.SortDirection.ToLower() == "desc" ? "DESC" : "ASC";

      var sql = new StringBuilder(@"
                SELECT 
                    oh.ORIG_SALES_ORDER_NO AS BestellNr,
                    oh.CREATE_TS AS Erstelldatum,
                    op.PROD_ORG_ID AS ArtikelNr,
                    wwsza.HRS_TEXT AS Hrs,
                    wwsza.ART_BEZ AS Artikel,
                    wwsza.WGR_NO AS WgrNo,
                    op.ORDERED_QTY AS Anzahl,
                    op.STATUS AS BestellStatus
                FROM Order_Header AS oh
                INNER JOIN Order_POS AS op ON oh.SALES_ORDER_NO = op.SALES_ORDER_NO
                INNER JOIN OnlineShop.dbo.WWS_ZENTRAL_ARTIKEL AS wwsza ON op.PROD_ORG_ID = wwsza.ART_NO
                WHERE 1=1");

      AppendFilterConditions(sql, filter);

      // Add ORDER BY and pagination
      sql.Append($" ORDER BY {orderBy} {sortDirection}");
      sql.Append(" OFFSET @Skip ROWS FETCH NEXT @PageSize ROWS ONLY");

      return sql.ToString();
    }

    /// <summary>
    /// Append WHERE conditions for filtering
    /// </summary>
    private void AppendFilterConditions(StringBuilder sql, OrderFilterRequest filter)
    {
      if (filter.ArtikelNr.HasValue)
      {
        sql.Append(" AND op.PROD_ORG_ID = @ArtikelNr");
      }

      if (filter.BestellNr.HasValue)
      {
        sql.Append(" AND oh.ORIG_SALES_ORDER_NO = @BestellNr");
      }

      if (!string.IsNullOrEmpty(filter.Status))
      {
        sql.Append(" AND op.STATUS = @Status");
      }

      if (!string.IsNullOrEmpty(filter.Hrs))
      {
        sql.Append(" AND wwsza.HRS_TEXT LIKE @Hrs");
      }

      if (!string.IsNullOrEmpty(filter.Artikel))
      {
        sql.Append(" AND wwsza.ART_BEZ LIKE @Artikel");
      }

      if (!string.IsNullOrEmpty(filter.WgrNo))
      {
        sql.Append(" AND wwsza.WGR_NO = @WgrNo");
      }

      if (filter.FromDate.HasValue)
      {
        sql.Append(" AND oh.CREATE_TS >= @FromDate");
      }

      if (filter.ToDate.HasValue)
      {
        sql.Append(" AND oh.CREATE_TS <= @ToDate");
      }

      // Exclude completed, cancelled, etc. orders
      sql.Append(@" AND NOT op.STATUS IN (
                  'ORDER_COMPLETED',
                  'CANCELLED',
                  'RETURN_RECEIVED',
                  'RETURN_CREATED',
                  'SHIPPED'
              ) AND NOT op.STATUS LIKE '%PICK%'");
    }

    /// <summary>
    /// Add parameters for filtering to the SQL command
    /// </summary>
    private void AddFilterParameters(SqlCommand command, OrderFilterRequest filter)
    {
      if (filter.ArtikelNr.HasValue)
      {
        command.Parameters.AddWithValue("@ArtikelNr", filter.ArtikelNr.Value);
      }

      if (filter.BestellNr.HasValue)
      {
        command.Parameters.AddWithValue("@BestellNr", filter.BestellNr.Value);
      }

      if (!string.IsNullOrEmpty(filter.Status))
      {
        command.Parameters.AddWithValue("@Status", filter.Status);
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

      if (filter.FromDate.HasValue)
      {
        command.Parameters.AddWithValue("@FromDate", filter.FromDate.Value);
      }

      if (filter.ToDate.HasValue)
      {
        command.Parameters.AddWithValue("@ToDate", filter.ToDate.Value.AddDays(1).AddSeconds(-1)); // Include the entire day
      }
    }

    /// <summary>
    /// Map the sort property to the actual SQL column name
    /// </summary>
    private string GetSortColumn(string sortBy)
    {
      return sortBy.ToLower() switch
      {
        "bestellnr" => "oh.ORIG_SALES_ORDER_NO",
        "erstelldatum" => "oh.CREATE_TS",
        "artikelnr" => "op.PROD_ORG_ID",
        "hrs" => "wwsza.HRS_TEXT",
        "artikel" => "wwsza.ART_BEZ",
        "wgrno" => "wwsza.WGR_NO",
        "anzahl" => "op.ORDERED_QTY",
        "bestellstatus" => "op.STATUS",
        _ => "oh.CREATE_TS"
      };
    }

    #endregion
  }
}