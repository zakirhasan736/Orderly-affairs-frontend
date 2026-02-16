'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

const API = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface TourStatus {
  version: string | null;
  has_completed: boolean;
  manually_started: boolean;
  last_run_at: string | null;
}

export const useTour = () => {
  const [status, setStatus] = useState<TourStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = () =>
    Cookies.get('auth_token') || Cookies.get('nok_auth_token');

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API}/onboarding/status`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch tour status');
      }

      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Tour status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (payload: {
    has_completed?: boolean;
    manually_started?: boolean;
    version?: string;
  }) => {
    try {
      await fetch(`${API}/onboarding/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      await fetchStatus();
    } catch (err) {
      console.error('Tour update error:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return {
    status,
    loading,
    updateStatus,
    refetch: fetchStatus,
  };
};
