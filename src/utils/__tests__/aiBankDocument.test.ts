import { describe, expect, it } from 'vitest';
import {
  correctBankStatementSectionKey,
  isBankStatementCandidate,
} from '@/utils/aiBankDocument';

describe('bank statement section routing', () => {
  it('recognizes a monthly bank statement even when an address is present', () => {
    expect(
      isBankStatementCandidate({
        documentSummary:
          'This is a monthly bank statement from Lakeshore National Bank for the account holders Jordan Michael Casey and Alexis Renee Casey.',
      }),
    ).toBe(true);
  });

  it('moves a bank statement off Main Residence', () => {
    expect(
      correctBankStatementSectionKey('main_residence', {
        documentSummary:
          'This is a monthly bank statement from Lakeshore National Bank.',
      }),
    ).toBe('banking_financial_accounts');
  });

  it('leaves mortgage statements on Main Residence', () => {
    expect(
      correctBankStatementSectionKey('main_residence', {
        documentSummary:
          'This is a mortgage statement from Lakeshore National Bank for the home.',
      }),
    ).toBe('main_residence');
  });
});
