import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

const isProd =
  process.env.NODE_ENV === 'production' ||
  process.env.NEXT_PUBLIC_HIDE_CLIENT_LOGS === 'true';

const GENERIC = 'Request failed';

/**
 * Strip backend error bodies in production so the Network tab / Redux DevTools
 * do not expose stack traces, validation fields, or internal messages.
 * Rate-limit (429) details are kept so the UI can show timers.
 */
export function sanitizeFetchBaseQueryError(
  error: FetchBaseQueryError,
): FetchBaseQueryError {
  if (!isProd) return error;

  if (typeof error.status === 'number' && (error.status === 429 || error.status === 400)) {
    const data = error.data as { detail?: unknown; message?: unknown } | undefined;
    const detail =
      typeof data?.detail === 'string'
        ? data.detail
        : typeof data?.message === 'string'
          ? data.message
          : error.status === 429
            ? 'Too many attempts. Please try again later.'
            : GENERIC;
    // Keep user-actionable auth errors (rate limit / captcha / OTP)
    if (
      error.status === 429 ||
      /captcha|security|otp|code|password|reset|attempt|signup|expired|verification/i.test(
        detail,
      )
    ) {
      return {
        status: error.status,
        data: { detail },
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

  if (!isProd) {
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
