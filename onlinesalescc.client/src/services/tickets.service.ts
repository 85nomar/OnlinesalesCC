/**
 * Tickets Service
 * 
 * This service handles all ticket-related API calls.
 */

import { apiClient } from './api';
import { API_ENDPOINTS } from '@/config/api.config';
import type { Ticket } from '@/shared/schema';

/**
 * Tickets service for handling ticket-related API calls
 */
export const TicketsService = {
    /**
     * Get all tickets
     * 
     * @returns Promise with tickets data
     */
    async getAllTickets(): Promise<Ticket[]> {
        try {
            // Use direct get for full data loads
            return await apiClient.get<Ticket[]>(API_ENDPOINTS.TICKETS);
        } catch (error) {
            console.error("Error fetching all tickets:", error);
            return [];
        }
    },

    /**
     * Get tickets by item (article) number
     * 
     * @param artikelNr The item number to filter by
     * @returns Promise with filtered tickets
     */
    async getTicketsByArtikelNr(artikelNr: number): Promise<Ticket[]> {
        // Skip validation for empty or invalid artikelNr
        if (!artikelNr || isNaN(artikelNr)) {
            return [];
        }

        // Use debounced method only for search operations
        return apiClient.getWithDebounce<Ticket[]>(
            `${API_ENDPOINTS.TICKETS}/by-itemnr/${artikelNr}`,
            artikelNr,
            4 // Minimum 4 digits for item numbers
        );
    },

    /**
     * Get tickets by order number
     * 
     * @param bestellNr The order number to filter by
     * @returns Promise with filtered tickets
     */
    async getTicketsByBestellNr(bestellNr: number): Promise<Ticket[]> {
        // Check if bestellNr is valid before attempting to fetch
        // Must be at least 3 digits to be considered valid and avoid excessive API calls
        if (!bestellNr || isNaN(bestellNr) || bestellNr < 100) {
            console.log(`Skipping ticket lookup for invalid order number: ${bestellNr}`);
            return [];
        }

        try {
            // Use the correct server-side endpoint for order number filtering
            return apiClient.getWithDebounce<Ticket[]>(
                `${API_ENDPOINTS.TICKETS}/by-ordernr/${bestellNr}`,
                bestellNr,
                3 // Minimum 3 digits for order numbers
            );
        } catch (error) {
            console.error(`Error during ticket lookup for order ${bestellNr}:`, error);
            return [];
        }
    },

    /**
     * Create a new ticket
     * 
     * @param ticket The ticket data to create
     * @returns Promise with the created ticket
     */
    async createTicket(ticket: Omit<Ticket, 'id' | 'ticketId'>): Promise<Ticket> {
        try {
            // For C# backend, we don't need to generate a ticketId or id
            // The backend will assign these values
            const newTicket = {
                ...ticket,
                // Don't set ticketId, let C# backend assign it
                // Don't set id, we'll use ticketId returned from C# backend
                comment: ticket.comment || '', // Using 'comment' instead of 'description' for C# backend
                entrydate: ticket.entrydate || new Date().toISOString(),
                byUser: ticket.byUser || 'System User'
            };

            return await apiClient.post<Ticket>(API_ENDPOINTS.TICKETS, newTicket);
        } catch (error) {
            console.error("Error creating ticket:", error);
            throw error; // Re-throw as this is a user-initiated action that needs feedback
        }
    },

    /**
     * Update an existing ticket
     * 
     * @param ticketId The ticket ID to update
     * @param updates The partial ticket data to update
     * @returns Promise with the updated ticket
     */
    async updateTicket(ticketId: number, updates: Partial<Omit<Ticket, 'id' | 'ticketId'>>): Promise<Ticket> {
        try {
            // Get the existing ticket
            const tickets = await this.getAllTickets();
            const existingTicket = tickets.find(ticket => ticket.ticketId === ticketId);

            if (!existingTicket) {
                throw new Error(`Ticket with ID ${ticketId} not found`);
            }

            // Merge the existing ticket with the updates
            const updatedTicket = {
                ...existingTicket,
                ...updates,
            };

            // Use ticketId (numeric) for the API call
            return await apiClient.put<Ticket>(`${API_ENDPOINTS.TICKETS}/${ticketId}`, updatedTicket);
        } catch (error) {
            console.error(`Error updating ticket ${ticketId}:`, error);
            throw error; // Re-throw as this is a user-initiated action that needs feedback
        }
    },

    /**
     * Delete a ticket
     *
     * @param ticketId The ticket ID to delete
     * @returns Promise indicating success
     */
    async deleteTicket(ticketId: string | number): Promise<void> {
        try {
            // Get the ticket to verify it exists
            const tickets = await this.getAllTickets();
            
            // Handle both string and numeric IDs
            const numericId = typeof ticketId === 'string' 
                ? parseInt(ticketId.replace('ticket-', ''), 10)
                : ticketId;
                
            const ticket = tickets.find(t => t.ticketId === numericId);

            if (!ticket) {
                throw new Error(`Ticket with ID ${ticketId} not found`);
            }

            // Use numericId for the API call
            await apiClient.delete<void>(`${API_ENDPOINTS.TICKETS}/${numericId}`);
        } catch (error) {
            console.error(`Error deleting ticket ${ticketId}:`, error);
            throw error; // Re-throw as this is a user-initiated action that needs feedback
        }
    }
};