import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge UX guard only.
 *
 * Real auth cookies are set by the API host (api.*). Those often are NOT
 * visible to portal middleware, so after login the old middleware bounced
 * /dashboard → /. Client AuthWatcher validates via GET /auth/session.
 *
 * Optional portal marker cookie: oa_portal_session (set after successful session).
 */
const PORTAL_SESSION_COOKIE = 'oa_portal_session';

function hasOwnerCue(req: NextRequest): boolean {
  return Boolean(
    req.cookies.get('auth_token')?.value ||
      req.cookies.get(PORTAL_SESSION_COOKIE)?.value,
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Logged-in cue on login page → leave routing to the client.
  // Owners still finishing plan/trial/payment must stay on checkout; only the
  // session API knows requires_billing, so middleware must not force /dashboard.
  if (pathname === '/' || pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  if (pathname === '/next-kin') {
    if (req.cookies.get('nok_auth_token')?.value) {
      return NextResponse.redirect(new URL('/next-kin/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // /dashboard: NEVER hard-redirect to login here.
  // Missing portal cookies used to send users in a loop after MFA/login.
  // AuthWatcher + dashboard hydrate call the API with credentials instead.
  if (pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/next-kin/')) {
    return NextResponse.next();
  }

  // Admin support inbox — auth checked client-side via API (role: admin).
  if (pathname.startsWith('/admin')) {
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
    '/admin/:path*',
  ],
};
