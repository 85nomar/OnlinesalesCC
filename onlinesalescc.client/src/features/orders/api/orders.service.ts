/**
 * Orders Service
 * 
 * Handles all order-related API calls to the backend.
 * Uses mapped types with English property names internally while handling 
 * the conversion to/from backend types with German property names.
 */

import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import type { 
  OpenOrder, 
  OpenOrderGrouped, 
  OrdersGroupedAdditional,
  OrderFilterRequest,
  OrderGroupedFilterRequest
} from '../types/models';
import {
  mapOpenOrder,
  mapOpenOrderGrouped,
  mapOrdersGroupedAdditional,
  MappedOpenOrder,
  MappedOpenOrderGrouped,
  MappedOrdersGroupedAdditional
} from '../types/mappings';
import { PaginatedResponse } from '@/features/common/types/pagination';

/**
 * Orders service for handling order-related API calls
 */
export const OrdersService = {
  /**
   * Get all open orders
   * @param filter Optional filter criteria
   * @returns Promise with mapped open orders
   */
  async getOpenOrders(filter?: Partial<OrderFilterRequest>): Promise<MappedOpenOrder[]> {
    try {
      // Construct query params
      const params = new URLSearchParams();
      if (filter?.itemNumber) params.append('artikelNr', filter.itemNumber.toString());
      if (filter?.orderNumber) params.append('bestellNr', filter.orderNumber.toString());
      if (filter?.supplier) params.append('supplier', filter.supplier);
      if (filter?.fromDate) params.append('fromDate', filter.fromDate);
      if (filter?.toDate) params.append('toDate', filter.toDate);
      if (filter?.orderStatus) params.append('status', filter.orderStatus);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient.get<OpenOrder[]>(`${API_ENDPOINTS.ORDERS}${queryString}`);
      
      return response.map(order => mapOpenOrder(order));
    } catch (error) {
      console.error('Error fetching open orders:', error);
      return [];
    }
  },

  /**
   * Get grouped open orders
   * @param filter Optional filter criteria
   * @returns Promise with mapped grouped open orders
   */
  async getOpenOrdersGrouped(filter?: Partial<OrderGroupedFilterRequest>): Promise<MappedOpenOrderGrouped[]> {
    try {
      // Construct query params
      const params = new URLSearchParams();
      if (filter?.itemNumber) params.append('artikelNr', filter.itemNumber.toString());
      if (filter?.supplier) params.append('supplier', filter.supplier);
      if (filter?.fromDate) params.append('fromDate', filter.fromDate);
      if (filter?.toDate) params.append('toDate', filter.toDate);
      if (filter?.hasMissingDeliveryDate !== undefined) 
        params.append('hasMissingDeliveryDate', filter.hasMissingDeliveryDate.toString());
      if (filter?.hasTickets !== undefined)
        params.append('hasTickets', filter.hasTickets.toString());

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient.get<OpenOrderGrouped[]>(`${API_ENDPOINTS.ORDERS_GROUPED}${queryString}`);
      
      return response.map(order => mapOpenOrderGrouped(order));
    } catch (error) {
      console.error('Error fetching grouped open orders:', error);
      return [];
    }
  },

  /**
   * Get open orders by item number
   * @param itemNumber The item number to filter by
   * @returns Promise with mapped open orders for the item
   */
  async getOpenOrdersByItemNumber(itemNumber: number): Promise<MappedOpenOrder[]> {
    try {
      const response = await apiClient.get<OpenOrder[]>(
        API_ENDPOINTS.ORDERS_BY_ITEM(itemNumber.toString())
      );
      
      return response.map(order => mapOpenOrder(order));
    } catch (error) {
      console.error(`Error fetching orders for item ${itemNumber}:`, error);
      return [];
    }
  },

  /**
   * Get open orders by order number
   * @param orderNumber The order number to filter by
   * @returns Promise with mapped open orders for the order
   */
  async getOpenOrdersByOrderNumber(orderNumber: number): Promise<MappedOpenOrder[]> {
    try {
      const response = await apiClient.get<OpenOrder[]>(
        API_ENDPOINTS.ORDERS_BY_ORDER(orderNumber.toString())
      );
      
      return response.map(order => mapOpenOrder(order));
    } catch (error) {
      console.error(`Error fetching orders for order ${orderNumber}:`, error);
      return [];
    }
  }
};

/**
 * Orders Additional service for handling order additional data API calls
 */
export const OrdersAdditionalService = {
  /**
   * Get additional data for all orders
   * @returns Promise with mapped additional data for orders
   */
  async getAllOrdersAdditional(): Promise<MappedOrdersGroupedAdditional[]> {
    try {
      const response = await apiClient.get<OrdersGroupedAdditional[]>(API_ENDPOINTS.ORDERS_ADDITIONAL);
      return response.map(data => mapOrdersGroupedAdditional(data));
    } catch (error) {
      console.error('Error fetching all orders additional data:', error);
      return [];
    }
  },

  /**
   * Get additional data for a specific item
   * @param itemNumber The item number to get additional data for
   * @returns Promise with mapped additional data for the item
   */
  async getOrderAdditional(itemNumber: number): Promise<MappedOrdersGroupedAdditional | null> {
    try {
      const response = await apiClient.get<OrdersGroupedAdditional>(
        API_ENDPOINTS.ORDER_ADDITIONAL(itemNumber.toString())
      );
      
      return mapOrdersGroupedAdditional(response);
    } catch (error) {
      console.error(`Error fetching additional data for item ${itemNumber}:`, error);
      return null;
    }
  },

  /**
   * Update delivery date for an item
   * @param itemNumber The item number to update delivery date for
   * @param newDeliveryDate The new delivery date
   * @returns Promise with the updated additional data
   */
  async updateDeliveryDate(itemNumber: number, newDeliveryDate: string): Promise<MappedOrdersGroupedAdditional | null> {
    try {
      const response = await apiClient.patch<OrdersGroupedAdditional>(
        `${API_ENDPOINTS.ORDER_ADDITIONAL(itemNumber.toString())}/delivery-date`,
        { newDeliveryDate }
      );
      
      return mapOrdersGroupedAdditional(response);
    } catch (error) {
      console.error(`Error updating delivery date for item ${itemNumber}:`, error);
      return null;
    }
  },

  /**
   * Add alternative item
   * @param itemNumber The item number to add alternative for
   * @param alternativeItemNumber The alternative item number
   * @param alternativeItemName The alternative item name
   * @returns Promise with the updated additional data
   */
  async addAlternativeItem(
    itemNumber: number, 
    alternativeItemNumber: number, 
    alternativeItemName: string
  ): Promise<MappedOrdersGroupedAdditional | null> {
    try {
      const response = await apiClient.post<OrdersGroupedAdditional>(
        `${API_ENDPOINTS.ORDER_ADDITIONAL(itemNumber.toString())}/alternatives`,
        {
          alternativeArtikelNr: alternativeItemNumber,
          alternativeArtikel: alternativeItemName
        }
      );
      
      return mapOrdersGroupedAdditional(response);
    } catch (error) {
      console.error(`Error adding alternative item for ${itemNumber}:`, error);
      return null;
    }
  },

  /**
   * Remove alternative item
   * @param itemNumber The item number to remove alternative from
   * @param alternativeItemNumber The alternative item number to remove
   * @returns Promise with the updated additional data
   */
  async removeAlternativeItem(
    itemNumber: number, 
    alternativeItemNumber: number
  ): Promise<MappedOrdersGroupedAdditional | null> {
    try {
      const response = await apiClient.delete<OrdersGroupedAdditional>(
        `${API_ENDPOINTS.ORDER_ADDITIONAL(itemNumber.toString())}/alternatives/${alternativeItemNumber}`
      );
      
      return mapOrdersGroupedAdditional(response);
    } catch (error) {
      console.error(`Error removing alternative item ${alternativeItemNumber} for ${itemNumber}:`, error);
      return null;
    }
  }
}; 