/**
 * Ticket Models
 * 
 * These interfaces define the data structures used for tickets,
 * matching the C# backend models with original German property names.
 */

/**
 * Ticket interface (matches OrderTicket model from C# backend)
 */
export interface Ticket {
  id: string;
  ticketId: number;
  bestellNr: number | null;
  artikelNr: number | null;
  comment: string | null;
  byUser: string | null;
  entrydate: string | null;
} 