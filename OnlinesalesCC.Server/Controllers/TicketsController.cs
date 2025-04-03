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
        private readonly FomdbNewContext _context;
        private readonly ILogger<TicketsController> _logger;

        public TicketsController(FomdbNewContext context, ILogger<TicketsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get all tickets
        /// GET: api/tickets
        /// </summary>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<IEnumerable<OrderTicket>> GetAllTickets()
        {
            try
            {
                var tickets = _context.OrderTickets
                    .OrderByDescending(x => x.Entrydate)
                    .ToList();

                return Ok(tickets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all tickets");
                return StatusCode(500, new { error = "Internal server error while retrieving tickets" });
            }
        }

        /// <summary>
        /// Get tickets by article number
        /// GET: api/tickets/{artikelNr}
        /// </summary>
        [HttpGet("{artikelNr:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<IEnumerable<OrderTicket>> GetTicketsByArtikelNr(int artikelNr)
        {
            try
            {
                var tickets = _context.OrderTickets
                    .Where(x => x.ArtikelNr == artikelNr)
                    .OrderByDescending(x => x.Entrydate)
                    .ToList();

                // Note: Node.js returns empty array instead of 404
                return Ok(tickets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tickets for article number {ArtikelNr}", artikelNr);
                return StatusCode(500, new { error = "Internal server error while retrieving tickets" });
            }
        }

        /// <summary>
        /// Create a new ticket
        /// POST: api/tickets
        /// </summary>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<OrderTicket> CreateTicket([FromBody] OrderTicket ticket)
        {
            try
            {
                if (ticket == null)
                {
                    return BadRequest(new { error = "Ticket data is required" });
                }

                // Generate new ticket ID
                var lastTicket = _context.OrderTickets
                    .OrderByDescending(t => t.TicketId)
                    .FirstOrDefault();
                
                ticket.TicketId = (lastTicket?.TicketId ?? 999) + 1;
                ticket.Id = Guid.NewGuid().ToString();
                ticket.Entrydate = DateTime.UtcNow.ToString("O"); // ISO 8601 format
                ticket.ByUser = ticket.ByUser ?? "System User";

                _context.OrderTickets.Add(ticket);
                _context.SaveChanges();

                return CreatedAtAction(
                    nameof(GetAllTickets),
                    new { id = ticket.Id },
                    ticket
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating ticket");
                return StatusCode(500, new { error = "Internal server error while creating ticket" });
            }
        }

        /// <summary>
        /// Update an existing ticket
        /// PATCH: api/tickets/{id}
        /// </summary>
        [HttpPatch("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<OrderTicket> UpdateTicket(string id, [FromBody] OrderTicket updates)
        {
            try
            {
                if (updates == null)
                {
                    return BadRequest(new { error = "Update data is required" });
                }

                var existingTicket = _context.OrderTickets.FirstOrDefault(t => t.Id == id);
                if (existingTicket == null)
                {
                    return NotFound(new { error = $"Ticket with ID {id} not found" });
                }

                // Only update provided fields (matching Node.js behavior)
                if (updates.ArtikelNr != 0)
                    existingTicket.ArtikelNr = updates.ArtikelNr;
                if (updates.BestellNr != 0)
                    existingTicket.BestellNr = updates.BestellNr;
                if (!string.IsNullOrEmpty(updates.Comment))
                    existingTicket.Comment = updates.Comment;
                if (!string.IsNullOrEmpty(updates.ByUser))
                    existingTicket.ByUser = updates.ByUser;

                // Always update the entry date on modification
                existingTicket.Entrydate = DateTime.UtcNow.ToString("O");

                _context.OrderTickets.Update(existingTicket);
                _context.SaveChanges();

                return Ok(existingTicket);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating ticket {TicketId}", id);
                return StatusCode(500, new { error = "Internal server error while updating ticket" });
            }
        }

        /// <summary>
        /// Delete a ticket
        /// DELETE: api/tickets/{id}
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult DeleteTicket(string id)
        {
            try
            {
                var ticket = _context.OrderTickets.FirstOrDefault(t => t.Id == id);
                if (ticket == null)
                {
                    return NotFound(new { error = $"Ticket with ID {id} not found" });
                }

                _context.OrderTickets.Remove(ticket);
                _context.SaveChanges();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting ticket {TicketId}", id);
                return StatusCode(500, new { error = "Internal server error while deleting ticket" });
            }
        }
    }
}
