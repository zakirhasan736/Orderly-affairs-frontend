'use client';

import { AlertCircle } from 'lucide-react';
import { formatRetryCountdown } from '@/utils/authRateLimit';

type RateLimitBannerProps = {
  seconds: number;
  className?: string;
};

/**
 * Inline wait banner — prefer this over stacking toasts for 429s.
 */
export function RateLimitBanner({ seconds, className = '' }: RateLimitBannerProps) {
  if (seconds <= 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 ${className}`}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium">Please wait before trying again</p>
        <p className="mt-0.5 text-amber-800/90">
          Too many requests. Available in{' '}
          <span className="inline-block min-w-[3ch] font-semibold tabular-nums">
            {formatRetryCountdown(seconds)}
          </span>
          .
        </p>
      </div>
    </div>
  );
}

export function rateLimitedButtonLabel(
  seconds: number,
  idleLabel: string,
  busyLabel?: string,
  busy?: boolean,
): string {
  if (busy && busyLabel) return busyLabel;
  if (seconds > 0) return `Wait ${formatRetryCountdown(seconds)}`;
  return idleLabel;
}
