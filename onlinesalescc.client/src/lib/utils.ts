import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { addDays } from "date-fns";
import { parseAndFormatDate } from "@/components/DateFormatter";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * @deprecated Use DateFormatter component or parseAndFormatDate from DateFormatter instead
 */
export function formatDateString(dateString: string): string {
  return parseAndFormatDate(dateString, 'swiss');
}

/**
 * Determines the status of a delivery date: danger (past), warning (soon), or normal
 */
export function getDeliveryDateStatus(dateString: string | Date): 'danger' | 'warning' | 'normal' {
  try {
    // Parse the date using our universal parser
    const dateText = typeof dateString === 'string' ? dateString : dateString.toISOString();
    const isoFormatted = parseAndFormatDate(dateText, 'iso');
    
    // Create a date from the ISO string
    const date = new Date(isoFormatted);
    const today = new Date();
    
    // Clear time portion for accurate date comparison
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    // Past dates are considered delayed
    if (date < today) {
      return 'danger';
    }
    
    // Dates within the next 3 days
    const threeDaysFromNow = addDays(today, 3);
    if (date <= threeDaysFromNow) {
      return 'warning';
    }
    
    return 'normal';
  } catch (error) {
    return 'normal';
  }
}

/**
 * Generates a unique ID string
 */
export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
