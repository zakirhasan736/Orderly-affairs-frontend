'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSessionSkeleton } from '@/components/admin/AdminSkeletons';
import { AdminAuthProvider, useAdminAuth } from '@/components/admin/AdminAuthProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { SessionExpiredListener } from '@/components/SessionExpiredListener';
import { SessionTimeoutGuard } from '@/components/SessionTimeoutGuard';
import './admin.css';

const PORTAL_KIND_KEY = 'oa_portal_kind';

function AdminGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const { loading, session, signOut } = useAdminAuth();
  const isLogin = pathname.startsWith('/admin/login');

  useEffect(() => {
    try {
      sessionStorage.setItem(PORTAL_KIND_KEY, 'admin');
    } catch {
      /* ignore */
    }
  }, []);

  if (loading) {
    return <AdminSessionSkeleton />;
  }

  if (isLogin) {
    return <>{children}</>;
  }

  if (!session?.authenticated) {
    return <AdminSessionSkeleton />;
  }

  return (
    <>
      <SessionTimeoutGuard
        onLogout={async () => {
          await signOut({ reason: 'idle' });
        }}
      />
      <AdminShell>{children}</AdminShell>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="oa-admin">
      <AdminAuthProvider>
        <SessionExpiredListener />
        <AdminGate>{children}</AdminGate>
      </AdminAuthProvider>
    </div>
  );
}
