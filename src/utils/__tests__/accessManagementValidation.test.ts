import { describe, expect, it } from 'vitest';
import {
  isDuplicateAccessEmail,
  validateAccessCredentialsStep,
  validateAccessPersonForSave,
  validateAccessPersonStep,
  validateAccessSectionsStep,
  validateAccessWizardStep,
} from '@/utils/accessManagementValidation';
import {
  formatRetryCountdown,
  parseAuthApiError,
} from '@/utils/authRateLimit';
import { isValidE164PhoneNumber } from '@/utils/phoneCountries';

describe('accessManagementValidation', () => {
  it('rejects empty person identity fields', () => {
    expect(validateAccessPersonStep({}).ok).toBe(false);
    expect(
      validateAccessPersonStep({
        full_name: '   ',
        email: 'a@b.com',
        relationship: 'Spouse',
      }).message,
    ).toMatch(/required/i);
  });

  it('rejects invalid email shape', () => {
    const result = validateAccessPersonStep({
      full_name: 'Jane Doe',
      email: 'not-an-email',
      relationship: 'Sister',
    });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/valid email/i);
  });

  it('accepts complete person identity', () => {
    expect(
      validateAccessPersonStep({
        full_name: 'Jane Doe',
        email: 'jane@example.com',
        relationship: 'Sister',
      }).ok,
    ).toBe(true);
  });

  it('requires sections for section-specific access', () => {
    const empty = validateAccessSectionsStep({
      access_level: 'Section-Specific Access',
      authorized_sections: [],
    });
    expect(empty.ok).toBe(false);

    const ok = validateAccessSectionsStep({
      access_level: 'Section-Specific Access',
      authorized_sections: ['1'],
    });
    expect(ok.ok).toBe(true);
  });

  it('allows full kit access without sections', () => {
    expect(
      validateAccessSectionsStep({
        access_level: 'Full Kit Access',
        authorized_sections: [],
      }).ok,
    ).toBe(true);
  });

  it('requires master password on credentials step', () => {
    expect(
      validateAccessCredentialsStep({
        immediate_access: true,
        master_password: '',
      }).message,
    ).toMatch(/login password/i);

    expect(
      validateAccessCredentialsStep({
        immediate_access: false,
        master_password: '   ',
      }).message,
    ).toMatch(/master password/i);

    expect(
      validateAccessCredentialsStep({
        master_password: 'SecurePass1!',
      }).ok,
    ).toBe(true);
  });

  it('blocks save when any required field is missing', () => {
    const result = validateAccessPersonForSave({
      full_name: '',
      email: 'a@b.com',
      relationship: 'Friend',
      access_level: 'Full Kit Access',
      master_password: 'x',
    });
    expect(result.ok).toBe(false);
  });

  it('allows save when all required fields are filled', () => {
    expect(
      validateAccessPersonForSave({
        full_name: 'Alex',
        email: 'alex@example.com',
        relationship: 'Friend',
        access_level: 'Full Kit Access',
        authorized_sections: [],
        master_password: 'TempPass123!',
      }).ok,
    ).toBe(true);
  });

  it('detects duplicate emails case-insensitively', () => {
    const people = [{ email: 'A@Example.com' }, { email: 'b@example.com' }];
    expect(isDuplicateAccessEmail('a@example.com', people)).toBe(true);
    expect(
      isDuplicateAccessEmail('a@example.com', people, { excludeIndex: 0 }),
    ).toBe(false);
  });

  it('routes wizard steps correctly', () => {
    expect(validateAccessWizardStep('review', {}).ok).toBe(true);
    expect(validateAccessWizardStep(undefined, {}).ok).toBe(false);
  });
});

describe('phoneCountries', () => {
  it('rejects empty and incomplete phone numbers', () => {
    expect(isValidE164PhoneNumber('')).toBe(false);
    expect(isValidE164PhoneNumber('123')).toBe(false);
  });

  it('accepts a valid E.164 US number', () => {
    expect(isValidE164PhoneNumber('+12025550123')).toBe(true);
  });
});

describe('authRateLimit', () => {
  it('formats countdown human-readably', () => {
    expect(formatRetryCountdown(45)).toBe('45s');
    expect(formatRetryCountdown(125)).toBe('2:05');
    expect(formatRetryCountdown(3700)).toBe('1h 1m');
  });

  it('parses retry-after from API error payloads', () => {
    const parsed = parseAuthApiError(
      {
        status: 429,
        data: { detail: 'Please try again in 45 seconds.' },
      },
      'fallback',
    );
    expect(parsed.status).toBe(429);
    expect(parsed.retryAfterSeconds).toBe(45);
  });
});
