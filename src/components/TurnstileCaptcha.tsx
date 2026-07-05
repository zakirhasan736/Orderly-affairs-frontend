'use client';

import React, { useEffect, useRef } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

interface TurnstileCaptchaProps {
  onTokenChange: (token: string) => void;
  className?: string;
}

export function TurnstileCaptcha({
  onTokenChange,
  className,
}: TurnstileCaptchaProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  useEffect(() => {
    if (!siteKey && process.env.NODE_ENV === 'development') {
      onTokenChange('dev-bypass');
    }
  }, [onTokenChange, siteKey]);

  if (!siteKey) {
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return (
      <p className="text-sm text-destructive">
        Security verification is unavailable. Contact support.
      </p>
    );
  }

  return (
    <div className={className}>
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        onSuccess={token => onTokenChange(token)}
        onExpire={() => {
          onTokenChange('');
          turnstileRef.current?.reset();
        }}
        onError={() => onTokenChange('')}
        options={{
          theme: 'light',
          size: 'flexible',
        }}
      />
    </div>
  );
}
