/**
 * API Client
 * 
 * This module provides a centralized client for making API calls to the .NET Core backend.
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Add Vite environment variable types
interface ImportMetaEnv {
  VITE_API_BASE_URL: string;
}

// Debounce configuration
const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};
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
  (config: InternalAxiosRequestConfig) => {
    // You can add auth headers or other pre-request logic here
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle 404 errors more gracefully
    if (error.response?.status === 404) {
      const url = error.config?.url || '';
      console.error(`API endpoint not found: ${url}`);
    }

    // Handle network errors (like ERR_CONNECTION_REFUSED) more gracefully
    if (error.code === 'ERR_NETWORK') {
      console.error(`Network error connecting to API: ${error.message}`);
      console.debug('Check that the server is running and that the API base URL is correct in .env.development');
      console.debug('Current baseURL:', axiosInstance.defaults.baseURL);
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
      const response = await axiosInstance.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * GET request with debounce for search operations
   * @param url The endpoint URL
   * @param searchValue The search value
   * @param minLength Minimum length for search value
   * @param config Optional axios config
   * @returns Promise with response data
   */
  async getWithDebounce<T>(
    url: string,
    searchValue: number | string,
    minLength = MIN_SEARCH_LENGTH,
    config?: AxiosRequestConfig
  ): Promise<T> {
    if (!isValidNumberSearch(searchValue, minLength)) {
      return [] as unknown as T;
    }

    return debounceRequest(url, () => this.get<T>(url, config));
  },

  /**
   * POST request
   * @param url The endpoint URL
   * @param data The request body
   * @param config Optional axios config
   * @returns Promise with response data
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await axiosInstance.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * PUT request
   * @param url The endpoint URL
   * @param data The request body
   * @param config Optional axios config
   * @returns Promise with response data
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await axiosInstance.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * PATCH request
   * @param url The endpoint URL
   * @param data The request body
   * @param config Optional axios config
   * @returns Promise with response data
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await axiosInstance.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * DELETE request
   * @param url The endpoint URL
   * @param config Optional axios config
   * @returns Promise with response data
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await axiosInstance.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 