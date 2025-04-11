/**
 * External Mock Data: Open Orders
 * 
 * This file contains mock data that simulates the response from an external backend API.
 * The data structure represents the format that would be received from the real backend.
 * 
 * DO NOT MODIFY this file as it represents the actual API contract with the backend.
 */

export interface ExternalOrder {
  BestellNr: number;
  Erstelldatum: string;
  ArtikelNr: number;
  Hrs: string;
  Artikel: string;
  WgrNo: number;
  Anzahl: number;
  BestellStatus: string;
}

export const externalOpenOrders: ExternalOrder[] = [
  {
    BestellNr: 20688504,
    Erstelldatum: '2019-06-04 21:10:31.000',
    ArtikelNr: 1901399,
    Hrs: 'RAVENSCOURT',
    Artikel: 'NSW VOICE OF GERMANY 19+2MIC /D',
    WgrNo: 8123,
    Anzahl: 1,
    BestellStatus: 'UNKNOWN',
  },
  {
    BestellNr: 20802494,
    Erstelldatum: '2019-07-27 23:49:30.000',
    ArtikelNr: 1909288,
    Hrs: 'TONIES',
    Artikel: '01-0178 30 LIEBLINS KINDERLIEDER SC',
    WgrNo: 450,
    Anzahl: 1,
    BestellStatus: 'ORDER_COMPLETED',
  },
  {
    BestellNr: 20985737,
    Erstelldatum: '2019-10-28 20:09:03.000',
    ArtikelNr: 1106030,
    Hrs: 'NESCAFÉ',
    Artikel: '12385198 LUNGO DECAFFEINATO 16C',
    WgrNo: 629,
    Anzahl: 2,
    BestellStatus: 'UNKNOWN',
  },
  {
    BestellNr: 21105315,
    Erstelldatum: '2019-11-29 22:13:39.000',
    ArtikelNr: 1592944,
    Hrs: 'NUTRIBULLET',
    Artikel: 'EXTRAKTOR 600W 12PCS BLACK DEAL',
    WgrNo: 674,
    Anzahl: 1,
    BestellStatus: 'UNKNOWN',
  },
  {
    BestellNr: 21170795,
    Erstelldatum: '2019-12-18 08:54:01.000',
    ArtikelNr: 1802500,
    Hrs: 'LITEON',
    Artikel: 'ES1 DVDRW 8XSLIM USB BLACK',
    WgrNo: 3330,
    Anzahl: 1,
    BestellStatus: 'UNKNOWN',
  },
  {
    BestellNr: 21336783,
    Erstelldatum: '2020-03-19 13:39:03.000',
    ArtikelNr: 1977567,
    Hrs: 'SOLIS',
    Artikel: '8453 SILVER',
    WgrNo: 617,
    Anzahl: 1,
    BestellStatus: 'UNKNOWN',
  },
  {
    BestellNr: 21434994,
    Erstelldatum: '2020-04-03 19:49:40.000',
    ArtikelNr: 1780852,
    Hrs: 'LOGITECH',
    Artikel: 'BRIO 4K BULK',
    WgrNo: 3620,
    Anzahl: 1,
    BestellStatus: 'UNKNOWN',
  },
  {
    BestellNr: 21570024,
    Erstelldatum: '2020-04-29 14:09:05.000',
    ArtikelNr: 1929567,
    Hrs: 'MICROSOFT',
    Artikel: 'ELITE WL SERIES 2',
    WgrNo: 3128,
    Anzahl: 1,
    BestellStatus: 'UNKNOWN',
  }
];