/**
 * External Mock Data Index
 * 
 * This file exports all external mock data to be used with the adapter pattern.
 * The data is organized into different files based on their purpose:
 * 
 * - openOrders.ts and openOrdersGrouped.ts represent data coming from the backend API
 *   (these should not be modified as they match the expected backend response structure)
 * 
 * - ordersAdditionalData.ts contains frontend-specific enhancements that can be modified
 *   to support frontend features that don't yet exist in the backend
 *
 * - largeDataSets.ts contains larger datasets for testing load performance and UI scalability
 */

// Export the regular mock data
//export * from './openOrders';
//export * from './openOrdersGrouped';
export * from './ordersAdditionalData';
export * from './services';

// Export the large datasets
export * from './largeDataSets';