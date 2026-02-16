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
    const el = document.querySelector(targetSelector);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const update = () => setRect(el.getBoundingClientRect());

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [targetSelector]);

  if (!rect) return null;

  return (
    <div className="fixed inset-0 z-[999]" onClick={onClose}>
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/60 transition-opacity duration-300" />

      {/* Highlight box */}
      <motion.div
        className="absolute rounded-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          top: rect.top - 12,
          left: rect.left - 12,
          width: rect.width + 24,
          height: rect.height + 24,
        }}
      >
        {/* Glow Border */}
        <div
          className="absolute inset-0 rounded-xl 
    border-2 border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.6)]"
        />

        {/* Floating Pulse Dot */}
        <motion.div
          className="absolute -top-2 -right-2 w-4 h-4 bg-amber-400 rounded-full"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        />
      </motion.div>

      <div
        className="relative z-[1000] h-full"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
