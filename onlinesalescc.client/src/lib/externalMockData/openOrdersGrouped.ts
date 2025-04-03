/**
 * External Mock Data: Open Orders Grouped
 * 
 * This file contains mock data that simulates the response from an external backend API.
 * The data structure represents the format that would be received from the real backend.
 * 
 * DO NOT MODIFY this file as it represents the actual API contract with the backend.
 */

export interface ExternalGroupedOrder {
  ArtikelNr: number;
  Hrs: string;
  Artikel: string;
  WgrNo: number;
  Anzahl: number;
  Erstelldatum: string;
  AnzahlTickets: number;
}

export const externalOpenOrdersGrouped: ExternalGroupedOrder[] = [
  {
    ArtikelNr: 2269303,
    Hrs: 'ALBRECHT',
    Artikel: 'DR56+ DAB+ ADAPTER',
    WgrNo: 110,
    Anzahl: 93,
    Erstelldatum: '2024-11-29 15:55:10.000',
    AnzahlTickets: 2,
  },
  {
    ArtikelNr: 2269405,
    Hrs: 'CREATIVE',
    Artikel: 'PEBBLE V3 BLACK',
    WgrNo: 205,
    Anzahl: 45,
    Erstelldatum: '2024-10-15 09:30:20.000',
    AnzahlTickets: 0,
  },
  {
    ArtikelNr: 2270188,
    Hrs: 'JBL',
    Artikel: 'TUNE 510BT WHITE',
    WgrNo: 458,
    Anzahl: 67,
    Erstelldatum: '2024-12-05 14:25:30.000',
    AnzahlTickets: 1,
  },
  {
    ArtikelNr: 2270901,
    Hrs: 'APPLE',
    Artikel: 'MAGIC KEYBOARD BLACK',
    WgrNo: 3620,
    Anzahl: 34,
    Erstelldatum: '2025-01-10 11:45:15.000',
    AnzahlTickets: 3,
  },
  {
    ArtikelNr: 2271507,
    Hrs: 'SAMSUNG',
    Artikel: 'GALAXY WATCH 5 PRO',
    WgrNo: 545,
    Anzahl: 21,
    Erstelldatum: '2024-11-22 08:15:45.000',
    AnzahlTickets: 0,
  },
  {
    ArtikelNr: 1977567,
    Hrs: 'SOLIS',
    Artikel: '8453 SILVER',
    WgrNo: 617,
    Anzahl: 15,
    Erstelldatum: '2024-10-30 16:20:00.000',
    AnzahlTickets: 1,
  },
  {
    ArtikelNr: 1780852,
    Hrs: 'LOGITECH',
    Artikel: 'BRIO 4K BULK',
    WgrNo: 3620,
    Anzahl: 28,
    Erstelldatum: '2025-02-15 13:10:25.000',
    AnzahlTickets: 0,
  },
  {
    ArtikelNr: 1929567,
    Hrs: 'MICROSOFT',
    Artikel: 'ELITE WL SERIES 2',
    WgrNo: 3128,
    Anzahl: 12,
    Erstelldatum: '2025-01-05 10:05:50.000',
    AnzahlTickets: 1,
  }
];