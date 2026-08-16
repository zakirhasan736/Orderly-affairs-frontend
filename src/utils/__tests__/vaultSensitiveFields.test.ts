import { describe, expect, it } from 'vitest';
import { splitSectionPayload } from '@/utils/vaultPrivacySplit';
import { lastFourDigits } from '@/utils/vaultSensitiveFields';

describe('finance last-4 split', () => {
  it('keeps last 4 on the server and full number in zk', () => {
    const { server, zk, device } = splitSectionPayload('12', {
      '12A': [
        {
          bank_name: 'Chase',
          account_number: '123456789012',
          routing_number: '021000021',
          account_documents: { text: '', files: [{ url: 'x' }] },
        },
      ],
    });
    const row = (server as { '12A': Array<Record<string, unknown>> })['12A'][0];
    expect(row.bank_name).toBe('Chase');
    expect(row.account_number).toBe('9012');
    expect(row.routing_number).toBeUndefined();
    expect(row.account_documents).toBeUndefined();
    const zkRow = (zk as { '12A': Array<Record<string, unknown>> })['12A'][0];
    expect(zkRow.account_number).toBe('123456789012');
    expect(zkRow.routing_number).toBe('021000021');
    const deviceRow = (device as { '12A': Array<Record<string, unknown>> })[
      '12A'
    ][0];
    expect(deviceRow.account_documents).toEqual({
      text: '',
      files: [{ url: 'x' }],
    });
  });

  it('projects insurance policy numbers to last 4 and keeps PDFs on device', () => {
    const { server, zk, device } = splitSectionPayload('7', {
      '7A': {
        carrier: 'State Farm',
        policy_number: 'POL-99887766',
        policy_documents: { files: [{ url: 'p.pdf' }] },
      },
    });
    const row = (server as { '7A': Record<string, unknown> })['7A'];
    expect(row.carrier).toBe('State Farm');
    expect(row.policy_number).toBe('7766');
    expect(row.policy_documents).toBeUndefined();
    expect(
      (zk as { '7A': Record<string, unknown> })['7A'].policy_number,
    ).toBe('POL-99887766');
    expect(
      (device as { '7A': Record<string, unknown> })['7A'].policy_documents,
    ).toEqual({ files: [{ url: 'p.pdf' }] });
  });

  it('keeps vital passwords out of the server payload', () => {
    const { server, zk } = splitSectionPayload('1', {
      '1A': {
        full_legal_name: 'Ada Lovelace',
        primary_email_password: 'secret',
      },
    });
    const row = (server as { '1A': Record<string, unknown> })['1A'];
    expect(row.full_legal_name).toBe('Ada Lovelace');
    expect(row.primary_email_password).toBeUndefined();
    expect(
      (zk as { '1A': Record<string, unknown> })['1A'].primary_email_password,
    ).toBe('secret');
  });

  it('extracts last four digits from wrapped upload fields', () => {
    expect(lastFourDigits({ text: '**** 4412' })).toBe('4412');
  });
});
