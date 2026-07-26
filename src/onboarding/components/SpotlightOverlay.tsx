'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Props {
  targetSelector: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export const SpotlightOverlay = ({
  targetSelector,
  children,
  onClose,
}: Props) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    let cancelled = false;
    let el: Element | null = null;
    let tries = 0;

    const update = () => {
      if (!el || cancelled) return;
      setRect(el.getBoundingClientRect());
    };

    const attach = (node: Element) => {
      el = node;
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      update();
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);
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
      tries += 1;
      if (tries < 20) {
        window.setTimeout(find, 80);
      }
    };

    find();

    return () => {
      cancelled = true;
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [targetSelector]);

  return (
    <div className="fixed inset-0 z-[999]" onClick={onClose}>
      <div className="absolute inset-0 bg-[rgba(33, 61, 89,0.55)] transition-opacity duration-300" />

      {rect ? (
        <motion.div
          className="pointer-events-none absolute rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            top: rect.top - 12,
            left: rect.left - 12,
            width: rect.width + 24,
            height: rect.height + 24,
            boxShadow: '0 0 0 9999px rgba(33, 61, 89,0.55)',
          }}
        >
          <div className="absolute inset-0 rounded-xl border-2 border-[#2B5A8C] shadow-[0_0_0_4px_rgba(43, 90, 140,0.2)]" />
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
        {children}
      </div>
    </div>
  );
};
