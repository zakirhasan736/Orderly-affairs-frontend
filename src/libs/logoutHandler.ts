import { AppDispatch } from '@/store/store';
import { useDispatch } from 'react-redux';
import { clearSession } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import { ownerLogout } from '@/libs/secureFetch';

export function useLogout() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  return async () => {
    try {
      await ownerLogout();
    } catch {
      // still clear local state if network fails
    }

    dispatch(clearSession());
    if (typeof window !== 'undefined') {
      localStorage.removeItem('orderlyAffairsData');
      localStorage.removeItem('orderly_otp_session_id');
    }
    router.push('/');
  };
}
