import type { OpenOrders, OpenOrdersGrouped, AlternativeItem, Ticket } from '@/shared/schema';

// Mock data for testing and development
export const mockBackendOpenOrders: OpenOrders[] = [];
export const mockBackendOpenOrdersGrouped: OpenOrdersGrouped[] = [];
export const mockOrdersGroupedAdditional: any[] = [];
export const mockTickets: Ticket[] = [];

// Mock data adapters
export const adaptOpenOrders = (data: any): OpenOrders[] => {
  return data.map((item: any) => ({
    BestellNr: item.bestellNr || 0,
    Erstelldatum: item.erstelldatum || new Date().toISOString(),
    ArtikelNr: item.artikelNr || 0,
    Hrs: item.hrs || '',
    Artikel: item.artikel || '',
    WgrNo: item.wgrNo || '',
    Anzahl: item.anzahl || 0,
    BestellStatus: item.bestellStatus || '',
    orderArtikelNr: item.orderArtikelNr || 0,
    alternativeArtikelNr: item.alternativeArtikelNr || 0,
    alternativeArtikel: item.alternativeArtikel || ''
  }));
};

export const adaptOpenOrdersGrouped = (data: any): OpenOrdersGrouped[] => {
  return data.map((item: any) => ({
    Artikel: item.artikel || '',
    Anzahl: item.anzahl || 0,
    BestellNr: item.bestellNr || 0,
    Erstelldatum: item.erstelldatum || new Date().toISOString(),
    ArtikelNr: item.artikelNr || 0,
    Hrs: item.hrs || '',
    WgrNo: item.wgrNo || '',
    BestellStatus: item.bestellStatus || '',
    orders: item.orders || [],
    orderArtikelNr: item.orderArtikelNr || 0,
    alternativeArtikelNr: item.alternativeArtikelNr || 0,
    alternativeArtikel: item.alternativeArtikel || '',
    AnzahlTickets: item.anzahlTickets || 0
  }));
};

export const adaptOrdersGroupedAdditional = (data: any) => {
  return data.map((item: any) => ({
    id: item.id,
    ArtikelNr: item.artikelNr || 0,
    newDeliveryDate: item.newDeliveryDate,
    originalDeliveryDate: item.originalDeliveryDate,
    notes: item.notes,
    alternativeItems: item.alternativeItems || []
  }));
};
