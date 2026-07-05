'use client';
import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { clearSession, setSession, setSessionChecked } from '@/store/slices/authSlice';
import { fetchSession } from '@/libs/secureFetch';
import { installProductionConsoleGuard } from '@/utils/clientLogger';

export default function AppInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    installProductionConsoleGuard();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const session = await fetchSession();
        if (cancelled) return;

        if (session.authenticated && session.email && session.role) {
          dispatch(
            setSession({
              user: {
                email: session.email,
                role: session.role,
                owner_id: session.owner_id ?? null,
              },
            }),
          );
        } else {
          dispatch(clearSession());
        }
      } catch {
        if (!cancelled) dispatch(clearSession());
      } finally {
        if (!cancelled) dispatch(setSessionChecked(true));
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return null;
}
