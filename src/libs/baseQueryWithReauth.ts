import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';
import { sanitizeFetchBaseQueryError } from '@/utils/sanitizeApiError';
import {
  applyCsrfHeader,
  bootstrapCsrfToken,
  clearCsrfToken,
  getCsrfToken,
  isCsrfFailure,
  rememberCsrfFromResponse,
} from '@/libs/csrf';
import { refreshAuthSession } from '@/libs/sessionRefresh';
import { resolveApiBaseUrl } from '@/libs/apiBase';

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

function requestMethod(args: string | FetchArgs): string {
  if (typeof args === 'string') return 'GET';
  return (args.method || 'GET').toUpperCase();
}

export function createSecureBaseQuery(
  pathPrefix: string,
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> {
  const prepareHeaders = (headers: Headers) => {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    const token = getCsrfToken();
    if (token) {
      headers.set('X-CSRF-Token', token);
    }
    try {
      const kind = sessionStorage.getItem('oa_portal_kind');
      if (kind === 'family' || kind === 'nextkin' || kind === 'owner') {
        headers.set('X-OA-Session-Kind', kind);
      }
    } catch {
      /* ignore */
    }
    return headers;
  };

  return async (args, api, extraOptions) => {
    // Resolve per request so HTTPS portal always uses same-origin /oa-api.
    const rawBaseQuery = fetchBaseQuery({
      baseUrl: `${resolveApiBaseUrl()}${pathPrefix}`,
      credentials: 'include',
      prepareHeaders,
    });

    const method = requestMethod(args);
    if (method !== 'GET' && method !== 'HEAD') {
      await bootstrapCsrfToken();
    }

    // Ensure CSRF is on this request even if prepareHeaders ran early.
    if (typeof args !== 'string') {
      const headers = new Headers(args.headers as HeadersInit | undefined);
      applyCsrfHeader(headers, method);
      args = { ...args, headers };
    }

    let result = await rawBaseQuery(args, api, extraOptions);
    rememberCsrfFromResponse(result.meta?.response);

    if (
      result.error &&
      isCsrfFailure(
        typeof result.error.status === 'number' ? result.error.status : undefined,
        result.error.data,
      )
    ) {
      clearCsrfToken();
      await bootstrapCsrfToken();
      if (typeof args !== 'string') {
        const headers = new Headers(args.headers as HeadersInit | undefined);
        applyCsrfHeader(headers, method);
        args = { ...args, headers };
      }
      result = await rawBaseQuery(args, api, extraOptions);
      rememberCsrfFromResponse(result.meta?.response);
    }

    if (
      result.error &&
      result.error.status === 401 &&
      !shouldSkipRefresh(args)
    ) {
      const refreshed = await refreshAuthSession();
      if (refreshed) {
        result = await rawBaseQuery(args, api, extraOptions);
        rememberCsrfFromResponse(result.meta?.response);
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
