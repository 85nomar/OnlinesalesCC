/**
 * Orders Service
 * 
 * This service handles all order-related API calls.
 */

import { apiClient, debounceRequest, isValidNumberSearch } from './api';
import { API_ENDPOINTS } from '@/config/api.config';
import { OpenOrder, OpenOrderGrouped, OrdersGroupedAdditional, AlternativeItem } from '@/shared/types';

// Type aliases for backward compatibility
export type OpenOrders = OpenOrder;
export type OpenOrdersGrouped = OpenOrderGrouped;

// Order cache storage
// A simple in-memory cache to store orders by lookup key
// This improves performance for repeat searches
export const orderCache = new Map<string, {
  timestamp: number;
  data: OpenOrders[];
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL
const MAX_CACHE_SIZE = 50; // Maximum number of different orders to cache

// Helper to cleanup old cache entries
const cleanupCache = () => {
  const now = Date.now();
  let oldestKey = null;
  let oldestTime = now;

  // Find expired entries and the oldest entry
  Array.from(orderCache.entries()).forEach(([key, entry]) => {
    if (now - entry.timestamp > CACHE_TTL) {
      orderCache.delete(key);
    } else if (entry.timestamp < oldestTime) {
      oldestTime = entry.timestamp;
      oldestKey = key;
    }
  });

  // If we're over size limit, remove the oldest entry
  if (orderCache.size > MAX_CACHE_SIZE && oldestKey) {
    orderCache.delete(oldestKey);
  }
};

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
    try {
      // Check cache first for all orders
      const cacheKey = 'all-orders';
      if (orderCache.has(cacheKey)) {
        const cachedData = orderCache.get(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
          console.log(`Using cached data for all orders (${cachedData.data.length} items)`);
          return cachedData.data;
        }
        // Cache entry exists but is stale, will be overwritten
      }

      // Log the API request
      console.log('Fetching all open orders from API endpoint...');

      // Use direct get method with increased timeout for this potentially large request
      const response = await apiClient.get<any>(API_ENDPOINTS.ORDERS, {
        timeout: 60000 // 60 second timeout
      });

      // Process the response based on its format
      let orders: OpenOrders[] = [];

      // Handle both response formats - array or paginated object with items property
      if (response && typeof response === 'object' && 'items' in response) {
        console.log(`Loaded ${response.items.length} orders from paginated response (out of ${response.totalCount} total)`);
        orders = response.items as OpenOrders[];
      } else if (Array.isArray(response)) {
        // If it's already an array, use it directly
        console.log(`Loaded ${response.length} orders from array response`);
        orders = response;
      } else {
        console.error('Unexpected response format from orders API:', response);
        return [];
      }

      // Cache the results for future use
      if (orders.length > 0) {
        // Clean up old cache entries
        cleanupCache();

        // Store in cache
        orderCache.set(cacheKey, {
          timestamp: Date.now(),
          data: orders
        });
        console.log(`Cached ${orders.length} orders for future use`);
      }

      return orders;
    } catch (error) {
      console.error("Error fetching all orders:", error);
      // Return empty array instead of propagating the error
      return [];
    }
  },

  /**
   * Get open orders by item (article) number
   * 
   * @param artikelNr The item number to filter by
   * @returns Promise with filtered orders
   */
  async getOpenOrdersByArtikelNr(artikelNr: number): Promise<OpenOrders[]> {
    // Skip validation for empty or invalid artikelNr
    if (!artikelNr || isNaN(artikelNr)) {
      return [];
    }

    // Convert to string for consistent cache key
    const cacheKey = `item:${artikelNr}`;

    // Check cache first
    if (orderCache.has(cacheKey)) {
      const cachedData = orderCache.get(cacheKey);
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
        console.log(`Using cached data for item #${artikelNr} (${cachedData.data.length} items)`);
        return cachedData.data;
      }
      // Cache entry exists but is stale, will be overwritten
    }

    console.log(`Searching for orders with item #${artikelNr} using API endpoint...`);

    try {
      // Show loading indicator immediately to improve perceived performance
      const url = `${API_ENDPOINTS.ORDERS}/by-itemnr/${artikelNr}`;
      console.log(`Making API request to: ${url}`);

      // Increase timeout for this request to handle potentially slow responses
      const orders = await apiClient.getWithDebounce<OpenOrders[]>(
        url,
        artikelNr,
        4, // Minimum 4 digits for item numbers
        { timeout: 60000 } // 60 second timeout
      );

      console.log(`Received API response for item #${artikelNr}: ${orders.length} orders`);

      // Cache successful responses
      if (orders && orders.length > 0) {
        // Clean up old entries before adding new ones
        cleanupCache();

        // Add to cache
        orderCache.set(cacheKey, {
          timestamp: Date.now(),
          data: orders
        });
        console.log(`Cached ${orders.length} orders for item #${artikelNr}`);
      }

      return orders;
    } catch (error) {
      console.error(`Error during order lookup for item ${artikelNr}:`, error);
      return [];
    }
  },

  /**
   * Get grouped open orders
   * 
   * @param page Optional page number for pagination
   * @param pageSize Optional page size for pagination
   * @param sortBy Optional field to sort by
   * @param sortDirection Optional sort direction ('asc' or 'desc')
   * @returns Promise with grouped orders data
   */
  async getOpenOrdersGrouped(
    page?: number,
    pageSize?: number,
    sortBy?: string,
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Promise<OpenOrdersGrouped[] | { items: OpenOrdersGrouped[], totalCount: number }> {
    try {
      // Build query parameters for pagination and sorting
      const params = new URLSearchParams();

      if (page !== undefined) {
        params.append('page', page.toString());
      }

      if (pageSize !== undefined) {
        params.append('pageSize', pageSize.toString());
      }

      if (sortBy) {
        params.append('sortBy', sortBy);
        params.append('sortDirection', sortDirection);
      }

      const queryString = params.toString();
      const url = `${API_ENDPOINTS.ORDERS_GROUPED}${queryString ? `?${queryString}` : ''}`;

      // Use direct get for this critical data load endpoint
      const response = await apiClient.get<any>(url);

      // Check if the response has a paginated structure
      if (response && typeof response === 'object' && 'items' in response) {
        return response as { items: OpenOrdersGrouped[], totalCount: number };
      }

      // If it's the old format (array), return it directly
      return response as OpenOrdersGrouped[];
    } catch (error) {
      console.error("Error fetching grouped orders:", error);
      return [];
    }
  },

  /**
   * Get all open orders with pagination
   * 
   * @param page Optional page number for pagination
   * @param pageSize Optional page size for pagination
   * @param sortBy Optional field to sort by
   * @param sortDirection Optional sort direction ('asc' or 'desc')
   * @returns Promise with paginated orders data
   */
  async getPaginatedOrders(
    page?: number,
    pageSize?: number,
    sortBy?: string,
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Promise<{ items: OpenOrders[], totalCount: number }> {
    try {
      // Build query parameters for pagination and sorting
      const params = new URLSearchParams();

      // Always include pagination parameters to ensure server-side pagination
      params.append('page', page?.toString() || '1');
      params.append('pageSize', pageSize?.toString() || '25');

      if (sortBy) {
        params.append('sortBy', sortBy);
        params.append('sortDirection', sortDirection);
      }

      const queryString = params.toString();
      const url = `${API_ENDPOINTS.ORDERS}${queryString ? `?${queryString}` : ''}`;

      console.log(`Fetching paginated orders with URL: ${url}`);
      const response = await apiClient.get<any>(url);

      // Check if the response has a paginated structure
      if (response && typeof response === 'object' && 'items' in response) {
        console.log(`Received paginated response with ${response.items.length} items out of ${response.totalCount} total`);
        return response as { items: OpenOrders[], totalCount: number };
      }

      // If it's the old format (array), convert it
      if (Array.isArray(response)) {
        console.warn('Received array response instead of paginated object - server pagination may not be working');
        return {
          items: response as OpenOrders[],
          totalCount: response.length
        };
      }

      // Fallback to empty response
      console.error('Unexpected response format:', response);
      return { items: [], totalCount: 0 };
    } catch (error) {
      console.error("Error fetching orders:", error);
      return { items: [], totalCount: 0 };
    }
  },

  /**
   * Get open orders by order number
   * 
   * @param bestellNr The order number to filter by
   * @returns Promise with filtered orders
   */
  async getOpenOrdersByBestellNr(bestellNr: number): Promise<OpenOrders[]> {
    // Skip validation for empty or invalid bestellNr
    if (!bestellNr || isNaN(bestellNr) || bestellNr < 100) {
      console.log(`Skipping order lookup for invalid order number: ${bestellNr}`);
      return [];
    }

    // Convert to string for consistent cache key
    const cacheKey = `order:${bestellNr}`;

    // Check cache first
    if (orderCache.has(cacheKey)) {
      const cachedData = orderCache.get(cacheKey);
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
        console.log(`Using cached data for order #${bestellNr} (${cachedData.data.length} items)`);
        return cachedData.data;
      }
      // Cache entry exists but is stale, will be overwritten
    }

    console.log(`Searching for order #${bestellNr} using API endpoint...`);

    try {
      // Show loading indicator immediately to improve perceived performance
      const url = `${API_ENDPOINTS.ORDERS}/by-ordernr/${bestellNr}`;
      console.log(`Making API request to: ${url}`);

      // Increase timeout for this request to handle potentially slow responses
      const orders = await apiClient.getWithDebounce<OpenOrders[]>(
        url,
        bestellNr,
        3, // Minimum 3 digits for order numbers
        { timeout: 60000 } // 60 second timeout
      );

      console.log(`Received API response for order #${bestellNr}: ${orders.length} orders`);

      // Cache successful responses
      if (orders && orders.length > 0) {
        // Clean up old entries before adding new ones
        cleanupCache();

        // Add to cache
        orderCache.set(cacheKey, {
          timestamp: Date.now(),
          data: orders
        });
        console.log(`Cached ${orders.length} orders for #${bestellNr}`);
      }

      return orders;
    } catch (error) {
      console.error(`Error during order lookup for order ${bestellNr}:`, error);

      // In case of error, try client-side filtering as fallback
      console.log(`Falling back to client-side filtering for order #${bestellNr}...`);
      try {
        const allOrders = await this.getOpenOrders();
        const bestellNrStr = bestellNr.toString();
        const filteredOrders = allOrders.filter(order =>
          order.BestellNr && order.BestellNr.toString() === bestellNrStr
        );

        // Cache fallback results too
        if (filteredOrders.length > 0) {
          cleanupCache();
          orderCache.set(cacheKey, {
            timestamp: Date.now(),
            data: filteredOrders
          });
        }

        return filteredOrders;
      } catch (fallbackError) {
        console.error(`Fallback also failed for order ${bestellNr}:`, fallbackError);
        return [];
      }
    }
  },

  /**
   * Search across all orders by search term, not limited to current page
   * 
   * @param searchTerm The search term to filter by
   * @returns Promise with filtered orders matching the search term
   */
  async searchOrders(searchTerm: string): Promise<OpenOrders[]> {
    // Skip empty searches
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    const searchTermLower = searchTerm.toLowerCase().trim();
    console.log(`Searching all orders with term: "${searchTermLower}"`);

    try {
      // Check if it's a numeric search - could be an order number or item number
      const numericSearchTerm = parseInt(searchTermLower, 10);

      // If it's a valid number, try direct endpoints first for better performance
      if (!isNaN(numericSearchTerm) && numericSearchTerm > 0) {
        console.log(`Numeric search detected (${numericSearchTerm}), trying direct lookups first`);

        // Try order number lookup first (more specific)
        if (numericSearchTerm > 1000) { // Order numbers are typically larger
          const orderResults = await this.getOpenOrdersByBestellNr(numericSearchTerm);
          if (orderResults && orderResults.length > 0) {
            console.log(`Found ${orderResults.length} results by order number`);
            return orderResults;
          }
        }

        // Then try item number lookup
        if (numericSearchTerm > 0) {
          const itemResults = await this.getOpenOrdersByArtikelNr(numericSearchTerm);
          if (itemResults && itemResults.length > 0) {
            console.log(`Found ${itemResults.length} results by item number`);
            return itemResults;
          }
        }
      }

      // For text searches or if direct lookups failed, try searching in the cache first
      const cacheKey = 'all-orders';

      if (orderCache.has(cacheKey)) {
        const cachedData = orderCache.get(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
          console.log(`Using cached data for search "${searchTermLower}" (filtering ${cachedData.data.length} items)`);

          // Filter cached orders based on search term
          const filteredOrders = cachedData.data.filter(order => {
            if (!order) return false;

            // Check various fields for matches
            return (
              // Order number
              (order.BestellNr && order.BestellNr.toString().includes(searchTermLower)) ||
              // Item number
              (order.ArtikelNr && order.ArtikelNr.toString().includes(searchTermLower)) ||
              // Item name (case-insensitive)
              (order.Artikel && order.Artikel.toLowerCase().includes(searchTermLower)) ||
              // Brand (case-insensitive) 
              (order.Hrs && order.Hrs.toLowerCase().includes(searchTermLower)) ||
              // Product group
              (order.WgrNo && order.WgrNo.toString().toLowerCase().includes(searchTermLower))
            );
          });

          if (filteredOrders.length > 0) {
            console.log(`Found ${filteredOrders.length} results in cache for "${searchTermLower}"`);
            return filteredOrders;
          }

          console.log(`No results found in cache for "${searchTermLower}", trying API endpoint`);
        }
      }

      // If no cache hit or no results, make a direct API call
      // This would ideally be a dedicated search endpoint on the backend
      console.log(`Making API request to search across all orders for "${searchTermLower}"`);

      // As a fallback approach, load all orders and filter on the client
      const allOrders = await this.getOpenOrders();

      const results = allOrders.filter(order => {
        if (!order) return false;

        // Check various fields for matches
        return (
          // Order number
          (order.BestellNr && order.BestellNr.toString().includes(searchTermLower)) ||
          // Item number
          (order.ArtikelNr && order.ArtikelNr.toString().includes(searchTermLower)) ||
          // Item name (case-insensitive)
          (order.Artikel && order.Artikel.toLowerCase().includes(searchTermLower)) ||
          // Brand (case-insensitive) 
          (order.Hrs && order.Hrs.toLowerCase().includes(searchTermLower)) ||
          // Product group
          (order.WgrNo && order.WgrNo.toString().toLowerCase().includes(searchTermLower))
        );
      });

      console.log(`Found ${results.length} results by searching all orders for "${searchTermLower}"`);
      return results;
    } catch (error) {
      console.error("Error searching orders:", error);
      return [];
    }
  },

  /**
   * Search across a collection of order items using a consistent search logic
   * 
   * @param items Array of order items to search through (can be OpenOrders[] or OpenOrdersGrouped[])
   * @param searchTerm The search term to filter by
   * @returns Filtered array of items matching the search term
   */
  searchOrderItems<T extends OpenOrders | OpenOrdersGrouped>(items: T[], searchTerm: string): T[] {
    if (!searchTerm || searchTerm.trim().length === 0 || !items || items.length === 0) {
      return items;
    }

    const searchTermLower = searchTerm.toLowerCase().trim();

    return items.filter(item => {
      if (!item) return false;

      // Check various fields for matches
      return (
        // Order number (if exists)
        ('BestellNr' in item && item.BestellNr && item.BestellNr.toString().includes(searchTermLower)) ||
        // Item number
        (item.ArtikelNr && item.ArtikelNr.toString().includes(searchTermLower)) ||
        // Item name (case-insensitive)
        (item.Artikel && item.Artikel.toLowerCase().includes(searchTermLower)) ||
        // Brand (case-insensitive) 
        (item.Hrs && item.Hrs.toLowerCase().includes(searchTermLower)) ||
        // Product group (if exists)
        ('WgrNo' in item && item.WgrNo && item.WgrNo.toString().toLowerCase().includes(searchTermLower))
      );
    });
  },

  /**
   * Search across items (grouped orders) by search term
   * 
   * @param searchTerm The search term to filter by
   * @returns Promise with filtered items matching the search term
   */
  async searchItems(searchTerm: string): Promise<OpenOrdersGrouped[]> {
    // Skip empty searches
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    const searchTermLower = searchTerm.toLowerCase().trim();
    console.log(`Searching all items with term: "${searchTermLower}"`);

    try {
      // Try to search in cache first
      const cacheKey = 'all-items-grouped';

      // If we have cached items, search through them
      if (orderCache.has(cacheKey)) {
        const cachedData = orderCache.get(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
          console.log(`Using cached items for search "${searchTermLower}" (filtering ${cachedData.data.length} items)`);

          // Convert to OpenOrdersGrouped for filtering
          const groupedOrders = cachedData.data
            .filter(order => !!order.ArtikelNr)
            .reduce((groups: { [key: string]: OpenOrdersGrouped }, order) => {
              const artikelNr = order.ArtikelNr;
              if (!groups[artikelNr]) {
                groups[artikelNr] = {
                  ArtikelNr: order.ArtikelNr,
                  Artikel: order.Artikel,
                  Anzahl: 0,
                  Hrs: order.Hrs,
                  WgrNo: order.WgrNo,
                  Erstelldatum: order.Erstelldatum,
                  AnzahlTickets: 0
                };
              }
              groups[artikelNr].Anzahl += order.Anzahl;
              return groups;
            }, {});

          // Convert to array and filter
          const items = Object.values(groupedOrders);
          const filteredItems = this.searchOrderItems(items, searchTermLower);
          console.log(`Found ${filteredItems.length} grouped items in cache for "${searchTermLower}"`);
          return filteredItems;
        }
      }

      // If no cache or stale, get all grouped items
      console.log(`Making API request to get grouped items for "${searchTermLower}"`);

      // Get all grouped items
      const items = await this.getOpenOrdersGrouped();
      const allItems = Array.isArray(items) ? items : items.items;

      // Filter using our common search function
      const filteredItems = this.searchOrderItems(allItems, searchTermLower);
      console.log(`Found ${filteredItems.length} items for "${searchTermLower}"`);

      return filteredItems;
    } catch (error) {
      console.error("Error searching items:", error);
      return [];
    }
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
    try {
      // Use the specific endpoint for a single item's additional data
      const data = await apiClient.get<OrdersGroupedAdditional>(
        `${API_ENDPOINTS.ORDER_ADDITIONAL(artikelNr.toString())}`
      );
      return data;
    } catch (error) {
      console.error(`Error fetching additional data for article ${artikelNr}:`, error);
      return null;
    }
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

    // First, get the current data to preserve the original delivery date
    try {
      const currentData = await this.getOrderAdditionalByArtikelNr(artikelNr);

      // If this is the first update, store the current delivery date as the original
      let originalDate = null;
      if (currentData) {
        // Use any type to handle both camelCase and PascalCase property names
        const data = currentData as any;

        // Check which property name is used (camelCase or PascalCase)
        originalDate = data.originalDeliveryDate || data.OriginalDeliveryDate;

        // If no original date is set yet but there's a current delivery date, 
        // use the current delivery date as the original one
        if (!originalDate) {
          originalDate = data.newDeliveryDate || data.NewDeliveryDate;
        }
      }

      // Use the specific endpoint for updating delivery date
      await apiClient.patch<void>(
        `${API_ENDPOINTS.ORDER_ADDITIONAL(artikelNr.toString())}/delivery-date`,
        {
          newDeliveryDate: formattedDate,
          originalDeliveryDate: originalDate
        }
      );
    } catch (error) {
      console.error("Error updating delivery date:", error);
      throw error;
    }
  },

  /**
   * Add an alternative item
   * 
   * @param artikelNr The original item number
   * @param item The alternative item to add
   * @returns Promise indicating success
   */
  async addAlternativeItem(artikelNr: number, item: AlternativeItem): Promise<void> {
    // Make sure we have the correct properties for the API
    const payload = {
      ArtikelNr: item.artikelNr || item.alternativeArtikelNr,
      Artikel: item.artikel || item.alternativeArtikel
    };

    console.log(`Sending alternative item to API for artikelNr=${artikelNr}:`, payload);

    // Use the specific endpoint for adding an alternative item
    // The server will handle creating the entry if it doesn't exist
    await apiClient.post<void>(
      `${API_ENDPOINTS.ORDER_ADDITIONAL(artikelNr.toString())}/alternatives`,
      payload
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