import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { 
  USE_MOCK_DATA, 
  API_BASE_URL,
  AUTH_REQUIRED, 
  AUTH_HEADER_NAME, 
  AUTH_TOKEN_PREFIX,
  getApiUrl,
  getAuthToken
} from '@/config/api.config';

/**
 * API Configuration Module
 * 
 * This module provides utilities for making API requests.
 * It supports two modes:
 * 1. Mock Mode: Uses the mock data provided by the application
 * 2. Real API Mode: Makes real HTTP requests to the backend
 * 
 * MIGRATION STEP: To migrate to a real API backend:
 * 1. Set USE_MOCK_DATA to false in '@/config/api.config'
 * 2. Configure API_BASE_URL in '@/config/api.config'
 */

/**
 * Checks if the response is OK, throws an error if not
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Makes an API request
 * 
 * This function is used by react-query mutations.
 * For GET requests with mock data, it's bypassed in favor of service functions.
 */
export async function apiRequest(
  method: string,
  endpoint: string,
  data?: unknown | undefined,
): Promise<Response> {
  // If we're using mock data and this is a GET request, 
  // we should let the service handle it
  if (USE_MOCK_DATA && method.toUpperCase() === 'GET') {
    console.warn('Using mock data for GET request to', endpoint);
    // Return mock response that will satisfy throwIfResNotOk
    return new Response(JSON.stringify({ mock: true }), { status: 200 });
  }
  
  // Build headers
  const headers: Record<string, string> = {};
  
  // Add content-type for requests with body
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add auth header if required
  if (AUTH_REQUIRED) {
    headers[AUTH_HEADER_NAME] = `${AUTH_TOKEN_PREFIX} ${getAuthToken()}`;
  }
  
  // Build URL
  const url = getApiUrl(endpoint);
  
  // Make the request
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

/**
 * Query client instance with mock-aware configuration
 * 
 * MIGRATION STEP: When migrating to a real API:
 * 1. Set USE_MOCK_DATA to false in '@/config/api.config'
 * 2. Configure API_BASE_URL in '@/config/api.config'
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // No global queryFn when using mock data
      // When migrating to real API, implement a proper queryFn
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Add queryClient to window for global access
declare global {
  interface Window {
    queryClient: typeof queryClient;
  }
}

// Make queryClient globally available
window.queryClient = queryClient;
