import { NextResponse } from 'next/server';

/**
 * First-party portal cookie so Next middleware can allow /dashboard.
 * API auth cookies live on api.* and are often invisible to portal middleware.
 */
const COOKIE = 'oa_portal_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, '1', cookieOptions(MAX_AGE));
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, '', cookieOptions(0));
  return res;
}
