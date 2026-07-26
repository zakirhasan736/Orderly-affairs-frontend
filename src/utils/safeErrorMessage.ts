/**
 * Returns a safe user-facing error message.
 * Rate-limit details are surfaced; auth enumeration details stay masked.
 */
import { parseAuthApiError } from '@/utils/authRateLimit';

export function getSafeErrorMessage(err: unknown, fallback: string): string {
  const parsed = parseAuthApiError(err, fallback);
  if (parsed.status === 429) {
    return parsed.message;
  }

  const detail = (parsed.message || '').trim();
  if (/captcha|security check|turnstile/i.test(detail)) {
    return 'Security check expired or already used. Complete the Cloudflare check again, then retry.';
  }

  if (
    parsed.status === 400 ||
    parsed.status === 403 ||
    parsed.status === 409 ||
    parsed.status === 422
  ) {
    if (
      detail &&
      detail !== fallback &&
      !/internal|stack|traceback|exception/i.test(detail)
    ) {
      return detail;
    }
  }
  if (parsed.status === 401) {
    return detail && detail !== fallback
      ? detail
      : 'Invalid email or password';
  }
  return fallback;
}
