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

// Ticket table
export const tickets = pgTable("tickets", {
  id: text("id").primaryKey(), // Using string ID to match client format
  ticketId: integer("ticketId").notNull(),
  bestellNr: integer("bestellNr").notNull(), // Order number
  artikelNr: integer("artikelNr").notNull(), // Item number
  comment: text("comment").notNull(),
  byUser: text("byUser").notNull(), // Created by
  entrydate: text("entrydate").notNull(), // Creation date
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

// Open Orders table
export const openOrders = pgTable("openOrders", {
  id: serial("id").primaryKey(), // For database usage only
  BestellNr: integer("BestellNr").notNull(), // Order number
  Erstelldatum: text("Erstelldatum").notNull(), // Creation date
  ArtikelNr: integer("ArtikelNr").notNull(), // Item number
  Hrs: text("Hrs").notNull(), // Brand
  Artikel: text("Artikel").notNull(), // Item name
  WgrNo: integer("WgrNo").notNull(), // Product group
  Anzahl: integer("Anzahl").notNull(), // Quantity
  BestellStatus: text("BestellStatus").notNull(), // Order status
});

export const insertOpenOrderSchema = createInsertSchema(openOrders).omit({
  id: true,
});

export type InsertOpenOrder = z.infer<typeof insertOpenOrderSchema>;
// For client compatibility, exclude database ID
export type OpenOrder = Omit<typeof openOrders.$inferSelect, 'id'>;

// Open Orders Grouped table
export const openOrdersGrouped = pgTable("openOrdersGrouped", {
  id: serial("id").primaryKey(), // For database usage only
  ArtikelNr: integer("ArtikelNr").notNull(), // Item number
  Hrs: text("Hrs").notNull(), // Brand
  Artikel: text("Artikel").notNull(), // Item name
  WgrNo: integer("WgrNo").notNull(), // Product group
  Anzahl: integer("Anzahl").notNull(), // Total orders
  Erstelldatum: text("Erstelldatum").notNull(), // Earliest delivery date
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
});

export const insertOrdersGroupedAdditionalSchema = createInsertSchema(ordersGroupedAdditional).omit({
  id: true,
});

export type InsertOrdersGroupedAdditional = z.infer<typeof insertOrdersGroupedAdditionalSchema>;
export type OrdersGroupedAdditional = typeof ordersGroupedAdditional.$inferSelect & {
  alternativeItems?: AlternativeItem[];
};

// Alternative items simple model (for compatibility with the data format)
export type AlternativeItem = {
  artikelNr: number;
  artikel: string;
};
