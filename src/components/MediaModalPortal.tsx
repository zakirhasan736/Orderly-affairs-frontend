'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface MediaModalPortalProps {
  children: React.ReactNode;
  onBackdropClick?: () => void;
}

export function MediaModalPortal({
  children,
  onBackdropClick,
}: MediaModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200]">
      <button
        type="button"
        aria-label="Close media dialog backdrop"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onBackdropClick}
      />
      <div className="relative z-[201] flex min-h-[100dvh] items-start justify-center overflow-y-auto px-3 py-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:px-4 sm:py-6">
        <div className="w-full max-w-4xl">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
