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
  INTERNAL_MOCK = 'internal_mock',
  EXTERNAL_MOCK = 'external_mock',
  REAL_API = 'real_api',
}

// Helper function to check data source type
export function isRealApi(source: DataSource): boolean {
  return source === DataSource.REAL_API
}

export function isMockData(source: DataSource): boolean {
  return source === DataSource.INTERNAL_MOCK || source === DataSource.EXTERNAL_MOCK
}

/**
 * Current data source configuration
 * Set this to control how data is sourced
 */
export const CURRENT_DATA_SOURCE = DataSource.REAL_API

/**
 * Legacy configuration flag
 * @deprecated Use CURRENT_DATA_SOURCE instead
 */
export const USE_MOCK_DATA = false // Set to false when migrating

/**
 * API base URL
 * Used when CURRENT_DATA_SOURCE is set to REAL_API
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

/**
 * API version
 * Appended to API_BASE_URL when constructing endpoints
 */
export const API_VERSION = 'v1'

/**
 * Authentication settings
 */
export const AUTH_REQUIRED = false
export const AUTH_HEADER_NAME = 'Authorization'
export const AUTH_TOKEN_PREFIX = 'Bearer'

/**
 * API endpoints configuration
 */
export const API_ENDPOINTS = {
  // Tickets
  TICKETS: '/api/tickets',
  TICKET: (id: string | number) => `/api/tickets/${id}`,
  TICKETS_BY_ARTIKEL: (artikelNr: number) => `/api/tickets/${artikelNr}`,

  // Orders
  ORDERS: '/api/orders',
  ORDERS_GROUPED: '/api/orders/grouped',
  ORDERS_BY_ARTIKEL: (artikelNr: number) => `/api/orders/by-artikelnr/${artikelNr}`,

  // Additional Order Data
  ORDERS_ADDITIONAL: '/api/orders/additional',
  ORDER_ADDITIONAL: (artikelNr: number) => `/api/orders/additional/${artikelNr}`,
  ORDER_DELIVERY_DATE: (artikelNr: number) => `/api/orders/additional/${artikelNr}/delivery-date`,
  ORDER_ALTERNATIVES: (artikelNr: number) => `/api/orders/additional/${artikelNr}/alternatives`,
  ORDER_ALTERNATIVE: (artikelNr: number, altArtikelNr: number) => `/api/orders/additional/${artikelNr}/alternatives/${altArtikelNr}`,

  // Email Notifications
  EMAIL_NOTIFICATIONS: '/api/notifications/email',
}

/**
 * Constructs a full API URL
 *
 * @param endpoint The API endpoint path
 * @returns Full URL including base and version or local path for internal API
 */
export function getApiUrl(endpoint: string): string {
  if (API_BASE_URL === '') {
    // Use local Express API
    return endpoint
  }

  // Remove any duplicate slashes when joining paths
  const baseWithoutTrailingSlash = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL

  const versionPath = API_VERSION ? `/${API_VERSION}` : ''
  const endpointWithLeadingSlash = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  return `${baseWithoutTrailingSlash}${versionPath}${endpointWithLeadingSlash}`
}

/**
 * Retrieves authorization token (placeholder for actual implementation)
 *
 * MIGRATION NOTE: Replace this with your actual token retrieval logic
 */
export function getAuthToken(): string {
  return localStorage.getItem('auth_token') || ''
}

/**
 * Sets the authorization token (placeholder for actual implementation)
 *
 * MIGRATION NOTE: Replace this with your actual token storage logic
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('auth_token', token)
}
