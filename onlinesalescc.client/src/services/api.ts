/**
 * API Client Wrapper
 * 
 * This module provides a centralized client for making API calls.
 * It automatically handles different data sources based on the API configuration.
 */

import { CURRENT_DATA_SOURCE, DataSource, isRealApi, getApiUrl as configGetApiUrl } from '@/config/api.config';

// Re-export services for easy access
export { TicketsService } from './tickets.service';
export { OrdersService, OrdersAdditionalService } from './orders.service';
export { EmailService } from './email.service';

// Define basic fetch options with credentials included
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Include credentials (cookies) with requests
};

/**
 * Main API client with methods for different HTTP verbs
 */
export const apiClient = {
  /**
   * Perform a GET request
   * 
   * @param endpoint API endpoint
   * @returns Promise with the response data
   */
  async get<T>(endpoint: string): Promise<T> {
    const url = configGetApiUrl(endpoint);
    console.log(`Making GET request to: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      ...defaultOptions, // Use default options with credentials
    });

    if (!response.ok) {
      console.error(`API error (${response.status}): ${response.statusText}`);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Perform a POST request
   * 
   * @param endpoint API endpoint
   * @param data Request body data
   * @returns Promise with the response data
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    const url = configGetApiUrl(endpoint);
    console.log(`Making POST request to: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      ...defaultOptions, // Use default options with credentials
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error(`API error (${response.status}): ${response.statusText}`);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Perform a PUT request
   * 
   * @param endpoint API endpoint
   * @param data Request body data
   * @returns Promise with the response data
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    const url = configGetApiUrl(endpoint);
    console.log(`Making PUT request to: ${url}`);

    const response = await fetch(url, {
      method: 'PUT',
      ...defaultOptions, // Use default options with credentials
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error(`API error (${response.status}): ${response.statusText}`);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Perform a PATCH request
   * 
   * @param endpoint API endpoint
   * @param data Request body data
   * @returns Promise with the response data
   */
  async patch<T>(endpoint: string, data: any): Promise<T> {
    // For mock mode, simulate a successful patch and return the data
    if (!isRealApi(CURRENT_DATA_SOURCE)) {
      return data as unknown as T;
    }

    const url = configGetApiUrl(endpoint);
    console.log(`Making PATCH request to: ${url}`);

    const response = await fetch(url, {
      ...defaultOptions, // Use default options with credentials
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error(`API error (${response.status}): ${response.statusText}`);
      return handleErrorResponse(response);
    }

    return response.json();
  },

  /**
   * Perform a DELETE request
   * 
   * @param endpoint API endpoint
   * @returns Promise with the response data
   */
  async delete<T>(endpoint: string): Promise<T> {
    const url = configGetApiUrl(endpoint);
    console.log(`Making DELETE request to: ${url}`);

    const response = await fetch(url, {
      method: 'DELETE',
      ...defaultOptions, // Use default options with credentials
    });

    if (!response.ok) {
      console.error(`API error (${response.status}): ${response.statusText}`);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },
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