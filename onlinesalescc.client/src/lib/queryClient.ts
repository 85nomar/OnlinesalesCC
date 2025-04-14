import { QueryClient, QueryFunction } from "@tanstack/react-query";
import {
    API_BASE_URL,
    getApiUrl,
    getAuthToken
} from '@/config/api.config';

/**
 * API Configuration Module
 * 
 * This module provides utilities for making API requests.
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
 */
export async function apiRequest(
    method: string,
    endpoint: string,
    data?: unknown | undefined,
): Promise<Response> {
    // Build headers
    const headers: Record<string, string> = {};

    // Add content-type for requests with body
    if (data) {
        headers["Content-Type"] = "application/json";
    }

    // Add auth header if authentication is needed
    const token = getAuthToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
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
 * Query client instance
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
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
