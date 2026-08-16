import { describe, expect, it } from 'vitest';
import { composeEntryTitle, entryDrawerTitle } from '@/vault-prototype/entryDisplayTitle';
import { layoutSchemaFields, schemaFieldIsHalf } from '@/vault-prototype/fieldLayout';
import { schemaByApiId } from '@/vault-prototype/schemaDataBridge';
import { previewAiFillAgainstVault } from '@/utils/aiFillPreview';
import type { SchemaField, SchemaSub } from '@/vault-prototype/types';

describe('entry titles', () => {
  it('names a vehicle from year make model', () => {
    expect(
      composeEntryTitle({ year: '2022', make: 'Honda', model: 'CR-V' }),
    ).toBe('2022 Honda CR-V');
  });

  it('uses the live draft in add/edit drawer titles', () => {
    const sub: SchemaSub = {
      id: 'current-vehicles',
      name: 'Current Vehicles',
      kind: 'entries',
      entry: 'vehicle',
      fields: [],
    };
    expect(entryDrawerTitle('add', sub, {})).toBe('Add vehicle');
    expect(
      entryDrawerTitle('add', sub, { year: '2022', make: 'Honda', model: 'CR-V' }),
    ).toBe('Add 2022 Honda CR-V');
    expect(
      entryDrawerTitle('edit', sub, { make: 'Honda', model: 'CR-V' }),
    ).toBe('Edit Honda CR-V');
  });
});

describe('two-column field layout', () => {
  it('marks short vehicle fields as half width', () => {
    const section = schemaByApiId('5');
    const vehicles = section?.subs.find(sub => sub.id === 'current-vehicles');
    const year = vehicles?.fields.find(field => field.store === 'year');
    const vin = vehicles?.fields.find(field => field.store === 'vin');
    const financing = vehicles?.fields.find(field => field.store === 'financing');
    expect(year && schemaFieldIsHalf(year)).toBe(true);
    expect(vin && schemaFieldIsHalf(vin)).toBe(true);
    expect(financing && schemaFieldIsHalf(financing)).toBe(false);
  });

  it('pairs year with VIN and make with model', () => {
    const fields: SchemaField[] = [
      { k: 'Year', t: 'text', store: 'year', w: 'half' },
      { k: 'Make', t: 'text', store: 'make', w: 'half' },
      { k: 'Model', t: 'text', store: 'model', w: 'half' },
      { k: 'VIN', t: 'text', store: 'vin', w: 'half' },
    ];
    expect(layoutSchemaFields(fields).map(field => field.store)).toEqual([
      'year',
      'vin',
      'make',
      'model',
    ]);
  });

  it('packs leftover short fields onto one row', () => {
    const fields: SchemaField[] = [
      { k: 'Year', t: 'text', store: 'year' },
      { k: 'Notes', t: 'long', store: 'notes' },
      { k: 'Color', t: 'text', store: 'color' },
    ];
    expect(layoutSchemaFields(fields).map(field => field.store)).toEqual([
      'year',
      'color',
      'notes',
    ]);
  });
});

describe('AI fill preview', () => {
  it('detects an existing vehicle with the same data', () => {
    const preview = previewAiFillAgainstVault({
      sectionId: '5',
      facts: [
        { label: 'Year', field_key: 'year', value: '2022' },
        { label: 'Make', field_key: 'make', value: 'Honda' },
        { label: 'Model', field_key: 'model', value: 'CR-V' },
        { label: 'VIN', field_key: 'vin', value: '5J8TB4H50NL014723' },
      ],
      sectionData: {
        '5A': [
          {
            year: '2022',
            make: 'Honda',
            model: 'CR-V',
            vin: '5J8TB4H50NL014723',
          },
        ],
      },
    });
    expect(preview.kind).toBe('same');
    expect(preview.title).toBe('2022 Honda CR-V');
    expect(preview.fieldKind.vin).toBe('same');
  });

  it('detects new data on an existing vehicle', () => {
    const preview = previewAiFillAgainstVault({
      sectionId: '5',
      facts: [
        { label: 'Year', field_key: 'year', value: '2022' },
        { label: 'Make', field_key: 'make', value: 'Honda' },
        { label: 'Model', field_key: 'model', value: 'CR-V' },
        { label: 'Color', field_key: 'color', value: 'Blue' },
      ],
      sectionData: {
        '5A': [{ year: '2022', make: 'Honda', model: 'CR-V' }],
      },
    });
    expect(preview.kind).toBe('update');
    expect(preview.fieldKind.color).toBe('new');
  });

  it('treats a new vehicle as a new fill', () => {
    const preview = previewAiFillAgainstVault({
      sectionId: '5',
      facts: [
        { label: 'Make', field_key: 'make', value: 'Toyota' },
        { label: 'Model', field_key: 'model', value: 'Camry' },
      ],
      sectionData: {
        '5A': [{ year: '2022', make: 'Honda', model: 'CR-V' }],
      },
    });
    expect(preview.kind).toBe('new');
    expect(preview.matchedItem).toBeUndefined();
    expect(preview.title).toBe('Toyota Camry');
  });
});
