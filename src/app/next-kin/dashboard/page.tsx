'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EnhancedNOKDashboard } from '@/components/EnhancedNOKDashboard';
import { useGetMyNextKinAccessQuery, useNextkinLogoutMutation } from '@/services/authApi';
import { useEffect, useState } from 'react';
import { useGetKitForNokQuery } from '@/services/kitApi';
import { OwnerLetterModal } from '@/components/OwnerLetterModal';
import { MessagesDeliveryModal } from '@/components/MessagesDeliveryModal';
import { nokLogout, fetchSession } from '@/libs/secureFetch';

export default function NextKinDashboardPage() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [showOwnerLetter, setShowOwnerLetter] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);

  const {
    data: access,
    isLoading,
    error,
  } = useGetMyNextKinAccessQuery();

  const { data: kit, isLoading: kitLoading } = useGetKitForNokQuery();
  const [nextkinLogout] = useNextkinLogoutMutation();

  useEffect(() => {
    fetchSession().then(session => {
      if (!session.authenticated || session.role !== 'nextkin') {
        router.replace('/next-kin');
        return;
      }
      setSessionReady(true);
    });
  }, [router]);

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

  if ((error as any)?.status === 403) {
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

  if (isLoading || kitLoading) {
    return <div>Loading dashboard…</div>;
  }

  return (
    <>
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
        sessionTime={15 * 60}
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
    </>
  );
}
