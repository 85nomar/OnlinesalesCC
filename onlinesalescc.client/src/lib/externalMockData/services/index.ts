/**
 * External Mock Data Services
 * 
 * This file exports service functions for working with external mock data.
 * The service layer encapsulates all external data interactions, providing
 * a clean API for the rest of the application to use.
 */

import { 
  adaptOpenOrders,
  adaptOpenOrdersGrouped,
  adaptOrdersGroupedAdditional,
  findOrderByArticleNr,
  findAdditionalDataByArticleNr
} from '@/lib/mockDataAdapter';

/**
 * External Orders Service
 * 
 * Provides methods for retrieving various types of order data
 * from the external mock data source.
 */
export const ExternalOrdersService = {
  /**
   * Get all open orders (ungrouped)
   */
  getOpenOrders: () => {
    return adaptOpenOrders();
  },
  
  /**
   * Get open orders grouped by article
   */
  getOpenOrdersGrouped: () => {
    return adaptOpenOrdersGrouped();
  },
  
  /**
   * Get additional data for orders
   */
  getOrdersGroupedAdditional: () => {
    return adaptOrdersGroupedAdditional();
  },
  
  /**
   * Get orders for a specific article number
   */
  getOrdersByArticleNr: (artikelNr: number) => {
    return findOrderByArticleNr(artikelNr);
  },
  
  /**
   * Get additional data for a specific article
   */
  getOrderAdditionalByArticleNr: (artikelNr: number) => {
    return findAdditionalDataByArticleNr(artikelNr);
  }
};