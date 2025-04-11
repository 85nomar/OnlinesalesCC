import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Original user table (keeping as required by the boilerplate)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Ticket table (matches OrderTicket model from C# backend)
export const tickets = pgTable("tickets", {
  id: text("id").primaryKey(), // Using string ID as required primary key
  ticketId: integer("ticketId").notNull(),
  bestellNr: integer("bestellNr"), // Nullable in C# model (long? BestellNr)
  artikelNr: integer("artikelNr"), // Nullable in C# model (int? ArtikelNr)
  comment: text("comment"), // Nullable in C# model (string? Comment)
  byUser: text("byUser"), // Nullable in C# model (string? ByUser)
  entrydate: text("entrydate"), // Nullable in C# model (DateTime? Entrydate)
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

// Open Orders table (matches OpenOrders model from C# backend)
export const openOrders = pgTable("openOrders", {
  id: serial("id").primaryKey(), // For database usage only
  BestellNr: integer("BestellNr").notNull(), // Order number
  Erstelldatum: text("Erstelldatum").notNull(), // Creation date
  ArtikelNr: integer("ArtikelNr").notNull(), // Item number
  Hrs: text("Hrs"), // Nullable in C# model (string? Hrs)
  Artikel: text("Artikel"), // Nullable in C# model (string? Artikel)
  WgrNo: text("WgrNo"), // Nullable in C# model (string? WgrNo)
  Anzahl: integer("Anzahl").notNull(), // Quantity
  BestellStatus: text("BestellStatus"), // Nullable in C# model (string? BestellStatus)
});

export const insertOpenOrderSchema = createInsertSchema(openOrders).omit({
  id: true,
});

export type InsertOpenOrder = z.infer<typeof insertOpenOrderSchema>;
// For client compatibility, exclude database ID
export type OpenOrder = Omit<typeof openOrders.$inferSelect, 'id'>;

// Open Orders Grouped table (matches OpenOrdersGrouped model from C# backend)
export const openOrdersGrouped = pgTable("openOrdersGrouped", {
  id: serial("id").primaryKey(), // For database usage only
  ArtikelNr: integer("ArtikelNr").notNull(), // Item number
  Hrs: text("Hrs"), // Nullable in C# model (string? Hrs)
  Artikel: text("Artikel"), // Nullable in C# model (string? Artikel)
  WgrNo: text("WgrNo"), // Nullable in C# model (string? WgrNo)
  Anzahl: integer("Anzahl").notNull(), // Total orders
  Erstelldatum: text("Erstelldatum").notNull(), // Creation date
  AnzahlTickets: integer("AnzahlTickets").notNull(), // Associated tickets count
});

export const insertOpenOrderGroupedSchema = createInsertSchema(openOrdersGrouped).omit({
  id: true,
});

export type InsertOpenOrderGrouped = z.infer<typeof insertOpenOrderGroupedSchema>;
// For client compatibility, exclude database ID
export type OpenOrderGrouped = Omit<typeof openOrdersGrouped.$inferSelect, 'id'>;

// Additional data for grouped orders (matching client format)
export const ordersGroupedAdditional = pgTable("ordersGroupedAdditional", {
  id: serial("id").primaryKey(),
  ArtikelNr: integer("ArtikelNr").notNull(), // Item number (matching client naming)
  newDeliveryDate: text("newDeliveryDate"), // New delivery date (if changed)
  originalDeliveryDate: text("originalDeliveryDate"), // Original delivery date
  notes: text("notes"), // Additional notes for the order
});

export const insertOrdersGroupedAdditionalSchema = createInsertSchema(ordersGroupedAdditional).omit({
  id: true,
});

export type InsertOrdersGroupedAdditional = z.infer<typeof insertOrdersGroupedAdditionalSchema>;
export type OrdersGroupedAdditional = typeof ordersGroupedAdditional.$inferSelect & {
  alternativeItems?: AlternativeItem[];
};

// Alternative items table
export const alternativeItems = pgTable("alternativeItems", {
  id: serial("id").primaryKey(),
  orderArtikelNr: integer("orderArtikelNr").notNull(), // Original order item number
  alternativeArtikelNr: integer("alternativeArtikelNr").notNull(), // Alternative item number
  alternativeArtikel: text("alternativeArtikel").notNull(), // Alternative item name
});

export const insertAlternativeItemSchema = createInsertSchema(alternativeItems).omit({
  id: true,
});

export type InsertAlternativeItem = z.infer<typeof insertAlternativeItemSchema>;
export type AlternativeItem = typeof alternativeItems.$inferSelect & {
  artikelNr: number; // For client compatibility (same as alternativeArtikelNr)
  artikel: string;  // For client compatibility (same as alternativeArtikel)
};
