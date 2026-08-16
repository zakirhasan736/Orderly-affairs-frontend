'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

import { useGetNokLetterQuery } from '@/services/nokLetterApi';
import { Button } from '@common/ui/button';
import { fetchSession } from '@/libs/secureFetch';

export default function NextKinLetterPage() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    fetchSession().then(session => {
      if (!session.authenticated || session.role !== 'nextkin') {
        router.replace('/next-kin');
        return;
      }
      if (String(session.access_type || '').toLowerCase() === 'family') {
        router.replace('/dashboard');
        return;
      }
      setSessionReady(true);
    });
  }, [router]);

  const { data: letter, isLoading } = useGetNokLetterQuery(undefined, {
    skip: !sessionReady,
  });

  if (!sessionReady || isLoading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#F6F8FA]">
        <p className="text-sm text-[#7A8794]">Loading letter…</p>
      </div>
    );
  }

  if (!letter) {
    return (
      <div className="min-h-[100dvh] bg-[#F6F8FA] px-6 py-10">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-[#2E7FAD]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <p className="mt-8 text-[#7A8794]">No personal letter available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F6F8FA] px-5 py-8 font-[family-name:var(--font-family)]">
      <div className="mx-auto max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-[#2E7FAD]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <article className="mt-6 rounded-[16px] border border-[#E4EAF0] bg-white p-6 sm:p-8">
          <h1 className="font-[family-name:var(--font-family-display)] text-[26px] font-normal text-[#213D59]">
            A letter from your loved one
          </h1>
          <div className="mt-6 whitespace-pre-wrap text-[15.5px] leading-[1.7] text-[#414A55]">
            {letter.letter_opening}

            {'\n\n'}

            {letter.closing_message}

            {'\n\n'}

            {letter.letter_signature}

            {'\n\n'}

            {letter.signer_name}
          </div>
        </article>
      </div>
    </div>
  );
}
