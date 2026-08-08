'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { clearSession } from '@/store/slices/authSlice';
import { clearPortalSession } from '@/libs/secureFetch';

const PORTAL_KIND_KEY = 'oa_portal_kind';

type PortalKind = 'owner' | 'family' | 'nextkin' | 'admin';

function readPortalKind(): PortalKind {
  try {
    const kind = sessionStorage.getItem(PORTAL_KIND_KEY);
    if (
      kind === 'family' ||
      kind === 'nextkin' ||
      kind === 'owner' ||
      kind === 'admin'
    ) {
      return kind;
    }
  } catch {
    /* ignore */
  }
  if (typeof window === 'undefined') return 'owner';
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/family')) return 'family';
  if (path.startsWith('/next-kin')) return 'nextkin';
  return 'owner';
}

function expiredDestination(kind: PortalKind): string {
  if (kind === 'family') return '/family/login?session=expired';
  if (kind === 'nextkin') return '/next-kin?session=expired';
  if (kind === 'admin') return '/admin/login?session=expired';
  return '/?session=expired';
}

/**
 * Listens for hard session death (failed refresh) and routes to the
 * correct portal login with ?session=expired.
 */
export function SessionExpiredListener() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const onSessionExpired = () => {
      const portalKind = readPortalKind();
      try {
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
        router.replace(expiredDestination(portalKind));
      });
    };

    window.addEventListener('orderly-session-expired', onSessionExpired);
    return () => {
      window.removeEventListener('orderly-session-expired', onSessionExpired);
    };
  }, [router, dispatch]);

  return null;
}
