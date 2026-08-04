import {
  applyCsrfHeader,
  bootstrapCsrfToken,
  clearCsrfToken,
  isCsrfFailure,
  rememberCsrfFromResponse,
} from '@/libs/csrf';
import {
  ensureFreshSession,
  refreshAuthSession,
  stillAuthenticated,
} from '@/libs/sessionRefresh';
import { resolveApiBaseUrl } from '@/libs/apiBase';

export { ensureFreshSession };

function notifySessionExpired() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('orderly-session-expired'));
}

/** Prefer HTTPS API origin; rewrite accidental http:// absolute URLs too. */
function buildApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path);
      const host = url.hostname.toLowerCase();
      const isLocal =
        host === 'localhost' || host === '127.0.0.1' || host === '::1';
      if (!isLocal && url.protocol === 'http:') {
        url.protocol = 'https:';
      }
      // Prefer same-origin proxy when available so cookies + HTTPS stay clean.
      const proxyBase = resolveApiBaseUrl();
      if (proxyBase === '/oa-api') {
        return `/oa-api${url.pathname}${url.search}${url.hash}`;
      }
      return url.toString();
    } catch {
      return path;
    }
  }
  const base = resolveApiBaseUrl();
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Tell the API which cookie session to prefer when leftovers exist. */
function applySessionKindHeader(headers: Headers) {
  if (typeof window === 'undefined') return;
  try {
    const kind = sessionStorage.getItem('oa_portal_kind');
    if (kind === 'family' || kind === 'nextkin' || kind === 'owner') {
      headers.set('X-OA-Session-Kind', kind);
    }
  } catch {
    /* ignore */
  }
}

export async function secureFetch(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<Response> {
  const url = buildApiUrl(path);
  const headers = new Headers(options.headers || undefined);
  const method = (options.method || 'GET').toUpperCase();

  if (
    method !== 'GET' &&
    method !== 'HEAD' &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  if (method !== 'GET' && method !== 'HEAD') {
    await bootstrapCsrfToken();
  }
  applyCsrfHeader(headers, method);
  applySessionKindHeader(headers);

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });
  rememberCsrfFromResponse(res);

  if (res.status === 403 && !retried) {
    const bodyText = await res.clone().text().catch(() => '');
    if (isCsrfFailure(403, bodyText) || /csrf/i.test(bodyText)) {
      clearCsrfToken();
      await bootstrapCsrfToken();
      return secureFetch(path, options, true);
    }
  }

  if (res.status === 401 && !retried) {
    const refreshed = await refreshAuthSession();
    if (refreshed) {
      return secureFetch(path, options, true);
    }
    // Owner-only routes 401 valid family sessions; only expire if session is gone.
    if (!(await stillAuthenticated())) {
      notifySessionExpired();
    }
  }

  return res;
}

export async function fetchSession(): Promise<{
  authenticated: boolean;
  role?: 'owner' | 'nextkin';
  access_type?: 'family' | 'nextkin' | string;
  portal_role?: string;
  portal_role_label?: string;
  dashboard_permissions?: Record<string, boolean>;
  authorized_sections?: string[];
  access_level?: string;
  full_name?: string;
  email?: string;
  owner_id?: string;
  billing_status?: string;
  requires_billing?: boolean;
  billing_only?: boolean;
  auto_renew?: boolean;
  trial_mode?: string | null;
  lock_message?: string | null;
}> {
  if (!resolveApiBaseUrl()) return { authenticated: false };

  try {
    const res = await secureFetch('/auth/session', { method: 'GET' });
    if (!res.ok) return { authenticated: false };
    return res.json();
  } catch {
    return { authenticated: false };
  }
}

/** First-party cookie so Next middleware allows /dashboard after API login. */
export async function markPortalSession(): Promise<void> {
  try {
    await fetch('/api/auth/portal-session', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // non-fatal — AuthWatcher still validates against the API
  }
}

export async function clearPortalSession(): Promise<void> {
  try {
    await fetch('/api/auth/portal-session', {
      method: 'DELETE',
      credentials: 'include',
    });
  } catch {
    // ignore
  }
}

export async function ownerLogout(): Promise<void> {
  await secureFetch('/auth/owner-logout', { method: 'POST' });
  clearCsrfToken();
  await clearPortalSession();
}

export async function nokLogout(): Promise<void> {
  await secureFetch('/auth/nextkin-logout', { method: 'POST' });
  clearCsrfToken();
  await clearPortalSession();
}
