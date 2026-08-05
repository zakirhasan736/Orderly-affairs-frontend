'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchSession } from '@/libs/secureFetch';

/**
 * NOK portal shell — family collaborators use /dashboard, not /next-kin.
 * Matches backend VaultPrincipalMiddleware (SECURITY_MODEL.md).
 */
export default function NextKinPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void fetchSession().then(session => {
      if (cancelled) return;

      const accessType = String(session.access_type || '').toLowerCase();
      if (session.authenticated && accessType === 'family') {
        router.replace('/dashboard');
        return;
      }

      if (
        session.authenticated &&
        session.role === 'owner' &&
        !pathname.endsWith('/next-kin') &&
        pathname !== '/next-kin'
      ) {
        router.replace('/dashboard');
        return;
      }

      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f6f8fb]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      </div>
    );
  }

  return <>{children}</>;
}
