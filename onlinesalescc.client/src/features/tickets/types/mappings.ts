/**
 * Ticket Mappings
 * 
 * This module provides mapped types and mapping functions for tickets
 * to convert between German backend properties and English frontend properties.
 */

import type { Ticket } from './models';

/**
 * Mapped type for Ticket
 */
export type MappedTicket = {
  id: string;
  ticketId: number;
  orderNumber: number | null;
  itemNumber: number | null;
  comment: string | null;
  byUser: string | null;
  createdAt: string | null;
};

/**
 * Maps a Ticket object from German to English property names
 */
export function mapTicket(ticket: Ticket): MappedTicket {
  return {
    id: ticket.id,
    ticketId: ticket.ticketId,
    orderNumber: ticket.bestellNr,
    itemNumber: ticket.artikelNr,
    comment: ticket.comment,
    byUser: ticket.byUser,
    createdAt: ticket.entrydate
  };
}

/**
 * Maps a MappedTicket to a backend-compatible payload
 */
export function toTicketPayload(ticket: Partial<MappedTicket>): Partial<Ticket> {
  return {
    comment: ticket.comment,
    artikelNr: ticket.itemNumber,
    bestellNr: ticket.orderNumber,
    byUser: ticket.byUser,
    // Don't include other fields that shouldn't be sent to backend
  };
} 