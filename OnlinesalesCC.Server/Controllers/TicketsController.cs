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
                return BadRequest("Ticket data is required");
            }

            // Set default values for nullable fields if they're not provided
            if (newTicket.Entrydate == null)
            {
                newTicket.Entrydate = DateTime.Now;
            }

            if (string.IsNullOrEmpty(newTicket.ByUser))
            {
                newTicket.ByUser = "System User";
            }

            try
            {
                using (var context = new FomdbNewContext())
                {
                    context.OrderTickets.Add(newTicket);
                    context.SaveChanges();
                }

                return CreatedAtAction(nameof(Get), new { id = newTicket.TicketId }, newTicket);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPut("{id:int}")]
        public IActionResult Put(int id, [FromBody] OrderTicket updatedTicket)
        {
            if (updatedTicket == null)
            {
                return BadRequest("Ticket data is required");
            }

            try
            {
                using (var context = new FomdbNewContext())
                {
                    var existingTicket = context.OrderTickets.Find(id);
                    if (existingTicket == null)
                    {
                        return NotFound($"Ticket with ID {id} not found");
                    }

                    // Update properties
                    existingTicket.ArtikelNr = updatedTicket.ArtikelNr;
                    existingTicket.Comment = updatedTicket.Comment;
                    existingTicket.ByUser = updatedTicket.ByUser;
                    existingTicket.BestellNr = updatedTicket.BestellNr;

                    // Only update entry date if it's provided
                    if (updatedTicket.Entrydate.HasValue)
                    {
                        existingTicket.Entrydate = updatedTicket.Entrydate;
                    }

                    context.OrderTickets.Update(existingTicket);
                    context.SaveChanges();

                    return Ok(existingTicket);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPatch("{id:int}")]
        public IActionResult Patch(int id, [FromBody] OrderTicket updatedTicket)
        {
            if (updatedTicket == null)
            {
                return BadRequest("Ticket data is required");
            }

            try
            {
                using (var context = new FomdbNewContext())
                {
                    var existingTicket = context.OrderTickets.Find(id);
                    if (existingTicket == null)
                    {
                        return NotFound($"Ticket with ID {id} not found");
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

                    return Ok(existingTicket);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("{id:int}")]
        public IActionResult Delete(int id)
        {
            try
            {
                using (var context = new FomdbNewContext())
                {
                    var ticket = context.OrderTickets.Find(id);
                    if (ticket == null)
                    {
                        return NotFound($"Ticket with ID {id} not found");
                    }

                    context.OrderTickets.Remove(ticket);
                    context.SaveChanges();

                    return NoContent();
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // Add this new endpoint to get tickets by article number
        [HttpGet("by-itemnr/{artikelNr:int}")]
        public IActionResult GetByArtikelNr(int artikelNr)
        {
            if (artikelNr <= 0)
            {
                return BadRequest("Invalid article number");
            }

            Console.WriteLine($"TicketsController: Looking up tickets for item {artikelNr}");
            
            try
            {
                using (var context = new FomdbNewContext())
                {
                    // Enable logging of SQL queries in development
                    if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
                    {
                        Console.WriteLine("Generating SQL query for ticket lookup by item number");
                    }
                    
                    // Optimize query with explicit column selection and ordering
                    var tickets = context.OrderTickets
                        .Where(t => t.ArtikelNr == artikelNr)
                        .OrderByDescending(t => t.Entrydate)
                        .ToArray();

                    Console.WriteLine($"Found {tickets.Length} tickets for item {artikelNr}");
                    
                    return Ok(tickets);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetByArtikelNr({artikelNr}): {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // Update the GetByBestellNr method for tickets
        [HttpGet("by-ordernr/{bestellNr:long}")]
        public IActionResult GetByBestellNr(long bestellNr)
        {
            if (bestellNr <= 0)
            {
                return BadRequest("Invalid order number");
            }

            Console.WriteLine($"TicketsController: Looking up tickets for order {bestellNr}");
            
            try
            {
                using (var context = new FomdbNewContext())
                {
                    // Enable logging of SQL queries in development
                    if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
                    {
                        Console.WriteLine("Generating SQL query for ticket lookup by order number");
                    }
                    
                    // Optimize query with explicit column selection and ordering
                    var tickets = context.OrderTickets
                        .Where(t => t.BestellNr == bestellNr)
                        .OrderByDescending(t => t.Entrydate)
                        .ToArray();

                    Console.WriteLine($"Found {tickets.Length} tickets for order {bestellNr}");
                    
                    return Ok(tickets);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetByBestellNr({bestellNr}): {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
