import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const ownerToken = req.cookies.get('auth_token')?.value;
  const nokToken = req.cookies.get('nok_auth_token')?.value;
  const { pathname } = req.nextUrl;

  /*
   ─────────────────────────────
   PUBLIC ROUTES
   ─────────────────────────────
  */

  // Owner login page
  if (pathname === '/' || pathname.startsWith('/login')) {
    if (ownerToken) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // Next-of-Kin login page (ALWAYS public)
  if (pathname === '/next-kin') {
    if (nokToken) {
      return NextResponse.redirect(new URL('/next-kin/dashboard', req.url));
    }
    return NextResponse.next();
  }

  /*
   ─────────────────────────────
   PROTECTED OWNER DASHBOARD
   ─────────────────────────────
  */
  if (pathname.startsWith('/dashboard')) {
    if (!ownerToken) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  /*
   ─────────────────────────────
   PROTECTED NEXT-OF-KIN DASHBOARD
   ─────────────────────────────
  */
  if (pathname.startsWith('/next-kin/dashboard')) {
    if (!nokToken) {
      return NextResponse.redirect(new URL('/next-kin', req.url));
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
    '/next-kin/dashboard/:path*',
  ],
};
