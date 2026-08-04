/** Session helpers — cookie refresh goes through CSRF-aware secureFetch paths. */

import { ensureFreshSession, fetchSession } from '@/libs/secureFetch';
import { devError } from '@/utils/clientLogger';

/**
 * Refresh the HttpOnly access cookie via the shared CSRF-aware refresh path.
 * Prefer ensureFreshSession / secureFetch for new code.
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const ok = await ensureFreshSession();
    if (!ok) return false;
    const session = await fetchSession();
    return session.authenticated === true;
  } catch (err) {
    devError('Token refresh error', err);
    return false;
  }
}
