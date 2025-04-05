/**
 * API Configuration
 *
 * This file controls API endpoints and configuration for the application.
 */

/**
 * API base URL
 * Using environment variable for flexible configuration across environments
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

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
 * @returns Full URL including base or local path for internal API
 */
export function getApiUrl(endpoint: string): string {
  // If no API base URL is defined, use local endpoint
  if (!API_BASE_URL) {
    return endpoint;
  }

  // Combine the base URL with the endpoint
  return `${API_BASE_URL}${endpoint}`;
}

/**
 * Retrieves authorization token
 */
export function getAuthToken(): string {
  return localStorage.getItem("auth_token") || "";
}

/**
 * Sets the authorization token
 */
export function setAuthToken(token: string): void {
  localStorage.setItem("auth_token", token);
}
