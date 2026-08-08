import { describe, expect, it } from 'vitest';
import {
  fieldShouldMask,
  isSensitiveFieldKey,
  maskSensitiveDisplay,
} from '@/utils/sensitiveFields';

describe('sensitiveFields', () => {
  it('masks SSN, account, routing, card, and password keys', () => {
    expect(isSensitiveFieldKey('social_security_number')).toBe(true);
    expect(isSensitiveFieldKey('account_number')).toBe(true);
    expect(isSensitiveFieldKey('routing_number')).toBe(true);
    expect(isSensitiveFieldKey('card_number')).toBe(true);
    expect(isSensitiveFieldKey('account_password')).toBe(true);
    expect(isSensitiveFieldKey('phone_password')).toBe(true);
  });

  it('does not mask usernames, emails, or license numbers', () => {
    expect(isSensitiveFieldKey('primary_email_username')).toBe(false);
    expect(isSensitiveFieldKey('drivers_license_number')).toBe(false);
    expect(isSensitiveFieldKey('vin')).toBe(false);
  });

  it('honors inputType password and sensitive labels', () => {
    expect(fieldShouldMask({ key: 'notes', inputType: 'password' })).toBe(true);
    expect(
      fieldShouldMask({ key: 'misc', label: 'Bank Account Number' }),
    ).toBe(true);
  });

  it('builds XXXX-style display masks', () => {
    expect(maskSensitiveDisplay('1234')).toBe('XXXX');
    expect(maskSensitiveDisplay('123456789')).toBe('XXXXX6789');
  });
});
