import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';
import { sanitizeFetchBaseQueryError } from '@/utils/sanitizeApiError';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/** Auth routes where a 401 must NOT trigger refresh-token (avoids 429 spam). */
const SKIP_REFRESH_PATHS = [
  '/login',
  '/signup',
  '/request-password-reset',
  '/reset-password',
  '/nextkin-login',
  '/refresh-token',
  '/send-email-otp',
  '/send-sms-otp',
  '/verify-sms-otp',
  '/verify-email',
  '/verify-totp',
];

function shouldSkipRefresh(args: string | FetchArgs): boolean {
  const url = typeof args === 'string' ? args : args.url;
  if (!url) return false;
  return SKIP_REFRESH_PATHS.some(
    path => url === path || url.startsWith(`${path}?`) || url.endsWith(path),
  );
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export function createSecureBaseQuery(
  pathPrefix: string,
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl: `${API_BASE}${pathPrefix}`,
    credentials: 'include',
    prepareHeaders: headers => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  });

  return async (args, api, extraOptions) => {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (
      result.error &&
      result.error.status === 401 &&
      !shouldSkipRefresh(args)
    ) {
      const refreshed = await refreshSession();
      if (refreshed) {
        result = await rawBaseQuery(args, api, extraOptions);
      }
    }

    if (result.error?.status === 429 && result.meta?.response) {
      const retryHeader = result.meta.response.headers.get('Retry-After');
      if (retryHeader && /^\d+$/.test(retryHeader)) {
        const retryAfterSeconds = Math.max(parseInt(retryHeader, 10), 1);
        const existingData =
          result.error.data &&
          typeof result.error.data === 'object' &&
          !Array.isArray(result.error.data)
            ? (result.error.data as Record<string, unknown>)
            : {};
        // Construct an error-only result (do not spread `data` from the success union)
        result = {
          error: {
            status: result.error.status,
            data: {
              ...existingData,
              retry_after_seconds: retryAfterSeconds,
            },
          } as FetchBaseQueryError,
          meta: result.meta,
        };
      }
    }

    if (result.error) {
      result = {
        error: sanitizeFetchBaseQueryError(result.error),
        meta: result.meta,
      };
    }

    return result;
  };
}

export const baseQueryWithReauth = createSecureBaseQuery('');
