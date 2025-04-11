using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using OnlinesalesCC.Server.Models;
using System;
using System.Linq;
using System.Collections.Generic;
using Microsoft.Data.SqlClient;

namespace OnlinesalesCC.Server.Controllers
{
  [ApiController]
  [Route("api/orders/additional")]
  public class OrdersAdditionalController : ControllerBase
  {
    private readonly ILogger<OrdersAdditionalController> _logger;

    public OrdersAdditionalController(ILogger<OrdersAdditionalController> logger)
    {
      _logger = logger;
    }

    /// <summary>
    /// Get all additional order data
    /// </summary>
    [HttpGet]
    public IActionResult GetAll()
    {
      try
      {
        using (var context = new FomdbNewContext())
        {
          var additionalData = context.OrderAdditionalData.ToList();

          // Check if there's no data and add some test data for the dashboard
          if (additionalData.Count == 0)
          {
            Console.WriteLine("No delivery data found. Adding sample data for testing.");
            additionalData = AddSampleDeliveryData(context);
          }

          // For each additional data item, get its alternative items
          foreach (var item in additionalData)
          {
            var alternatives = context.OrderAlternativeItems
                .Where(a => a.OrderArtikelNr == item.ArtikelNr)
                .Select(a => new AlternativeItemResponse
                {
                  ArtikelNr = a.AlternativeArtikelNr,
                  Artikel = a.AlternativeArtikel
                })
                .ToList();

            item.AlternativeItems = alternatives;
          }

          return Ok(additionalData);
        }
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting all additional order data");
        return StatusCode(500, $"Internal server error: {ex.Message}");
      }
    }

    // Helper method to add sample delivery dates for testing
    private List<OrderAdditionalData> AddSampleDeliveryData(FomdbNewContext context)
    {
      var result = new List<OrderAdditionalData>();

      try
      {
        // Try to find real article numbers from the orders in the database
        var realArticleNumbers = new List<int>();

        // This direct SQL query can be more reliable than ORM mapping for tables we haven't fully mapped
        using (var connection = new SqlConnection(
          "Data Source=GRW04SQLHQ01;Initial Catalog=FOMdbNew;Integrated Security=True;TrustServerCertificate=True;Encrypt=False;"))
        {
          connection.Open();

          var command = new SqlCommand(
            "SELECT TOP 5 PROD_ORG_ID FROM Order_POS WHERE PROD_ORG_ID IS NOT NULL GROUP BY PROD_ORG_ID",
            connection);

          using (var reader = command.ExecuteReader())
          {
            while (reader.Read())
            {
              realArticleNumbers.Add(reader.GetInt32(0));
            }
          }
        }

        Console.WriteLine($"Found {realArticleNumbers.Count} real article numbers in the database");

        // Fallback to hardcoded article numbers if we couldn't find any from the database
        int[] sampleArticles = realArticleNumbers.Count > 0
          ? realArticleNumbers.ToArray()
          : new[] { 2269303, 2270188, 2271507, 2222222, 2333333 };

        for (int i = 0; i < sampleArticles.Length; i++)
        {
          // Get a date that ranges from today to 14 days in the future
          var daysToAdd = i * 3; // 0, 3, 6, 9, 12 days from now
          var deliveryDate = DateTime.Now.AddDays(daysToAdd).ToString("yyyy-MM-dd");

          var additionalData = new OrderAdditionalData
          {
            ArtikelNr = sampleArticles[i],
            NewDeliveryDate = deliveryDate,
            OriginalDeliveryDate = DateTime.Now.AddDays(daysToAdd + 5).ToString("yyyy-MM-dd"), // Original date is 5 days later
            Notes = $"Test delivery data added on {DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}"
          };

          context.OrderAdditionalData.Add(additionalData);
          result.Add(additionalData);
          Console.WriteLine($"Added test delivery date {deliveryDate} for article {sampleArticles[i]}");
        }

        context.SaveChanges();
        Console.WriteLine($"Successfully added {sampleArticles.Length} test delivery dates");
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error adding sample data: {ex.Message}");
      }

      return result;
    }

    /// <summary>
    /// Get additional data for a specific article
    /// </summary>
    [HttpGet("{artikelNr:int}")]
    public IActionResult GetByArtikelNr(int artikelNr)
    {
      try
      {
        using (var context = new FomdbNewContext())
        {
          // First, get any alternative items regardless of additional data existence
          var alternativeItems = context.OrderAlternativeItems
              .Where(a => a.OrderArtikelNr == artikelNr)
              .Select(a => new AlternativeItemResponse
              {
                ArtikelNr = a.AlternativeArtikelNr,
                Artikel = a.AlternativeArtikel
              })
              .ToList();

          Console.WriteLine($"Found {alternativeItems.Count} alternative items for artikelNr={artikelNr}");

          // Now check if additional data exists
          var additionalData = context.OrderAdditionalData
              .FirstOrDefault(a => a.ArtikelNr == artikelNr);

          if (additionalData == null)
          {
            // Return an empty object instead of 404 to avoid aggressive error messages in the frontend
            additionalData = new OrderAdditionalData
            {
              ArtikelNr = artikelNr,
              AlternativeItems = alternativeItems // Use the items we already found
            };
          }
          else
          {
            // Assign alternative items to the additional data
            additionalData.AlternativeItems = alternativeItems;
          }

          return Ok(additionalData);
        }
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, $"Error getting additional data for artikelNr: {artikelNr}");
        return StatusCode(500, $"Internal server error: {ex.Message}");
      }
    }

    /// <summary>
    /// Update delivery date for a specific article
    /// </summary>
    [HttpPatch("{artikelNr:int}/delivery-date")]
    public IActionResult UpdateDeliveryDate(int artikelNr, [FromBody] DeliveryDateUpdate dateUpdate)
    {
      if (dateUpdate == null || string.IsNullOrEmpty(dateUpdate.NewDeliveryDate))
      {
        return BadRequest("New delivery date is required");
      }

      try
      {
        using (var context = new FomdbNewContext())
        {
          var data = context.OrderAdditionalData
              .FirstOrDefault(x => x.ArtikelNr == artikelNr);

          if (data == null)
          {
            // Create new record if none exists
            var newData = new OrderAdditionalData
            {
              ArtikelNr = artikelNr,
              NewDeliveryDate = dateUpdate.NewDeliveryDate,
              OriginalDeliveryDate = dateUpdate.OriginalDeliveryDate
            };

            context.OrderAdditionalData.Add(newData);
          }
          else
          {
            // Update existing record
            if (string.IsNullOrEmpty(data.OriginalDeliveryDate) && !string.IsNullOrEmpty(dateUpdate.OriginalDeliveryDate))
            {
              data.OriginalDeliveryDate = dateUpdate.OriginalDeliveryDate;
            }
            data.NewDeliveryDate = dateUpdate.NewDeliveryDate;

            context.OrderAdditionalData.Update(data);
          }

          context.SaveChanges();
          return Ok(new { success = true, message = "Delivery date updated successfully" });
        }
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, $"Error updating delivery date for artikelNr: {artikelNr}");
        return StatusCode(500, $"Internal server error: {ex.Message}");
      }
    }

    /// <summary>
    /// Add alternative item for a specific article
    /// </summary>
    [HttpPost("{artikelNr:int}/alternatives")]
    public IActionResult AddAlternativeItem(int artikelNr, [FromBody] AlternativeItemRequest request)
    {
      if (request == null || request.ArtikelNr <= 0 || string.IsNullOrEmpty(request.Artikel))
      {
        return BadRequest("Alternative item details are required");
      }

      try
      {
        using (var context = new FomdbNewContext())
        {
          // Check for duplicate
          var existing = context.OrderAlternativeItems
              .FirstOrDefault(a => a.OrderArtikelNr == artikelNr && 
                                a.AlternativeArtikelNr == request.ArtikelNr);

          if (existing != null)
          {
            return Conflict("Alternative item already exists");
          }

          // Create a new alternative item
          var newAlternative = new OrderAlternativeItem
          {
            OrderArtikelNr = artikelNr,
            AlternativeArtikelNr = request.ArtikelNr,
            AlternativeArtikel = request.Artikel
          };

          context.OrderAlternativeItems.Add(newAlternative);

          // Check if we need to create an OrderAdditionalData record
          var additionalData = context.OrderAdditionalData
              .FirstOrDefault(a => a.ArtikelNr == artikelNr);

          if (additionalData == null)
          {
            // Create a new record
            var newData = new OrderAdditionalData
            {
              ArtikelNr = artikelNr,
              // Leave dates null
            };

            context.OrderAdditionalData.Add(newData);
            Console.WriteLine($"Created new OrderAdditionalData record for artikelNr={artikelNr}");
          }

          context.SaveChanges();

          Console.WriteLine($"Added alternative item for artikelNr={artikelNr}: {request.ArtikelNr} - {request.Artikel}");

          return Created($"/api/orders/additional/{artikelNr}", new 
          { 
            success = true, 
            message = "Alternative item added", 
            item = new AlternativeItemResponse 
            { 
              ArtikelNr = newAlternative.AlternativeArtikelNr, 
              Artikel = newAlternative.AlternativeArtikel 
            } 
          });
        }
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, $"Error adding alternative item for artikelNr: {artikelNr}");
        return StatusCode(500, $"Internal server error: {ex.Message}");
      }
    }

    /// <summary>
    /// Remove alternative item for a specific article
    /// </summary>
    [HttpDelete("{artikelNr:int}/alternatives/{altArtikelNr:int}")]
    public IActionResult RemoveAlternativeItem(int artikelNr, int altArtikelNr)
    {
      try
      {
        using (var context = new FomdbNewContext())
        {
          var item = context.OrderAlternativeItems
              .FirstOrDefault(a => a.OrderArtikelNr == artikelNr && 
                                 a.AlternativeArtikelNr == altArtikelNr);

          if (item == null)
          {
            return NotFound($"Alternative item not found");
          }

          context.OrderAlternativeItems.Remove(item);
          context.SaveChanges();

          return Ok(new { success = true, message = "Alternative item removed" });
        }
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, $"Error removing alternative item: orderArtikelNr={artikelNr}, altArtikelNr={altArtikelNr}");
        return StatusCode(500, $"Internal server error: {ex.Message}");
      }
    }
  }
}