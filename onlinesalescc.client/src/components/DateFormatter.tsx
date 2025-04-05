import React, { useMemo } from 'react';
import { format, isValid, parseISO } from 'date-fns';

interface DateFormatterProps {
  date: string | Date | null;
  format?: 'swiss' | 'iso' | 'full';
  withTime?: boolean;
  className?: string;
  showOriginalOnError?: boolean;
}

export function parseAndFormatDate(
  dateInput: string | Date | null,
  formatType: 'swiss' | 'iso' | 'full' = 'swiss',
  withTime: boolean = false
): string {
  // Early exit if null, undefined or empty string
  if (!dateInput) return 'N/A';
  if (typeof dateInput === 'string' && dateInput.trim() === '') return 'N/A';

  try {
    let dateObj: Date;

    if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else {
      // Check for null-like values encoded as strings
      if (typeof dateInput === 'string' && ['null', 'undefined', 'NaN'].includes(dateInput.toLowerCase())) {
        return 'N/A';
      }

      // Try parsing direct with new Date() first for timestamp format
      if (dateInput.includes(' ')) {
        dateObj = new Date(dateInput);
        if (!isValid(dateObj)) {
          // Try ISO format with T separator
          const [datePart, timePart] = dateInput.split(' ');
          if (datePart && timePart) {
            dateObj = new Date(`${datePart}T${timePart}`);
          }
        }
      } else {
        // Try ISO format parsing
        dateObj = parseISO(dateInput);
      }

      // If still not valid, try dd.MM.yyyy format
      if (!isValid(dateObj)) {
        const parts = dateInput.split(/[\-\.\/]/);

        if (parts.length === 3) {
          // Handle dd.MM.yyyy format
          if (parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length >= 4) {
            dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
          // Handle yyyy-MM-dd or yyyy.MM.dd format
          else if (parts[0].length === 4 && parts[1].length <= 2 && parts[2].length <= 2) {
            dateObj = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
          }
        }
      }
    }

    if (!isValid(dateObj)) {
      return 'N/A';
    }

    // Check if time is actually present in the input
    const hasTimeComponent =
      (dateInput instanceof Date && (
        dateInput.getHours() !== 0 ||
        dateInput.getMinutes() !== 0 ||
        dateInput.getSeconds() !== 0
      )) ||
      (typeof dateInput === 'string' &&
        (dateInput.includes(':') || dateInput.includes('T')));

    // Format based on the specified format type
    let result: string;

    switch (formatType) {
      case 'swiss':
        result = (withTime && hasTimeComponent)
          ? format(dateObj, 'dd.MM.yyyy HH:mm')
          : format(dateObj, 'dd.MM.yyyy');
        break;
      case 'iso':
        result = (withTime && hasTimeComponent)
          ? format(dateObj, 'yyyy-MM-dd HH:mm')
          : format(dateObj, 'yyyy-MM-dd');
        break;
      case 'full':
        result = format(dateObj, 'PPP');
        break;
      default:
        result = format(dateObj, 'dd.MM.yyyy');
    }

    return result;
  } catch (error) {
    // Return N/A for all parsing errors
    return 'N/A';
  }
}

/**
 * A universal component for formatting dates consistently
 * throughout the application.
 * 
 * Memoized to prevent unnecessary re-renders
 */
const DateFormatter = React.memo(function DateFormatterComponent({
  date,
  format = 'swiss', // Default to Swiss format (dd.MM.yyyy)
  withTime = false,
  className = '',
  showOriginalOnError = false
}: DateFormatterProps) {
  // Memoize the formatted date value
  const formattedDate = useMemo(() => {
    try {
      const result = parseAndFormatDate(date, format, withTime);

      // Return original on error if requested and formatted matches input
      if (showOriginalOnError && date && result === 'N/A') {
        return String(date);
      }

      return result;
    } catch (error) {
      // Additional error handling inside the useMemo
      return showOriginalOnError && date ? String(date) : 'N/A';
    }
  }, [date, format, withTime, showOriginalOnError]);

  // Extra safety check - return null if there's an issue with the component
  if (date === undefined) return null;

  return <span className={className}>{formattedDate}</span>;
});

export default DateFormatter;