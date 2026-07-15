'use client';

import { useEffect, useState } from 'react';
import { fetchSession } from '@/libs/secureFetch';
import { useGetStatusQuery } from '@/services/billingApi';
import { BillingLockPanel } from '@/components/BillingLockPanel';

/**
 * When trial/payment fails, owner can still open /dashboard but only sees
 * the payment unlock UI — vault sections stay locked.
 */
export function BillingAccessGate({ children }: { children: React.ReactNode }) {
  const { data: status, isLoading, refetch } = useGetStatusQuery();
  const [sessionBillingOnly, setSessionBillingOnly] = useState<boolean | null>(
    null,
  );
  const [lockMessage, setLockMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchSession().then(session => {
      if (cancelled) return;
      setSessionBillingOnly(Boolean(session.billing_only));
      setLockMessage(session.lock_message ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading || sessionBillingOnly === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-sm text-slate-500">
        Checking account access…
      </div>
    );
  }

  const billingOnly =
    Boolean(status?.billing_only) || Boolean(sessionBillingOnly);

  if (billingOnly) {
    return (
      <BillingLockPanel
        message={status?.lock_message || lockMessage}
        onResolved={() => {
          void refetch();
          setSessionBillingOnly(false);
        }}
      />
    );
  }

  return <>{children}</>;
}
