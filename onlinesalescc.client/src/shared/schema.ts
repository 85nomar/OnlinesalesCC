/**
 * Shared type definitions between client and server
 */

export interface Ticket {
  id?: string // Client-side unique identifier
  ticketId: number // Server-side ticket ID
  artikelNr?: number // Item/Article number
  comment?: string // Ticket comment/description
  byUser?: string // User who created the ticket
  entrydate?: string // Ticket creation date
  bestellNr?: number // Order number
}
