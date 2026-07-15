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
  /** Show a large gate panel until ready (login / reset). */
  gateMode?: boolean;
}

/**
 * Cloudflare Turnstile must finish BEFORE auth UI is usable.
 * Keep the widget VISIBLE while loading — hidden/sr-only widgets often fail.
 */
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
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    isCaptchaEnabled ? 'loading' : 'ready',
  );
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevResetKey = useRef(resetKey);
  const readyRef = useRef(false);

  const setReady = useCallback(
    (ready: boolean, nextStatus: 'loading' | 'ready' | 'error') => {
      readyRef.current = ready;
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
            gateMode ? 'min-h-[140px] py-8' : 'py-4'
          }`}
        >
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            Verifying you are human…
          </p>
          <p className="mt-1 max-w-xs text-center text-xs text-slate-500">
            Cloudflare security check must finish before you can continue.
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

      {/* Always visible — hidden widgets break Cloudflare challenges */}
      <div className={status === 'ready' ? 'block' : 'opacity-90'}>
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
            retryTimer.current = setTimeout(() => remount(), 2500);
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
        <p className="mb-2 text-center text-xs font-medium text-emerald-700">
          Security check complete — you can continue
        </p>
      )}
    </div>
  );
}
