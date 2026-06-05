import React, { useMemo, useState } from 'react';
import { Button } from '@common/ui/button';
import { Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@common/ui/popover';
import { EnhancedCalendar } from './EnhancedCalendar';
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
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'MM / DD / YYYY',
  disabled = false,
  className,
  variant = 'standard',
  error = false,
  errorMessage,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedDate = useMemo(() => {
    if (!value) return undefined;
    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      setOpen(false);
      return;
    }

    const nextValue = date.toISOString();
    const currentValue =
      value instanceof Date ? value.toISOString() : String(value || '');

    if (currentValue.slice(0, 10) === nextValue.slice(0, 10)) {
      setOpen(false);
      return;
    }

    onChange(nextValue);
    setOpen(false);
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  // Base button classes following the enhanced visibility design system
  const baseClasses = cn(
    // Base styling
    'w-full justify-start text-left font-normal enhanced-field-frame',
    // Enhanced visibility background
    'bg-white dark:bg-[rgba(40,40,40,0.95)]',
    // Enhanced border styling - 2px solid border for better visibility
    'border-2 border-[#E0E0E0] dark:border-[#404040]',
    // Corner radius matching design system (same as DOB field)
    'rounded-[10px]', // calc(var(--corner-radius-button) - 2px)
    // Height and padding to match design system (same as DOB field)
    'h-10 px-3',
    // Typography (same font family, size, weight as DOB field)
    'text-sm font-normal text-[#213D59] dark:text-white',
    // Enhanced shadow for better depth perception
    'shadow-[0_2px_4px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.05)]',
    // Transition effects
    'transition-all duration-200 ease-in-out',
    // Enhanced hover effects
    'hover:bg-white hover:border-[#B0B0B0] hover:shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(0,0,0,0.03)]',
    'dark:hover:bg-[rgba(50,50,50,1)] dark:hover:border-[#606060] dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.03)]',
    // Enhanced focus styles
    'focus:border-[var(--accent-blue)] focus:shadow-[0_0_0_3px_rgba(0,122,255,0.15),0_2px_8px_rgba(0,0,0,0.1)] focus:bg-white focus:outline-none',
    'dark:focus:border-[var(--accent-blue)] dark:focus:shadow-[0_0_0_3px_rgba(0,122,255,0.25),0_2px_8px_rgba(0,0,0,0.3)] dark:focus:bg-[rgba(50,50,50,1)]',
    // Error states with enhanced visibility
    error && 'border-destructive focus:border-destructive focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]',
    // Disabled state
    disabled && 'opacity-50 cursor-not-allowed hover:bg-white dark:hover:bg-[rgba(40,40,40,0.95)]',
    className
  );

  // Icon classes based on variant - Same calendar icon as DOB field
  const iconClasses = cn(
    'h-4 w-4 calendar-icon',
    // Icon color: same as DOB field (brand color)
    'text-[#213D59] dark:text-accent-blue',
    variant !== 'no-icon' && 'mr-2'
  );

  // Text classes for selected date vs placeholder
  const textClasses = cn(
    // Selected date: #000000, Placeholder: #A6A6A6
    selectedDate 
      ? 'text-[#000000] dark:text-white selected-date' 
      : 'text-[#A6A6A6] dark:text-muted-foreground placeholder-text'
  );

  // Compact variant adjustments
  const compactAdjustments = variant === 'compact' ? {
    height: 'h-8',
    padding: 'px-2',
    text: 'text-xs'
  } : {};

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              baseClasses,
              variant === 'compact' && compactAdjustments.height,
              variant === 'compact' && compactAdjustments.padding,
              variant === 'compact' && compactAdjustments.text
            )}
          >
            {variant !== 'no-icon' && (
              <Calendar className={iconClasses} />
            )}
            <span className={textClasses}>
              {selectedDate ? formatDate(selectedDate) : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto max-w-[calc(100vw-2rem)] p-0 border-0 shadow-none bg-transparent datepicker-calendar-popup z-[120]" 
          align="start"
          sideOffset={8}
        >
          <EnhancedCalendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            className="datepicker-calendar-popup"
          />
        </PopoverContent>
      </Popover>
      {error && errorMessage && (
        <p className="text-xs text-destructive mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

// Named variants for easy import
export const DatePickerStandard = (props: Omit<DatePickerProps, 'variant'>) => (
  <DatePicker {...props} variant="standard" />
);

export const DatePickerCompact = (props: Omit<DatePickerProps, 'variant'>) => (
  <DatePicker {...props} variant="compact" />
);

export const DatePickerNoIcon = (props: Omit<DatePickerProps, 'variant'>) => (
  <DatePicker {...props} variant="no-icon" />
);