import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  readSafeErrorMessage,
  sanitizeFetchBaseQueryError,
} from '@/utils/sanitizeApiError';

describe('sanitizeApiError (HTTP response handling)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('passes through errors in non-production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const error = {
      status: 500,
      data: { detail: 'db stack' },
    } as any;
    expect(sanitizeFetchBaseQueryError(error)).toEqual(error);
  });

  it('keeps actionable 429/403 details in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const rateLimited = sanitizeFetchBaseQueryError({
      status: 429,
      data: { detail: 'Please try again in 45 seconds.', retry_after_seconds: 45 },
    } as any);
    expect(rateLimited.data).toMatchObject({
      detail: 'Please try again in 45 seconds.',
      retry_after_seconds: 45,
    });

    const forbidden = sanitizeFetchBaseQueryError({
      status: 403,
      data: { detail: 'Vault access is paused due to payment' },
    } as any);
    expect((forbidden.data as any).detail).toMatch(/payment/i);
  });

  it('reads safe messages from Response objects', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const res = new Response(JSON.stringify({ detail: 'Invalid OTP' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
    await expect(readSafeErrorMessage(res, 'fallback')).resolves.toBe(
      'Invalid OTP',
    );

    const limited = new Response('{}', {
      status: 429,
      headers: { 'Retry-After': '30' },
    });
    await expect(readSafeErrorMessage(limited, 'fallback')).resolves.toMatch(
      /30 seconds/i,
    );
  });
});
