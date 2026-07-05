'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useGetKitForNokQuery } from '@/services/kitApi';
import { useGetMyNextKinAccessQuery } from '@/services/authApi';
import { EnhancedSectionView } from '@/components/EnhancedSectionView';
import { isHiddenFromNokDashboard } from '@/config/nokConfig';
import { nokLogout, fetchSession } from '@/libs/secureFetch';

export default function NextKinSectionPage() {
  const router = useRouter();
  const { sectionId } = useParams<{ sectionId: string }>();
  const [sessionReady, setSessionReady] = useState(false);

  const { data: access } = useGetMyNextKinAccessQuery();
  const { data: kit, isLoading } = useGetKitForNokQuery();

  useEffect(() => {
    fetchSession().then(session => {
      if (!session.authenticated || session.role !== 'nextkin') {
        router.replace('/next-kin');
        return;
      }
      setSessionReady(true);
    });
  }, [router]);

  useEffect(() => {
    if (sectionId && isHiddenFromNokDashboard(sectionId)) {
      router.replace('/next-kin/dashboard');
    }
  }, [sectionId, router]);

  if (!sessionReady || isLoading || !kit) {
    return <div className="p-8 text-muted-foreground">Loading section…</div>;
  }

  return (
    <EnhancedSectionView
      formData={{}}
      sectionId={sectionId}
      nokData={access?.nextkin}
      kit={kit}
      onBack={() => router.push('/next-kin/dashboard')}
      onLogout={async () => {
        try {
          await nokLogout();
        } catch {}
        router.replace('/next-kin');
      }}
      onOwnerLetterAccess={() => router.push('/next-kin/letter')}
      onDeliverMessages={() => router.push('/next-kin/messages')}
      sessionTime={15 * 60}
    />
  );
}
