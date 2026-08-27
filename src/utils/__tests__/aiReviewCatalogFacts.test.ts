import { describe, expect, it } from 'vitest';
import { mergeFactsWithSectionCatalog } from '@/utils/aiReviewCatalogFacts';
import type { DetectedAiFact } from '@/utils/aiDashboardPatchCache';

function fact(
  partial: Partial<DetectedAiFact> & { label: string },
): DetectedAiFact {
  return {
    label: partial.label,
    value: partial.value || '',
    field_key: partial.field_key,
    subsection: partial.subsection,
    section_key: partial.section_key,
  };
}

describe('mergeFactsWithSectionCatalog', () => {
  it('keeps extracted values and adds empty catalog fields for Add', () => {
    const merged = mergeFactsWithSectionCatalog({
      facts: [
        fact({
          field_key: 'account_number',
          label: 'Account Number',
          value: '4471',
        }),
      ],
      sectionIds: ['12'],
    });
    const byKey = Object.fromEntries(
      merged.map(item => [item.field_key, item.value]),
    );
    expect(byKey.account_number).toBe('4471');
    expect(byKey.routing_number).toBe('');
    expect(byKey.bank_name).toBe('');
    expect(merged.some(item => item.field_key === 'routing_number')).toBe(true);
  });

  it('keeps empty catalog fields for every matched section', () => {
    const merged = mergeFactsWithSectionCatalog({
      facts: [
        fact({
          field_key: 'vin',
          label: 'VIN',
          value: '1HGCM82633A004352',
          section_key: 'vehicles',
        }),
      ],
      sectionIds: ['7', '5'],
    });
    const insurance = merged.filter(item =>
      String(item.section_key || '').includes('insurance'),
    );
    const vehicles = merged.filter(
      item =>
        item.section_key === 'vehicles' || item.field_key === 'vin',
    );
    expect(insurance.some(item => !item.value)).toBe(true);
    expect(vehicles.some(item => item.field_key === 'vin' && item.value)).toBe(
      true,
    );
    expect(
      merged.some(
        item => item.section_key === 'vehicles' && !item.value,
      ),
    ).toBe(true);
  });

  it('does not list generic issue date twice when license issue date is present', () => {
    const merged = mergeFactsWithSectionCatalog({
      facts: [
        fact({
          field_key: 'drivers_license_issue_date',
          label: 'Issue Date',
          value: '2020-11-10',
          section_key: 'vital_information',
        }),
        fact({
          field_key: 'issue_date',
          label: 'Issue date',
          value: '2020-11-10',
          section_key: 'vital_information',
        }),
        fact({
          field_key: 'full_legal_name',
          label: 'Full Legal Name (First, Middle, Last)',
          value: 'Sebastian Shahvandi',
          section_key: 'vital_information',
        }),
        fact({
          field_key: 'full_legal_name_on_id',
          label: 'Full legal name (on ID)',
          value: 'Sebastian Shahvandi',
          section_key: 'vital_information',
        }),
      ],
      sectionIds: ['1'],
    });
    const issueRows = merged.filter(
      item =>
        /issue/i.test(item.label) &&
        String(item.value || '').includes('2020'),
    );
    expect(issueRows).toHaveLength(1);
    expect(issueRows[0].field_key).toBe('drivers_license_issue_date');
    expect(
      merged.some(item => item.field_key === 'full_legal_name_on_id'),
    ).toBe(false);
  });
});
