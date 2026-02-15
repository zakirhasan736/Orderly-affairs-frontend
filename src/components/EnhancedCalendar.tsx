import React, { useState } from 'react';
import { Calendar } from '@common/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@common/ui/select';
import { Button } from '@common/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EnhancedCalendarProps {
  mode?: 'single';
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  className?: string;
}

export function EnhancedCalendar({ mode = 'single', selected, onSelect, className }: EnhancedCalendarProps) {
  const currentDate = selected || new Date();
  const [month, setMonth] = useState(currentDate.getMonth());
  const [year, setYear] = useState(currentDate.getFullYear());

  // Generate year options (from 1900 to current year + 10)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1900 + 11 }, (_, i) => 1900 + i).reverse();
  
  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleMonthChange = (newMonth: string) => {
    const monthIndex = parseInt(newMonth);
    setMonth(monthIndex);
  };

  const handleYearChange = (newYear: string) => {
    const yearValue = parseInt(newYear);
    setYear(yearValue);
  };

  const handlePreviousMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const displayDate = new Date(year, month, 1);

  return (
    <div
      className={`enhanced-calendar-popover datepicker-calendar-popup ${className}`}
    >
      {/* Quick Navigation Header */}
      <div className="enhanced-calendar-header flex items-center justify-between mb-4 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousMonth}
          className="h-8 w-8 p-0 glass-hover"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center justify-between gap-2 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 flex-1">
            <Select value={month.toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((monthName, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={year.toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="h-8 text-sm w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {yearOptions.map(yearOption => (
                  <SelectItem key={yearOption} value={yearOption.toString()}>
                    {yearOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
          className="h-8 w-8 p-0 glass-hover"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Component */}
      <Calendar
        mode={mode}
        selected={selected}
        onSelect={onSelect}
        month={displayDate}
        onMonthChange={newDate => {
          setMonth(newDate.getMonth());
          setYear(newDate.getFullYear());
        }}
        className="w-full"
        classNames={{
          nav_button: 'hidden', // Hide default navigation buttons since we have our own
          caption: 'hidden', // Hide default caption since we have our own
        }}
      />

      {/* Quick Date Shortcuts */}
      <div className="enhanced-calendar-shortcuts flex flex-wrap gap-1 mt-3 pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const today = new Date();
            setMonth(today.getMonth());
            setYear(today.getFullYear());
            onSelect(today);
          }}
          className="h-7 px-2 text-xs glass-hover"
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            setMonth(lastMonth.getMonth());
            setYear(lastMonth.getFullYear());
          }}
          className="h-7 px-2 text-xs glass-hover"
        >
          Last Month
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const lastYear = new Date();
            lastYear.setFullYear(lastYear.getFullYear() - 1);
            setMonth(lastYear.getMonth());
            setYear(lastYear.getFullYear());
          }}
          className="h-7 px-2 text-xs glass-hover"
        >
          Last Year
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelect(undefined)}
          className="h-7 px-2 text-xs text-muted-foreground glass-hover"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}