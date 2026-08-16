import { fieldViewKey, type SchemaField } from './types';

const FULL_TYPES = new Set(['long', 'multi']);

/** Short identity pairs that should sit on one row in the add/edit drawer. */
const PREFERRED_PAIRS: Array<[string, string]> = [
  ['year', 'vin'],
  ['make', 'model'],
  ['color', 'license_plate'],
  ['first_name', 'last_name'],
  ['city', 'state'],
  ['zip', 'zip_code'],
  ['state', 'zip'],
  ['policy_company', 'policy_number'],
  ['policy_type', 'policy_expiry'],
  ['member_id', 'group_number'],
  ['rxbin', 'rxpcn'],
  ['rx_bin', 'rx_pcn'],
  ['bank_name', 'account_number'],
  ['account_type', 'routing_number'],
  ['routing_number', 'account_number'],
  ['institution', 'account_number'],
  ['card_name', 'last_four'],
  ['creditor', 'account_number'],
  ['employer_name', 'job_title'],
  ['school_name', 'degree'],
  ['organization_name', 'membership_number'],
  ['charity_name', 'amount'],
  ['provider_name', 'phone'],
  ['full_name', 'relationship'],
  ['pet_name', 'pet_type'],
  ['date_of_birth', 'ssn'],
  ['issue_date', 'expiration_date'],
  ['start_date', 'end_date'],
  ['email', 'phone'],
  ['phone_number', 'email'],
  ['username', 'password'],
];

export function schemaFieldIsHalf(field: SchemaField): boolean {
  if (field.w === 'half') return true;
  if (FULL_TYPES.has(field.t)) return false;
  if (field.t === 'choice' && field.ui === 'pills' && (field.opts?.length || 0) > 6) {
    return false;
  }
  if (field.t === 'toggle' && String(field.k || '').length > 42) return false;
  return true;
}

function storeKey(field: SchemaField) {
  return fieldViewKey(field).toLowerCase();
}

function preferredPartnerKey(field: SchemaField): string | null {
  const key = storeKey(field);
  const pair = PREFERRED_PAIRS.find(([a, b]) => a === key || b === key);
  if (!pair) return null;
  return pair[0] === key ? pair[1] : pair[0];
}

/**
 * Pack short fields into two-column rows. Preferred pairs stay together;
 * leftover short fields fill the next open half so the drawer stays short.
 */
export function layoutSchemaFields(fields: SchemaField[]): SchemaField[] {
  const remaining = [...fields];
  const out: SchemaField[] = [];

  while (remaining.length) {
    const field = remaining.shift()!;
    if (!schemaFieldIsHalf(field)) {
      out.push(field);
      continue;
    }

    const partnerKey = preferredPartnerKey(field);
    const partnerIdx =
      partnerKey != null
        ? remaining.findIndex(
            item => schemaFieldIsHalf(item) && storeKey(item) === partnerKey,
          )
        : -1;
    if (partnerIdx >= 0) {
      out.push(field, remaining.splice(partnerIdx, 1)[0]);
      continue;
    }

    const nextHalf = remaining.findIndex(item => schemaFieldIsHalf(item));
    if (nextHalf >= 0) {
      out.push(field, remaining.splice(nextHalf, 1)[0]);
      continue;
    }

    out.push(field);
  }

  return out;
}
