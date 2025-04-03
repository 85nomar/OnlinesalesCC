/**
 * Internal Mock Data Types
 *
 * This file defines the types used for internal mock data
 * and provides the initial data for the application.
 */

/**
 * Mock Tickets Data
 */
export const mockTickets = [
  {
    id: "ticket-001",
    ticketId: 1001,
    artikelNr: 12345,
    title: "Delivery question for Samsung Galaxy",
    description:
      "Customer wants to know when the Samsung Galaxy will be delivered.",
    createdAt: "2025-03-05T10:30:00Z",
    status: "open",
    priority: "medium",
    customerName: "Alice Johnson",
    customerEmail: "alice@example.com",
  },
  {
    id: "ticket-002",
    ticketId: 1002,
    artikelNr: 12345,
    title: "Bulk order request for Samsung Galaxy",
    description: "Corporate customer needs 20 units by end of month.",
    createdAt: "2025-03-06T14:20:00Z",
    status: "in_progress",
    priority: "high",
    customerName: "Bob Smith",
    customerEmail: "bob@example.com",
  },
  {
    id: "ticket-003",
    ticketId: 1003,
    artikelNr: 12345,
    title: "Invoice correction for Samsung Galaxy",
    description: "Wrong price on invoice #INV-2025-456.",
    createdAt: "2025-03-07T09:15:00Z",
    status: "resolved",
    priority: "medium",
    customerName: "Charlie Davis",
    customerEmail: "charlie@example.com",
  },
  {
    id: "ticket-004",
    ticketId: 1004,
    artikelNr: 12347,
    title: "Missing accessories for Xiaomi Redmi",
    description: "Charger missing from package.",
    createdAt: "2025-03-08T16:05:00Z",
    status: "open",
    priority: "high",
    customerName: "Diana Evans",
    customerEmail: "diana@example.com",
  },
  {
    id: "ticket-005",
    ticketId: 1005,
    artikelNr: 12347,
    title: "Return request for Xiaomi Redmi",
    description: "Customer received wrong color.",
    createdAt: "2025-03-09T11:30:00Z",
    status: "open",
    priority: "medium",
    customerName: "Eric Franklin",
    customerEmail: "eric@example.com",
  },
  {
    id: "ticket-006",
    ticketId: 1006,
    artikelNr: 12348,
    title: "Technical issue with Google Pixel",
    description: "Device not charging properly.",
    createdAt: "2025-03-10T13:45:00Z",
    status: "in_progress",
    priority: "urgent",
    customerName: "Fiona Grant",
    customerEmail: "fiona@example.com",
  },
  {
    id: "ticket-007",
    ticketId: 1007,
    artikelNr: 12350,
    title: "Warranty information for Honor Magic",
    description: "Customer needs extended warranty details.",
    createdAt: "2025-03-11T10:00:00Z",
    status: "open",
    priority: "low",
    customerName: "George Harris",
    customerEmail: "george@example.com",
  },
  {
    id: "ticket-008",
    ticketId: 1008,
    artikelNr: 12350,
    title: "Price match request for Honor Magic",
    description: "Competitor offering at lower price.",
    createdAt: "2025-03-12T15:20:00Z",
    status: "open",
    priority: "medium",
    customerName: "Helen Ivanov",
    customerEmail: "helen@example.com",
  },
];

/**
 * Open Orders Type
 * Represents an individual order
 */
export type OpenOrders = {
  BestellNr: number;
  Erstelldatum: string;
  ArtikelNr: number;
  Hrs: string;
  Artikel: string;
  WgrNo: number;
  Anzahl: number;
  BestellStatus: string;
};

/**
 * Open Orders Grouped Type
 * Represents orders grouped by article
 */
export type OpenOrdersGrouped = {
  ArtikelNr: number;
  Hrs: string;
  Artikel: string;
  WgrNo: number;
  Anzahl: number;
  Erstelldatum: string;
  AnzahlTickets: number;
};

/**
 * Alternative Item Type
 * Represents an item that can be substituted
 */
export type AlternativeItem = {
  artikelNr: number;
  artikel: string;
};

/**
 * Additional Data for Orders
 * Represents extra information for orders
 */
export type OrdersGroupedAdditional = {
  ArtikelNr: number;
  newDeliveryDate: string | null;
  originalDeliveryDate?: string | null;
  alternativeItems: AlternativeItem[];
  id?: number;
};

/**
 * Mock Data: Open Orders
 */
export const mockBackendOpenOrders: OpenOrders[] = [
  {
    BestellNr: 20688504,
    Erstelldatum: "2019-06-04 21:10:31.000",
    ArtikelNr: 1901399,
    Hrs: "RAVENSCOURT",
    Artikel: "NSW VOICE OF GERMANY 19+2MIC /D",
    WgrNo: 8123,
    Anzahl: 1,
    BestellStatus: "UNKNOWN",
  },
  {
    BestellNr: 20802494,
    Erstelldatum: "2019-07-27 23:49:30.000",
    ArtikelNr: 1909288,
    Hrs: "TONIES",
    Artikel: "01-0178 30 LIEBLINS KINDERLIEDER SC",
    WgrNo: 450,
    Anzahl: 1,
    BestellStatus: "ORDER_COMPLETED",
  },
  {
    BestellNr: 20985737,
    Erstelldatum: "2019-10-28 20:09:03.000",
    ArtikelNr: 1106030,
    Hrs: "NESCAFÉ",
    Artikel: "12385198 LUNGO DECAFFEINATO 16C",
    WgrNo: 629,
    Anzahl: 2,
    BestellStatus: "UNKNOWN",
  },
  {
    BestellNr: 21105315,
    Erstelldatum: "2019-11-29 22:13:39.000",
    ArtikelNr: 1592944,
    Hrs: "NUTRIBULLET",
    Artikel: "EXTRAKTOR 600W 12PCS BLACK DEAL",
    WgrNo: 674,
    Anzahl: 1,
    BestellStatus: "UNKNOWN",
  },
  {
    BestellNr: 21170795,
    Erstelldatum: "2019-12-18 08:54:01.000",
    ArtikelNr: 1802500,
    Hrs: "LITEON",
    Artikel: "ES1 DVDRW 8XSLIM USB BLACK",
    WgrNo: 3330,
    Anzahl: 1,
    BestellStatus: "UNKNOWN",
  },
  {
    BestellNr: 21336783,
    Erstelldatum: "2020-03-19 13:39:03.000",
    ArtikelNr: 1977567,
    Hrs: "SOLIS",
    Artikel: "8453 SILVER",
    WgrNo: 617,
    Anzahl: 1,
    BestellStatus: "UNKNOWN",
  },
  {
    BestellNr: 21434994,
    Erstelldatum: "2020-04-03 19:49:40.000",
    ArtikelNr: 1780852,
    Hrs: "LOGITECH",
    Artikel: "BRIO 4K BULK",
    WgrNo: 3620,
    Anzahl: 1,
    BestellStatus: "UNKNOWN",
  },
  {
    BestellNr: 21570024,
    Erstelldatum: "2020-04-29 14:09:05.000",
    ArtikelNr: 1929567,
    Hrs: "MICROSOFT",
    Artikel: "ELITE WL SERIES 2",
    WgrNo: 3128,
    Anzahl: 1,
    BestellStatus: "UNKNOWN",
  },
];

/**
 * Mock Data: Open Orders Grouped
 */
export const mockBackendOpenOrdersGrouped: OpenOrdersGrouped[] = [
  {
    ArtikelNr: 2269303,
    Hrs: "ALBRECHT",
    Artikel: "DR56+ DAB+ ADAPTER",
    WgrNo: 110,
    Anzahl: 93,
    Erstelldatum: "2024-11-29 15:55:10.000",
    AnzahlTickets: 2,
  },
  {
    ArtikelNr: 2269405,
    Hrs: "CREATIVE",
    Artikel: "PEBBLE V3 BLACK",
    WgrNo: 205,
    Anzahl: 45,
    Erstelldatum: "2024-10-15 09:30:20.000",
    AnzahlTickets: 0,
  },
  {
    ArtikelNr: 2270188,
    Hrs: "JBL",
    Artikel: "TUNE 510BT WHITE",
    WgrNo: 458,
    Anzahl: 67,
    Erstelldatum: "2024-12-05 14:25:30.000",
    AnzahlTickets: 1,
  },
  {
    ArtikelNr: 2270901,
    Hrs: "APPLE",
    Artikel: "MAGIC KEYBOARD BLACK",
    WgrNo: 3620,
    Anzahl: 34,
    Erstelldatum: "2025-01-10 11:45:15.000",
    AnzahlTickets: 3,
  },
  {
    ArtikelNr: 2271507,
    Hrs: "SAMSUNG",
    Artikel: "GALAXY WATCH 5 PRO",
    WgrNo: 545,
    Anzahl: 21,
    Erstelldatum: "2024-11-22 08:15:45.000",
    AnzahlTickets: 0,
  },
  {
    ArtikelNr: 1977567,
    Hrs: "SOLIS",
    Artikel: "8453 SILVER",
    WgrNo: 617,
    Anzahl: 15,
    Erstelldatum: "2024-10-30 16:20:00.000",
    AnzahlTickets: 1,
  },
  {
    ArtikelNr: 1780852,
    Hrs: "LOGITECH",
    Artikel: "BRIO 4K BULK",
    WgrNo: 3620,
    Anzahl: 28,
    Erstelldatum: "2025-02-15 13:10:25.000",
    AnzahlTickets: 0,
  },
  {
    ArtikelNr: 1929567,
    Hrs: "MICROSOFT",
    Artikel: "ELITE WL SERIES 2",
    WgrNo: 3128,
    Anzahl: 12,
    Erstelldatum: "2025-01-05 10:05:50.000",
    AnzahlTickets: 1,
  },
];

/**
 * Mock Data: Orders Additional Information
 */
export const mockOrdersGroupedAdditional: OrdersGroupedAdditional[] = [
  {
    id: 1,
    ArtikelNr: 2269303,
    newDeliveryDate: "25.07.25",
    originalDeliveryDate: null,
    alternativeItems: [
      { artikelNr: 2269405, artikel: "PEBBLE V3 BLACK" },
      { artikelNr: 2270188, artikel: "TUNE 510BT WHITE" },
      { artikelNr: 2271507, artikel: "GALAXY WATCH 5 PRO" },
    ],
  },
  {
    id: 2,
    ArtikelNr: 2269405,
    newDeliveryDate: null,
    originalDeliveryDate: null,
    alternativeItems: [
      { artikelNr: 2269303, artikel: "DR56+ DAB+ ADAPTER" },
      { artikelNr: 2270901, artikel: "MAGIC KEYBOARD BLACK" },
    ],
  },
  {
    id: 3,
    ArtikelNr: 2270188,
    newDeliveryDate: "05.08.25",
    originalDeliveryDate: null,
    alternativeItems: [{ artikelNr: 2271507, artikel: "GALAXY WATCH 5 PRO" }],
  },
  {
    id: 4,
    ArtikelNr: 2270901,
    newDeliveryDate: "15.08.25",
    originalDeliveryDate: null,
    alternativeItems: [],
  },
  {
    id: 5,
    ArtikelNr: 2271507,
    newDeliveryDate: null,
    originalDeliveryDate: null,
    alternativeItems: [
      { artikelNr: 2269303, artikel: "DR56+ DAB+ ADAPTER" },
      { artikelNr: 2270188, artikel: "TUNE 510BT WHITE" },
    ],
  },
  // Add some for the items with matching order numbers
  {
    id: 6,
    ArtikelNr: 1977567,
    newDeliveryDate: "10.09.25",
    originalDeliveryDate: null,
    alternativeItems: [{ artikelNr: 1780852, artikel: "BRIO 4K BULK" }],
  },
  {
    id: 7,
    ArtikelNr: 1780852,
    newDeliveryDate: "20.07.25",
    originalDeliveryDate: null,
    alternativeItems: [
      { artikelNr: 1977567, artikel: "8453 SILVER" },
      { artikelNr: 1929567, artikel: "ELITE WL SERIES 2" },
    ],
  },
  {
    id: 8,
    ArtikelNr: 1929567,
    newDeliveryDate: "30.06.25",
    originalDeliveryDate: null,
    alternativeItems: [{ artikelNr: 1780852, artikel: "BRIO 4K BULK" }],
  },
];

/**
 * Ticket Type
 * Represents a customer ticket
 */
export type Ticket = {
  id: string;
  ticketId: number;
  artikelNr: number;
  bestellNr?: number; // Order number associated with the ticket
  title: string;
  description: string;
  createdAt: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  customerName: string;
  customerEmail: string;
  comment?: string;
  byUser?: string; // User who created the ticket
};

/**
 * Product Groups for categorizing products
 */
export const productGroups = [
  { id: 110, name: "Audio Adapters" },
  { id: 205, name: "PC Speakers" },
  { id: 458, name: "Headphones" },
  { id: 545, name: "Smartwatches" },
  { id: 617, name: "Household Appliances" },
  { id: 629, name: "Beverages" },
  { id: 674, name: "Kitchen Appliances" },
  { id: 3128, name: "Gaming Controllers" },
  { id: 3330, name: "Optical Drives" },
  { id: 3620, name: "Computer Peripherals" },
  { id: 8123, name: "Gaming Accessories" },
  { id: 450, name: "Audio Books" },
];
