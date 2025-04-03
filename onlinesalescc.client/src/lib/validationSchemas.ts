/**
 * Validation Schemas
 * 
 * This module provides Zod validation schemas for form validation.
 */

import { z } from "zod";

/**
 * Generic Ticket Form Schema
 * For creating/editing a ticket with optional order number
 */
export const ticketFormSchema = z.object({
  artikelNr: z.number()
    .int("Item number must be an integer")
    .gte(1000, "Item number must be at least 4 digits"),
  bestellNr: z.number()
    .int("Order number must be an integer")
    .gte(0, "Order number must be a positive number")
    .optional()
    .transform(val => val || 0), // Transform undefined to 0 for default
  comment: z.string()
    .min(10, "Comment must be at least 10 characters")
    .max(500, "Comment must be less than 500 characters"),
});

/**
 * Order-specific Ticket Form Schema
 * For creating a ticket with an already selected item
 */
export const orderTicketFormSchema = z.object({
  orderNumber: z.string()
    .optional()
    .transform(val => val || ""),
  comment: z.string()
    .min(10, "Comment must be at least 10 characters")
    .max(500, "Comment must be less than 500 characters"),
});

/**
 * Delivery Date Form Schema
 */
export const deliveryDateFormSchema = z.object({
  newDeliveryDate: z.string()
    .min(1, "Delivery date is required"),
});

/**
 * Alternative Item Form Schema
 */
export const alternativeItemFormSchema = z.object({
  artikelNr: z.number()
    .int("Item number must be an integer")
    .gte(1000, "Item number must be at least 4 digits"),
  artikel: z.string()
    .min(3, "Item name must be at least 3 characters")
    .max(100, "Item name must be less than 100 characters"),
});

// Type definitions for form values
export type TicketFormValues = z.infer<typeof ticketFormSchema>;
export type OrderTicketFormValues = z.infer<typeof orderTicketFormSchema>;
export type DeliveryDateFormValues = z.infer<typeof deliveryDateFormSchema>;
export type AlternativeItemFormValues = z.infer<typeof alternativeItemFormSchema>;