'use client';

import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useEffect } from 'react';

import { useGetKitForNokQuery } from '@/services/kitApi';
import { useGetMyNextKinAccessQuery } from '@/services/authApi';
import { EnhancedSectionView } from '@/components/EnhancedSectionView';

export default function NextKinSectionPage() {
  const router = useRouter();
  const { sectionId } = useParams<{ sectionId: string }>();

  const token = Cookies.get('nok_auth_token');

  const { data: access } = useGetMyNextKinAccessQuery();
  const { data: kit, isLoading } = useGetKitForNokQuery();

  useEffect(() => {
    if (!token) router.replace('/next-kin/login');
  }, [token, router]);

  if (!token || isLoading || !kit) {
    return <div className="p-8 text-muted-foreground">Loading section…</div>;
  }

  return (
    <EnhancedSectionView
      formData={{}}
      sectionId={sectionId}
      nokData={access?.nextkin}
      kit={kit}
      onBack={() => router.push('/next-kin/dashboard')}
      onLogout={() => {
        Cookies.remove('nok_auth_token');
        router.replace('/next-kin');
      }}
      onOwnerLetterAccess={() => router.push('/next-kin/letter')}
      onDeliverMessages={() => router.push('/next-kin/messages')}
      sessionTime={15 * 60}
    />
  );
}
