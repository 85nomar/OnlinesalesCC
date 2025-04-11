/**
 * Enhanced Additional Data for Orders
 * 
 * This file provides additional data for orders that the backend hasn't developed yet.
 * Unlike the other external mock data files, this can be modified to suit frontend needs.
 * 
 * This data is intended to be used with the adapter pattern to enhance the basic order data
 * with additional features needed for the frontend functionality.
 */

export type AlternativeItem = {
  artikelNr: number;
  artikel: string;
};

export type ExternalOrderAdditional = {
  id: string;
  itemNumber: number;         // ArtikelNr in the backend data
  imageUrl: string;           // Product image URL
  newDeliveryDate: string | null; // Updated delivery date (DD.MM.YY format)
  alternativeItemsCount: number; // Number of alternative items
  alternativeItems: AlternativeItem[]; // Alternative items details
};

/**
 * Enhanced data for order items
 * This can be modified as needed to support the frontend features
 */
export const externalOrdersAdditional: ExternalOrderAdditional[] = [
  {
    id: "add-2269303",
    itemNumber: 2269303,
    imageUrl: "/placeholder.svg",
    newDeliveryDate: "25.07.25",
    alternativeItemsCount: 3,
    alternativeItems: [
      { artikelNr: 2269405, artikel: "PEBBLE V3 BLACK" },
      { artikelNr: 2270188, artikel: "TUNE 510BT WHITE" },
      { artikelNr: 2271507, artikel: "GALAXY WATCH 5 PRO" }
    ]
  },
  {
    id: "add-2269405",
    itemNumber: 2269405,
    imageUrl: "/placeholder.svg",
    newDeliveryDate: null,
    alternativeItemsCount: 2,
    alternativeItems: [
      { artikelNr: 2269303, artikel: "DR56+ DAB+ ADAPTER" },
      { artikelNr: 2270901, artikel: "MAGIC KEYBOARD BLACK" }
    ]
  },
  {
    id: "add-2270188",
    itemNumber: 2270188,
    imageUrl: "/placeholder.svg",
    newDeliveryDate: "05.08.25",
    alternativeItemsCount: 1,
    alternativeItems: [
      { artikelNr: 2271507, artikel: "GALAXY WATCH 5 PRO" }
    ]
  },
  {
    id: "add-2270901",
    itemNumber: 2270901,
    imageUrl: "/placeholder.svg",
    newDeliveryDate: "15.08.25",
    alternativeItemsCount: 0,
    alternativeItems: []
  },
  {
    id: "add-2271507",
    itemNumber: 2271507,
    imageUrl: "/placeholder.svg",
    newDeliveryDate: null,
    alternativeItemsCount: 2,
    alternativeItems: [
      { artikelNr: 2269303, artikel: "DR56+ DAB+ ADAPTER" },
      { artikelNr: 2270188, artikel: "TUNE 510BT WHITE" }
    ]
  },
  {
    id: "add-1977567",
    itemNumber: 1977567,
    imageUrl: "/placeholder.svg",
    newDeliveryDate: "10.09.25",
    alternativeItemsCount: 1,
    alternativeItems: [
      { artikelNr: 1780852, artikel: "BRIO 4K BULK" }
    ]
  },
  {
    id: "add-1780852",
    itemNumber: 1780852,
    imageUrl: "/placeholder.svg",
    newDeliveryDate: "20.07.25",
    alternativeItemsCount: 2,
    alternativeItems: [
      { artikelNr: 1977567, artikel: "8453 SILVER" },
      { artikelNr: 1929567, artikel: "ELITE WL SERIES 2" }
    ]
  },
  {
    id: "add-1929567",
    itemNumber: 1929567,
    imageUrl: "/placeholder.svg",
    newDeliveryDate: "30.06.25",
    alternativeItemsCount: 1,
    alternativeItems: [
      { artikelNr: 1780852, artikel: "BRIO 4K BULK" }
    ]
  }
];