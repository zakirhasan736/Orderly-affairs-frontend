'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@common/ui/utils';
import { VaultButton } from './chrome';
import { EMPTY_FILTERED, EMPTY_NEVER_STARTED } from './copy';

const REST =
  'rounded-[16px] border border-[#E4EAF0] bg-white shadow-[0_1px_2px_rgba(33,61,89,0.06)]';
const HOVER =
  'transition-[box-shadow,transform] duration-[160ms] ease-in-out hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(33,61,89,0.07)]';

const STAT_ICON: Record<'blue' | 'amber' | 'green' | 'navy', string> = {
  blue: 'bg-[#EAF6FD] text-[#2E7FAD]',
  amber: 'bg-[#FDF4E4] text-[#B4761A]',
  green: 'bg-[#E8F6F0] text-[#1F9D6B]',
  navy: 'bg-[#E9EEF4] text-[#213D59]',
};

export function StatCard({
  tone = 'blue',
  icon,
  value,
  label,
  detail,
  action,
  onClick,
  className,
}: {
  tone?: 'blue' | 'amber' | 'green' | 'navy';
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  detail?: string;
  action?: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        REST,
        HOVER,
        'flex min-h-[118px] flex-col p-3.5 text-left',
        className,
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-[12px]',
          STAT_ICON[tone],
        )}
      >
        {icon}
      </span>
      <span className="mt-3 text-[27px] font-bold leading-none tracking-[-0.028em] text-[#213D59] tabular-nums">
        {value}
      </span>
      <span className="mt-1 truncate text-[15.5px] font-bold text-[#213D59]">
        {label}
      </span>
      {detail ? (
        <span className="mt-0.5 line-clamp-1 text-[13px] text-[#7A8794]">
          {detail}
        </span>
      ) : null}
      {action ? (
        <span className="mt-auto pt-2 text-[13px] font-semibold text-[#2E7FAD]">
          {action}
        </span>
      ) : null}
    </button>
  );
}

export function CategoryTile({
  title,
  subtitle,
  icon,
  hasNew = false,
  selected = false,
  className,
  ...props
}: React.ComponentProps<'button'> & {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  hasNew?: boolean;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex min-h-[7rem] flex-col justify-between rounded-[12px] border px-3.5 py-3.5 text-left',
        HOVER,
        selected
          ? 'border-[#213D59] bg-[#213D59] text-white'
          : hasNew
            ? 'border-[#B4761A]/40 bg-[#FDF4E4] text-[#213D59]'
            : 'border-[#E4EAF0] bg-[#F6F8FA] text-[#213D59] hover:bg-white',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        {icon}
        {hasNew ? (
          <span
            className={cn(
              'rounded-full px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em]',
              selected ? 'bg-[#FDF4E4] text-[#B4761A]' : 'bg-[#B4761A] text-white',
            )}
          >
            New data
          </span>
        ) : null}
      </div>
      <div className="mt-3">
        <span className="block truncate text-[15.5px] font-bold">{title}</span>
        {subtitle ? (
          <span
            className={cn(
              'mt-1 block text-[13px]',
              selected ? 'text-white/75' : 'text-[#7A8794]',
            )}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
    </button>
  );
}

export function SectionTile({
  title,
  status,
  className,
  ...props
}: React.ComponentProps<'button'> & {
  title: string;
  status: 'notStarted' | 'inProgress' | 'complete';
}) {
  const meta =
    status === 'complete'
      ? { label: 'Complete', ring: 'border-[#1F9D6B] bg-[#E8F6F0]', dot: 'bg-[#1F9D6B]' }
      : status === 'inProgress'
        ? { label: 'In progress', ring: 'border-[#B4761A]/30 bg-[#FDF4E4]', dot: 'bg-[#B4761A]' }
        : { label: 'Not started', ring: 'border-[#E4EAF0] bg-white', dot: 'bg-[#6A7481]' };

  return (
    <button
      type="button"
      className={cn(
        REST,
        HOVER,
        'flex w-full items-center gap-3 px-3.5 py-3.5 text-left',
        meta.ring,
        className,
      )}
      {...props}
    >
      <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', meta.dot)} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15.5px] font-bold text-[#213D59]">
          {title}
        </span>
        <span className="text-[13px] text-[#7A8794]">{meta.label}</span>
      </span>
    </button>
  );
}

export function ItemCard({
  title,
  subtitle,
  status,
  className,
  ...props
}: React.ComponentProps<'button'> & {
  title: string;
  subtitle?: string;
  status: 'complete' | 'attention' | 'missing';
}) {
  const dot =
    status === 'complete'
      ? 'bg-[#1F9D6B]'
      : status === 'attention'
        ? 'bg-[#B4761A]'
        : 'bg-[#C2442E]';

  return (
    <button
      type="button"
      className={cn(REST, HOVER, 'flex w-full items-start gap-3 p-4 text-left', className)}
      {...props}
    >
      <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', dot)} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15.5px] font-bold text-[#213D59]">
          {title}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block text-[13px] text-[#7A8794]">{subtitle}</span>
        ) : null}
      </span>
    </button>
  );
}

export function AddCard({
  label = 'Add another',
  className,
  ...props
}: React.ComponentProps<'button'> & { label?: string }) {
  return (
    <button
      type="button"
      className={cn(
        'flex min-h-[120px] w-full flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-[#213D59]/25 bg-transparent text-[#2E7FAD]',
        HOVER,
        className,
      )}
      {...props}
    >
      <Plus className="h-5 w-5" />
      <span className="text-[15px] font-semibold">{label}</span>
    </button>
  );
}

export function EmptyState({
  variant = 'neverStarted',
  title,
  description,
  action,
  onAction,
  className,
}: {
  variant?: 'neverStarted' | 'filtered';
  title?: string;
  description?: string;
  action?: string;
  onAction?: () => void;
  className?: string;
}) {
  const fallback = variant === 'filtered' ? EMPTY_FILTERED : EMPTY_NEVER_STARTED;
  return (
    <div
      className={cn(
        'rounded-[22px] border border-dashed border-[#E4EAF0] bg-[#F6F8FA] px-6 py-10 text-center',
        className,
      )}
    >
      <p className="text-[19px] font-bold tracking-[-0.02em] text-[#213D59]">
        {title || fallback.title}
      </p>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-[1.55] text-[#7A8794]">
        {description || fallback.description}
      </p>
      {action && onAction ? (
        <VaultButton variant="primary" className="mt-5" onClick={onAction}>
          {action}
        </VaultButton>
      ) : null}
    </div>
  );
}
