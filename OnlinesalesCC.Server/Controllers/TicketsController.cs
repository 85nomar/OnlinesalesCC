using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlinesalesCC.Server.Models;
using System.Diagnostics;

namespace OnlinesalesCC.Server.Controllers
{
    [Authorize]
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

        [HttpGet("{artikelNr}")]
        public IEnumerable<OrderTicket> GetByArtikelNr(int artikelNr)
        {
            IEnumerable<OrderTicket> retTickets;

            using (var context = new FomdbNewContext())
            {
                retTickets = context.OrderTickets
                    .Where(x => x.ArtikelNr == artikelNr)
                    .OrderByDescending(x => x.Entrydate)
                    .ToArray();
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

            // Ensure required fields are set
            newTicket.Entrydate = newTicket.Entrydate ?? DateTime.UtcNow;
            newTicket.ByUser = newTicket.ByUser ?? "System User";

            using (var context = new FomdbNewContext())
            {
                context.OrderTickets.Add(newTicket);
                context.SaveChanges();
            }

            return CreatedAtAction(nameof(Get), new { id = newTicket.TicketId }, newTicket);
        }

        [HttpPatch("{id}")]
        public IActionResult Patch(int id, [FromBody] OrderTicket updatedTicket)
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

                // Only update non-null fields
                if (updatedTicket.ArtikelNr.HasValue)
                    existingTicket.ArtikelNr = updatedTicket.ArtikelNr;
                if (updatedTicket.Comment != null)
                    existingTicket.Comment = updatedTicket.Comment;
                if (updatedTicket.ByUser != null)
                    existingTicket.ByUser = updatedTicket.ByUser;
                if (updatedTicket.BestellNr.HasValue)
                    existingTicket.BestellNr = updatedTicket.BestellNr;
                
                // Always update the entry date on modification
                existingTicket.Entrydate = DateTime.UtcNow;

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
    }
}
