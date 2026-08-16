import { describe, expect, it } from 'vitest';
import { formConfig } from '@/config/formConfig';
import { fromSchemaView, schemaByApiId, toSchemaView } from '@/vault-prototype/schemaDataBridge';
import { mergeFactsWithSectionCatalog } from '@/utils/aiReviewCatalogFacts';

const SKIP_TYPES = new Set([
  'Instructions',
  'InstructionsModal',
  'AccessManagement',
  'NextOfKinLetter',
  'LettersToNextOfKin',
]);

describe('schema field completeness', () => {
  it('keeps every stored insurance field on each policy subsection', () => {
    const section = schemaByApiId('7');
    const life = section?.subs.find(sub => sub.id === 'life-insurance');
    const stores = new Set(life?.fields.map(field => field.store).filter(Boolean));
    expect(stores.has('policy_company')).toBe(true);
    expect(stores.has('policy_number')).toBe(true);
    expect(stores.has('policy_expiry')).toBe(true);
    expect(stores.has('beneficiaries')).toBe(true);
    expect(stores.has('policy_documents')).toBe(true);
    expect(stores.has('premium_info')).toBe(true);
    expect(stores.has('member_id')).toBe(true);
  });

  it('maps insurance renewal / expiry onto policy_expiry', () => {
    const stored = {
      '7A': [
        {
          policy_type: 'Homeowner/Renter',
          policy_company: 'State Farm',
          policy_expiry: '2027-03-01',
        },
      ],
    };
    const view = toSchemaView('7', stored);
    const row = (view['home-property-insurance'] as Array<Record<string, unknown>>)[0];
    expect(row.policy_expiry).toBe('2027-03-01');

    const next = fromSchemaView('7', stored, {
      ...view,
      'home-property-insurance': [{ ...row, policy_expiry: '2028-04-15' }],
    });
    expect((next['7A'] as Array<Record<string, unknown>>)[0].policy_expiry).toBe('2028-04-15');
    expect((next['7A'] as Array<Record<string, unknown>>)[0].policy_type).toBe('Homeowner/Renter');
  });

  it('does not map license expiration onto insurance or identity dates', () => {
    const stored = {
      vital_info: {
        drivers_license_expiration_date: '2029-11-01',
        full_legal_name: 'Maria Alvarez',
      },
    };
    const view = toSchemaView('1', stored);
    const license = view['drivers-license'] as Record<string, unknown>;
    expect(
      license.drivers_license_expiration_date || license.expiration_date,
    ).toBe('2029-11-01');
    const personal = view['personal-details'] as Record<string, unknown>;
    expect(personal.full_legal_name).toBe('Maria Alvarez');
  });

  it('does not keep HTML-only labels that were never in the stored catalog', () => {
    const section = schemaByApiId('1');
    const personal = section?.subs.find(sub => sub.id === 'personal-details');
    const labels = (personal?.fields || []).map(field => field.k.toLowerCase());
    expect(labels.some(label => label.includes('pronoun'))).toBe(false);
    expect(personal?.fields.every(field => Boolean(field.store))).toBe(true);
  });

  it('adds missing legal tax fields instead of dropping them', () => {
    const section = schemaByApiId('20');
    const stores = new Set(
      section?.subs.flatMap(sub => sub.fields.map(field => field.store).filter(Boolean)),
    );
    expect(stores.has('current_tax_year')).toBe(true);
    expect(stores.has('adoption_documents')).toBe(true);
    expect(stores.has('expiration_date')).toBe(true);
  });

  it('includes every banking subsection in AI review catalog', () => {
    const merged = mergeFactsWithSectionCatalog({
      facts: [{ label: 'Account Number', field_key: 'account_number', value: '4471' }],
      sectionIds: ['12'],
    });
    const keys = merged.map(item => item.field_key);
    expect(keys).toContain('account_number');
    expect(keys).toContain('routing_number');
    expect(keys).toContain('subscription_renewal_date');
    expect(keys).toContain('cd_maturity_date');
  });

  it('keeps every stored formConfig input on the HTML section', () => {
    const skipSections = new Set(['2', '3', '4']);
    const missingBySection: Record<string, string[]> = {};
    formConfig.chunks.forEach(chunk => {
      chunk.sections.forEach(section => {
        if (skipSections.has(section.id)) return;
        const schema = schemaByApiId(section.id);
        const stores = new Set(
          (schema?.subs || []).flatMap(sub =>
            sub.fields.map(field => field.store).filter(Boolean),
          ),
        );
        const keys: string[] = [];
        section.subsections.forEach(sub => {
          (sub.fields || []).forEach(field => {
            if (field?.key && !SKIP_TYPES.has(String(field.type))) keys.push(field.key);
          });
          (sub.groups || []).forEach(group => {
            (group.fields || []).forEach(field => {
              if (field?.key && !SKIP_TYPES.has(String(field.type))) keys.push(field.key);
            });
          });
        });
        const missing = [...new Set(keys)].filter(key => !stores.has(key));
        if (missing.length) missingBySection[section.id] = missing;
      });
    });
    expect(missingBySection).toEqual({});
  });
});
