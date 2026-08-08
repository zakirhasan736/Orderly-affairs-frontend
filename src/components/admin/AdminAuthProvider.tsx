'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  adminGetSession,
  adminLogout,
  type AdminSession,
} from '@/libs/api/adminApi';

type AdminAuthContextValue = {
  session: AdminSession | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: (opts?: { reason?: 'idle' | 'manual' }) => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const s = await adminGetSession();
      setSession(s?.authenticated ? s : null);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (loading) return;
    const onLogin = pathname?.startsWith('/admin/login');
    if (!session?.authenticated && !onLogin) {
      router.replace('/admin/login');
    }
    if (session?.authenticated && onLogin) {
      router.replace('/admin');
    }
  }, [loading, session, pathname, router]);

  const signOut = useCallback(async (opts?: { reason?: 'idle' | 'manual' }) => {
    try {
      await adminLogout();
    } catch {
      /* ignore */
    }
    setSession(null);
    try {
      sessionStorage.removeItem('oa_portal_kind');
    } catch {
      /* ignore */
    }
    const q = opts?.reason === 'idle' ? '?session=expired' : '';
    router.replace(`/admin/login${q}`);
  }, [router]);

  const value = useMemo(
    () => ({ session, loading, refresh, signOut }),
    [session, loading, refresh, signOut],
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return ctx;
}
