/**
 * Tickets Feature
 * 
 * This module exports all ticket-related functionality.
 */

// Re-export the tickets service
export { TicketsService } from './api/tickets.service';

// Re-export types and mappings
export type { Ticket } from './types/models';
export type { MappedTicket } from './types/mappings';
export { mapTicket, toTicketPayload } from './types/mappings'; 