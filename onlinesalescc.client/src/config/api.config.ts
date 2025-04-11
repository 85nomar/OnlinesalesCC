/**
 * API Configuration
 *
 * This file controls how the application sources its data:
 * - In development/prototype phase: from mock data
 * - In production: from real API endpoints
 *
 * To switch to a real backend:
 * 1. Set CURRENT_DATA_SOURCE to DataSource.REAL_API
 * 2. Configure API_BASE_URL to point to your backend
 * 3. Set API_VERSION if needed
 * 4. Configure authentication settings if required
 *
 * DATA SOURCE OPTIONS:
 * - INTERNAL_MOCK: Uses the application's built-in mock data
 * - EXTERNAL_MOCK: Uses external mock data through adapter layer
 * - REAL_API: Uses real backend API endpoints
 */

/**
 * Data Source enum
 * Controls which data source the application uses
 */
export enum DataSource {
  INTERNAL_MOCK = "internal_mock",
  EXTERNAL_MOCK = "external_mock",
  REAL_API = "real_api",
}

// Helper function to check data source type
export function isRealApi(source: DataSource): boolean {
  return source === DataSource.REAL_API;
}

export function isMockData(source: DataSource): boolean {
  return source === DataSource.INTERNAL_MOCK || source === DataSource.EXTERNAL_MOCK;
}

/**
 * Current data source configuration
 * Set this to control how data is sourced
 */
export const CURRENT_DATA_SOURCE = DataSource.REAL_API;

/**
 * Legacy configuration flag
 * @deprecated Use CURRENT_DATA_SOURCE instead
 */
export const USE_MOCK_DATA = false; // Set to false when migrating

/**
 * API base URL
 * Used when CURRENT_DATA_SOURCE is set to REAL_API
 * 
 * Using environment variable for flexible configuration across environments
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * API version
 * Appended to API_BASE_URL when constructing endpoints
 */
export const API_VERSION = "v1";

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
