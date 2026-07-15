/**
 * Captcha / Cloudflare Turnstile gate.
 * Set NEXT_PUBLIC_OTP_CAPTCHA_ENABLED=false to unblock auth when Turnstile is broken.
 * Must match backend OTP_CAPTCHA_ENABLED=false.
 */
export const isCaptchaEnabled =
  process.env.NEXT_PUBLIC_OTP_CAPTCHA_ENABLED !== 'false';

/** Sent when captcha is disabled; backend ignores it if OTP_CAPTCHA_ENABLED=false. */
export const CAPTCHA_DISABLED_TOKEN = 'captcha-disabled';
