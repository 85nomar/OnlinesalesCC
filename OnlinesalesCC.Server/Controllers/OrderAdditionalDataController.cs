using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlinesalesCC.Server.Models;
using System.Diagnostics;

namespace OnlinesalesCC.Server.Controllers
{
  [Authorize]
  [ApiController]
  [Route("api/[controller]")]
  public class OrderAdditionalDataController : ControllerBase
  {
    [HttpGet]
    public IEnumerable<OrderAdditionalData> Get()
    {
      IEnumerable<OrderAdditionalData> additionalData;

      using (var context = new FomdbNewContext())
      {
        additionalData = context.OrderAdditionalData.ToArray();
      }

      return additionalData;
    }

    [HttpGet("{artikelNr}")]
    public ActionResult<OrderAdditionalData> GetByArtikelNr(int artikelNr)
    {
      using (var context = new FomdbNewContext())
      {
        var data = context.OrderAdditionalData
            .FirstOrDefault(x => x.ArtikelNr == artikelNr);

        if (data == null)
        {
          return NotFound();
        }

        return data;
      }
    }

    [HttpPost]
    public IActionResult Post([FromBody] OrderAdditionalData additionalData)
    {
      if (additionalData == null)
      {
        return BadRequest();
      }

      using (var context = new FomdbNewContext())
      {
        // Check if a record for this ArtikelNr already exists
        var existing = context.OrderAdditionalData
            .FirstOrDefault(x => x.ArtikelNr == additionalData.ArtikelNr);

        if (existing != null)
        {
          // Update existing record instead of creating a new one
          existing.NewDeliveryDate = additionalData.NewDeliveryDate;
          existing.OriginalDeliveryDate = additionalData.OriginalDeliveryDate;
          existing.Notes = additionalData.Notes;

          context.OrderAdditionalData.Update(existing);
          context.SaveChanges();

          return Ok(existing);
        }

        // Create new record
        context.OrderAdditionalData.Add(additionalData);
        context.SaveChanges();
      }

      return CreatedAtAction(nameof(GetByArtikelNr), new { artikelNr = additionalData.ArtikelNr }, additionalData);
    }

    [HttpPut("{id}")]
    public IActionResult Put(int id, [FromBody] OrderAdditionalData updatedData)
    {
      if (updatedData == null || updatedData.Id != id)
      {
        return BadRequest();
      }

      using (var context = new FomdbNewContext())
      {
        var existingData = context.OrderAdditionalData.Find(id);
        if (existingData == null)
        {
          return NotFound();
        }

        existingData.ArtikelNr = updatedData.ArtikelNr;
        existingData.NewDeliveryDate = updatedData.NewDeliveryDate;
        existingData.OriginalDeliveryDate = updatedData.OriginalDeliveryDate;
        existingData.Notes = updatedData.Notes;

        context.OrderAdditionalData.Update(existingData);
        context.SaveChanges();
      }

      return NoContent();
    }

    [HttpPut("delivery-date/{artikelNr}")]
    public IActionResult UpdateDeliveryDate(int artikelNr, [FromBody] DeliveryDateUpdate dateUpdate)
    {
      if (dateUpdate == null || string.IsNullOrEmpty(dateUpdate.NewDeliveryDate))
      {
        return BadRequest();
      }

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
      }

      return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
      using (var context = new FomdbNewContext())
      {
        var data = context.OrderAdditionalData.Find(id);
        if (data == null)
        {
          return NotFound();
        }

        context.OrderAdditionalData.Remove(data);
        context.SaveChanges();
      }

      return NoContent();
    }
  }

  // DTO for delivery date updates
  public class DeliveryDateUpdate
  {
    public string NewDeliveryDate { get; set; } = string.Empty;
    public string? OriginalDeliveryDate { get; set; }
  }
}