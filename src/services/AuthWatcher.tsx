'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { clearSession } from '@/store/slices/authSlice';
import {
  clearPortalSession,
  fetchSession,
  markPortalSession,
} from '@/libs/secureFetch';

export default function AuthWatcher({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (pathname.startsWith('/next-kin')) {
      return;
    }

    const isOwnerArea = pathname.startsWith('/dashboard');

    if (pathname === '/' || pathname.startsWith('/login')) {
      return;
    }

    let cancelled = false;

    const verify = async () => {
      const session = await fetchSession();
      if (cancelled) return;

      if (!session.authenticated) {
        dispatch(clearSession());
        router.replace('/');
        return;
      }

      if (isOwnerArea && session.role !== 'owner') {
        router.replace('/');
        return;
      }

      // Incomplete subscription/checkout — send back to plan selection.
      if (
        isOwnerArea &&
        session.role === 'owner' &&
        session.requires_billing
      ) {
        router.replace('/?resume=checkout');
        return;
      }

      if (session.role === 'owner' && !session.requires_billing) {
        await markPortalSession();
      }
    };

    void verify();

    const onSessionExpired = () => {
      dispatch(clearSession());
      void clearPortalSession().finally(() => {
        router.replace('/?session=expired');
      });
    };
    window.addEventListener('orderly-session-expired', onSessionExpired);

    return () => {
      cancelled = true;
      window.removeEventListener('orderly-session-expired', onSessionExpired);
    };
  }, [pathname, router, dispatch]);

  return <>{children}</>;
}
