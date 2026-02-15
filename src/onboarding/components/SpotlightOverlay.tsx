'use client';

import React, { useEffect, useState } from 'react';

interface Props {
  targetSelector: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export const SpotlightOverlay: React.FC<Props> = ({
  targetSelector,
  children,
  onClose,
}) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Lock scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    const el = document.querySelector(targetSelector);
    if (!el) return;

    el.scrollIntoView({
      behavior: 'smooth',
      block: window.innerWidth < 768 ? 'start' : 'center',
    });

    const update = () => {
      const r = el.getBoundingClientRect();
      setRect(r);
    };

    const timeout = setTimeout(update, 350);

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [targetSelector]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  if (!rect) return null;

  return (
    <div className="fixed inset-0 z-[1000]" onClick={onClose}>
      {/* True luxury mask */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          // backdropFilter: 'blur(6px)',
          // WebkitBackdropFilter: 'blur(6px)',
          background: `radial-gradient(
            circle at ${rect.left + rect.width / 2}px ${
              rect.top + rect.height / 2
            }px,
            transparent ${Math.max(rect.width, rect.height) / 1.6}px,
            rgba(0,0,0,0.75) ${Math.max(rect.width, rect.height) / 1.3}px
          )`,
        }}
      />

      {/* Soft glow ring */}
      <div
        className="absolute pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          top: rect.top - 16,
          left: rect.left - 16,
          width: rect.width + 32,
          height: rect.height + 32,
          borderRadius: '20px',
          boxShadow: '0 0 60px rgba(251,191,36,0.35)',
        }}
      />

      {/* Tour Card */}
      <div
        className="relative h-full z-1001 flex justify-center"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
