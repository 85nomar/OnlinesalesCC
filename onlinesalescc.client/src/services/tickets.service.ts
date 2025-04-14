/**
 * Tickets Service
 * 
 * This service handles all ticket-related API calls.
 */

import { apiClient } from './api';
import { API_ENDPOINTS } from '@/config/api.config';
import type { Ticket } from '@/shared/schema';  // Correct import path with @/ prefix

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
        return apiClient.get<Ticket[]>(API_ENDPOINTS.TICKETS);
    },

    /**
     * Get tickets by item (article) number
     * 
     * @param artikelNr The item number to filter by
     * @returns Promise with filtered tickets
     */
    async getTicketsByArtikelNr(artikelNr: number): Promise<Ticket[]> {
        const tickets = await apiClient.get<Ticket[]>(API_ENDPOINTS.TICKETS);
        return tickets.filter(ticket => ticket.artikelNr === artikelNr);
    },

    /**
     * Get tickets by order number
     * 
     * @param bestellNr The order number to filter by
     * @returns Promise with filtered tickets
     */
    async getTicketsByBestellNr(bestellNr: number): Promise<Ticket[]> {
        const tickets = await apiClient.get<Ticket[]>(API_ENDPOINTS.TICKETS);
        return tickets.filter(ticket => ticket.bestellNr === bestellNr);
    },

    /**
     * Create a new ticket
     * 
     * @param ticket The ticket data to create
     * @returns Promise with the created ticket
     */
    async createTicket(ticket: Omit<Ticket, 'id' | 'ticketId'>): Promise<Ticket> {
        // Generate a ticket ID for the new ticket
        const tickets = await this.getAllTickets();
        const nextTicketId = tickets.length > 0
            ? Math.max(...tickets.map(t => t.ticketId)) + 1
            : 1000;

        const newTicket = {
            ...ticket,
            ticketId: nextTicketId,
            id: crypto.randomUUID(), // Generate a unique ID
            entrydate: new Date().toISOString(),
            byUser: 'System User'
        };

        return apiClient.post<Ticket>(API_ENDPOINTS.TICKETS, newTicket);
    },

    /**
     * Update an existing ticket
     * 
     * @param id The ticket ID to update
     * @param updates The partial ticket data to update
     * @returns Promise with the updated ticket
     */
    async updateTicket(id: string, updates: Partial<Omit<Ticket, 'id' | 'ticketId'>>): Promise<Ticket> {
        // Get the existing ticket
        const tickets = await this.getAllTickets();
        const existingTicket = tickets.find(ticket => ticket.id === id);

        if (!existingTicket) {
            throw new Error(`Ticket with ID ${id} not found`);
        }

        // Merge the existing ticket with the updates
        const updatedTicket = {
            ...existingTicket,
            ...updates,
        };

        return apiClient.put<Ticket>(`${API_ENDPOINTS.TICKET(id)}`, updatedTicket);
    },

    /**
     * Delete a ticket
     * 
     * @param id The ticket ID to delete
     * @returns Promise indicating success
     */
    async deleteTicket(id: string | number): Promise<void> {
        // Extract the numeric ticketId if given a Ticket object or string id
        let ticketId: number;

        if (typeof id === 'string') {
            // If we're given a string ID, we need to first fetch the ticket to get its numeric ID
            const tickets = await this.getAllTickets();
            const targetTicket = tickets.find(t => t.id === id);
            if (!targetTicket) {
                throw new Error(`Ticket with ID ${id} not found`);
            }
            ticketId = targetTicket.ticketId;
        } else {
            // If we're given a number, use it directly
            ticketId = id;
        }

        // Make the API call with the numeric ID
        await apiClient.delete<void>(`/api/tickets/${ticketId}`);
    }
};