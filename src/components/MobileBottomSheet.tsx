'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@common/ui/utils';

export const MOBILE_SHEET_SPRING = {
  type: 'spring' as const,
  damping: 34,
  stiffness: 380,
  mass: 0.85,
};

/** Above dashboard mobile bottom nav (z-50 / z-[55]) */
export const MOBILE_SHEET_Z = 'z-[70]';

export const MOBILE_SHEET_SCROLL_PADDING =
  'pb-[max(2rem,env(safe-area-inset-bottom))]';

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
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className={cn('fixed inset-0 lg:hidden', zClassName)}>
          <motion.button
            type="button"
            aria-label="Close dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
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
              'absolute inset-x-0 bottom-0 flex max-h-[96dvh] flex-col overflow-hidden rounded-t-[1.75rem] bg-background shadow-2xl',
              'pb-[env(safe-area-inset-bottom)]',
              className,
            )}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
