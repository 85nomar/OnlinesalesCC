/**
 * TypeScript interfaces for the OnlinesalesCC application
 * These interfaces define the data structures used in the application,
 * matching the C# backend models.
 */

/**
 * User interface
 */
export interface User {
  id: number;
  username: string;
  password: string;
}

/**
 * Ticket interface (matches OrderTicket model from C# backend)
 */
export interface Ticket {
  id?: string;           // Client-side ID (optional)
  ticketId: number;      // Backend ID
  bestellNr?: number;    // Order number (optional)
  artikelNr?: number;    // Item number (optional)
  comment?: string;      // Ticket comment (optional)
  byUser?: string;       // User who created the ticket (optional)
  entrydate?: string;    // Entry date (optional)
  description?: string;  // For frontend compatibility
}

/**
 * Open Order interface (matches OpenOrders model from C# backend)
 */
export interface OpenOrder {
  BestellNr: number;       // Order number
  Erstelldatum: string;    // Creation date
  ArtikelNr: number;       // Item number
  Hrs?: string;            // HRS text (optional)
  Artikel?: string;        // Article name (optional)
  WgrNo?: string;          // WGR number (optional)
  Anzahl: number;          // Quantity
  BestellStatus?: string;  // Order status (optional)
}

/**
 * Grouped Open Orders interface (matches OpenOrdersGrouped model from C# backend)
 */
export interface OpenOrderGrouped {
  ArtikelNr: number;       // Item number
  Hrs?: string;            // HRS text (optional)
  Artikel?: string;        // Article name (optional)
  WgrNo?: string;          // WGR number (optional)
  Anzahl: number;          // Total orders
  Erstelldatum: string;    // Creation date
  AnzahlTickets: number;   // Associated tickets count
}

/**
 * Alternative Item interface
 */
export interface AlternativeItem {
  id?: number;                      // Backend ID (optional for client)
  orderArtikelNr: number;           // Original order item number
  alternativeArtikelNr: number;     // Alternative item number
  alternativeArtikel: string;       // Alternative item name

  // For client compatibility
  artikelNr?: number;               // Same as alternativeArtikelNr
  artikel?: string;                 // Same as alternativeArtikel
}

/**
 * Additional data for grouped orders
 */
export interface OrdersGroupedAdditional {
  id?: number;                      // Backend ID (optional for client)
  ArtikelNr: number;                // Item number
  newDeliveryDate?: string;         // New delivery date (if changed)
  originalDeliveryDate?: string;    // Original delivery date
  notes?: string;                   // Additional notes for the order
  alternativeItems?: AlternativeItem[]; // Alternative items (if any)
}

/**
 * Pagination response interface
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Email notification interface
 */
export interface EmailNotification {
  to: string;
  cc?: string[];
  subject: string;
  body: string;
  isHtml?: boolean;
} 