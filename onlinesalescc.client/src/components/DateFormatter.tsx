import React from 'react';
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
  console.log('⏱️ DateFormatter input:', { dateInput, formatType, withTime });
  
  // Early exit if null, undefined or empty string
  if (!dateInput) return 'N/A';
  if (typeof dateInput === 'string' && dateInput.trim() === '') return 'N/A';
  
  try {
    let dateObj: Date;
    let parseMethod = 'unknown';
    
    if (dateInput instanceof Date) {
      dateObj = dateInput;
      parseMethod = 'direct-date-instance';
      console.log('✅ Input is already a Date instance');
    } else {
      console.log('📅 Parsing string date:', dateInput);
      
      // Check for null-like values encoded as strings
      if (typeof dateInput === 'string' && ['null', 'undefined', 'NaN'].includes(dateInput.toLowerCase())) {
        console.warn('⚠️ Date input is a string containing a null-like value:', dateInput);
        return 'N/A';
      }
      
      // Try parsing direct with new Date() first for timestamp format
      if (dateInput.includes(' ')) {
        dateObj = new Date(dateInput);
        if (isValid(dateObj)) {
          parseMethod = 'direct-constructor-with-space';
          console.log('✅ Parsed with direct constructor (space format)');
        }
      } else {
        // Try ISO format parsing
        dateObj = parseISO(dateInput);
        if (isValid(dateObj)) {
          parseMethod = 'parseISO';
          console.log('✅ Parsed with parseISO');
        }
      }
      
      // If still not valid, try dd.MM.yyyy format
      if (!isValid(dateObj)) {
        const parts = dateInput.split(/[\-\.\/]/);
        
        if (parts.length === 3) {
          // Handle dd.MM.yyyy format
          if (parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length >= 4) {
            dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            if (isValid(dateObj)) {
              parseMethod = 'dd.MM.yyyy';
              console.log('✅ Parsed with dd.MM.yyyy format');
            }
          } 
          // Handle yyyy-MM-dd or yyyy.MM.dd format
          else if (parts[0].length === 4 && parts[1].length <= 2 && parts[2].length <= 2) {
            dateObj = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
            if (isValid(dateObj)) {
              parseMethod = 'yyyy-MM-dd';
              console.log('✅ Parsed with yyyy-MM-dd format');
            }
          }
        }
      }
      
      // If there's timestamp part and still not valid, try other approaches
      if (!isValid(dateObj) && dateInput.includes(' ')) {
        console.log('🔍 Trying timestamp parsing for:', dateInput);
        
        // Split into date and time parts
        const [datePart, timePart] = dateInput.split(' ');
        
        if (datePart && timePart) {
          // Second try: ISO format with T
          dateObj = new Date(`${datePart}T${timePart}`);
          if (isValid(dateObj)) {
            parseMethod = 'iso-T-format';
            console.log('✅ Parsed with ISO-T format');
          }
          
          // Third try: Remove milliseconds if present
          if (!isValid(dateObj) && timePart.includes('.')) {
            const timeWithoutMs = timePart.split('.')[0];
            dateObj = new Date(`${datePart}T${timeWithoutMs}`);
            if (isValid(dateObj)) {
              parseMethod = 'iso-T-no-ms';
              console.log('✅ Parsed with ISO-T format (no milliseconds)');
            }
          }
          
          // Fourth try: Manual parsing
          if (!isValid(dateObj)) {
            console.log('🛠️ Trying manual parsing for:', dateInput);
            
            try {
              // Parse date components
              const [year, month, day] = datePart.split('-').map(Number);
              let [hours, minutes, seconds] = [0, 0, 0];
              
              if (timePart) {
                const timeParts = timePart.split(':');
                hours = parseInt(timeParts[0] || '0', 10);
                minutes = parseInt(timeParts[1] || '0', 10);
                
                // Handle seconds that might contain milliseconds
                if (timeParts[2]) {
                  seconds = parseInt(timeParts[2].split('.')[0], 10);
                }
              }
              
              // Month is 0-indexed in JavaScript Date
              dateObj = new Date(year, month - 1, day, hours, minutes, seconds);
              if (isValid(dateObj)) {
                parseMethod = 'manual-parsing';
                console.log('✅ Parsed with manual parsing');
              }
            } catch (err) {
              console.error('❌ Manual parsing failed:', err);
            }
          }
        }
      }
    }
    
    if (!isValid(dateObj)) {
      console.error('❌ All parsing methods failed for:', dateInput);
      // Return N/A for invalid dates instead of raw string
      return 'N/A';
    }
    
    // For debugging, output parsed date and format
    console.log('📊 Parsed date result:', { 
      input: dateInput,
      parsed: dateObj.toISOString(),
      method: parseMethod,
      withTime
    });
    
    // Check if time is actually present in the input
    const hasTimeComponent = 
      (dateInput instanceof Date && (
        dateInput.getHours() !== 0 || 
        dateInput.getMinutes() !== 0 || 
        dateInput.getSeconds() !== 0
      )) || 
      (typeof dateInput === 'string' && 
        (dateInput.includes(':') || dateInput.includes('T')));
        
    console.log('⏲️ Time component detection:', {
      hasTimeComponent,
      input: dateInput,
      requestedWithTime: withTime
    });
    
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
    
    console.log('✨ Formatting result:', { 
      input: dateInput, 
      result, 
      withTime,
      hasTimeComponent
    });
    
    return result;
  } catch (error) {
    console.error('💥 Date parsing error:', error, 'for input:', dateInput);
    // Return N/A for all parsing errors
    return 'N/A';
  }
}

/**
 * A universal component for formatting dates consistently
 * throughout the application.
 */
export default function DateFormatter({
  date,
  format = 'swiss', // Default to Swiss format (dd.MM.yyyy)
  withTime = false,
  className = '',
  showOriginalOnError = false
}: DateFormatterProps) {
  console.log('🔄 DateFormatter component rendering:', { 
    date, 
    format, 
    withTime,
    type: typeof date,
    isString: typeof date === 'string',
    isDate: date instanceof Date
  });
  
  const formattedDate = parseAndFormatDate(date, format, withTime);
  
  // Return original on error if requested and formatted matches input
  if (showOriginalOnError && date && formattedDate === date.toString()) {
    console.log('⚠️ Returning original date (formatting failed):', date.toString());
    return <span className={className}>{date.toString()}</span>;
  }
  
  console.log('🎯 DateFormatter final output:', formattedDate);
  return <span className={className}>{formattedDate}</span>;
}