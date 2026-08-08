'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';

export type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

interface Props {
  targetSelector: string;
  children: ReactNode | ((rect: SpotlightRect) => ReactNode);
  onClose?: () => void;
}

/** Quiet period after the last scroll event before we treat the target as settled. */
const SCROLL_SETTLE_MS = 140;
/** Fallback if the browser never fires scroll (target already in view). */
const ALIGN_FALLBACK_MS = 420;

function toSpotlightRect(box: DOMRect): SpotlightRect {
  return {
    top: box.top,
    left: box.left,
    width: box.width,
    height: box.height,
    right: box.right,
    bottom: box.bottom,
  };
}

export const SpotlightOverlay = ({
  targetSelector,
  children,
  onClose,
}: Props) => {
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  /** Hide hole + tooltip until the target has been scrolled into place. */
  const [aligned, setAligned] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let el: Element | null = null;
    let tries = 0;
    let settleTimer: number | null = null;
    let fallbackTimer: number | null = null;
    let isAligned = false;

    setAligned(false);
    setRect(null);

    const clearSettleTimer = () => {
      if (settleTimer != null) {
        window.clearTimeout(settleTimer);
        settleTimer = null;
      }
    };

    const update = () => {
      if (!el || cancelled) return;
      setRect(toSpotlightRect(el.getBoundingClientRect()));
    };

    const reveal = () => {
      if (cancelled || !el || isAligned) return;
      isAligned = true;
      clearSettleTimer();
      if (fallbackTimer != null) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      update();
      setAligned(true);
    };

    const scheduleSettle = () => {
      if (isAligned) return;
      clearSettleTimer();
      settleTimer = window.setTimeout(reveal, SCROLL_SETTLE_MS);
    };

    const onScrollOrResize = () => {
      if (!el || cancelled) return;
      if (isAligned) {
        update();
        return;
      }
      scheduleSettle();
    };

    const attach = (node: Element) => {
      el = node;

      window.addEventListener('resize', onScrollOrResize);
      window.addEventListener('scroll', onScrollOrResize, true);
      window.addEventListener('scrollend', reveal, true);

      node.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });

      // Already in view (or instant scroll): still wait briefly, then reveal.
      fallbackTimer = window.setTimeout(reveal, ALIGN_FALLBACK_MS);
      scheduleSettle();
    };

    const find = () => {
      if (cancelled) return;
      const candidates = Array.from(
        document.querySelectorAll(targetSelector),
      );
      const node =
        candidates.find(item => {
          const box = item.getBoundingClientRect();
          return box.width > 2 && box.height > 2;
        }) || null;

      if (node) {
        attach(node);
        return;
      }
      setRect(null);
      setAligned(false);
      tries += 1;
      if (tries < 20) {
        window.setTimeout(find, 80);
      }
    };

    find();

    return () => {
      cancelled = true;
      clearSettleTimer();
      if (fallbackTimer != null) window.clearTimeout(fallbackTimer);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('scrollend', reveal, true);
    };
  }, [targetSelector]);

  const content =
    typeof children === 'function'
      ? aligned && rect
        ? children(rect)
        : null
      : children;

  return (
    <div className="fixed inset-0 z-[999]" onClick={onClose}>
      {/* Solid dim while scrolling — no hole/tooltip until the target settles */}
      {!aligned ? (
        <div
          className="absolute inset-0 bg-[rgba(33,61,89,0.55)]"
          aria-hidden
        />
      ) : null}

      {aligned && rect ? (
        <motion.div
          className="pointer-events-none absolute rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            top: rect.top - 12,
            left: rect.left - 12,
            width: rect.width + 24,
            height: rect.height + 24,
            boxShadow: '0 0 0 9999px rgba(33, 61, 89,0.55)',
          }}
        >
          <div className="absolute inset-0 rounded-xl border-2 border-[#2B5A8C] shadow-[0_0_0_4px_rgba(43,90,140,0.2)]" />
          <motion.div
            className="absolute -top-2 -right-2 h-3.5 w-3.5 rounded-full bg-[#2B5A8C]"
            animate={{ scale: [1, 1.35, 1] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
          />
        </motion.div>
      ) : null}

      <div
        className="relative z-[1000] h-full"
        onClick={e => e.stopPropagation()}
      >
        {aligned ? (
          <motion.div
            className="h-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut', delay: 0.04 }}
          >
            {content}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
};
