/**
 * API Configuration
 *
 * This file controls API endpoints and authentication settings for the ASP.NET Core backend.
 */

/**
 * API base URL
 * Used when CURRENT_DATA_SOURCE is set to REAL_API
 * 
 * Using environment variable for flexible configuration across environments
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";



/**
 * Authentication settings
 */
export const AUTH_REQUIRED = false;
export const AUTH_HEADER_NAME = "Authorization";
export const AUTH_TOKEN_PREFIX = "Bearer";

/**
 * API endpoints configuration
 */
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: "/api/auth/login",
  LOGOUT: "/api/auth/logout",

  // User management
  USERS: "/api/users",
  USER: (id: string) => `/api/users/${id}`,

  // Orders
  ORDERS: "/api/orders",
  ORDERS_GROUPED: "/api/orders/grouped",
  ORDER: (id: string) => `/api/orders/${id}`,
  ORDER_ADDITIONAL: (id: string) => `/api/orders/additional/${id}`,
  ORDERS_ADDITIONAL: "/api/orders/additional",

  // Tickets
  TICKETS: "/api/tickets",
  TICKET: (id: string) => `/api/tickets/${id}`,

  // Notifications
  NOTIFICATIONS_EMAIL: "/api/notifications/email",
};

/**
 * Constructs a full API URL
 *
 * @param endpoint The API endpoint path
 * @returns Full URL including base and version or local path for internal API
 */
export function getApiUrl(endpoint: string): string {
  // If no API base URL is defined, use local endpoint
  if (!API_BASE_URL) {
    return endpoint;
  }

  // For C# backend, we don't need to include the API_VERSION
  // Just combine the base URL with the endpoint
  return `${API_BASE_URL}${endpoint}`;
}

/**
 * Retrieves authorization token (placeholder for actual implementation)
 *
 * MIGRATION NOTE: Replace this with your actual token retrieval logic
 */
export function getAuthToken(): string {
  return localStorage.getItem("auth_token") || "";
}

/**
 * Sets the authorization token (placeholder for actual implementation)
 *
 * MIGRATION NOTE: Replace this with your actual token storage logic
 */
export function setAuthToken(token: string): void {
  localStorage.setItem("auth_token", token);
}
