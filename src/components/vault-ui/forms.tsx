'use client';

import React, { useState } from 'react';
import { cn } from '@common/ui/utils';
import { MaskRevealButton, ProgressBar } from './chrome';

export function FormField({
  id,
  label,
  error,
  masked = false,
  hint,
  className,
  ...props
}: React.ComponentProps<'input'> & {
  label: string;
  error?: string;
  masked?: boolean;
  hint?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const inputId = id || props.name || label.replace(/\s+/g, '-').toLowerCase();
  const type = masked && !revealed ? 'password' : props.type || 'text';

  return (
    <label className={cn('block', className)} htmlFor={inputId}>
      <span className="mb-1.5 block text-[13px] font-medium text-[#213D59]">
        {label}
      </span>
      <span className="relative block">
        <input
          id={inputId}
          {...props}
          type={type}
          aria-invalid={error ? true : undefined}
          className={cn(
            'h-11 w-full rounded-[12px] border bg-white px-3 text-[15px] text-[#213D59] outline-none',
            'transition-[border-color,box-shadow] duration-[160ms] ease-in-out',
            'placeholder:text-[#7A8794]',
            masked && 'pr-11',
            'tabular-nums',
            error
              ? 'border-[#C2442E] focus:border-[#C2442E] focus:shadow-[0_0_0_3px_rgba(194,68,46,0.15)]'
              : 'border-[#E4EAF0] focus:border-[#2E7FAD] focus:shadow-[0_0_0_3px_rgba(46,127,173,0.18)]',
          )}
        />
        {masked ? (
          <MaskRevealButton
            revealed={revealed}
            onToggle={() => setRevealed(value => !value)}
          />
        ) : null}
      </span>
      {error ? (
        <span className="mt-1 block text-[13px] text-[#C2442E]">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[13px] text-[#7A8794]">{hint}</span>
      ) : null}
    </label>
  );
}

export function UploadZone({
  state = 'resting',
  progress = 0,
  onBrowse,
  className,
  children,
}: {
  state?: 'resting' | 'dragOver' | 'processing' | 'ready';
  progress?: number;
  onBrowse?: () => void;
  className?: string;
  children?: React.ReactNode;
}) {
  const copy =
    state === 'dragOver'
      ? 'Drop it here'
      : state === 'processing'
        ? 'Reading your document'
        : state === 'ready'
          ? 'Ready for review'
          : 'Drop a file here, or browse to add one';

  return (
    <button
      type="button"
      onClick={onBrowse}
      disabled={state === 'processing'}
      className={cn(
        'w-full rounded-[16px] border border-dashed px-6 py-8 text-center',
        'transition-[background-color,border-color] duration-[160ms] ease-in-out',
        state === 'dragOver' && 'border-[#3EB1E5] bg-[#EAF6FD]',
        state === 'processing' && 'border-[#619FCE] bg-[#EAF6FD]',
        state === 'ready' && 'border-[#1F9D6B] bg-[#E8F6F0]',
        state === 'resting' && 'border-[#E4EAF0] bg-[#EAF6FD]/60 hover:border-[#619FCE]',
        className,
      )}
    >
      <p className="text-[15.5px] font-bold text-[#213D59]">{copy}</p>
      {state === 'processing' ? (
        <ProgressBar value={progress} size="card" className="mx-auto mt-4 max-w-xs bg-[#213D59]/10" />
      ) : (
        <p className="mt-1 text-[13px] text-[#7A8794]">
          {children || 'Keep scans, photos, or PDFs with the matching Vault item.'}
        </p>
      )}
    </button>
  );
}

export function PermissionToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  className,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-[12px] border border-[#E4EAF0] bg-white px-4 py-3',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-[15.5px] font-bold text-[#213D59]">{label}</p>
        {description ? (
          <p className="mt-0.5 text-[13px] text-[#7A8794]">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-[160ms] ease-in-out',
          checked ? 'bg-[#213D59]' : 'bg-[#E4EAF0]',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-[0_1px_2px_rgba(33,61,89,0.06)]',
            'transition-transform duration-[160ms] ease-in-out',
            checked ? 'left-5' : 'left-0.5',
          )}
        />
      </button>
    </div>
  );
}

export function DetailDrawer({
  open,
  onClose,
  title,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-[#16293C]/40"
        onClick={onClose}
      />
      <aside
        className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-white shadow-[0_18px_48px_rgba(33,61,89,0.16)]"
        style={{ animation: 'oa-drawer-in 0.28s cubic-bezier(0.32, 0.72, 0, 1)' }}
      >
        <header className="shrink-0 border-b border-[#E4EAF0] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[19px] font-bold tracking-[-0.02em] text-[#213D59]">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-3 py-1 text-[13px] font-semibold text-[#2E7FAD]"
            >
              Close
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <footer className="sticky bottom-0 shrink-0 border-t border-[#E4EAF0] bg-white px-5 py-4">
            {footer}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
