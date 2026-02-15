'use client';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { EnhancedNOKDashboard } from '@/components/EnhancedNOKDashboard';
import {
  useGetMyNextKinAccessQuery} from '@/services/authApi';
import { useEffect, useState } from 'react';
import { useGetKitForNokQuery } from '@/services/kitApi';
import { OwnerLetterModal } from '@/components/OwnerLetterModal';
import { MessagesDeliveryModal } from '@/components/MessagesDeliveryModal';
import { useNextkinLogoutMutation } from '@/services/authApi';

export default function NextKinDashboardPage() {
  const router = useRouter();
  const token = Cookies.get('nok_auth_token');
  const [showOwnerLetter, setShowOwnerLetter] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);

  const {
    data: access,
    isLoading,
    error,
  } = useGetMyNextKinAccessQuery();

  const { data: kit, isLoading: kitLoading } = useGetKitForNokQuery();
  const [nextkinLogout] = useNextkinLogoutMutation();
 
console.log('📦 KIT FOR NOK RESPONSE:', kit);
console.log('👤 KIT.NEXTKIN:', kit?.nextkin);

  useEffect(() => {
    if (!token) {
      router.replace('/next-kin/login');
    }
  }, [token, router]);

  if (!token) return null;

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
     // 🔥 REQUIRED
     Cookies.remove('nok_auth_token');

     toast.success('Logged out successfully');

     // 🔁 hard redirect to avoid back-button access
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


