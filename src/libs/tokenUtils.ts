// src/libs/tokenUtils.ts
import { fetchSession } from '@/libs/secureFetch';
import { devError } from '@/utils/clientLogger';

export async function refreshAccessToken(): Promise<boolean> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  if (!API_BASE) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) return false;
    const session = await fetchSession();
    return session.authenticated === true;
  } catch (err) {
    devError('Token refresh error', err);
    return false;
  }
}
