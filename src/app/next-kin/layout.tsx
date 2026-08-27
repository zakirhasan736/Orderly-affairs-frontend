'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchSession } from '@/libs/secureFetch';
import { SessionExpiredListener } from '@/components/SessionExpiredListener';
import { CollaboratorFirstLoginGate } from '@/components/auth/CollaboratorFirstLoginGate';
import {
  SessionTimeoutGuard,
  nokIdleTiming,
} from '@/components/SessionTimeoutGuard';

const PORTAL_KIND_KEY = 'oa_portal_kind';

function isNokLoginPath(pathname: string) {
  return (
    pathname === '/next-kin' ||
    pathname === '/next-kin/' ||
    pathname.startsWith('/next-kin/claim') ||
    pathname.startsWith('/next-kin/verify-identity') ||
    pathname.startsWith('/next-kin/instructions')
  );
}

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
  const [accessLevel, setAccessLevel] = useState<string | undefined>();
  const [authenticatedNok, setAuthenticatedNok] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(PORTAL_KIND_KEY, 'nextkin');
    } catch {
      /* ignore */
    }
  }, []);

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
        !isNokLoginPath(pathname)
      ) {
        router.replace('/dashboard');
        return;
      }

      if (session.authenticated && session.role === 'nextkin') {
        setAuthenticatedNok(true);
        setAccessLevel(session.access_level);
      } else {
        setAuthenticatedNok(false);
        setAccessLevel(undefined);
      }

      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  const fullKit = useMemo(() => {
    const level = String(accessLevel || '').trim();
    if (
      level === 'Area-Specific Access' ||
      level === 'Section-Specific Access'
    ) {
      return false;
    }
    return true;
  }, [accessLevel]);

  const idle = nokIdleTiming(fullKit);
  const guardEnabled = authenticatedNok && !isNokLoginPath(pathname);

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F6F8FA]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E4EAF0] border-t-[#3EB1E5]" />
      </div>
    );
  }

  return (
    <>
      <SessionExpiredListener />
      <SessionTimeoutGuard
        enabled={guardEnabled}
        idleMs={idle.idleMs}
        warnSeconds={idle.warnSeconds}
      />
      <CollaboratorFirstLoginGate>{children}</CollaboratorFirstLoginGate>
    </>
  );
}
