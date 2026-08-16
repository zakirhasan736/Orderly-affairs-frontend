'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Eye, EyeOff, Search, X } from 'lucide-react';
import { cn } from '@common/ui/utils';

const TRANSITION = 'transition-[background-color,box-shadow,transform,color,opacity] duration-[160ms] ease-in-out';

export function SidebarNavItem({
  label,
  active = false,
  count,
  statusDot,
  icon,
  className,
  ...props
}: React.ComponentProps<'button'> & {
  label: React.ReactNode;
  active?: boolean;
  count?: number;
  statusDot?: 'attention' | 'complete' | 'missing';
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-3 rounded-full px-3.5 py-2.5 text-left text-[13px] font-semibold',
        TRANSITION,
        active
          ? 'bg-[#2C4B6B] text-white shadow-[0_1px_2px_rgba(33,61,89,0.06)]'
          : 'text-white/85 hover:bg-white/10 hover:text-white',
        className,
      )}
      {...props}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {typeof count === 'number' && count > 0 ? (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#3EB1E5] px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums text-[#16293C]">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
      {statusDot ? (
        <span
          className={cn(
            'h-2 w-2 shrink-0 rounded-full',
            statusDot === 'complete' && 'bg-[#1F9D6B]',
            statusDot === 'attention' && 'bg-[#B4761A]',
            statusDot === 'missing' && 'bg-[#C2442E]',
          )}
        />
      ) : null}
    </button>
  );
}

export function SidebarCollectionHeader({
  title,
  expanded,
  onToggle,
  children,
  className,
}: {
  title: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={cn(
          'flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-[13px] font-semibold text-white/80 hover:bg-white/10 hover:text-white',
          TRANSITION,
        )}
      >
        <ChevronRight
          className={cn(
            'h-4 w-4 shrink-0 text-white/55',
            TRANSITION,
            expanded && 'rotate-90',
          )}
        />
        <span className="min-w-0 flex-1 truncate">{title}</span>
      </button>
      {expanded ? children : null}
    </div>
  );
}

export function ProgressBar({
  value,
  size = 'sidebar',
  className,
}: {
  value: number;
  size?: 'sidebar' | 'card' | 'hero';
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const height = size === 'card' ? 'h-[5px]' : 'h-[6px]';
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-full bg-white/15',
        height,
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full bg-[#3EB1E5]', TRANSITION)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 'topbar',
  surface = 'light',
  className,
  children,
}: {
  value: number;
  size?: 'topbar' | 'hero';
  surface?: 'light' | 'navy';
  className?: string;
  children?: React.ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const px = size === 'hero' ? 112 : 34;
  const strokeWidth = size === 'hero' ? 10 : 4;
  const radius = (px - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const track = surface === 'navy' ? 'rgba(255,255,255,0.18)' : '#E4EAF0';
  const bar = surface === 'navy' ? '#7ACAF9' : '#3EB1E5';
  const label = surface === 'navy' ? 'text-white' : 'text-[#213D59]';

  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: px, height: px }}
    >
      <svg width={px} height={px} className="-rotate-90" aria-hidden>
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          fill="none"
          stroke={track}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          fill="none"
          stroke={bar}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className={cn('absolute inset-0 flex items-center justify-center font-semibold tabular-nums', label)}>
        {children ?? (
          <span className={size === 'hero' ? 'text-[27px] font-bold' : 'text-[10.5px] font-bold'}>
            {Math.round(clamped)}%
          </span>
        )}
      </span>
    </span>
  );
}

export function VaultButton({
  variant = 'primary',
  size = 'default',
  className,
  ...props
}: React.ComponentProps<'button'> & {
  variant?: 'primary' | 'accent' | 'ghost';
  size?: 'default' | 'small';
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold',
        TRANSITION,
        size === 'small'
          ? 'min-h-8 px-3 text-[13px]'
          : 'min-h-11 px-4 text-[15px]',
        variant === 'primary' &&
          'bg-[#213D59] text-white hover:bg-[#2C4B6B]',
        variant === 'accent' &&
          'bg-[#3EB1E5] text-[#16293C] hover:bg-[#7ACAF9]',
        variant === 'ghost' &&
          'bg-transparent text-[#213D59] hover:bg-[#EAF6FD]',
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({
  size = 'default',
  count,
  label,
  className,
  children,
  ...props
}: React.ComponentProps<'button'> & {
  size?: 'default' | 'compact';
  count?: number;
  label: string;
}) {
  const px = size === 'compact' ? 'h-8 w-8' : 'h-[38px] w-[38px]';
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full border border-[#E4EAF0] bg-white text-[#213D59]',
        TRANSITION,
        'hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(33,61,89,0.07)]',
        px,
        className,
      )}
      {...props}
    >
      {children}
      {typeof count === 'number' && count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-[#C2442E] px-1 text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </button>
  );
}

export type GlobalSearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  sectionId?: string;
  subId?: string;
};

export function GlobalSearch({
  results,
  onSelect,
  placeholder = 'Search your Vault',
  className,
}: {
  results: GlobalSearchResult[];
  onSelect: (result: GlobalSearchResult) => void;
  placeholder?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return results.filter(item => !item.subId).slice(0, 8);
    return results
      .filter(
        item =>
          item.title.toLowerCase().includes(q) ||
          (item.subtitle || '').toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [query, results]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  const showResults = open && (focused || query.length > 0);

  const choose = (item: GlobalSearchResult) => {
    onSelect(item);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className={cn('relative min-w-0 w-full', className)}>
      <div
        className={cn(
          'flex h-[42px] items-center gap-2 rounded-full border bg-[#F6F8FA] px-4',
          TRANSITION,
          focused
            ? 'border-[#3EB1E5] bg-white shadow-[0_0_0_3px_rgba(62,177,229,.14)]'
            : 'border-[#E4EAF0]',
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-[#7A8794]" />
        <input
          ref={inputRef}
          value={query}
          onChange={event => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => {
            setFocused(false);
            window.setTimeout(() => setOpen(false), 160);
          }}
          onKeyDown={event => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex(i => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex(i => Math.max(i - 1, 0));
            } else if (event.key === 'Enter') {
              event.preventDefault();
              const hit = filtered[activeIndex];
              if (hit) choose(hit);
            } else if (event.key === 'Escape') {
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-[14px] text-[#213D59] outline-none placeholder:text-[#7A8794]"
          aria-label={placeholder}
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onMouseDown={event => event.preventDefault()}
            onClick={() => setQuery('')}
            className="text-[#7A8794] hover:text-[#213D59]"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <kbd className="hidden rounded-[5px] border border-[#E4EAF0] bg-white px-1.5 py-0.5 text-[11px] font-semibold text-[#7A8794] sm:inline">
            /
          </kbd>
        )}
      </div>
      {showResults ? (
        <ul className="absolute z-50 mt-2 max-h-[340px] w-full overflow-y-auto rounded-[14px] border border-[#E4EAF0] bg-white p-1.5 shadow-[0_18px_48px_rgba(33,61,89,0.16)]">
          {filtered.length === 0 ? (
            <li className="px-3 py-5 text-center text-[13.5px] text-[#7A8794]">
              Nothing in your Vault matches that yet.
            </li>
          ) : (
            <>
              <li className="px-3 pb-1 pt-2 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#7A8794]">
                {filtered.length} result{filtered.length === 1 ? '' : 's'}
              </li>
              {filtered.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-left',
                      index === activeIndex ? 'bg-[#EAF6FD]' : 'hover:bg-[#EAF6FD]',
                    )}
                    onMouseDown={event => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(item)}
                  >
                    <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#213D59]">
                      {item.title}
                    </span>
                    {item.subtitle ? (
                      <span className="shrink-0 text-[12px] text-[#7A8794]">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </>
          )}
        </ul>
      ) : null}
    </div>
  );
}

export function AttentionChip({
  tone,
  children,
  className,
  ...props
}: React.ComponentProps<'button'> & {
  tone: 'overdue' | 'dueSoon';
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium',
        TRANSITION,
        'hover:-translate-y-0.5',
        tone === 'overdue' && 'bg-[#FBEDEA] text-[#C2442E]',
        tone === 'dueSoon' && 'bg-[#FDF4E4] text-[#B4761A]',
        className,
      )}
      {...props}
    >
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
}

export function MaskRevealButton({
  revealed,
  onToggle,
}: {
  revealed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8794] hover:text-[#213D59]"
      aria-label={revealed ? 'Hide value' : 'Show value'}
    >
      {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}
