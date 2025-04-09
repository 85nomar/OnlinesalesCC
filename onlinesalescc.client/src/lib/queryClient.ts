import { QueryClient, QueryFunction } from "@tanstack/react-query";
import {
    API_BASE_URL,
    AUTH_REQUIRED,
    AUTH_HEADER_NAME,
    AUTH_TOKEN_PREFIX,
    getAuthToken
} from '@/config/api.config';

/**
 * API Configuration Module
 * 
 * This module provides utilities for making API requests.
 * It supports three modes:
 * 1. Internal Mock Mode: Uses the built-in mock data provided by the application
 * 2. External Mock Mode: Uses external mock data through adapter layer
 * 3. Real API Mode: Makes real HTTP requests to the backend
 * 
 * MIGRATION STEP: To migrate to a real API backend:
 * 1. Set CURRENT_DATA_SOURCE to DataSource.REAL_API in '@/config/api.config'
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
 * API request function for React Query
 * 
 * This function is used as the default queryFn for React Query.
 * It handles API calls to the ASP.NET Core backend.
 */
export async function apiRequest(
    { queryKey: [endpoint], signal }: { queryKey: [string], signal?: AbortSignal }
): Promise<Response> {
    // Build headers
    const requestHeaders: Record<string, string> = {};

    // Add auth token if required
    if (AUTH_REQUIRED) {
        const token = getAuthToken();
        if (token) {
            requestHeaders["Authorization"] = `${AUTH_TOKEN_PREFIX}${token}`;
        }
    }

    // Build URL
    const url = `${API_BASE_URL}${endpoint}`;

    // Make the request
    const res = await fetch(url, {
        method: 'GET',
        headers: requestHeaders,
        signal,
        credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
}

/**
 * Query client instance for ASP.NET Core backend
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: async ({ queryKey, signal }) => {
                const endpoint = queryKey[0];
                if (typeof endpoint !== 'string') {
                    throw new Error('Query key must be a string');
                }
                return apiRequest({ queryKey: [endpoint], signal });
            },
            refetchInterval: false,
            refetchOnWindowFocus: false,
            staleTime: Infinity,
            retry: 1
        },
        mutations: {
            retry: 1
        }
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
