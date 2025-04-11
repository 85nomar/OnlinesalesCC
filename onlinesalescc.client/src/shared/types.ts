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
  ticketId: number;
  bestellNr?: number;
  artikelNr?: number;
  comment?: string;
  byUser?: string;
  entrydate?: string;
}

/**
 * Open Order interface (matches OpenOrders model from C# backend)
 */
export interface OpenOrder {
  BestellNr: number;
  Erstelldatum: string;
  ArtikelNr: number;
  Hrs?: string;
  Artikel?: string;
  WgrNo?: string;
  Anzahl: number;
  BestellStatus?: string;
}

/**
 * Grouped Open Orders interface (matches OpenOrdersGrouped model from C# backend)
 */
export interface OpenOrderGrouped {
  ArtikelNr: number;
  Hrs?: string;
  Artikel?: string;
  WgrNo?: string;
  Anzahl: number;
  Erstelldatum: string;
  Entrydate?: string;
  AnzahlTickets: number;
}

/**
 * Alternative Item interface
 */
export interface AlternativeItem {
  orderArtikelNr: number;
  alternativeArtikelNr: number;
  alternativeArtikel: string;
}

/**
 * Additional data for grouped orders
 */
export interface OrdersGroupedAdditional {
  ArtikelNr: number;
  newDeliveryDate?: string;
  originalDeliveryDate?: string;
  notes?: string;
  alternativeItems?: AlternativeItem[];
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