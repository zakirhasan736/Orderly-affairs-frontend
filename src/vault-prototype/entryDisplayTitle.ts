import { fieldViewKey, type SchemaSub } from './types';

function asLabel(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    return value.map(asLabel).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['label', 'name', 'value', 'text', 'title', 'type']) {
      const nested = asLabel(record[key]);
      if (nested) return nested;
    }
  }
  return '';
}

function pick(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const text = asLabel(row[key]);
    if (text) return text;
  }
  return '';
}

function joinBits(parts: Array<string | undefined | null>, sep = ' ') {
  return parts.map(part => String(part || '').trim()).filter(Boolean).join(sep);
}

/**
 * Human title for a repeating card so users know which item it is
 * without opening the drawer (2022 Honda CR-V, State Farm · Auto, …).
 */
export function composeEntryTitle(
  row: Record<string, unknown> | null | undefined,
  sub?: SchemaSub,
): string {
  const record = row && typeof row === 'object' ? row : {};

  const year = pick(record, ['year']);
  const make = pick(record, ['make']);
  const model = pick(record, ['model']);
  if (make || model) return joinBits([year, make, model]);

  const vin = pick(record, ['vin']);
  if (vin) return `VIN ${vin.slice(-8)}`;

  const company = pick(record, [
    'policy_company',
    'insurance_company',
    'carrier',
  ]);
  const policyType = pick(record, ['policy_type']);
  if (company || policyType) return joinBits([company, policyType], ' · ');

  const bank = pick(record, ['bank_name', 'institution', 'financial_institution']);
  const accountType = pick(record, ['account_type', 'account_nickname']);
  if (bank || accountType) return joinBits([bank, accountType], ' · ');

  const school = pick(record, ['school_name', 'institution_name', 'school']);
  const degree = pick(record, ['degree', 'credential']);
  if (school || degree) return joinBits([school, degree], ' · ');

  const employer = pick(record, ['employer_name', 'employer', 'company_name']);
  const title = pick(record, ['job_title', 'title', 'position']);
  if (employer || title) return joinBits([employer, title], ' · ');

  const org = pick(record, [
    'organization_name',
    'group_name',
    'charity_name',
    'service_name',
    'provider_name',
  ]);
  if (org) return org;

  const person = pick(record, ['full_name', 'name', 'member_name', 'pet_name']);
  const relation = pick(record, ['relationship', 'pet_type']);
  if (person) return joinBits([person, relation], ' · ');

  const card = pick(record, ['card_name', 'creditor', 'document_name', 'item_description']);
  if (card) return card;

  if (sub) {
    for (const field of sub.fields) {
      const text = asLabel(record[fieldViewKey(field)]);
      if (text && text.length < 80) return text;
    }
  }

  return '';
}

export function entryDrawerTitle(
  mode: 'add' | 'edit',
  sub: SchemaSub,
  row: Record<string, unknown>,
) {
  const noun = sub.entry || 'item';
  const headline = composeEntryTitle(row, sub);
  if (headline) return mode === 'edit' ? `Edit ${headline}` : `Add ${headline}`;
  return mode === 'edit' ? `Edit ${noun}` : `Add ${noun}`;
}

export function entryCardTitle(
  sub: SchemaSub,
  row: Record<string, unknown>,
  index: number,
) {
  return (
    composeEntryTitle(row, sub) ||
    `${sub.entry || 'Item'} ${index + 1}`
  );
}
