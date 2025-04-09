using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlinesalesCC.Server.Models;
using System.Diagnostics;

namespace OnlinesalesCC.Server.Controllers
{
  [Authorize]
  [ApiController]
  [Route("api/[controller]")]
  public class OrderAlternativeItemsController : ControllerBase
  {
    [HttpGet]
    public IEnumerable<OrderAlternativeItem> Get()
    {
      IEnumerable<OrderAlternativeItem> items;

      using (var context = new FomdbNewContext())
      {
        items = context.OrderAlternativeItems.ToArray();
      }

      return items;
    }

    [HttpGet("by-order/{orderArtikelNr}")]
    public IEnumerable<OrderAlternativeItem> GetByOrderArtikelNr(int orderArtikelNr)
    {
      IEnumerable<OrderAlternativeItem> items;

      using (var context = new FomdbNewContext())
      {
        items = context.OrderAlternativeItems
            .Where(x => x.OrderArtikelNr == orderArtikelNr)
            .ToArray();
      }

      return items;
    }

    [HttpPost]
    public IActionResult Post([FromBody] OrderAlternativeItem newItem)
    {
      if (newItem == null)
      {
        return BadRequest();
      }

      using (var context = new FomdbNewContext())
      {
        context.OrderAlternativeItems.Add(newItem);
        context.SaveChanges();
      }

      return CreatedAtAction(nameof(Get), new { id = newItem.Id }, newItem);
    }

    [HttpPut("{id}")]
    public IActionResult Put(int id, [FromBody] OrderAlternativeItem updatedItem)
    {
      if (updatedItem == null || updatedItem.Id != id)
      {
        return BadRequest();
      }

      using (var context = new FomdbNewContext())
      {
        var existingItem = context.OrderAlternativeItems.Find(id);
        if (existingItem == null)
        {
          return NotFound();
        }

        existingItem.OrderArtikelNr = updatedItem.OrderArtikelNr;
        existingItem.AlternativeArtikelNr = updatedItem.AlternativeArtikelNr;
        existingItem.AlternativeArtikel = updatedItem.AlternativeArtikel;

        context.OrderAlternativeItems.Update(existingItem);
        context.SaveChanges();
      }

      return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
      using (var context = new FomdbNewContext())
      {
        var item = context.OrderAlternativeItems.Find(id);
        if (item == null)
        {
          return NotFound();
        }

        context.OrderAlternativeItems.Remove(item);
        context.SaveChanges();
      }

      return NoContent();
    }

    [HttpDelete("by-article/{orderArtikelNr}/{alternativeArtikelNr}")]
    public IActionResult DeleteByArticle(int orderArtikelNr, int alternativeArtikelNr)
    {
      using (var context = new FomdbNewContext())
      {
        var item = context.OrderAlternativeItems
            .FirstOrDefault(x => x.OrderArtikelNr == orderArtikelNr &&
                                 x.AlternativeArtikelNr == alternativeArtikelNr);

        if (item == null)
        {
          return NotFound();
        }

        context.OrderAlternativeItems.Remove(item);
        context.SaveChanges();
      }

      return NoContent();
    }
  }
}