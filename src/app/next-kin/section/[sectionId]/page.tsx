'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useGetKitForNokQuery } from '@/services/kitApi';
import { useGetMyNextKinAccessQuery } from '@/services/authApi';
import { EnhancedSectionView } from '@/components/EnhancedSectionView';
import { isHiddenFromNokDashboard } from '@/config/nokConfig';
import { nokLogout, fetchSession } from '@/libs/secureFetch';
import { SessionTimeoutGuard } from '@/components/SessionTimeoutGuard';
import {
  NokVaultUnlockBanner,
  useNokKitDecrypt,
} from '@/hooks/useNokKitDecrypt';

function SectionSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-[#f6f8fb]">
      <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-[1480px] items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-9 w-16 animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
      <div className="mx-auto max-w-[1480px] space-y-3 px-4 py-5">
        <div className="h-24 animate-pulse rounded-2xl bg-white" />
        <div className="h-40 animate-pulse rounded-2xl bg-white" />
      </div>
    </div>
  );
}

export default function NextKinSectionPage() {
  const router = useRouter();
  const { sectionId } = useParams<{ sectionId: string }>();
  const [accessLevel, setAccessLevel] = useState<string | undefined>();

  const { data: access } = useGetMyNextKinAccessQuery();
  const { data: kitRaw, isLoading: kitLoading } = useGetKitForNokQuery();
  const {
    kit,
    vaultGate,
    unlockPassword,
    setUnlockPassword,
    unlockBusy,
    handleUnlock,
  } = useNokKitDecrypt(kitRaw);

  useEffect(() => {
    let cancelled = false;
    void fetchSession().then(session => {
      if (cancelled) return;
      if (!session.authenticated || session.role !== 'nextkin') {
        router.replace('/next-kin');
        return;
      }
      setAccessLevel(session.access_level);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (sectionId && isHiddenFromNokDashboard(sectionId)) {
      router.replace('/next-kin/dashboard');
    }
  }, [sectionId, router]);

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

  const sessionSeconds = fullKit ? 5 * 60 : 10 * 60;
  const idleMs = fullKit ? 3.5 * 60 * 1000 : 8 * 60 * 1000;

  if ((kitLoading && !kit) || !kit || vaultGate === 'checking') {
    return <SectionSkeleton />;
  }

  return (
    <>
      <SessionTimeoutGuard idleMs={idleMs} warnSeconds={45} />
      <div className="bg-[#f6f8fb] px-4 pt-4">
        <NokVaultUnlockBanner
          vaultGate={vaultGate}
          unlockPassword={unlockPassword}
          setUnlockPassword={setUnlockPassword}
          unlockBusy={unlockBusy}
          onUnlock={() => void handleUnlock()}
        />
      </div>
      <EnhancedSectionView
        formData={{}}
        sectionId={sectionId}
        nokData={access?.nextkin ?? {}}
        kit={kit}
        onBack={() => router.push('/next-kin/dashboard')}
        onLogout={async () => {
          try {
            const { lockE2ee } = await import('@/libs/e2ee/unlock');
            lockE2ee();
            await nokLogout();
          } catch {}
          router.replace('/next-kin');
        }}
        onOwnerLetterAccess={() => router.push('/next-kin/letter')}
        onDeliverMessages={() => router.push('/next-kin/messages')}
        sessionTime={sessionSeconds}
      />
    </>
  );
}
