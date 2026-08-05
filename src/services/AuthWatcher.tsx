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

const PORTAL_KIND_KEY = 'oa_portal_kind';

function isFamilyCollaborator(session: {
  role?: string;
  access_type?: string;
}): boolean {
  return (
    session.role === 'nextkin' &&
    String(session.access_type || '').toLowerCase() === 'family'
  );
}

export default function AuthWatcher({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // NOK portal and family login use their own session UX.
    if (pathname.startsWith('/next-kin') || pathname.startsWith('/family')) {
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
        void import('@/libs/e2ee/unlock').then(({ lockE2ee }) => lockE2ee());
        void import('@/utils/clearSensitiveClientStorage').then(
          ({ clearSensitiveClientStorage }) => clearSensitiveClientStorage(),
        );
        router.replace('/');
        return;
      }

      // Family collaborators use the owner dashboard shell with ACL.
      if (isOwnerArea && isFamilyCollaborator(session)) {
        try {
          sessionStorage.setItem(PORTAL_KIND_KEY, 'family');
        } catch {
          /* ignore */
        }
        await markPortalSession();
        return;
      }

      if (isOwnerArea && session.role !== 'owner') {
        // Pure Next-of-Kin should use /next-kin/dashboard, not owner login.
        if (session.role === 'nextkin') {
          try {
            sessionStorage.setItem(PORTAL_KIND_KEY, 'nextkin');
          } catch {
            /* ignore */
          }
          router.replace('/next-kin/dashboard');
          return;
        }
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
        try {
          sessionStorage.setItem(PORTAL_KIND_KEY, 'owner');
        } catch {
          /* ignore */
        }
        await markPortalSession();
      }
    };

    void verify();

    const onSessionExpired = () => {
      let portalKind = 'owner';
      try {
        portalKind = sessionStorage.getItem(PORTAL_KIND_KEY) || 'owner';
        sessionStorage.removeItem(PORTAL_KIND_KEY);
      } catch {
        /* ignore */
      }
      dispatch(clearSession());
      void import('@/libs/e2ee/unlock').then(({ lockE2ee }) => lockE2ee());
      void import('@/utils/clearSensitiveClientStorage').then(
        ({ clearSensitiveClientStorage }) => clearSensitiveClientStorage(),
      );
      void clearPortalSession().finally(() => {
        if (portalKind === 'family') {
          router.replace('/family/login?session=expired');
          return;
        }
        if (portalKind === 'nextkin') {
          router.replace('/next-kin?session=expired');
          return;
        }
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
