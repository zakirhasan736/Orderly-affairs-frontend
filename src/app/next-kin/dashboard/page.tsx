'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EnhancedNOKDashboard } from '@/components/EnhancedNOKDashboard';
import { useGetMyNextKinAccessQuery, useNextkinLogoutMutation } from '@/services/authApi';
import { useEffect, useMemo, useState } from 'react';
import { useGetKitForNokQuery } from '@/services/kitApi';
import { OwnerLetterModal } from '@/components/OwnerLetterModal';
import { MessagesDeliveryModal } from '@/components/MessagesDeliveryModal';
import { nokLogout, fetchSession } from '@/libs/secureFetch';
import { HelpAssistantProvider } from '@/components/help/HelpAssistantContext';
import { HelpAssistantHost } from '@/components/help/HelpAssistantHost';
import { SessionTimeoutGuard } from '@/components/SessionTimeoutGuard';
import {
  NokVaultUnlockBanner,
  useNokKitDecrypt,
} from '@/hooks/useNokKitDecrypt';

export default function NextKinDashboardPage() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [accessLevel, setAccessLevel] = useState<string | undefined>();
  const [showOwnerLetter, setShowOwnerLetter] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);

  const {
    data: access,
    isLoading,
    error,
  } = useGetMyNextKinAccessQuery();

  const { data: kitRaw, isLoading: kitLoading } = useGetKitForNokQuery();
  const {
    kit,
    vaultGate,
    unlockPassword,
    setUnlockPassword,
    unlockBusy,
    handleUnlock,
  } = useNokKitDecrypt(kitRaw);
  const [nextkinLogout] = useNextkinLogoutMutation();

  useEffect(() => {
    fetchSession().then(session => {
      if (!session.authenticated || session.role !== 'nextkin') {
        router.replace('/next-kin');
        return;
      }
      setAccessLevel(session.access_level);
      setSessionReady(true);
    });
  }, [router]);

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

  // Full Kit JWT = 5 min; section JWT = 10 min. Warn before token dies.
  const sessionSeconds = fullKit ? 5 * 60 : 10 * 60;
  const idleMs = fullKit ? 3.5 * 60 * 1000 : 8 * 60 * 1000;

  if (!sessionReady) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">Loading dashboard…</div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      const { lockE2ee } = await import('@/libs/e2ee/unlock');
      lockE2ee();
      await nextkinLogout({}).unwrap();
    } catch {
      // logout should NEVER fail UX
    } finally {
      try {
        await nokLogout();
      } catch {}
      toast.success('Logged out successfully');
      router.replace('/next-kin');
    }
  };

  if ((error as { status?: number })?.status === 403) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">Awaiting owner approval</div>
      </div>
    );
  }

  if (!access) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">Unable to load access</div>
      </div>
    );
  }

  if (isLoading || kitLoading || vaultGate === 'checking') {
    return <div>Loading dashboard…</div>;
  }

  return (
    <HelpAssistantProvider>
      <SessionTimeoutGuard idleMs={idleMs} warnSeconds={45} />
      <div className="px-4 pt-4">
        <NokVaultUnlockBanner
          vaultGate={vaultGate}
          unlockPassword={unlockPassword}
          setUnlockPassword={setUnlockPassword}
          unlockBusy={unlockBusy}
          onUnlock={() => void handleUnlock()}
        />
      </div>
      <EnhancedNOKDashboard
        nokData={access.nextkin}
        kit={kit}
        onViewSection={sectionId =>
          router.push(`/next-kin/section/${sectionId}`)
        }
        formData={{}}
        onLogout={handleLogout}
        onOwnerLetterAccess={() => setShowOwnerLetter(true)}
        onDeliverMessages={() => setShowMessagesModal(true)}
        sessionTime={sessionSeconds}
      />
      {showOwnerLetter && (
        <OwnerLetterModal
          nokData={kit?.nextkin}
          onClose={() => setShowOwnerLetter(false)}
        />
      )}

      {showMessagesModal && (
        <MessagesDeliveryModal
          nokData={kit?.nextkin}
          kit={kit}
          formData={{}}
          onClose={() => setShowMessagesModal(false)}
        />
      )}

      <HelpAssistantHost
        currentSectionId={null}
        onStartTour={() => undefined}
        onNavigateToSection={sectionId =>
          router.push(`/next-kin/section/${sectionId}`)
        }
        onFocusUpload={() => undefined}
      />
    </HelpAssistantProvider>
  );
}
