import React, { useEffect, useMemo, useState } from 'react';
import { Calendar } from '@common/ui/calendar';
import { Button } from '@common/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@common/ui/utils';

interface EnhancedCalendarProps {
  mode?: 'single';
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  className?: string;
}

function toDateKey(date?: Date) {
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

const nativeSelectClass = cn(
  'h-10 min-h-10 min-w-0 flex-1 rounded-md border border-input bg-white px-2 text-sm text-foreground',
  'touch-manipulation cursor-pointer appearance-auto',
  'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none',
  'dark:bg-input/30',
);

export function EnhancedCalendar({
  mode = 'single',
  selected,
  onSelect,
  className,
}: EnhancedCalendarProps) {
  const initialDate = selected || new Date();
  const [month, setMonth] = useState(initialDate.getMonth());
  const [year, setYear] = useState(initialDate.getFullYear());

  const selectedKey = useMemo(() => toDateKey(selected), [selected]);

  useEffect(() => {
    if (!selected) return;
    setMonth(selected.getMonth());
    setYear(selected.getFullYear());
  }, [selectedKey, selected]);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: currentYear - 1900 + 11 },
    (_, i) => 1900 + i,
  ).reverse();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const handleMonthChange = (newMonth: string) => {
    setMonth(parseInt(newMonth, 10));
  };

  const handleYearChange = (newYear: string) => {
    setYear(parseInt(newYear, 10));
  };

  const handlePreviousMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(currentYear => currentYear - 1);
    } else {
      setMonth(currentMonth => currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(currentYear => currentYear + 1);
    } else {
      setMonth(currentMonth => currentMonth + 1);
    }
  };

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onSelect(undefined);
      return;
    }

    if (selectedKey === toDateKey(date)) return;

    onSelect(date);
  };

  const displayDate = new Date(year, month, 1);

  return (
    <div
      className={cn(
        'enhanced-calendar-popover datepicker-calendar-popup rounded-2xl border bg-background p-4 shadow-lg',
        className,
      )}
    >
      <div className="enhanced-calendar-header mb-4 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePreviousMonth}
          className="h-10 w-10 shrink-0 p-0 touch-manipulation"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <select
            aria-label="Select month"
            value={month.toString()}
            onChange={event => handleMonthChange(event.target.value)}
            className={nativeSelectClass}
          >
            {monthNames.map((monthName, index) => (
              <option key={monthName} value={index.toString()}>
                {monthName}
              </option>
            ))}
          </select>

          <select
            aria-label="Select year"
            value={year.toString()}
            onChange={event => handleYearChange(event.target.value)}
            className={cn(nativeSelectClass, 'w-24 shrink-0')}
          >
            {yearOptions.map(yearOption => (
              <option key={yearOption} value={yearOption.toString()}>
                {yearOption}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
          className="h-10 w-10 shrink-0 p-0 touch-manipulation"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Calendar
        mode={mode}
        selected={selected}
        onSelect={handleSelect}
        month={displayDate}
        onMonthChange={newDate => {
          setMonth(newDate.getMonth());
          setYear(newDate.getFullYear());
        }}
        className="w-full"
        classNames={{
          nav_button: 'hidden',
          caption: 'hidden',
          day_button:
            'mx-auto flex min-h-11 min-w-11 items-center justify-center rounded-xl p-0 text-sm font-medium touch-manipulation',
        }}
      />

      <div className="enhanced-calendar-shortcuts mt-3 flex flex-wrap gap-1 border-t pt-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const today = new Date();
            setMonth(today.getMonth());
            setYear(today.getFullYear());
            handleSelect(today);
          }}
          className="h-10 min-h-10 px-3 text-xs touch-manipulation"
        >
          Today
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onSelect(undefined)}
          className="h-10 min-h-10 px-3 text-xs text-muted-foreground touch-manipulation"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
