'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import {
  CAPTCHA_DISABLED_TOKEN,
  isCaptchaEnabled,
} from '@/utils/captchaConfig';

interface TurnstileCaptchaProps {
  onTokenChange: (token: string) => void;
  /** true only after Cloudflare issues a usable token (or captcha disabled). */
  onReadyChange?: (ready: boolean) => void;
  className?: string;
  /** Bump to force a fresh widget after a single-use token was consumed. */
  resetKey?: string | number;
  /** Prefer compact loading state above the fold before forms unlock. */
  gateMode?: boolean;
}

export function TurnstileCaptcha({
  onTokenChange,
  onReadyChange,
  className,
  resetKey = 0,
  gateMode = false,
}: TurnstileCaptchaProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const [widgetKey, setWidgetKey] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevResetKey = useRef(resetKey);

  const setReady = useCallback(
    (ready: boolean, nextStatus: 'loading' | 'ready' | 'error') => {
      setStatus(nextStatus);
      onReadyChange?.(ready);
    },
    [onReadyChange],
  );

  const remount = useCallback(() => {
    onTokenChange('');
    setReady(false, 'loading');
    setWidgetKey(k => k + 1);
  }, [onTokenChange, setReady]);

  useEffect(() => {
    if (!isCaptchaEnabled) {
      onTokenChange(CAPTCHA_DISABLED_TOKEN);
      setReady(true, 'ready');
      return;
    }
    if (!siteKey && process.env.NODE_ENV === 'development') {
      onTokenChange('dev-bypass');
      setReady(true, 'ready');
    }
  }, [onTokenChange, siteKey, setReady]);

  useEffect(() => {
    if (prevResetKey.current === resetKey) return;
    prevResetKey.current = resetKey;
    remount();
  }, [resetKey, remount]);

  useEffect(() => {
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  if (!isCaptchaEnabled) {
    return null;
  }

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
      {status !== 'ready' && (
        <div
          className={`mb-3 flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 ${
            gateMode ? 'py-10' : 'py-4'
          }`}
        >
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            Preparing security check…
          </p>
          <p className="mt-1 text-xs text-slate-500 text-center max-w-xs">
            Cloudflare must finish before sign-in, signup, or reset can continue.
          </p>
          {status === 'error' && (
            <button
              type="button"
              className="mt-3 text-xs text-slate-700 underline"
              onClick={() => remount()}
            >
              Retry security check
            </button>
          )}
        </div>
      )}

      {/* Keep widget mounted so the challenge can complete; hide until ready optional */}
      <div className={status === 'ready' ? 'block' : 'sr-only'}>
        <Turnstile
          key={`${widgetKey}-${resetKey}`}
          ref={turnstileRef}
          siteKey={siteKey}
          onSuccess={token => {
            onTokenChange(token);
            setReady(true, 'ready');
          }}
          onExpire={() => {
            onTokenChange('');
            setReady(false, 'loading');
            turnstileRef.current?.reset();
          }}
          onError={() => {
            onTokenChange('');
            setReady(false, 'error');
            if (retryTimer.current) clearTimeout(retryTimer.current);
            retryTimer.current = setTimeout(() => remount(), 3000);
          }}
          options={{
            theme: 'light',
            size: 'flexible',
            appearance: 'always',
            retry: 'auto',
            retryInterval: 2000,
            refreshExpired: 'auto',
            execution: 'render',
          }}
        />
      </div>

      {status === 'ready' && (
        <p className="mb-2 text-center text-xs text-emerald-700">
          Security check ready
        </p>
      )}
    </div>
  );
}
