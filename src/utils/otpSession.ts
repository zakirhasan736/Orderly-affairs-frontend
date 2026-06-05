const OTP_SESSION_KEY = 'orderly_otp_session_id';

function createSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `otp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOtpSessionId() {
  if (typeof window === 'undefined') return '';

  const existing = window.localStorage.getItem(OTP_SESSION_KEY);
  if (existing) return existing;

  const next = createSessionId();
  window.localStorage.setItem(OTP_SESSION_KEY, next);
  return next;
}

export function otpSessionHeaders() {
  const sessionId = getOtpSessionId();
  if (!sessionId) return {};

  return {
    'X-Otp-Session-Id': sessionId,
  };
}
