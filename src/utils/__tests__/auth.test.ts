import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  AUTH_RATE_LIMIT_FALLBACK_SECONDS,
  formatRetryCountdown,
  parseAuthApiError,
} from '@/utils/authRateLimit';
import { getSafeErrorMessage } from '@/utils/safeErrorMessage';
import { getOtpSessionId, otpSessionHeaders } from '@/utils/otpSession';
import { CAPTCHA_DISABLED_TOKEN, isCaptchaEnabled } from '@/utils/captchaConfig';
import {
  buildE164PhoneNumber,
  extractDigits,
  getPhoneValidationError,
  isValidE164PhoneNumber,
  isValidPhoneForCountry,
  processNationalNumberInput,
} from '@/utils/phoneCountries';

describe('authRateLimit', () => {
  it('formats countdown for seconds, minutes, and hours', () => {
    expect(formatRetryCountdown(0)).toBe('0s');
    expect(formatRetryCountdown(45)).toBe('45s');
    expect(formatRetryCountdown(125)).toBe('2:05');
    expect(formatRetryCountdown(3700)).toBe('1h 1m');
    expect(formatRetryCountdown(7200)).toBe('2h');
  });

  it('parses retry_after_seconds from payload', () => {
    const parsed = parseAuthApiError(
      { status: 429, data: { detail: 'Slow down', retry_after_seconds: 90 } },
      'fallback',
    );
    expect(parsed.retryAfterSeconds).toBe(90);
    expect(parsed.message).toMatch(/try again/i);
  });

  it('falls back to 45s when 429 has no wait hint', () => {
    const parsed = parseAuthApiError(
      { status: 429, data: { detail: 'Too many requests' } },
      'fallback',
    );
    expect(parsed.retryAfterSeconds).toBe(AUTH_RATE_LIMIT_FALLBACK_SECONDS);
  });

  it('parses nested error wrappers and minute text', () => {
    const nested = parseAuthApiError(
      { error: { status: 400, data: { message: 'Invalid code' } } },
      'fallback',
    );
    expect(nested.status).toBe(400);
    expect(nested.message).toBe('Invalid code');

    const minutes = parseAuthApiError(
      { status: 429, data: { detail: 'Try again in 2 minutes.' } },
      'fallback',
    );
    expect(minutes.retryAfterSeconds).toBe(120);
  });

  it('clamps wait display to 30 minutes', () => {
    const parsed = parseAuthApiError(
      { status: 429, data: { detail: 'Wait', retry_after_seconds: 99999 } },
      'fallback',
    );
    expect(parsed.retryAfterSeconds).toBe(30 * 60);
  });
});

describe('safeErrorMessage', () => {
  it('surfaces 429 and actionable 400/422 details', () => {
    expect(
      getSafeErrorMessage(
        { status: 429, data: { detail: 'Please try again in 30 seconds.' } },
        'fallback',
      ),
    ).toMatch(/try again/i);

    expect(
      getSafeErrorMessage(
        { status: 400, data: { detail: 'Email already in use' } },
        'Save failed',
      ),
    ).toBe('Email already in use');

    expect(
      getSafeErrorMessage(
        { status: 422, data: { detail: 'Master password is required' } },
        'Save failed',
      ),
    ).toBe('Master password is required');
  });

  it('masks internal stack traces and unknown 500s', () => {
    expect(
      getSafeErrorMessage(
        { status: 400, data: { detail: 'Traceback: boom' } },
        'Save failed',
      ),
    ).toBe('Save failed');

    expect(
      getSafeErrorMessage(
        { status: 500, data: { detail: 'db exploded' } },
        'Something went wrong',
      ),
    ).toBe('Something went wrong');
  });
});

describe('otpSession', () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(store).forEach(key => delete store[key]);
    const localStorageMock = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
    };
    vi.stubGlobal('window', {
      localStorage: localStorageMock,
    });
    vi.stubGlobal('localStorage', localStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a stable session id and headers', () => {
    const first = getOtpSessionId();
    const second = getOtpSessionId();
    expect(first).toBeTruthy();
    expect(second).toBe(first);
    expect(otpSessionHeaders()['X-Otp-Session-Id']).toBe(first);
  });

  it('returns empty id when window is unavailable', () => {
    vi.stubGlobal('window', undefined);
    expect(getOtpSessionId()).toBe('');
    expect(otpSessionHeaders()).toEqual({});
  });
});

describe('captchaConfig', () => {
  it('exposes disabled token constant', () => {
    expect(CAPTCHA_DISABLED_TOKEN).toBe('captcha-disabled');
    expect(typeof isCaptchaEnabled).toBe('boolean');
  });
});

describe('phoneCountries (auth)', () => {
  it('extracts digits and builds US E.164', () => {
    expect(extractDigits('(202) 555-0123')).toBe('2025550123');
    expect(buildE164PhoneNumber('US', '2025550123')).toBe('+12025550123');
    expect(isValidE164PhoneNumber('+12025550123')).toBe(true);
    expect(isValidPhoneForCountry('US', '2025550123')).toBe(true);
  });

  it('keeps US country when typing national digits (no Chile steal)', () => {
    const processed = processNationalNumberInput('5628835494', 'US');
    expect(processed.countryCode).toBe('US');
    expect(extractDigits(processed.nationalNumber)).toBe('5628835494');
  });

  it('re-detects country only for explicit international prefix', () => {
    const processed = processNationalNumberInput('+442071838750', 'US');
    expect(processed.countryCode).toBe('GB');
  });

  it('returns validation errors for short numbers only when digits exist', () => {
    expect(getPhoneValidationError('US', '')).toBeNull();
    expect(getPhoneValidationError('US', '12')).toMatch(/short|number/i);
  });
});
