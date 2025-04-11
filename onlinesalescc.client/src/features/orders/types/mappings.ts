/**
 * Order Mappings
 * 
 * This module provides mapped types and mapping functions for orders
 * to convert between German backend properties and English frontend properties.
 */

import {
  OpenOrder,
  OpenOrderGrouped,
  OrdersGroupedAdditional,
  AlternativeItem,
} from './models';

/**
 * Mapped type for OpenOrder
 */
export type MappedOpenOrder = {
  orderNumber: number;
  creationDate: string;
  itemNumber: number;
  supplier: string | null;
  itemName: string | null;
  productGroup: string | null;
  quantity: number;
  orderStatus: string | null;
};

/**
 * Mapped type for OpenOrderGrouped
 */
export type MappedOpenOrderGrouped = {
  itemNumber: number;
  supplier: string | null;
  itemName: string | null;
  productGroup: string | null;
  quantity: number;
  creationDate: string;
  ticketCount: number;
};

/**
 * Mapped type for OrdersGroupedAdditional
 */
export type MappedOrdersGroupedAdditional = {
  itemNumber: number;
  newDeliveryDate: string | null;
  originalDeliveryDate: string | null;
  notes: string | null;
  alternativeItems: MappedAlternativeItem[] | null;
};

/**
 * Mapped type for AlternativeItem
 */
export type MappedAlternativeItem = {
  orderItemNumber: number;
  alternativeItemNumber: number;
  alternativeItemName: string | null;
};

/**
 * Maps an OpenOrder object from German to English property names
 */
export function mapOpenOrder(order: OpenOrder): MappedOpenOrder {
  return {
    orderNumber: order.BestellNr,
    creationDate: order.Erstelldatum,
    itemNumber: order.ArtikelNr,
    supplier: order.Hrs,
    itemName: order.Artikel,
    productGroup: order.WgrNo,
    quantity: order.Anzahl,
    orderStatus: order.BestellStatus
  };
}

/**
 * Maps an OpenOrderGrouped object from German to English property names
 */
export function mapOpenOrderGrouped(order: OpenOrderGrouped): MappedOpenOrderGrouped {
  return {
    itemNumber: order.ArtikelNr,
    supplier: order.Hrs,
    itemName: order.Artikel,
    productGroup: order.WgrNo,
    quantity: order.Anzahl,
    creationDate: order.Erstelldatum,
    ticketCount: order.AnzahlTickets
  };
}

/**
 * Maps an OrdersGroupedAdditional object from German to English property names
 */
export function mapOrdersGroupedAdditional(data: OrdersGroupedAdditional): MappedOrdersGroupedAdditional {
  return {
    itemNumber: data.ArtikelNr,
    newDeliveryDate: data.NewDeliveryDate,
    originalDeliveryDate: data.OriginalDeliveryDate,
    notes: data.notes,
    alternativeItems: data.alternativeItems?.map(mapAlternativeItem) ?? null
  };
}

/**
 * Maps an AlternativeItem object from German to English property names
 */
export function mapAlternativeItem(item: AlternativeItem): MappedAlternativeItem {
  return {
    orderItemNumber: item.orderArtikelNr,
    alternativeItemNumber: item.alternativeArtikelNr,
    alternativeItemName: item.alternativeArtikel
  };
} 