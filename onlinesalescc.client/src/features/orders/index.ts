/**
 * Orders Feature
 * 
 * This module exports all order-related functionality.
 */

// Re-export the orders services
export { OrdersService, OrdersAdditionalService } from './api/orders.service';

// Re-export types and mappings
export type { 
  OpenOrder, 
  OpenOrderGrouped, 
  OrdersGroupedAdditional,
  AlternativeItem,
  OrderFilterRequest,
  OrderGroupedFilterRequest
} from './types/models';

export type {
  MappedOpenOrder,
  MappedOpenOrderGrouped,
  MappedOrdersGroupedAdditional,
  MappedAlternativeItem
} from './types/mappings';

export {
  mapOpenOrder,
  mapOpenOrderGrouped,
  mapOrdersGroupedAdditional,
  mapAlternativeItem
} from './types/mappings'; 