'use client';

import { useEffect, useState } from 'react';
import { secureFetch } from '@/libs/secureFetch';

export interface TourStatus {
  version: string | null;
  has_completed: boolean;
  manually_started: boolean;
  last_run_at: string | null;
}

export const useTour = () => {
  const [status, setStatus] = useState<TourStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await secureFetch('/onboarding/status');
      if (!res.ok) {
        setStatus(null);
        return;
      }
      setStatus(await res.json());
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (payload: Partial<TourStatus>) => {
    const res = await secureFetch('/onboarding/status', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update tour status');
    await fetchStatus();
  };

  useEffect(() => {
    void fetchStatus();
  }, []);

  return { status, loading, updateStatus, refetch: fetchStatus };
};
