'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useGetNokLetterQuery } from '@/services/nokLetterApi';
import { Button } from '@common/ui/button';
import { fetchSession } from '@/libs/secureFetch';
import { SessionTimeoutGuard } from '@/components/SessionTimeoutGuard';

export default function NextKinLetterPage() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [accessLevel, setAccessLevel] = useState<string | undefined>();

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

  const { data: letter, isLoading } = useGetNokLetterQuery(undefined, {
    skip: !sessionReady,
  });

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

  const idleMs = fullKit ? 3.5 * 60 * 1000 : 8 * 60 * 1000;

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
    <>
      <SessionTimeoutGuard idleMs={idleMs} warnSeconds={45} />
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

          {'\n\n'}

          {letter.signer_name}
        </div>
      </div>
    </>
  );
}
