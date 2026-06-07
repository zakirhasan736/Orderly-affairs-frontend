'use client';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useEffect } from 'react';

import { useGetMyNextKinAccessQuery } from '@/services/authApi';
import { useGetNokLetterQuery } from '@/services/nokLetterApi';
import { Button } from '@common/ui/button';

export default function NextKinLetterPage() {
  const router = useRouter();
  const token = Cookies.get('nok_auth_token');

  const { data: access } = useGetMyNextKinAccessQuery();
  // const { data: letters, isLoading } = useGetNokLetterQuery();

  useEffect(() => {
    if (!token) router.replace('/next-kin');
  }, [token, router]);

const { data: letter, isLoading } = useGetNokLetterQuery();

if (!token || isLoading) {
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
