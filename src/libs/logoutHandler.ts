import Cookies from 'js-cookie';
import { AppDispatch } from '@/store/store';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';

export function useLogout() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  return () => {
    dispatch(logout());
    Cookies.remove('auth_token', { path: '/' });
    localStorage.clear();
    router.push('/');
  };
}
