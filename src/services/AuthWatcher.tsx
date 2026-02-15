'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import * as jose from 'jose';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';

export default function AuthWatcher({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // ✅ ABSOLUTELY IGNORE ALL NEXT-KIN ROUTES
    if (pathname.startsWith('/next-kin')) {
      return;
    }

    const isOwnerArea = pathname.startsWith('/dashboard');

    // 🔓 Public owner routes
    if (pathname === '/' || pathname.startsWith('/login')) {
      return;
    }

    const token = Cookies.get('auth_token');

    // 🚫 Missing owner token
    if (!token) {
      router.replace('/');
      return;
    }

    try {
      const payload = jose.decodeJwt(token);
      const exp = payload.exp ? payload.exp * 1000 : 0;

      // ⏰ Expired
      if (!exp || exp < Date.now()) {
        Cookies.remove('auth_token');
        dispatch(logout());
        router.replace('/');
        return;
      }

      // 🎭 Owner-only enforcement
      if (isOwnerArea && payload.role !== 'owner') {
        router.replace('/');
        return;
      }
    } catch {
      Cookies.remove('auth_token');
      dispatch(logout());
      router.replace('/');
    }
  }, [pathname, router, dispatch]);

  return <>{children}</>;
}
