/**
 * Order Models
 * 
 * These interfaces define the data structures used for orders,
 * matching the C# backend models with original German property names.
 */

/**
 * Open Order interface (matches OpenOrders model from C# backend)
 */
export interface OpenOrder {
  BestellNr: number;
  Erstelldatum: string;
  ArtikelNr: number;
  Hrs: string | null;
  Artikel: string | null;
  WgrNo: string | null;
  Anzahl: number;
  BestellStatus: string | null;
}

/**
 * Grouped Open Orders interface (matches OpenOrdersGrouped model from C# backend)
 */
export interface OpenOrderGrouped {
  ArtikelNr: number;
  Hrs: string | null;
  Artikel: string | null;
  WgrNo: string | null;
  Anzahl: number;
  Erstelldatum: string;
  AnzahlTickets: number;
}

/**
 * Alternative Item interface (matches backend model)
 */
export interface AlternativeItem {
  orderArtikelNr: number;
  alternativeArtikelNr: number;
  alternativeArtikel: string | null;
}

/**
 * Additional data for grouped orders (matches backend model)
 */
export interface OrdersGroupedAdditional {
  ArtikelNr: number;
  NewDeliveryDate: string | null;
  OriginalDeliveryDate: string | null;
  notes: string | null;
  alternativeItems?: AlternativeItem[] | null;
}

/**
 * Filter for orders
 */
export interface OrderFilterRequest {
  itemNumber?: number;
  orderNumber?: number;
  supplier?: string;
  fromDate?: string;
  toDate?: string;
  orderStatus?: string;
}

/**
 * Filter for grouped orders
 */
export interface OrderGroupedFilterRequest {
  itemNumber?: number;
  supplier?: string;
  fromDate?: string;
  toDate?: string;
  hasMissingDeliveryDate?: boolean;
  hasTickets?: boolean;
} 