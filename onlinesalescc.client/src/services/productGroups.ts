/**
 * Product Groups 
 *
 * This file provides product category data for the application.
 */

// Define the product group interface
export interface ProductGroup {
  id: string;
  name: string;
}

/**
 * Product Groups for categorizing products
 */
export const productGroups: ProductGroup[] = [
  { id: "110", name: "Audio Adapters" },
  { id: "205", name: "PC Speakers" },
  { id: "458", name: "Headphones" },
  { id: "545", name: "Smartwatches" },
  { id: "617", name: "Household Appliances" },
  { id: "629", name: "Beverages" },
  { id: "674", name: "Kitchen Appliances" },
  { id: "3128", name: "Gaming Controllers" },
  { id: "3330", name: "Optical Drives" },
  { id: "3620", name: "Computer Peripherals" },
  { id: "8123", name: "Gaming Accessories" },
  { id: "450", name: "Audio Books" }
];

/**
 * Find a product group by ID
 * @param id Product group ID to find
 * @returns The matching product group or undefined if not found
 */
export function getProductGroupById(id: string): ProductGroup | undefined {
  return productGroups.find(group => group.id === id);
}

/**
 * Get product group name by ID
 * @param id Product group ID to find
 * @param fallback Optional fallback value if group not found
 * @returns The product group name or fallback value
 */
export function getProductGroupName(id: string | null | undefined, fallback: string = "Unknown Group"): string {
  if (!id) return fallback;
  const group = getProductGroupById(id);
  return group ? group.name : fallback;
} 