import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

const GENERIC = 'Request failed';

function isProd(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_HIDE_CLIENT_LOGS === 'true'
  );
}

/**
 * Strip backend error bodies in production so the Network tab / Redux DevTools
 * do not expose stack traces, validation fields, or internal messages.
 * Rate-limit (429) details are kept so the UI can show timers.
 */
export function sanitizeFetchBaseQueryError(
  error: FetchBaseQueryError,
): FetchBaseQueryError {
  if (!isProd()) return error;

  if (
    typeof error.status === 'number' &&
    (error.status === 429 || error.status === 400 || error.status === 403)
  ) {
    const data = error.data as
      | { detail?: unknown; message?: unknown; retry_after_seconds?: unknown }
      | undefined;
    const detail =
      typeof data?.detail === 'string'
        ? data.detail
        : typeof data?.message === 'string'
          ? data.message
          : error.status === 429
            ? 'Too many attempts. Please try again later.'
            : GENERIC;
    const retryAfterSeconds =
      typeof data?.retry_after_seconds === 'number'
        ? data.retry_after_seconds
        : undefined;
    // Keep user-actionable auth errors (rate limit / captcha / OTP / billing)
    if (
      error.status === 429 ||
      error.status === 403 ||
      /captcha|security|otp|code|password|reset|attempt|signup|expired|verification|payment|billing|plan|paused|email/i.test(
        detail,
      )
    ) {
      return {
        status: error.status,
        data: {
          detail,
          ...(retryAfterSeconds != null
            ? { retry_after_seconds: retryAfterSeconds }
            : {}),
        },
      } as FetchBaseQueryError;
    }
  }

  const status =
    typeof error.status === 'number' ? error.status : 'CUSTOM_ERROR';

  return {
    status,
    data: { message: GENERIC },
  } as FetchBaseQueryError;
}

/** Safe message for raw fetch helpers (non-RTK). */
export async function readSafeErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  if (res.status === 429) {
    try {
      const payload = await res.clone().json();
      const detail = payload?.detail;
      if (typeof detail === 'string') return detail;
      if (typeof payload?.message === 'string') return payload.message;
    } catch {
      // ignore
    }
    const retry = res.headers.get('Retry-After');
    if (retry && /^\d+$/.test(retry)) {
      return `Too many attempts. Please try again in ${retry} seconds.`;
    }
  }

  if (!isProd()) {
    try {
      const payload = await res.clone().json();
      const detail = payload?.detail;
      if (typeof detail === 'string') return detail;
      if (typeof payload?.message === 'string') return payload.message;
    } catch {
      // ignore
    }
  }
  return fallback;
}
