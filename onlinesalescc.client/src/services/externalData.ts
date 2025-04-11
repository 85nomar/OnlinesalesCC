/**
 * External Data Service
 * 
 * This service provides access to data from external sources
 * (like the attached mock files) through the adapter layer.
 * 
 * It serves as a demonstration of how the application can
 * integrate with external data sources that may have
 * different structures than the internal application model.
 */

import { 
  adaptOpenOrders,
  adaptOpenOrdersGrouped,
  adaptOrdersGroupedAdditional
} from '@/lib/mockDataAdapter';

import {
  OpenOrders,
  OpenOrdersGrouped,
  OrdersGroupedAdditional,
  AlternativeItem
} from '@/lib/mockData';

/**
 * External Orders Service 
 * 
 * This service accesses orders data from an external source
 * and adapts it to match the application's internal data model.
 */
export const ExternalOrdersService = {
  /**
   * Get all open orders from external source
   * Transforms them to match application data model
   */
  getOpenOrders: async (): Promise<OpenOrders[]> => {
    // This simulates a delay that would occur with a real API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Use adapter to convert external data to application format
    return adaptOpenOrders();
  },
  
  /**
   * Get all grouped orders from external source
   * Transforms them to match application data model
   */
  getOpenOrdersGrouped: async (): Promise<OpenOrdersGrouped[]> => {
    // This simulates a delay that would occur with a real API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Use adapter to convert external data to application format
    return adaptOpenOrdersGrouped();
  },
  
  /**
   * Get all additional order data from external source
   * Transforms them to match application data model
   */
  getOrdersGroupedAdditional: async (): Promise<OrdersGroupedAdditional[]> => {
    // This simulates a delay that would occur with a real API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Use adapter to convert external data to application format
    return adaptOrdersGroupedAdditional();
  },
  
  /**
   * Get orders by article number from external source
   * Filters the adapted data for the specific article
   */
  getOpenOrdersByArtikelNr: async (artikelNr: number): Promise<OpenOrders[]> => {
    // This simulates a delay that would occur with a real API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Get all orders through the adapter and filter
    const allOrders = adaptOpenOrders();
    return allOrders.filter(order => order.ArtikelNr === artikelNr);
  },
  
  /**
   * Get additional data for specific article from external source
   */
  getOrderAdditionalByArtikelNr: async (artikelNr: number): Promise<OrdersGroupedAdditional | undefined> => {
    // This simulates a delay that would occur with a real API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Get all additional data through the adapter and find the specific item
    const allAdditionalData = adaptOrdersGroupedAdditional();
    return allAdditionalData.find(item => item.ArtikelNr === artikelNr);
  }
};