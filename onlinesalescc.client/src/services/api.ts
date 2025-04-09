/**
 * API Client Wrapper
 * 
 * This module provides a centralized client for making API calls.
 * It automatically handles different data sources based on the API configuration.
 */

import { CURRENT_DATA_SOURCE, DataSource, isRealApi } from '@/config/api.config';
import { Ticket } from '@/shared/schema';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// Re-export services for easy access
export { TicketsService } from './tickets.service';
export { OrdersService, OrdersAdditionalService } from './orders.service';
export { EmailService } from './email.service';

// Define basic fetch options
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Define debounce timers for different API endpoints
const debounceTimers: Record<string, NodeJS.Timeout> = {};
const MIN_SEARCH_LENGTH = 3;
const DEBOUNCE_TIME = 500; // ms

/**
 * Debounce API requests to prevent excessive calls
 * @param key Unique key for the request (usually endpoint)
 * @param fn Function to execute after debounce
 * @param wait Wait time in ms
 */
export function debounceRequest<T>(
  key: string,
  fn: () => Promise<T>,
  wait: number = DEBOUNCE_TIME
): Promise<T> {
  return new Promise((resolve, reject) => {
    // Clear any existing timer for this key
    if (debounceTimers[key]) {
      clearTimeout(debounceTimers[key]);
    }

    // Create a new timer
    debounceTimers[key] = setTimeout(() => {
      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          delete debounceTimers[key];
        });
    }, wait);
  });
}

/**
 * Validate search input for number fields
 * Returns true if valid, false if invalid
 */
export function isValidNumberSearch(value: number | string | null | undefined, minLength = MIN_SEARCH_LENGTH): boolean {
  // Skip validation for pagination calls or data loads that aren't searches
  if (value === undefined || value === null) {
    return true;
  }

  // If it's a number, convert to string
  const strValue = typeof value === 'number' ? value.toString() : value;

  // Basic validation - must be a non-empty string
  if (!strValue || typeof strValue !== 'string') {
    return false;
  }

  // For numeric searches that are expected to be IDs or order numbers, 
  // less restrictive validation - just make sure it's a valid number
  const numValue = parseInt(strValue, 10);
  if (isNaN(numValue) || numValue <= 0) {
    return false;
  }

  // For search operations that need minimum length
  if (minLength > 0 && strValue.length < minLength) {
    console.log(`Search value ${strValue} is too short (min: ${minLength})`);
    return false;
  }

  return true;
}

// Create Axios instance with default config
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
axiosInstance.interceptors.request.use(
  (config) => {
    // You can add auth headers or other pre-request logic here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle 404 errors more gracefully
    if (error.response?.status === 404) {
      const url = error.config?.url || '';

      // For tickets by order number endpoint or search endpoints, return empty results instead of error
      if (url.includes('/by-ordernr/') || url.includes('/by-itemnr/') || url.includes('/search')) {
        console.debug(`API endpoint not implemented: ${url} - returning empty results`);
        return Promise.resolve({ data: [] });
      }

      // For all other 404s, log an error
      console.error(`API endpoint not found: ${url}`);
    }

    // Handle network errors (like ERR_CONNECTION_REFUSED) more gracefully
    if (error.code === 'ERR_NETWORK') {
      console.error(`Network error connecting to API: ${error.message}`);
      console.debug('Check that the server is running and that the API base URL is correct in .env.development');
      console.debug('Current baseURL:', axiosInstance.defaults.baseURL);

      // For search endpoints, return empty results instead of error
      const url = error.config?.url || '';
      if (url.includes('/by-ordernr/') || url.includes('/by-itemnr/') || url.includes('/search')) {
        console.debug(`Returning empty results for ${url} due to network error`);
        return Promise.resolve({ data: [] });
      }
    }

    // Log all non-404 errors but don't expose them to UI
    if (error.response?.status !== 404) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data
      });
    }

    return Promise.reject(error);
  }
);

/**
 * Adapter function to transform C# backend ticket data to our frontend format
 * Maps ticketId to id when id is missing from the response
 */
function transformTicketResponse(data: any): any {
  // Check if this is an array of tickets
  if (Array.isArray(data)) {
    return data.map(ticket => transformTicketResponse(ticket));
  }

  // Check if this is a ticket object
  if (data && typeof data === 'object' && 'ticketId' in data) {
    // Map C# model fields to our frontend model
    return {
      ...data,
      // Use ticketId as string id if id is not present
      id: data.id || `ticket-${data.ticketId}`,
      // Ensure correct field names (mapping from backend to frontend)
      comment: data.comment || '',
      entrydate: data.entrydate || new Date().toISOString(),
      description: data.comment || '', // Map comment to description for frontend compatibility
    };
  }

  // Return unmodified for other data types
  return data;
}

/**
 * Adapter function to transform C# backend order data to our frontend format
 * Maps camelCase properties to PascalCase expected by the frontend
 */
function transformOrderResponse(data: any): any {
  // Handle null or undefined
  if (!data) {
    return [];
  }

  // Handle paginated response format
  if (data && typeof data === 'object' && 'items' in data && 'totalCount' in data) {
    return {
      items: Array.isArray(data.items) ? data.items.map((item: any) => transformOrderResponse(item)) : [],
      totalCount: data.totalCount,
      page: data.page || 1,
      pageSize: data.pageSize || 25,
      totalPages: data.totalPages || Math.ceil(data.totalCount / (data.pageSize || 25))
    };
  }

  // Check if this is an array of orders
  if (Array.isArray(data)) {
    return data.map(order => transformOrderResponse(order));
  }

  // Check if this is an order object
  if (data && typeof data === 'object') {
    // Normalize order properties from camelCase to PascalCase
    // Ensure BestellNr is stored as a numeric type for proper comparisons
    return {
      // Basic order properties with normalized casing
      BestellNr: typeof data.bestellNr !== 'undefined' ? data.bestellNr : (typeof data.BestellNr !== 'undefined' ? data.BestellNr : 0),
      Erstelldatum: data.erstelldatum || data.Erstelldatum || new Date().toISOString(),
      ArtikelNr: data.artikelNr || data.ArtikelNr || 0,
      Artikel: data.artikel || data.Artikel || '',
      Hrs: data.hrs || data.Hrs || '',
      WgrNo: data.wgrNo || data.WgrNo || '',
      Anzahl: data.anzahl || data.Anzahl || 1,
      BestellStatus: data.bestellStatus || data.BestellStatus || 'UNKNOWN',

      // Any other properties that might be present
      ...data
    };
  }

  // For any other data type, return as is
  return data;
}

/**
 * API Client with error handling and response formatting
 */
export const apiClient = {
  /**
   * GET request
   * @param url The endpoint URL
   * @param config Optional axios config
   * @returns Promise with response data
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      console.log(`Making API GET request to: ${url}`);
      const response = await axiosInstance.get<T>(url, config);
      console.log(`API Response from ${url}:`, response.status);

      // Apply transformations based on endpoint type
      if (url.includes('/api/tickets')) {
        return transformTicketResponse(response.data) as T;
      } else if (url.includes('/api/orders')) {
        return transformOrderResponse(response.data) as T;
      }

      return response.data;
    } catch (error) {
      const isSearchEndpoint = url.includes('/by-itemnr/') ||
        url.includes('/by-ordernr/') ||
        url.includes('/search');

      // For GET requests to search endpoints that fail, return empty results
      // This prevents errors from propagating to the UI
      if (isSearchEndpoint) {
        console.warn(`Returning empty results for failed GET request: ${url}`);
        console.error('Original error:', error);
        return [] as unknown as T;
      }

      // For endpoints that should always work (like /api/tickets), log more details
      console.error(`API Error for ${url}:`, error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }

      throw error;
    }
  },

  /**
   * GET request with debounce and validation
   * 
   * @param url The endpoint URL
   * @param searchValue The search value to validate
   * @param minLength Minimum length for search validation
   * @param config Optional axios config
   * @returns Promise with response data or empty array
   */
  async getWithDebounce<T>(
    url: string,
    searchValue: number | string,
    minLength = MIN_SEARCH_LENGTH,
    config?: AxiosRequestConfig
  ): Promise<T> {
    // Skip debouncing and validation for endpoints that aren't searches
    if (!url.includes('/by-artikelnr/') && !url.includes('/search') &&
      !url.includes('/by-itemnr/') && !url.includes('/by-ordernr/') &&
      !url.includes('/by-bestellnr/')) {
      return this.get<T>(url, config);
    }

    // Validate search value only for search operations
    if (!isValidNumberSearch(searchValue, minLength)) {
      return [] as unknown as T;
    }

    // Create a unique key for this request
    const debounceKey = `get:${url}:${searchValue}`;

    // Return a debounced request
    return debounceRequest(
      debounceKey,
      () => this.get<T>(url, config),
      DEBOUNCE_TIME
    );
  },

  /**
   * POST request
   * @param url The endpoint URL
   * @param data The data to send
   * @param config Optional axios config
   * @returns Promise with response data
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.post<T>(url, data, config);

    // Apply transformations based on endpoint type
    if (url.includes('/api/tickets')) {
      return transformTicketResponse(response.data) as T;
    } else if (url.includes('/api/orders')) {
      return transformOrderResponse(response.data) as T;
    }

    return response.data;
  },

  /**
   * PUT request
   * @param url The endpoint URL
   * @param data The data to send
   * @param config Optional axios config
   * @returns Promise with response data
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.put<T>(url, data, config);

    // Apply transformations based on endpoint type
    if (url.includes('/api/tickets')) {
      return transformTicketResponse(response.data) as T;
    } else if (url.includes('/api/orders')) {
      return transformOrderResponse(response.data) as T;
    }

    return response.data;
  },

  /**
   * PATCH request
   * @param url The endpoint URL
   * @param data The data to send
   * @param config Optional axios config
   * @returns Promise with response data
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.patch<T>(url, data, config);

    // Apply transformations based on endpoint type
    if (url.includes('/api/tickets')) {
      return transformTicketResponse(response.data) as T;
    } else if (url.includes('/api/orders')) {
      return transformOrderResponse(response.data) as T;
    }

    return response.data;
  },

  /**
   * DELETE request
   * @param url The endpoint URL
   * @param config Optional axios config
   * @returns Promise with response data
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.delete<T>(url, config);

    // Apply transformations based on endpoint type
    if (url.includes('/api/tickets')) {
      return transformTicketResponse(response.data) as T;
    } else if (url.includes('/api/orders')) {
      return transformOrderResponse(response.data) as T;
    }

    return response.data;
  }
};

/**
 * Helper function for handling API error responses
 * 
 * @param response The fetch response object
 * @returns Promise that rejects with error details
 */
async function handleErrorResponse(response: Response): Promise<never> {
  try {
    // Try to parse error details from response
    const errorData = await response.text();
    let errorMessage = `API Error: ${response.status} - ${response.statusText}`;

    try {
      // Try to parse as JSON for structured error message
      const jsonError = JSON.parse(errorData);
      errorMessage += `. Details: ${JSON.stringify(jsonError)}`;
    } catch (jsonError) {
      // If not JSON, include the raw response text
      if (errorData) {
        errorMessage += `. Response: ${errorData}`;
      }
    }

    throw new Error(errorMessage);
  } catch (error) {
    // If we can't even read the response
    throw new Error(`API Error: ${response.status} - ${response.statusText}. Unable to read response.`);
  }
}

/**
 * Helper function for returning mock data based on endpoint
 * 
 * @param endpoint API endpoint
 * @returns Mock data for the endpoint
 */
function getMockData<T>(endpoint: string): T {
  // Since we're removing mock data, always return an empty result
  // This should never be called since we're setting CURRENT_DATA_SOURCE to DataSource.REAL_API
  console.warn('getMockData is called but mock data is no longer available');
  return [] as unknown as T;
}