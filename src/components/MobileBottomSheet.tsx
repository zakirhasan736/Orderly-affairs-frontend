'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@common/ui/utils';

export const MOBILE_SHEET_SPRING = {
  type: 'spring' as const,
  damping: 34,
  stiffness: 380,
  mass: 0.85,
};

/**
 * Above dashboard mobile chrome (header/nav z-55, more menu z-80).
 * Sheets are portaled to document.body so parent transforms cannot trap stacking.
 */
export const MOBILE_SHEET_Z = 'z-[100]';

/** Extra room so last fields clear the sticky footer + home indicator */
export const MOBILE_SHEET_SCROLL_PADDING =
  'pb-[max(6.5rem,calc(5rem+env(safe-area-inset-bottom)))]';

/** Opaque panel/footer classes — safe on Safari/WebKit with transform animations */
export const MOBILE_SHEET_PANEL_CLASS = 'mobile-sheet-panel';
export const MOBILE_SHEET_OVERLAY_CLASS = 'mobile-sheet-overlay';
export const MOBILE_SHEET_FOOTER_CLASS = 'mobile-sheet-footer';

const BODY_SHEET_OPEN_CLASS = 'mobile-sheet-open';

export function useIsMobile(breakpoint = 768) {
  const query = `(max-width: ${breakpoint - 1}px)`;

  return useSyncExternalStore(
    onStoreChange => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onStoreChange);
      return () => mq.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function MobileSheetHandle() {
  return (
    <div className="flex justify-center pt-3 pb-1" aria-hidden>
      <div className="h-1.5 w-12 rounded-full bg-muted-foreground/25" />
    </div>
  );
}

export function MobileBottomSheet({
  open,
  onClose,
  children,
  className,
  labelledBy,
  zClassName = MOBILE_SHEET_Z,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
  zClassName?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add(BODY_SHEET_OPEN_CLASS);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove(BODY_SHEET_OPEN_CLASS);
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={cn('fixed inset-0 md:hidden', zClassName)}>
          <motion.button
            type="button"
            aria-label="Close dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className={cn('absolute inset-0', MOBILE_SHEET_OVERLAY_CLASS)}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={MOBILE_SHEET_SPRING}
            className={cn(
              'absolute inset-x-0 bottom-0 flex max-h-[min(96dvh,100svh)] flex-col overflow-hidden rounded-t-[1.75rem] shadow-2xl',
              'pb-[env(safe-area-inset-bottom)]',
              className,
            )}
          >
            <div
              className={cn(
                'pointer-events-none absolute inset-0 rounded-t-[1.75rem]',
                MOBILE_SHEET_PANEL_CLASS,
              )}
              aria-hidden
            />
            <div className="relative flex min-h-0 flex-1 flex-col">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
