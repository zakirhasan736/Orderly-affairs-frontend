'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { resolveApiBaseUrl } from '@/libs/apiBase';

function isApprovedStatus(value: string) {
  return value.trim().toLowerCase() === 'approved';
}

export default function DiditVerifyIdentityView() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId =
    params.get('verificationSessionId') ||
    params.get('session_id') ||
    params.get('verification_session_id') ||
    '';
  const hint = params.get('status') || '';
  const [status, setStatus] = useState(hint || 'checking');
  const [approved, setApproved] = useState(isApprovedStatus(hint));

  useEffect(() => {
    if (isApprovedStatus(hint)) {
      setApproved(true);
      setStatus(hint || 'Approved');
    }
    if (!sessionId) return;
    const base = resolveApiBaseUrl().replace(/\/$/, '');
    void fetch(
      `${base}/auth/didit/session-status?session_id=${encodeURIComponent(sessionId)}`,
      { credentials: 'include' },
    )
      .then(res => res.json())
      .then(data => {
        const nextStatus = String(data.status || hint || 'unknown');
        setStatus(nextStatus);
        setApproved(Boolean(data.approved) || isApprovedStatus(nextStatus));
      })
      .catch(() => {
        if (!isApprovedStatus(hint)) {
          setStatus(hint || 'unknown');
        }
      });
  }, [hint, sessionId]);

  useEffect(() => {
    if (!approved) return;
    const timer = window.setTimeout(() => {
      router.replace('/next-kin/dashboard');
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [approved, router]);

  const copy = useMemo(() => {
    if (approved) {
      return {
        title: 'Identity verified',
        body: 'Your ID and selfie check cleared. Opening the next-of-kin portal…',
      };
    }
    if (status === 'Declined' || status === 'Abandoned') {
      return {
        title: 'This check needs a person',
        body: 'It did not clear automatically. A person on our team will review it. You do not need to retry unless we ask you to.',
      };
    }
    if (status === 'In Review') {
      return {
        title: 'In review',
        body: 'Your documents are with our team. Nothing in the vault unlocks until that finishes and access is released.',
      };
    }
    return {
      title: 'Identity verification',
      body: 'If you just finished, give it a moment. If you still need to complete the ID and selfie, go back to the next-of-kin portal.',
    };
  }, [approved, status]);

  return (
    <div className="min-h-[100dvh] bg-[#F6F8FA]">
      <header className="border-b border-[#E4EAF0] bg-white">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <BrandLogo size={36} className="h-9 w-9" />
          <span className="text-sm font-semibold text-[#213D59]">
            Orderly Affairs
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-12">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#213D59] text-white">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-[24px] font-bold text-[#213D59]">{copy.title}</h1>
        <p className="mt-3 text-[15px] leading-6 text-[#414A55]">{copy.body}</p>
        <p className="mt-2 text-[13px] text-[#7A8794]">Status: {status || '—'}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/next-kin"
            className="inline-flex h-11 items-center rounded-xl bg-[#213D59] px-4 text-sm font-medium text-white"
          >
            Next of kin sign in
          </Link>
          <Link
            href="/next-kin/dashboard"
            className="inline-flex h-11 items-center rounded-xl border border-[#E4EAF0] bg-white px-4 text-sm font-medium text-[#213D59]"
          >
            Open portal
          </Link>
        </div>
      </main>
    </div>
  );
}

export function DiditVerifyIdentityFallback() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-[#F6F8FA]">
      <Loader2 className="h-8 w-8 animate-spin text-[#213D59]" />
    </div>
  );
}
