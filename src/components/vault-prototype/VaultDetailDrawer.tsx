'use client';

import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@common/ui/utils';
import {
  MobileSheetHandle,
  lockBodyForSheet,
  unlockBodyForSheet,
} from '@/components/MobileBottomSheet';

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  hideHeader?: boolean;
  padded?: boolean;
  /** Wider desktop panel for multi-field edit forms. */
  wide?: boolean;
};

export function VaultDetailDrawer({
  open,
  title,
  subtitle,
  icon,
  onClose,
  footer,
  children,
  hideHeader = false,
  padded = true,
  wide = false,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    lockBodyForSheet();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      unlockBodyForSheet();
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close detail"
        onClick={onClose}
        className={cn(
          'mobile-sheet-overlay fixed inset-0 z-[80] transition-opacity duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        role="dialog"
        aria-modal={open}
        aria-hidden={!open}
        aria-labelledby={hideHeader ? undefined : titleId}
        className={cn(
          'fixed z-[90] flex flex-col bg-white shadow-[0_18px_48px_rgba(33,61,89,.16)] transition-transform duration-[280ms] ease-[cubic-bezier(.32,.72,0,1)]',
          'inset-x-0 bottom-0 top-auto h-[min(92dvh,100svh)] max-h-[min(92dvh,100svh)] rounded-t-[22px]',
          'md:inset-y-0 md:left-auto md:right-0 md:top-0 md:h-[100dvh] md:max-h-none md:rounded-none',
          wide
            ? 'md:w-[min(720px,92vw)] lg:w-[min(780px,52vw)] md:max-w-[780px]'
            : 'md:w-[min(480px,90vw)] lg:w-[560px] md:max-w-[560px]',
          open
            ? 'translate-y-0 md:translate-x-0 md:translate-y-0'
            : 'pointer-events-none translate-y-full md:translate-x-full md:translate-y-0',
        )}
      >
        {!hideHeader ? (
          <div className="shrink-0 border-b border-[#E4EAF0]">
            <div className="md:hidden">
              <MobileSheetHandle />
            </div>
            <div className="flex items-start gap-3 px-4 pb-3 pt-1 md:gap-3.5 md:px-6 md:py-[22px]">
              {icon ? (
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[#EAF6FD] text-[#213D59]">
                  {icon}
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <h3
                  id={titleId}
                  className="text-[17px] font-bold leading-snug tracking-[-0.02em] text-[#213D59] md:text-[18px]"
                >
                  {title}
                </h3>
                {subtitle ? (
                  <p className="mt-0.5 text-[13px] leading-snug text-[#7A8794]">
                    {subtitle}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#E4EAF0] text-[#6A7481] hover:text-[#213D59] touch-manipulation"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
        <div
          className={cn(
            'mobile-sheet-scroll flex min-h-0 flex-1 flex-col',
            padded
              ? 'overflow-y-auto overscroll-contain px-4 py-3 md:px-5 md:py-4'
              : 'overflow-hidden',
          )}
        >
          {children}
        </div>
        {footer ? (
          <div
            className={cn(
              'mobile-sheet-footer flex shrink-0 flex-col-reverse gap-2 border-t border-[#E4EAF0] bg-white px-4 py-3',
              'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
              'sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5 sm:px-6',
              '[&>button]:min-h-12 [&>button]:w-full sm:[&>button]:min-h-10 sm:[&>button]:w-auto',
            )}
          >
            {footer}
          </div>
        ) : null}
      </aside>
    </>,
    document.body,
  );
}
