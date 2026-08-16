import { describe, expect, it } from 'vitest';
import type { SchemaField } from '@/vault-prototype/types';
import {
  partitionSchemaFields,
  schemaFieldPreview,
  schemaValueIsFilled,
} from '@/vault-prototype/schemaFieldPreview';

const routing: SchemaField = {
  k: 'Routing Number',
  t: 'text',
  store: 'routing_number',
};
const balance: SchemaField = {
  k: 'Opening Balance',
  t: 'money',
  store: 'opening_balance',
};
const account: SchemaField = {
  k: 'Account Number',
  t: 'masked',
  store: 'account_number',
};

describe('schema empty-field preview', () => {
  it('treats blank strings as empty and money as filled', () => {
    expect(schemaValueIsFilled('')).toBe(false);
    expect(schemaValueIsFilled('Add')).toBe(true);
    expect(schemaValueIsFilled(8214.55)).toBe(true);
    expect(schemaValueIsFilled([])).toBe(false);
  });

  it('splits empty vs filled keys for the fill popup', () => {
    const { empty, filled } = partitionSchemaFields(
      [routing, balance, account],
      {
        routing_number: '',
        opening_balance: 8214.55,
        account_number: '123456789',
      },
    );
    expect(empty.map(field => field.store)).toEqual(['routing_number']);
    expect(filled.map(field => field.store)).toEqual([
      'opening_balance',
      'account_number',
    ]);
  });

  it('masks account numbers until revealed', () => {
    expect(schemaFieldPreview(account, '123456789')).toMatch(/^•+$/);
    expect(
      schemaFieldPreview(account, '123456789', { revealMasked: true }),
    ).toBe('123456789');
    expect(schemaFieldPreview(balance, 8214.55)).toMatch(/8,?214/);
  });
});
