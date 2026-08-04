import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveApiBaseUrl } from '@/libs/apiBase';

/**
 * Edge UX guard + Content-Security-Policy with per-request nonce.
 *
 * Real auth cookies are set by the API host (api.*). Those often are NOT
 * visible to portal middleware. Client AuthWatcher validates via GET /auth/session.
 */
function buildCsp(nonce: string): string {
  const apiBase = resolveApiBaseUrl();
  let apiOrigin = '';
  try {
    if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
      apiOrigin = new URL(apiBase).origin;
    }
  } catch {
    apiOrigin = '';
  }

  // Always allow direct API hosts in case of older clients / absolute URLs.
  const configured = String(process.env.NEXT_PUBLIC_API_BASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  let configuredOrigin = '';
  try {
    if (configured.startsWith('http')) {
      const upgraded = configured.startsWith('http://')
        ? `https://${configured.slice('http://'.length)}`
        : configured;
      configuredOrigin = new URL(upgraded).origin;
    }
  } catch {
    configuredOrigin = '';
  }

  const connectSrc = [
    "'self'",
    apiOrigin,
    configuredOrigin,
    'https://api.orderly-affairs.com',
    'https://challenges.cloudflare.com',
    'https://api.stripe.com',
    'https://res.cloudinary.com',
    'https://api.cloudinary.com',
  ]
    .filter(Boolean)
    .join(' ');

  // nonce + strict-dynamic: modern browsers ignore 'unsafe-inline' when a nonce
  // is present. Keep host allowlists for older browsers / third-party loaders.
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com https://js.stripe.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${connectSrc}`,
    "frame-src 'self' blob: data: https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "worker-src 'self' blob:",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);

  const applySecurity = (res: NextResponse) => {
    res.headers.set('x-nonce', nonce);
    res.headers.set('Content-Security-Policy', buildCsp(nonce));
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return res;
  };

  // Logged-in cue on login page → leave routing to the client.
  if (pathname === '/' || pathname.startsWith('/login')) {
    return applySecurity(
      NextResponse.next({
        request: { headers: requestHeaders },
      }),
    );
  }

  if (pathname === '/next-kin') {
    if (req.cookies.get('nok_auth_token')?.value) {
      return applySecurity(
        NextResponse.redirect(new URL('/next-kin/dashboard', req.url)),
      );
    }
    return applySecurity(
      NextResponse.next({
        request: { headers: requestHeaders },
      }),
    );
  }

  // /dashboard: NEVER hard-redirect to login here.
  if (pathname.startsWith('/dashboard')) {
    return applySecurity(
      NextResponse.next({
        request: { headers: requestHeaders },
      }),
    );
  }

  if (pathname.startsWith('/next-kin/')) {
    return applySecurity(
      NextResponse.next({
        request: { headers: requestHeaders },
      }),
    );
  }

  if (pathname.startsWith('/admin')) {
    return applySecurity(
      NextResponse.next({
        request: { headers: requestHeaders },
      }),
    );
  }

  return applySecurity(
    NextResponse.next({
      request: { headers: requestHeaders },
    }),
  );
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets / image optimizer.
     * Needed so CSP nonce applies site-wide, not only auth routes.
     */
    {
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    },
  ],
};
