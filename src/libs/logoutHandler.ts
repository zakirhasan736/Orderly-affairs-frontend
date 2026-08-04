import { AppDispatch } from '@/store/store';
import { useDispatch } from 'react-redux';
import { clearSession } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import {
  clearPortalSession,
  nokLogout,
  ownerLogout,
} from '@/libs/secureFetch';

const PORTAL_KIND_KEY = 'oa_portal_kind';

type PortalKind = 'owner' | 'family' | 'nextkin';

function readPortalKind(): PortalKind {
  if (typeof window === 'undefined') return 'owner';
  try {
    const kind = sessionStorage.getItem(PORTAL_KIND_KEY);
    if (kind === 'family' || kind === 'nextkin' || kind === 'owner') {
      return kind;
    }
  } catch {
    /* ignore */
  }
  const path = window.location.pathname;
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

function logoutDestination(kind: PortalKind): string {
  if (kind === 'family') return '/family/login';
  if (kind === 'nextkin') return '/next-kin';
  return '/';
}

export function useLogout() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  return async () => {
    const kind = readPortalKind();
    const useNokSession = kind === 'family' || kind === 'nextkin';

    try {
      const { lockE2ee } = await import('@/libs/e2ee/unlock');
      lockE2ee();
    } catch {
      /* ignore */
    }

    try {
      if (useNokSession) {
        await nokLogout();
      } else {
        await ownerLogout();
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
    router.push(logoutDestination(kind));
  };
}
