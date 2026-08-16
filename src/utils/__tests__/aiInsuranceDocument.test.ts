import { describe, expect, it } from 'vitest';
import {
  isHealthInsuranceCardCandidate,
  isVehicleInsuranceDocument,
} from '@/utils/aiInsuranceDocument';

describe('insurance kind matching', () => {
  it('treats an auto ID card filename as vehicle insurance, not health', () => {
    const args = {
      fileName: 'Auto_Insurance_ID_Card_Honda_CRV_SAMPLE.png',
      documentSummary: 'Auto insurance identification card for a Honda CR-V.',
    };
    expect(isVehicleInsuranceDocument(args)).toBe(true);
    expect(isHealthInsuranceCardCandidate(args)).toBe(false);
  });

  it('does not treat generic “insurance card” as health', () => {
    expect(
      isHealthInsuranceCardCandidate({
        fileName: 'insurance_card.png',
        documentSummary: 'Insurance identification card.',
      }),
    ).toBe(false);
  });

  it('recognizes a health member card', () => {
    const args = {
      fileName: 'UHC_member_card.png',
      documentSummary:
        'UnitedHealthcare health insurance card with Member ID and RxBIN.',
    };
    expect(isHealthInsuranceCardCandidate(args)).toBe(true);
    expect(isVehicleInsuranceDocument(args)).toBe(false);
  });
});
