/**
 * Captcha / Cloudflare Turnstile gate.
 * Set NEXT_PUBLIC_OTP_CAPTCHA_ENABLED=false to unblock auth when Turnstile is broken.
 * Must match backend OTP_CAPTCHA_ENABLED=false.
 * Cypress E2E always disables the gate (window.Cypress).
 */
export function isCaptchaEnabledNow(): boolean {
  if (typeof window !== 'undefined') {
    const win = window as Window & { Cypress?: unknown };
    if (win.Cypress) return false;
  }
  return process.env.NEXT_PUBLIC_OTP_CAPTCHA_ENABLED !== 'false';
}

/** Static build-time flag (prefer isCaptchaEnabledNow in React UI). */
export const isCaptchaEnabled =
  process.env.NEXT_PUBLIC_OTP_CAPTCHA_ENABLED !== 'false';

/** Sent when captcha is disabled; backend ignores it if OTP_CAPTCHA_ENABLED=false. */
export const CAPTCHA_DISABLED_TOKEN = 'captcha-disabled';
