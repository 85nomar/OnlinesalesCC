/**
 * Orders Service
 * 
 * This service handles all order-related API calls.
 */

import { apiClient } from './api';
import { API_ENDPOINTS } from '@/config/api.config';
import { OpenOrders, OpenOrdersGrouped, OrdersGroupedAdditional, AlternativeItem } from '@/lib/mockData';

/**
 * Orders service for handling order-related API calls
 */
export const OrdersService = {
  /**
   * Get all open orders
   * 
   * @returns Promise with orders data
   */
  async getOpenOrders(): Promise<OpenOrders[]> {
    return apiClient.get<OpenOrders[]>(API_ENDPOINTS.ORDERS);
  },

  /**
   * Get open orders by item (article) number
   * 
   * @param artikelNr The item number to filter by
   * @returns Promise with filtered orders
   */
  async getOpenOrdersByArtikelNr(artikelNr: number): Promise<OpenOrders[]> {
    const orders = await apiClient.get<OpenOrders[]>(API_ENDPOINTS.ORDERS);
    return orders.filter(order => order.ArtikelNr === artikelNr);
  },

  /**
   * Get grouped open orders
   * 
   * @returns Promise with grouped orders data
   */
  async getOpenOrdersGrouped(): Promise<OpenOrdersGrouped[]> {
    return apiClient.get<OpenOrdersGrouped[]>(API_ENDPOINTS.ORDERS_GROUPED);
  }
};

/**
 * Orders Additional Service for handling additional order information
 */
export const OrdersAdditionalService = {
  /**
   * Get all additional order information
   * 
   * @returns Promise with additional orders data
   */
  async getOrdersGroupedAdditional(): Promise<OrdersGroupedAdditional[]> {
    return apiClient.get<OrdersGroupedAdditional[]>(API_ENDPOINTS.ORDERS_ADDITIONAL);
  },

  /**
   * Get additional information for a specific item (article)
   * 
   * @param artikelNr The item number
   * @returns Promise with the additional information for the item
   */
  async getOrderAdditionalByArtikelNr(artikelNr: number): Promise<OrdersGroupedAdditional | null> {
    const additionalData = await apiClient.get<OrdersGroupedAdditional[]>(API_ENDPOINTS.ORDERS_ADDITIONAL);
    const found = additionalData.find(item => item.ArtikelNr === artikelNr);
    return found || null;
  },

  /**
   * Update delivery date for an item
   * 
   * @param artikelNr The item number
   * @param newDate The new delivery date
   * @returns Promise indicating success
   */
  async updateDeliveryDate(artikelNr: number, newDate: string): Promise<void> {
    // Format date consistently - ensure it's in ISO format (YYYY-MM-DD)
    let formattedDate = newDate;
    if (newDate) {
      // If input is a date string in any format, convert to proper ISO
      try {
        const dateObj = new Date(newDate);
        if (!isNaN(dateObj.getTime())) { // Valid date
          // Use local timezone for date conversion to avoid timezone offset issues
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          formattedDate = `${year}-${month}-${day}`;
        }
      } catch (e) {
        console.error("Error formatting date:", e);
      }
    }

    // Use the specific endpoint for updating delivery date
    await apiClient.patch<void>(
      `${API_ENDPOINTS.ORDER_ADDITIONAL(artikelNr.toString())}/delivery-date`,
      { newDate: formattedDate }
    );
  },

  /**
   * Add an alternative item
   * 
   * @param artikelNr The original item number
   * @param item The alternative item to add
   * @returns Promise indicating success
   */
  async addAlternativeItem(artikelNr: number, item: AlternativeItem): Promise<void> {
    // Use the specific endpoint for adding an alternative item
    // The server will handle creating the entry if it doesn't exist
    await apiClient.post<void>(
      `${API_ENDPOINTS.ORDER_ADDITIONAL(artikelNr.toString())}/alternatives`,
      {
        artikelNr: item.artikelNr,
        artikel: item.artikel
      }
    );
  },

  /**
   * Remove an alternative item
   * 
   * @param artikelNr The original item number
   * @param altArtikelNr The alternative item number to remove
   * @returns Promise indicating success
   */
  async removeAlternativeItem(artikelNr: number, altArtikelNr: number): Promise<void> {
    // Use the specific endpoint for removing an alternative item
    await apiClient.delete<void>(
      `${API_ENDPOINTS.ORDER_ADDITIONAL(artikelNr.toString())}/alternatives/${altArtikelNr}`
    );
  }
};