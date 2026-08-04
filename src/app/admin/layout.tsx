'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AdminSessionSkeleton } from '@/components/admin/AdminSkeletons';
import { AdminAuthProvider, useAdminAuth } from '@/components/admin/AdminAuthProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import './admin.css';

function AdminGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const { loading, session } = useAdminAuth();
  const isLogin = pathname.startsWith('/admin/login');

  if (loading) {
    return <AdminSessionSkeleton />;
  }

  if (isLogin) {
    return <>{children}</>;
  }

  if (!session?.authenticated) {
    return <AdminSessionSkeleton />;
  }

  return <AdminShell>{children}</AdminShell>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="oa-admin">
      <AdminAuthProvider>
        <AdminGate>{children}</AdminGate>
      </AdminAuthProvider>
    </div>
  );
}
