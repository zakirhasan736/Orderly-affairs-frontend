import React, { useMemo, useState } from 'react';
import { Button } from '@common/ui/button';
import { Calendar, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@common/ui/popover';
import { EnhancedCalendar } from './EnhancedCalendar';
import {
  MobileBottomSheet,
  MobileSheetHandle,
  MOBILE_NESTED_SHEET_Z,
  useIsMobile,
} from './MobileBottomSheet';
import { cn } from '@common/ui/utils';

interface DatePickerProps {
  /** Current selected date value */
  value?: string | Date;
  /** Called when date is selected */
  onChange: (value: string | undefined) => void;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Whether the date picker is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Variant of the date picker */
  variant?: 'standard' | 'compact' | 'no-icon';
  /** Whether to show validation error state */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Accessible label for the mobile sheet */
  sheetTitle?: string;
}

export const DATE_PICKER_SHEET_Z = 'z-[130]'; // alias of MOBILE_NESTED_SHEET_Z


export function DatePicker({
  value,
  onChange,
  placeholder = 'MM / DD / YYYY',
  disabled = false,
  className,
  variant = 'standard',
  error = false,
  errorMessage,
  sheetTitle = 'Choose date',
}: DatePickerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedDate = useMemo(() => {
    if (!value) return undefined;
    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      setOpen(false);
      setSheetOpen(false);
      return;
    }

    const nextValue = date.toISOString();
    const currentValue =
      value instanceof Date ? value.toISOString() : String(value || '');

    if (currentValue.slice(0, 10) === nextValue.slice(0, 10)) {
      setOpen(false);
      setSheetOpen(false);
      return;
    }

    onChange(nextValue);
    setOpen(false);
    setSheetOpen(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const baseClasses = cn(
    'w-full justify-start text-left font-normal enhanced-field-frame touch-manipulation',
    'bg-white dark:bg-[rgba(40,40,40,0.95)]',
    'border-2 border-[#E0E0E0] dark:border-[#404040]',
    'rounded-[10px]',
    'h-11 min-h-11 px-3',
    'text-sm font-normal text-[#213D59] dark:text-white',
    'shadow-[0_2px_4px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.05)]',
    'transition-all duration-200 ease-in-out',
    'hover:bg-white hover:border-[#B0B0B0] hover:shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(0,0,0,0.03)]',
    'dark:hover:bg-[rgba(50,50,50,1)] dark:hover:border-[#606060] dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.03)]',
    'focus:border-[var(--accent-blue)] focus:shadow-[0_0_0_3px_rgba(0,122,255,0.15),0_2px_8px_rgba(0,0,0,0.1)] focus:bg-white focus:outline-none',
    'dark:focus:border-[var(--accent-blue)] dark:focus:shadow-[0_0_0_3px_rgba(0,122,255,0.25),0_2px_8px_rgba(0,0,0,0.3)] dark:focus:bg-[rgba(50,50,50,1)]',
    error &&
      'border-destructive focus:border-destructive focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]',
    disabled &&
      'opacity-50 cursor-not-allowed hover:bg-white dark:hover:bg-[rgba(40,40,40,0.95)]',
    className,
  );

  const iconClasses = cn(
    'h-4 w-4 calendar-icon',
    'text-[#213D59] dark:text-accent-blue',
    variant !== 'no-icon' && 'mr-2',
  );

  const textClasses = cn(
    selectedDate
      ? 'text-[#000000] dark:text-white selected-date'
      : 'text-[#A6A6A6] dark:text-muted-foreground placeholder-text',
  );

  const compactAdjustments =
    variant === 'compact'
      ? {
          height: 'h-10',
          padding: 'px-2',
          text: 'text-xs',
        }
      : {};

  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      className={cn(
        baseClasses,
        variant === 'compact' && compactAdjustments.height,
        variant === 'compact' && compactAdjustments.padding,
        variant === 'compact' && compactAdjustments.text,
      )}
      onClick={
        isMobile
          ? event => {
              event.preventDefault();
              if (!disabled) setSheetOpen(true);
            }
          : undefined
      }
    >
      {variant !== 'no-icon' && <Calendar className={iconClasses} />}
      <span className={textClasses}>
        {selectedDate ? formatDate(selectedDate) : placeholder}
      </span>
    </Button>
  );

  return (
    <div className="space-y-1">
      {isMobile ? (
        <>
          {triggerButton}
          <MobileBottomSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            className="max-h-[88dvh]"
            labelledBy="date-picker-sheet-title"
            zClassName={MOBILE_NESTED_SHEET_Z}
          >
            <div className="flex h-full min-h-0 flex-col">
              <MobileSheetHandle />
              <div className="flex shrink-0 items-center justify-between border-b px-4 pb-3 pt-1">
                <h3
                  id="date-picker-sheet-title"
                  className="text-lg font-semibold"
                >
                  {sheetTitle}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSheetOpen(false)}
                  className="h-10 w-10 rounded-full touch-manipulation"
                  aria-label="Close calendar"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 mobile-sheet-scroll">
                <EnhancedCalendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleSelect}
                  className="datepicker-calendar-popup border-0 shadow-none"
                />
              </div>
            </div>
          </MobileBottomSheet>
        </>
      ) : (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
          <PopoverContent
            className="w-auto max-w-[calc(100vw-2rem)] border-0 bg-transparent p-0 shadow-none datepicker-calendar-popup z-[150]"
            align="start"
            sideOffset={8}
            onOpenAutoFocus={event => event.preventDefault()}
          >
            <EnhancedCalendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              className="datepicker-calendar-popup"
            />
          </PopoverContent>
        </Popover>
      )}
      {error && errorMessage && (
        <p className="text-xs text-destructive mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

export const DatePickerStandard = (props: Omit<DatePickerProps, 'variant'>) => (
  <DatePicker {...props} variant="standard" />
);

export const DatePickerCompact = (props: Omit<DatePickerProps, 'variant'>) => (
  <DatePicker {...props} variant="compact" />
);

export const DatePickerNoIcon = (props: Omit<DatePickerProps, 'variant'>) => (
  <DatePicker {...props} variant="no-icon" />
);
