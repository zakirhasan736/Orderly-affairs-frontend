import { AppDispatch } from '@/store/store';
import { useDispatch } from 'react-redux';
import { clearSession } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import {
  clearPortalSession,
  nokLogout,
  ownerLogout,
} from '@/libs/secureFetch';

function isNokPath(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return path.startsWith('/next-kin') || path.startsWith('/family');
}

export function useLogout() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  return async () => {
    const nok = isNokPath();
    try {
      const { lockE2ee } = await import('@/libs/e2ee/unlock');
      lockE2ee();
    } catch {
      /* ignore */
    }
    try {
      if (nok) {
        await nokLogout();
      } else {
        await ownerLogout();
      }
    } catch {
      await clearPortalSession();
    }

    dispatch(clearSession());
    if (typeof window !== 'undefined') {
      localStorage.removeItem('orderlyAffairsData');
      localStorage.removeItem('orderly_otp_session_id');
    }
    router.push(nok ? '/next-kin' : '/');
  };
}
