/**
 * Single shared refresh mutex for secureFetch + RTK baseQuery.
 * Parallel 401s used to rotate the refresh token twice (one succeeds, one
 * fails) and falsely fire "session expired" for family/NOK sessions.
 */

import {
  applyCsrfHeader,
  bootstrapCsrfToken,
  rememberCsrfFromResponse,
} from '@/libs/csrf';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

let refreshPromise: Promise<boolean> | null = null;
let lastRefreshAt = 0;

/** Soft refresh at most once per minute during long AI batches. */
export const REFRESH_COOLDOWN_MS = 60_000;

function preferredRefreshRole(): 'family' | 'nextkin' | 'owner' | null {
  if (typeof window === 'undefined') return null;
  try {
    const kind = sessionStorage.getItem('oa_portal_kind');
    if (kind === 'family' || kind === 'nextkin') return kind;
    if (kind === 'owner') return 'owner';
  } catch {
    /* ignore */
  }
  return null;
}

async function postRefresh(): Promise<boolean> {
  await bootstrapCsrfToken();
  const headers = new Headers({ 'Content-Type': 'application/json' });
  applyCsrfHeader(headers, 'POST');
  try {
    const preferred = preferredRefreshRole();
    if (preferred === 'family' || preferred === 'nextkin') {
      headers.set('X-OA-Session-Kind', preferred);
    }
    const res = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers,
    });
    rememberCsrfFromResponse(res);
    if (res.ok) {
      lastRefreshAt = Date.now();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function refreshAuthSession(): Promise<boolean> {
  if (!API_BASE) return false;

  if (!refreshPromise) {
    refreshPromise = postRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/** Keep cookies fresh during long AI uploads. Safe to call often. */
export async function ensureFreshSession(): Promise<boolean> {
  if (Date.now() - lastRefreshAt < REFRESH_COOLDOWN_MS) {
    return true;
  }
  return refreshAuthSession();
}

/**
 * Confirm the browser still has a live API session before declaring expiry.
 * Owner-only endpoints return 401 for valid family cookies; a failed refresh
 * race must not log collaborators out.
 */
export async function stillAuthenticated(): Promise<boolean> {
  if (!API_BASE) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/session`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const body = await res.json();
    return Boolean(body?.authenticated);
  } catch {
    return false;
  }
}
