import { QueryClient, QueryFunction } from "@tanstack/react-query";
import {
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
 * It supports making HTTP requests to the ASP.NET Core backend.
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
 * Query client instance configuration
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
