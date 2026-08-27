import { describe, expect, it } from 'vitest';
import {
  formatDateOnly,
  formatDateOnlyDisplay,
  formatDateOnlyDisplayValue,
  parseDateOnly,
  toDateOnlyString,
} from '@/utils/dateOnly';
import { applySection1AIPatch } from '@/utils/applySection1AIPatch';

describe('dateOnly', () => {
  it('parses YYYY-MM-DD as a local calendar date (no UTC off-by-one)', () => {
    const date = parseDateOnly('1978-09-15');
    expect(date).toBeTruthy();
    expect(formatDateOnlyDisplay(date!)).toBe('09/15/1978');
    expect(formatDateOnly(date!)).toBe('1978-09-15');
  });

  it('parses ISO midnight UTC using the date prefix, not local shift', () => {
    const date = parseDateOnly('1978-09-15T00:00:00.000Z');
    expect(formatDateOnlyDisplay(date!)).toBe('09/15/1978');
  });

  it('normalizes slash dates to YYYY-MM-DD', () => {
    expect(toDateOnlyString('09/15/1978')).toBe('1978-09-15');
    expect(toDateOnlyString('9/15/78')).toBe('1978-09-15');
  });

  it('displays stored ISO dates as US MM/DD/YYYY', () => {
    expect(formatDateOnlyDisplayValue('1983-09-15')).toBe('09/15/1983');
    expect(formatDateOnlyDisplayValue('2020-11-10')).toBe('11/10/2020');
    expect(formatDateOnlyDisplayValue('Sebastian')).toBe('Sebastian');
  });
});

describe('applySection1AIPatch date normalization', () => {
  it('stores DOB as YYYY-MM-DD even when AI returns an ISO timestamp', () => {
    const result = applySection1AIPatch(
      { vital_info: {} },
      {
        vital_info: {
          full_legal_name: 'Sebastian Shahvandi',
          date_of_birth: '1978-09-15T00:00:00.000Z',
        },
      },
    );
    expect(result.vital_info.date_of_birth).toBe('1978-09-15');
  });
});
