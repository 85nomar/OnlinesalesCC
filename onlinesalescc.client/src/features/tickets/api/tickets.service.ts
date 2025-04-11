/**
 * Tickets Service
 * 
 * This service handles all ticket-related API calls to the backend.
 * It accepts and returns mapped types (English property names) while internally
 * handling the conversion to/from backend types (German property names).
 */

import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import type { Ticket } from '../types/models';
import { MappedTicket, mapTicket, toTicketPayload } from '../types/mappings';

/**
 * Tickets service for handling ticket-related API calls
 */
export const TicketsService = {
    /**
     * Get all tickets
     * @returns Promise with mapped tickets
     */
    async getAllTickets(): Promise<MappedTicket[]> {
        try {
            const response = await apiClient.get<Ticket[]>(API_ENDPOINTS.TICKETS);
            return response.map(ticket => mapTicket(ticket));
        } catch (error) {
            console.error("Error fetching all tickets:", error);
            return [];
        }
    },

    /**
     * Get tickets by order number
     * @param orderNumber The order number to filter by
     * @returns Promise with mapped tickets for the order
     */
    async getTicketsByOrderNumber(orderNumber: number): Promise<MappedTicket[]> {
        try {
            const response = await apiClient.get<Ticket[]>(
                `${API_ENDPOINTS.TICKETS}?bestellNr=${orderNumber}`
            );
            return response.map(ticket => mapTicket(ticket));
        } catch (error) {
            console.error(`Error fetching tickets for order ${orderNumber}:`, error);
            return [];
        }
    },

    /**
     * Get tickets by item number
     * @param itemNumber The item number to filter by
     * @returns Promise with mapped tickets for the item
     */
    async getTicketsByItemNumber(itemNumber: number): Promise<MappedTicket[]> {
        try {
            const response = await apiClient.get<Ticket[]>(
                `${API_ENDPOINTS.TICKETS}?artikelNr=${itemNumber}`
            );
            return response.map(ticket => mapTicket(ticket));
        } catch (error) {
            console.error(`Error fetching tickets for item ${itemNumber}:`, error);
            return [];
        }
    },

    /**
     * Create a new ticket
     * @param ticket The ticket data to create (using frontend property names)
     * @returns Promise with the created ticket data
     */
    async createTicket(ticket: Partial<MappedTicket>): Promise<MappedTicket> {
        try {
            // Map frontend property names to backend property names
            const payload = toTicketPayload(ticket);

            const response = await apiClient.post<Ticket>(
                API_ENDPOINTS.TICKETS,
                payload
            );
            
            return mapTicket(response);
        } catch (error) {
            console.error("Error creating ticket:", error);
            throw error;
        }
    },

    /**
     * Update an existing ticket
     * @param ticketId The ID of the ticket to update
     * @param ticket The updated ticket data (using frontend property names)
     * @returns Promise with the updated ticket data
     */
    async updateTicket(ticketId: number, ticket: Partial<MappedTicket>): Promise<MappedTicket> {
        try {
            // Map frontend property names to backend property names
            const payload = toTicketPayload(ticket);

            const response = await apiClient.patch<Ticket>(
                `${API_ENDPOINTS.TICKETS}/${ticketId}`,
                payload
            );
            
            return mapTicket(response);
        } catch (error) {
            console.error(`Error updating ticket ${ticketId}:`, error);
            throw error;
        }
    },

    /**
     * Delete a ticket
     * @param ticketId The ID of the ticket to delete
     */
    async deleteTicket(ticketId: number): Promise<void> {
        try {
            await apiClient.delete<void>(`${API_ENDPOINTS.TICKETS}/${ticketId}`);
        } catch (error) {
            console.error(`Error deleting ticket ${ticketId}:`, error);
            throw error;
        }
    }
}; 