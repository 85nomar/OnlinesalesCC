/**
 * Large Datasets
 * 
 * This file exports the large mock datasets for testing load performance.
 */

// Import the main types from the base files
import { ExternalOrder } from './openOrders';
import { ExternalGroupedOrder } from './openOrdersGrouped';

// Import the larger datasets
export { mockBackendOpenOrdersGrouped } from './mockBackendOpenOrdersGrouped';
export { mockBackendOpenOrders } from './mockBackendOpenOrders';

// Type definitions for the large datasets to match existing types
export type LargeOrdersGrouped = ExternalGroupedOrder;
export type LargeOrders = ExternalOrder;