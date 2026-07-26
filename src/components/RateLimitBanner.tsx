'use client';

import { InlineNotice } from '@/components/common/ui/inline-notice';
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
    <InlineNotice
      variant="warning"
      className={`mb-4 ${className}`.trim()}
      title="Please wait before trying again"
      description={
        <>
          Too many requests. Available in{' '}
          <span className="inline-block min-w-[3ch] font-semibold tabular-nums">
            {formatRetryCountdown(seconds)}
          </span>
          .
        </>
      }
    />
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
