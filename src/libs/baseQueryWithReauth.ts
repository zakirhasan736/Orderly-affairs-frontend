import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';
import { sanitizeFetchBaseQueryError } from '@/utils/sanitizeApiError';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

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

    if (result.error && result.error.status === 401) {
      const refreshed = await refreshSession();
      if (refreshed) {
        result = await rawBaseQuery(args, api, extraOptions);
      }
    }

    if (result.error) {
      result = {
        ...result,
        error: sanitizeFetchBaseQueryError(result.error),
      };
    }

    return result;
  };
}

export const baseQueryWithReauth = createSecureBaseQuery('');
