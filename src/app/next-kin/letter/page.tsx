'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useGetMyNextKinAccessQuery } from '@/services/authApi';
import { useGetNokLetterQuery } from '@/services/nokLetterApi';
import { Button } from '@common/ui/button';
import { fetchSession } from '@/libs/secureFetch';

export default function NextKinLetterPage() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);

  const { data: access } = useGetMyNextKinAccessQuery();

  useEffect(() => {
    fetchSession().then(session => {
      if (!session.authenticated || session.role !== 'nextkin') {
        router.replace('/next-kin');
        return;
      }
      setSessionReady(true);
    });
  }, [router]);

  const { data: letter, isLoading } = useGetNokLetterQuery();

  if (!sessionReady || isLoading) {
    return <div className="p-8">Loading letter…</div>;
  }

  if (!letter) {
    return (
      <div className="p-8 text-muted-foreground">
        No personal letter available.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-3xl">
      <Button variant="ghost" onClick={() => router.back()}>
        ← Back
      </Button>

      <h1 className="text-2xl font-semibold mt-6 mb-4">
        A Letter From Your Loved One
      </h1>

      <div className="prose max-w-none whitespace-pre-wrap">
        {letter.letter_opening}

        {'\n\n'}

        {letter.closing_message}

        {'\n\n'}

        {letter.letter_signature}
      </div>
    </div>
  );
}
