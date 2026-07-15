/**
 * Parse auth API errors for rate-limit countdown UI.
 */

export type ParsedAuthError = {
  status?: number;
  message: string;
  retryAfterSeconds: number | null;
};

function readDataMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  if (typeof record.detail === 'string') return record.detail;
  if (typeof record.message === 'string') return record.message;
  return null;
}

function parseSecondsFromText(text: string): number | null {
  const secondsMatch = text.match(/(\d+)\s*seconds?/i);
  if (secondsMatch) return Math.max(parseInt(secondsMatch[1], 10), 1);

  const minutesMatch = text.match(/(\d+)\s*minutes?/i);
  if (minutesMatch) return Math.max(parseInt(minutesMatch[1], 10) * 60, 1);

  return null;
}

export function formatRetryCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r}s`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function parseAuthApiError(
  err: unknown,
  fallback: string,
): ParsedAuthError {
  if (!err || typeof err !== 'object') {
    return { message: fallback, retryAfterSeconds: null };
  }

  const e = err as {
    status?: number | string;
    data?: unknown;
    error?: unknown;
  };

  // RTK unwrap errors often nest under `error` or are the FetchBaseQueryError itself
  const candidate =
    e.data !== undefined || typeof e.status === 'number'
      ? e
      : e.error && typeof e.error === 'object'
        ? (e.error as { status?: number | string; data?: unknown })
        : e;

  const status =
    typeof candidate.status === 'number' ? candidate.status : undefined;
  const rawMessage = readDataMessage(candidate.data) || fallback;

  let retryAfterSeconds: number | null = null;
  if (status === 429) {
    retryAfterSeconds = parseSecondsFromText(rawMessage) ?? 60;
  } else {
    retryAfterSeconds = parseSecondsFromText(rawMessage);
  }

  return {
    status,
    message:
      status === 429
        ? rawMessage.includes('Too many')
          ? rawMessage
          : `Too many requests. Please try again in ${retryAfterSeconds ?? 60} seconds.`
        : rawMessage === 'Request failed'
          ? fallback
          : rawMessage || fallback,
    retryAfterSeconds,
  };
}
