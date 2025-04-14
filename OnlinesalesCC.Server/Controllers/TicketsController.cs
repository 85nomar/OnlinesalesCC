using Microsoft.AspNetCore.Mvc;
using OnlinesalesCC.Server.Models;
using System.Diagnostics;

namespace OnlinesalesCC.Server.Controllers
{
    // Removed [Authorize] attribute to fix authentication issues
    [ApiController]
    [Route("api/[controller]")]
    public class TicketsController : ControllerBase
    {
        [HttpGet]
        public IEnumerable<OrderTicket> Get()
        {
            IEnumerable<OrderTicket> retTickets;

            using (var context = new FomdbNewContext())
            {
                retTickets = context.OrderTickets.OrderByDescending(x => x.Entrydate).ToArray();
            }

            return retTickets;
        }

        [HttpPost]
        public IActionResult Post([FromBody] OrderTicket newTicket)
        {
            if (newTicket == null)
            {
                return BadRequest();
            }

            using (var context = new FomdbNewContext())
            {
                context.OrderTickets.Add(newTicket);
                context.SaveChanges();
            }

            return CreatedAtAction(nameof(Get), new { id = newTicket.TicketId }, newTicket);
        }

        [HttpPut("{id}")]
        public IActionResult Put(int id, [FromBody] OrderTicket updatedTicket)
        {
            if (updatedTicket == null || updatedTicket.TicketId != id)
            {
                return BadRequest();
            }

            using (var context = new FomdbNewContext())
            {
                var existingTicket = context.OrderTickets.Find(id);
                if (existingTicket == null)
                {
                    return NotFound();
                }

                existingTicket.ArtikelNr = updatedTicket.ArtikelNr;
                existingTicket.Comment = updatedTicket.Comment;
                existingTicket.ByUser = updatedTicket.ByUser;
                existingTicket.Entrydate = updatedTicket.Entrydate;
                existingTicket.BestellNr = updatedTicket.BestellNr;

                context.OrderTickets.Update(existingTicket);
                context.SaveChanges();
            }

            return NoContent();
        }

        // Add PATCH endpoint while keeping the existing PUT endpoint for backward compatibility
        [HttpPatch("{id}")]
        public IActionResult Patch(int id, [FromBody] OrderTicket updatedTicket)
        {
            if (updatedTicket == null)
            {
                return BadRequest();
            }

            using (var context = new FomdbNewContext())
            {
                var existingTicket = context.OrderTickets.Find(id);
                if (existingTicket == null)
                {
                    return NotFound();
                }

                // Only update non-null properties
                if (updatedTicket.ArtikelNr.HasValue)
                    existingTicket.ArtikelNr = updatedTicket.ArtikelNr;
                if (updatedTicket.Comment != null)
                    existingTicket.Comment = updatedTicket.Comment;
                if (updatedTicket.ByUser != null)
                    existingTicket.ByUser = updatedTicket.ByUser;
                if (updatedTicket.Entrydate.HasValue)
                    existingTicket.Entrydate = updatedTicket.Entrydate;
                if (updatedTicket.BestellNr.HasValue)
                    existingTicket.BestellNr = updatedTicket.BestellNr;

                context.OrderTickets.Update(existingTicket);
                context.SaveChanges();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            using (var context = new FomdbNewContext())
            {
                var ticket = context.OrderTickets.Find(id);
                if (ticket == null)
                {
                    return NotFound();
                }

                context.OrderTickets.Remove(ticket);
                context.SaveChanges();
            }

            return NoContent();
        }

        // Add this new endpoint to get tickets by article number
        [HttpGet("by-artikelnr/{artikelNr}")]
        public IActionResult GetByArtikelNr(int artikelNr)
        {
            if (artikelNr <= 0)
            {
                return BadRequest("Invalid article number");
            }

            using (var context = new FomdbNewContext())
            {
                var tickets = context.OrderTickets
                    .Where(t => t.ArtikelNr == artikelNr)
                    .OrderByDescending(t => t.Entrydate)
                    .ToArray();

                return Ok(tickets);
            }
        }
    }
}
