import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

const isProd =
  process.env.NODE_ENV === 'production' ||
  process.env.NEXT_PUBLIC_HIDE_CLIENT_LOGS === 'true';

const GENERIC = 'Request failed';

/**
 * Strip backend error bodies in production so the Network tab / Redux DevTools
 * do not expose stack traces, validation fields, or internal messages.
 */
export function sanitizeFetchBaseQueryError(
  error: FetchBaseQueryError,
): FetchBaseQueryError {
  if (!isProd) return error;

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
