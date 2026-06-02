"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      navLayout="around"
      className={cn('rounded-2xl bg-background p-4', className)}
      classNames={{
        months: 'flex w-full flex-col gap-4 sm:flex-row',
        month:
          'grid w-[300px] grid-cols-[2.25rem_1fr_2.25rem] items-center gap-2',
        month_caption:
          'col-start-2 flex h-11 items-center justify-center rounded-2xl border bg-muted/40 px-4',
        caption_label: 'text-sm font-semibold text-foreground',
        nav: 'contents',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'col-start-1 size-9 rounded-2xl border-border/70 bg-background/90 p-0 shadow-sm transition hover:bg-muted/60 disabled:opacity-40 aria-disabled:opacity-40',
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'col-start-3 size-9 rounded-2xl border-border/70 bg-background/90 p-0 shadow-sm transition hover:bg-muted/60 disabled:opacity-40 aria-disabled:opacity-40',
        ),
        month_grid:
          'col-span-3 w-full table-fixed border-separate border-spacing-y-1',
        weekdays: '',
        weekday:
          'h-9 w-10 text-center align-middle text-[0.72rem] font-semibold uppercase text-muted-foreground',
        weeks: '',
        week: '',
        day: cn(
          'h-10 w-10 p-0 text-center align-middle text-sm focus-within:relative focus-within:z-20',
          props.mode === 'range'
            ? 'first:rounded-l-xl last:rounded-r-xl'
            : 'rounded-xl',
        ),
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'mx-auto flex size-9 items-center justify-center rounded-xl p-0 text-sm font-medium transition hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 aria-selected:opacity-100',
        ),
        selected:
          'bg-primary text-primary-foreground shadow-lg shadow-primary/20',
        today: 'border border-primary/30 bg-primary/5 text-primary',
        outside: 'text-muted-foreground/45',
        disabled: 'text-muted-foreground opacity-50',
        range_start: 'rounded-l-xl bg-primary text-primary-foreground',
        range_end: 'rounded-r-xl bg-primary text-primary-foreground',
        range_middle: 'bg-accent text-accent-foreground',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, ...props }) =>
          orientation === 'left' ? (
            <ChevronLeft className={cn('size-4', className)} {...props} />
          ) : (
            <ChevronRight className={cn('size-4', className)} {...props} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
