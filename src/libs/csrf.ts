/** Shared CSRF token cache for cookie-auth API calls (portal ↔ API). */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

let csrfToken: string | null = null;

export function getCsrfToken(): string | null {
  return csrfToken;
}

export function clearCsrfToken(): void {
  csrfToken = null;
}

export function rememberCsrfFromResponse(res: Response | null | undefined): void {
  if (!res) return;
  const fromHeader = res.headers.get('X-CSRF-Token');
  if (fromHeader) {
    csrfToken = fromHeader;
    return;
  }
  if (typeof document === 'undefined') return;
  const match = document.cookie.match(/(?:^|;\s*)oa_csrf_token=([^;]*)/);
  if (match?.[1]) {
    try {
      csrfToken = decodeURIComponent(match[1]);
    } catch {
      csrfToken = match[1];
    }
  }
}

export function applyCsrfHeader(headers: Headers, method: string): void {
  const upper = method.toUpperCase();
  if (upper === 'GET' || upper === 'HEAD' || upper === 'OPTIONS') return;
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }
}

export async function bootstrapCsrfToken(): Promise<void> {
  if (!API_BASE || csrfToken) return;
  try {
    const res = await fetch(`${API_BASE}/auth/session`, {
      method: 'GET',
      credentials: 'include',
    });
    rememberCsrfFromResponse(res);
  } catch {
    // non-fatal
  }
}

export function isCsrfFailure(status: number | undefined, data: unknown): boolean {
  if (status !== 403) return false;
  if (typeof data === 'string') return /csrf/i.test(data);
  if (data && typeof data === 'object' && 'detail' in data) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === 'string') return /csrf/i.test(detail);
  }
  return false;
}
