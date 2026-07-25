/**
 * Frontend drift guard: critical AI keys must exist in formConfig.
 * Run via: npx vitest run src/utils/__tests__/aiFieldDrift.test.ts
 */
import { describe, expect, it } from 'vitest';
import { formConfig } from '@/config/formConfig';

const CRITICAL_BY_SECTION: Record<string, string[]> = {
  '5': [
    'registration_expiry',
    'insurance_company',
    'insurance_policy',
  ],
  '7': ['policy_company', 'policy_number', 'policy_expiry', 'coverage_amount'],
  '8': ['organization_name', 'renewal_date', 'membership_details'],
  '12': [
    'bank_name',
    'cd_maturity_date',
    'last_statement_date',
    'subscription_renewal_date',
  ],
  '13': [
    'service_name',
    'subscription_renewal_date',
    'account_expiry_date',
  ],
};

function collectKeys(sectionId: string): Set<string> {
  const section = formConfig.chunks
    .flatMap(chunk => chunk.sections)
    .find(item => item.id === sectionId);
  const keys = new Set<string>();
  section?.subsections?.forEach(sub => {
    sub.fields?.forEach(field => {
      if (field?.key) keys.add(field.key);
    });
  });
  return keys;
}

describe('AI field drift (formConfig)', () => {
  Object.entries(CRITICAL_BY_SECTION).forEach(([sectionId, required]) => {
    it(`section ${sectionId} includes critical AI keys`, () => {
      const keys = collectKeys(sectionId);
      const missing = required.filter(key => !keys.has(key));
      expect(missing).toEqual([]);
    });
  });
});
