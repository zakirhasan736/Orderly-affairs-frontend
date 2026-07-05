import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge route guard — checks cookie *presence* only.
 *
 * SECURITY: A cookie being set does NOT mean the session is valid.
 * Tokens may be expired, revoked, or otherwise rejected by the backend.
 * All API routes perform real JWT/session validation; this middleware
 * is a UX redirect layer only.
 *
 * Set ENABLE_EDGE_SESSION_CHECK=true to additionally probe GET /auth/session
 * for protected routes (adds one backend round-trip per navigation).
 */
const ENABLE_EDGE_SESSION_CHECK =
  process.env.ENABLE_EDGE_SESSION_CHECK === 'true';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

async function hasValidSession(req: NextRequest): Promise<boolean> {
  if (!API_BASE) return true;

  try {
    const res = await fetch(`${API_BASE}/auth/session`, {
      headers: { cookie: req.headers.get('cookie') || '' },
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { authenticated?: boolean };
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const ownerToken = req.cookies.get('auth_token')?.value;
  const nokToken = req.cookies.get('nok_auth_token')?.value;
  const { pathname } = req.nextUrl;

  if (pathname === '/' || pathname.startsWith('/login')) {
    if (ownerToken) {
      if (ENABLE_EDGE_SESSION_CHECK) {
        const valid = await hasValidSession(req);
        if (!valid) {
          const res = NextResponse.next();
          res.cookies.delete('auth_token');
          return res;
        }
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  if (pathname === '/next-kin') {
    if (nokToken) {
      return NextResponse.redirect(new URL('/next-kin/dashboard', req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard')) {
    if (!ownerToken) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (ENABLE_EDGE_SESSION_CHECK) {
      const valid = await hasValidSession(req);
      if (!valid) {
        const res = NextResponse.redirect(new URL('/', req.url));
        res.cookies.delete('auth_token');
        return res;
      }
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/next-kin/')) {
    if (!nokToken) {
      return NextResponse.redirect(new URL('/next-kin', req.url));
    }
    if (ENABLE_EDGE_SESSION_CHECK) {
      const valid = await hasValidSession(req);
      if (!valid) {
        const res = NextResponse.redirect(new URL('/next-kin', req.url));
        res.cookies.delete('nok_auth_token');
        return res;
      }
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/next-kin',
    '/next-kin/:path*',
  ],
};
