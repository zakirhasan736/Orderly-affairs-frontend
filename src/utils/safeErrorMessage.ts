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
  if (
    parsed.status === 400 ||
    parsed.status === 409 ||
    parsed.status === 422
  ) {
    if (
      parsed.message &&
      parsed.message !== fallback &&
      !/internal|stack|traceback|exception/i.test(parsed.message)
    ) {
      return parsed.message;
    }
  }
  if (
    parsed.status === 400 &&
    /captcha|security check|otp|code|password/i.test(parsed.message)
  ) {
    return parsed.message;
  }
  return fallback;
}
