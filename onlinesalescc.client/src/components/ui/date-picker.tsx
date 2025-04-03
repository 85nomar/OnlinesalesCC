import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import 'react-day-picker/dist/style.css';
import { useTranslation } from 'react-i18next';

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  className?: string;
  disabled?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  required?: boolean;
}

export function DatePicker({ date, setDate, className, disabled, inputRef, required }: DatePickerProps) {
  const { t } = useTranslation();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      calendarRef.current && 
      !calendarRef.current.contains(event.target as Node) &&
      inputWrapperRef.current && 
      !inputWrapperRef.current.contains(event.target as Node)
    ) {
      setIsCalendarOpen(false);
    }
  };

  // Add click outside listener
  useEffect(() => {
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Format the selected date as dd.mm.yyyy (Swiss format)
  const formattedDate = date ? format(date, 'dd.MM.yyyy') : '';

  return (
    <div className="relative">
      <div 
        ref={inputWrapperRef}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        onClick={() => !disabled && setIsCalendarOpen(true)}
      >
        <input
          type="text"
          placeholder={t('common.dateFormat', 'dd.mm.yyyy')}
          value={formattedDate}
          readOnly
          className="flex-1 outline-none bg-transparent cursor-pointer"
          ref={inputRef}
          required={required}
          aria-required={required}
          // Remove any potential for autofocus
          autoComplete="off"
          autoFocus={false}
          tabIndex={-1}
        />
        <Button
          type="button"
          variant="ghost"
          className="h-6 w-6 p-0 ml-2"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) {
              setIsCalendarOpen(!isCalendarOpen);
            }
          }}
          disabled={disabled}
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
      
      {isCalendarOpen && (
        <div 
          ref={calendarRef} 
          className="absolute right-0 z-50 mt-2 rounded-md border border-input bg-popover shadow-md"
        >
          <DayPicker
            mode="single"
            selected={date}
            onSelect={(day) => {
              setDate(day);
              setIsCalendarOpen(false);
            }}
            footer={
              <div className="p-2 border-t border-border flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDate(undefined);
                    setIsCalendarOpen(false);
                  }}
                >
                  {t('common.clear', 'Clear')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setDate(new Date());
                    setIsCalendarOpen(false);
                  }}
                >
                  {t('common.today', 'Today')}
                </Button>
              </div>
            }
            className="p-3"
          />
        </div>
      )}
    </div>
  );
}