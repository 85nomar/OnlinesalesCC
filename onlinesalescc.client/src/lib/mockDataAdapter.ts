/**
 * Mock Data Adapter
 * 
 * This file adapts external mock data to the format expected by the application.
 * It serves as a translator between different data structures.
 * 
 * The adapter pattern allows us to transform data from external sources (like APIs)
 * into the format expected by our application, providing a layer of abstraction.
 */

import { 
  OpenOrdersGrouped, 
  OpenOrders, 
  OrdersGroupedAdditional,
  AlternativeItem
} from './mockData';

// Import external mock data
import { mockBackendOpenOrders as externalOpenOrders } from './externalMockData/largeDataSets';
import { mockBackendOpenOrdersGrouped as externalOpenOrdersGrouped } from './externalMockData/largeDataSets';
import { externalOrdersAdditional, type ExternalOrderAdditional, type AlternativeItem as ExternalAlternativeItem } from './externalMockData/ordersAdditionalData';
import type { LargeOrders as ExternalOrder, LargeOrdersGrouped as ExternalGroupedOrder } from './externalMockData/largeDataSets';

/**
 * Converts date from DD.MM.YY (Swiss format) to ISO format
 */
function convertSwissToIsoDate(swissDate: string | null): string | null {
  if (!swissDate) return null;
  
  // Parse DD.MM.YY format
  const dateParts = swissDate.split('.').map(part => parseInt(part, 10));
  const day = dateParts[0];
  const month = dateParts[1];
  const year = dateParts[2];
  
  // Create Date object (assuming 20YY for years)
  const date = new Date(2000 + year, month - 1, day);
  
  // Return ISO format using local timezone for consistent day values
  const fullYear = date.getFullYear();
  const monthFormatted = String(date.getMonth() + 1).padStart(2, '0');
  const dayFormatted = String(date.getDate()).padStart(2, '0');
  return `${fullYear}-${monthFormatted}-${dayFormatted}`;
}

/**
 * Adapts external open orders data to application format
 */
export function adaptOpenOrders(): OpenOrders[] {
  return externalOpenOrders.map((item: ExternalOrder) => ({
    BestellNr: item.BestellNr,
    Erstelldatum: item.Erstelldatum,
    ArtikelNr: item.ArtikelNr,
    Hrs: item.Hrs,
    Artikel: item.Artikel,
    WgrNo: item.WgrNo,
    Anzahl: item.Anzahl,
    BestellStatus: item.BestellStatus
  }));
}

/**
 * Adapts external open orders grouped data to application format
 */
export function adaptOpenOrdersGrouped(): OpenOrdersGrouped[] {
  return externalOpenOrdersGrouped.map((item: ExternalGroupedOrder) => ({
    ArtikelNr: item.ArtikelNr,
    Hrs: item.Hrs,
    Artikel: item.Artikel,
    WgrNo: item.WgrNo,
    Anzahl: item.Anzahl,
    Erstelldatum: item.Erstelldatum,
    AnzahlTickets: item.AnzahlTickets
  }));
}

/**
 * Adapts enhanced additional data to the application format
 */
export function adaptOrdersGroupedAdditional(): OrdersGroupedAdditional[] {
  return externalOrdersAdditional.map((item: ExternalOrderAdditional) => ({
    ArtikelNr: item.itemNumber,
    newDeliveryDate: convertSwissToIsoDate(item.newDeliveryDate),
    alternativeItems: item.alternativeItems.map((altItem: ExternalAlternativeItem) => ({
      artikelNr: altItem.artikelNr,
      artikel: altItem.artikel
    }))
  }));
}

/**
 * Find a specific order by article number
 */
export function findOrderByArticleNr(artikelNr: number): OpenOrders[] {
  return externalOpenOrders.filter(
    (order: ExternalOrder) => order.ArtikelNr === artikelNr
  ).map((item: ExternalOrder) => ({
    BestellNr: item.BestellNr,
    Erstelldatum: item.Erstelldatum,
    ArtikelNr: item.ArtikelNr,
    Hrs: item.Hrs,
    Artikel: item.Artikel,
    WgrNo: item.WgrNo,
    Anzahl: item.Anzahl,
    BestellStatus: item.BestellStatus
  }));
}

/**
 * Find additional order data by article number
 */
export function findAdditionalDataByArticleNr(artikelNr: number): OrdersGroupedAdditional | undefined {
  const item = externalOrdersAdditional.find((item: ExternalOrderAdditional) => item.itemNumber === artikelNr);
  
  if (!item) return undefined;
  
  return {
    ArtikelNr: item.itemNumber,
    newDeliveryDate: convertSwissToIsoDate(item.newDeliveryDate),
    alternativeItems: item.alternativeItems.map((altItem: ExternalAlternativeItem) => ({
      artikelNr: altItem.artikelNr,
      artikel: altItem.artikel
    }))
  };
}