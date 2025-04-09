import { z } from "zod";

/**
 * TypeScript interfaces matching C# models
 */

// Ticket interface matching OrderTicket C# model
export interface Ticket {
  id?: string;           // Optional for new tickets
  ticketId: number;      // Required
  bestellNr?: number;    // Optional (long? in C#)
  artikelNr?: number;    // Optional (int? in C#)
  comment?: string;      // Optional (string? in C#)
  byUser?: string;      // Optional (string? in C#)
  entrydate?: string;   // Optional (DateTime? in C#)
}

// Open Orders interface matching OpenOrders C# model
export interface OpenOrder {
  BestellNr: number;     // Required (long in C#)
  Erstelldatum: string;  // Required (DateTime in C#)
  ArtikelNr: number;     // Required (int in C#)
  Hrs?: string;         // Optional (string? in C#)
  Artikel?: string;     // Optional (string? in C#)
  WgrNo?: string;       // Optional (string? in C#)
  Anzahl: number;       // Required (int in C#)
  BestellStatus?: string; // Optional (string? in C#)
}

// Open Orders Grouped interface matching OpenOrdersGrouped C# model
export interface OpenOrderGrouped {
  ArtikelNr: number;     // Required (int in C#)
  Hrs?: string;         // Optional (string? in C#)
  Artikel?: string;     // Optional (string? in C#)
  WgrNo?: string;       // Optional (string? in C#)
  Anzahl: number;       // Required (int in C#)
  Erstelldatum: string;  // Required (DateTime in C#)
  AnzahlTickets: number; // Required (int in C#)
}

// Additional Order Data interface matching OrderAdditionalData C# model
export interface OrderAdditionalData {
  id?: number;          // Optional for new entries
  ArtikelNr: number;    // Required (int in C#)
  newDeliveryDate?: string;      // Optional (string? in C#)
  originalDeliveryDate?: string;  // Optional (string? in C#)
  notes?: string;       // Optional (string? in C#)
  alternativeItems?: AlternativeItem[]; // Optional array of alternative items
}

// Alternative Item interface matching OrderAlternativeItem C# model
export interface AlternativeItem {
  id?: number;          // Optional for new entries
  orderArtikelNr: number;       // Required (int in C#)
  alternativeArtikelNr: number; // Required (int in C#)
  alternativeArtikel: string;   // Required (string in C#)
}

/**
 * Zod Schemas for Runtime Type Validation
 */

// Ticket validation schema
export const ticketSchema = z.object({
  id: z.string().optional(),
  ticketId: z.number(),
  bestellNr: z.number().optional(),
  artikelNr: z.number().optional(),
  comment: z.string().optional(),
  byUser: z.string().optional(),
  entrydate: z.string().optional(),
});

// Open Order validation schema
export const openOrderSchema = z.object({
  BestellNr: z.number(),
  Erstelldatum: z.string(),
  ArtikelNr: z.number(),
  Hrs: z.string().optional(),
  Artikel: z.string().optional(),
  WgrNo: z.string().optional(),
  Anzahl: z.number(),
  BestellStatus: z.string().optional(),
});

// Open Order Grouped validation schema
export const openOrderGroupedSchema = z.object({
  ArtikelNr: z.number(),
  Hrs: z.string().optional(),
  Artikel: z.string().optional(),
  WgrNo: z.string().optional(),
  Anzahl: z.number(),
  Erstelldatum: z.string(),
  AnzahlTickets: z.number(),
});


export const alternativeItemSchema = z.object({
  id: z.number().optional(),
  orderArtikelNr: z.number(),
  alternativeArtikelNr: z.number(),
  alternativeArtikel: z.string(),
});

// Order types for API responses
export interface OpenOrders extends OpenOrder {
  orderArtikelNr: number;
  alternativeArtikelNr: number;
  alternativeArtikel: string;
}

export interface OpenOrdersGrouped {
  Artikel: string;
  Anzahl: number;
  BestellNr: number;
  Erstelldatum: string;
  ArtikelNr: number;
  Hrs: string;
  WgrNo: string;
  BestellStatus: string;
  orders: OpenOrders[];
  orderArtikelNr: number;
  alternativeArtikelNr: number;
  alternativeArtikel: string;
  AnzahlTickets: number;
}

export const openOrdersSchema = z.object({
  BestellNr: z.number(),
  Erstelldatum: z.string(),
  ArtikelNr: z.number(),
  Hrs: z.string(),
  Artikel: z.string(),
  WgrNo: z.string(),
  Anzahl: z.number(),
  BestellStatus: z.string(),
  orderArtikelNr: z.number(),
  alternativeArtikelNr: z.number(),
  alternativeArtikel: z.string()
});

export const openOrdersGroupedSchema = z.object({
  Artikel: z.string(),
  Anzahl: z.number(),
  BestellNr: z.number(),
  Erstelldatum: z.string(),
  ArtikelNr: z.number(),
  Hrs: z.string(),
  WgrNo: z.string(),
  BestellStatus: z.string(),
  orders: z.array(openOrdersSchema),
  orderArtikelNr: z.number(),
  alternativeArtikelNr: z.number(),
  alternativeArtikel: z.string()
});

export const orderAdditionalDataSchema = z.object({
  id: z.number().optional(),
  ArtikelNr: z.number(),
  newDeliveryDate: z.string().optional(),
  originalDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
  alternativeItems: z.array(alternativeItemSchema).optional(),
});
