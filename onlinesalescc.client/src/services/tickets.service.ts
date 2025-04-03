/**
 * Tickets Service
 *
 * This service handles all ticket-related API calls.
 */

import { apiClient } from './api'
import { API_ENDPOINTS } from '../config/api.config'
import type { Ticket } from '../shared/schema'

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
    return apiClient.get<Ticket[]>(API_ENDPOINTS.TICKETS)
  },

  /**
   * Get tickets by item (article) number
   *
   * @param artikelNr The item number to filter by
   * @returns Promise with filtered tickets
   */
  async getTicketsByArtikelNr(artikelNr: number): Promise<Ticket[]> {
    return apiClient.get<Ticket[]>(`${API_ENDPOINTS.TICKETS}/${artikelNr}`)
  },

  /**
   * Get tickets by order number
   *
   * @param bestellNr The order number to filter by
   * @returns Promise with filtered tickets
   */
  async getTicketsByBestellNr(bestellNr: number): Promise<Ticket[]> {
    const tickets = await this.getAllTickets()
    return tickets.filter((ticket) => ticket.bestellNr === bestellNr)
  },

  /**
   * Create a new ticket
   *
   * @param ticket The ticket data to create
   * @returns Promise with the created ticket
   */
  async createTicket(ticket: Omit<Ticket, 'id' | 'ticketId'>): Promise<Ticket> {
    const newTicket = {
      ...ticket,
      entrydate: new Date().toISOString(),
      byUser: ticket.byUser || 'System User',
    }

    return apiClient.post<Ticket>(API_ENDPOINTS.TICKETS, newTicket)
  },

  /**
   * Update an existing ticket
   *
   * @param id The ticket ID to update
   * @param updates The partial ticket data to update
   * @returns Promise with the updated ticket
   */
  async updateTicket(id: string | number, updates: Partial<Omit<Ticket, 'id' | 'ticketId'>>): Promise<Ticket> {
    // Convert string ID to number if necessary
    const ticketId = typeof id === 'string' ? parseInt(id) : id

    // Prepare the update data
    const updateData = {
      ...updates,
      ticketId: ticketId,
      entrydate: updates.entrydate || new Date().toISOString(),
      byUser: updates.byUser || 'System User',
    }

    return apiClient.patch<Ticket>(`${API_ENDPOINTS.TICKETS}/${ticketId}`, updateData)
  },

  /**
   * Delete a ticket
   *
   * @param id The ticket ID to delete
   * @returns Promise indicating success
   */
  async deleteTicket(id: string | number): Promise<void> {
    // Convert string ID to number if necessary
    const ticketId = typeof id === 'string' ? parseInt(id) : id
    return apiClient.delete<void>(`${API_ENDPOINTS.TICKETS}/${ticketId}`)
  },
}
