using OnlinesalesCC.Server.Models;
using System;
using System.Linq;

namespace OnlinesalesCC.Server
{
  /// <summary>
  /// This is a test utility to add sample delivery dates to the database
  /// Run this manually to populate test data for the dashboard
  /// </summary>
  public class Test_AddDeliveryData
  {
    public static void Main()
    {
      Console.WriteLine("Adding sample delivery data to database...");

      try
      {
        using (var context = new FomdbNewContext())
        {
          // First, clear any existing test data
          var existingData = context.OrderAdditionalData.ToList();
          if (existingData.Any())
          {
            Console.WriteLine($"Removing {existingData.Count} existing records");
            context.OrderAdditionalData.RemoveRange(existingData);
            context.SaveChanges();
          }

          // Sample article numbers (adjust these based on actual data in your database)
          var sampleArticles = new[] { 2269303, 2270188, 2271507, 2222222, 2333333 };

          // Add test delivery dates for each article
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
              Notes = $"Test delivery data added on {DateTime.Now}"
            };

            context.OrderAdditionalData.Add(additionalData);
            Console.WriteLine($"Added delivery date {deliveryDate} for article {sampleArticles[i]}");
          }

          context.SaveChanges();
          Console.WriteLine($"Successfully added {sampleArticles.Length} delivery dates");
        }
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error adding sample data: {ex.Message}");
        Console.WriteLine(ex.StackTrace);
      }

      Console.WriteLine("Press any key to exit...");
      Console.ReadKey();
    }
  }
}