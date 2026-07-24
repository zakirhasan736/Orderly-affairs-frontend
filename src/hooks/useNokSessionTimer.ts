'use client';

import { useEffect, useRef, useState } from 'react';

/** Live countdown for NOK session; calls onExpire once when it hits 0. */
export function useNokSessionTimer(
  initialSeconds: number,
  onExpire?: () => void,
) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor(initialSeconds || 0)),
  );
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    expiredRef.current = false;
    setRemaining(Math.max(0, Math.floor(initialSeconds || 0)));
  }, [initialSeconds]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining(prev => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [initialSeconds]);

  useEffect(() => {
    if (remaining !== 0 || expiredRef.current) return;
    expiredRef.current = true;
    onExpireRef.current?.();
  }, [remaining]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return { remaining, formatted, isExpired: remaining <= 0 };
}
