const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshSession(): Promise<boolean> {
  if (!API_BASE) return false;

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

export async function secureFetch(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers = new Headers(options.headers || undefined);

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (res.status === 401 && !retried) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      return secureFetch(path, options, true);
    }
  }

  return res;
}

export async function fetchSession(): Promise<{
  authenticated: boolean;
  role?: 'owner' | 'nextkin';
  email?: string;
  owner_id?: string;
  billing_status?: string;
  requires_billing?: boolean;
  billing_only?: boolean;
  auto_renew?: boolean;
  trial_mode?: string | null;
  lock_message?: string | null;
}> {
  if (!API_BASE) return { authenticated: false };

  const res = await secureFetch('/auth/session', { method: 'GET' });
  if (!res.ok) return { authenticated: false };
  return res.json();
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
  await clearPortalSession();
}

export async function nokLogout(): Promise<void> {
  await secureFetch('/auth/nextkin-logout', { method: 'POST' });
  await clearPortalSession();
}
