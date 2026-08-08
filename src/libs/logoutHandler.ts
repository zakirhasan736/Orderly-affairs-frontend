import { AppDispatch } from '@/store/store';
import { useDispatch } from 'react-redux';
import { clearSession } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import {
  clearPortalSession,
  nokLogout,
  ownerLogout,
} from '@/libs/secureFetch';
import { clearSensitiveClientStorage } from '@/utils/clearSensitiveClientStorage';

const PORTAL_KIND_KEY = 'oa_portal_kind';

type PortalKind = 'owner' | 'family' | 'nextkin' | 'admin';

function readPortalKind(): PortalKind {
  if (typeof window === 'undefined') return 'owner';
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
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/family')) return 'family';
  if (path.startsWith('/next-kin')) return 'nextkin';
  return 'owner';
}

function clearPortalKind() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(PORTAL_KIND_KEY);
  } catch {
    /* ignore */
  }
}

function logoutDestination(
  kind: PortalKind,
  reason?: 'idle' | 'manual',
): string {
  const expired = reason === 'idle' ? '?session=expired' : '';
  if (kind === 'family') return `/family/login${expired}`;
  if (kind === 'nextkin') return `/next-kin${expired}`;
  if (kind === 'admin') return `/admin/login${expired}`;
  return `/${expired === '' ? '' : expired}`;
}

export function useLogout() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  return async (opts?: { reason?: 'idle' | 'manual' }) => {
    const kind = readPortalKind();
    const useNokSession = kind === 'family' || kind === 'nextkin';
    const reason = opts?.reason ?? 'manual';

    try {
      const { lockE2ee } = await import('@/libs/e2ee/unlock');
      lockE2ee();
    } catch {
      /* ignore */
    }

    clearSensitiveClientStorage();

    try {
      if (useNokSession) {
        await nokLogout();
      } else if (kind !== 'admin') {
        await ownerLogout();
      } else {
        await clearPortalSession();
      }
    } catch {
      await clearPortalSession();
    }

    clearPortalKind();
    dispatch(clearSession());
    if (typeof window !== 'undefined') {
      localStorage.removeItem('orderlyAffairsData');
      localStorage.removeItem('orderly_otp_session_id');
    }
    router.push(logoutDestination(kind, reason));
  };
}
