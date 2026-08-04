/**
 * Resolve the public API origin for browser / Next runtime.
 *
 * On the HTTPS portal we use a same-origin `/oa-api` rewrite (see next.config.ts)
 * so the browser never calls plain `http://api…` (Mixed Content block).
 * Local http://localhost keeps talking to the API directly.
 */
export function resolveApiBaseUrl(
  raw: string | undefined | null = process.env.NEXT_PUBLIC_API_BASE_URL,
): string {
  const configured = String(raw || '').trim().replace(/\/+$/, '');

  // Absolute URL passed in (e.g. accidental http absolute path) — normalize first.
  if (
    configured.startsWith('http://') ||
    configured.startsWith('https://')
  ) {
    // fall through after proxy decision; absolute upgrade handled below
  }

  const proxyFlag = String(process.env.NEXT_PUBLIC_API_USE_PROXY || '')
    .trim()
    .toLowerCase();
  const forceProxy = proxyFlag === 'true';
  const disableProxy = proxyFlag === 'false';

  const onHttpsPage =
    typeof window !== 'undefined' && window.location?.protocol === 'https:';
  const isProdBuild =
    String(process.env.NODE_ENV || '').toLowerCase() === 'production';

  if (!disableProxy && (forceProxy || onHttpsPage || isProdBuild)) {
    return '/oa-api';
  }

  let base = configured;
  if (!base) return '';

  try {
    if (base.startsWith('http://')) {
      const host = new URL(base).hostname.toLowerCase();
      const isLocal =
        host === 'localhost' || host === '127.0.0.1' || host === '::1';
      if (!isLocal && (onHttpsPage || isProdBuild)) {
        base = `https://${base.slice('http://'.length)}`;
      }
    }
  } catch {
    /* ignore */
  }

  return base;
}

/** Server-only: upstream API for Next.js rewrites. Always prefer HTTPS off-localhost. */
export function resolveApiProxyTarget(
  raw: string | undefined | null =
    process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_BASE_URL,
): string {
  let base = String(raw || '').trim().replace(/\/+$/, '');
  if (!base) return 'http://127.0.0.1:8000';
  try {
    if (base.startsWith('http://')) {
      const host = new URL(base).hostname.toLowerCase();
      const isLocal =
        host === 'localhost' || host === '127.0.0.1' || host === '::1';
      if (!isLocal) {
        base = `https://${base.slice('http://'.length)}`;
      }
    }
  } catch {
    /* ignore */
  }
  return base;
}
