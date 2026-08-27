import raw from './schema.raw.json';
import {
  fieldSlug,
  fieldViewKey,
  type SchemaField,
  type SchemaFieldType,
  type SchemaSub,
  type SchemaSection,
} from './types';
import { formatDateOnly, parseDateOnly } from '@/utils/dateOnly';
import { AI_SECTION_BY_ID } from '@/utils/aiSectionRegistry';
import type { FieldDefinition, Subsection } from '@/types/formTypes';
import { formConfig } from '@/config/formConfig';

const VAULT_SCHEMA = raw as SchemaSection[];

type Dict = Record<string, unknown>;

const STOP = new Set([
  'the',
  'a',
  'an',
  'of',
  'and',
  'or',
  'to',
  'for',
  'in',
  'on',
  'is',
  'are',
  'your',
  'my',
  'this',
  'that',
  'with',
  'from',
]);

const SKIP_FORM_TYPES = new Set([
  'Instructions',
  'InstructionsModal',
  'AccessManagement',
  'NextOfKinLetter',
  'LettersToNextOfKin',
]);

const SKIP_ENRICH_SECTIONS = new Set(['0', '2', '3', '4']);

/** HTML subsection id → stored vault key */
const HTML_SUB_STORE: Record<string, string> = {
  'personal-details': 'vital_info',
  'drivers-license': 'vital_info',
  'phone-device-access': 'vital_info',
  'email-accounts': 'vital_info',
  'secure-locations': 'vital_info',
  'birth-citizenship': 'vital_info',
  'key-contacts': 'next_of_kin',
  'current-vehicles': '5A',
  'vehicle-financing': 'vehicle-financing',
  'registration-insurance': 'registration-insurance',
  'service-maintenance': 'service-maintenance',
  'property-identity': '6A',
  'property-details': '6A',
  'mortgage-payments': '6A',
  'ownership-documents': '6A',
  'current-financing': '6A',
  'historical-documents': '6A',
  'life-insurance': '7A',
  'health-insurance': '7A',
  'home-property-insurance': '7A',
  'auto-insurance': '7A',
  'other-policies': '7A',
  'group-memberships': '8A',
  giving: '9A',
  'planned-giving': '9A',
  'tax-records': '9A',
  schools: '10A',
  'service-record': '11A',
  'va-benefits': '11A',
  'checking-savings': '12A',
  'certificates-term-deposits': '12A',
  'automatic-payments': '12B',
  'password-manager': 'password-manager',
  'online-accounts': '13A',
  devices: 'devices',
  'digital-legacy': 'digital-legacy',
  'brokerage-taxable': '14A',
  'retirement-accounts': '14A',
  'other-holdings': '14A',
  'financial-advisors': 'financial-advisors',
  conditions: '15A',
  pharmacy: '15A',
  'advance-directives': '15A',
  medications: 'medications',
  providers: '15B',
  'medical-history': '15B',
  'credit-cards-list': '16A',
  'loans-lines-of-credit': '16B',
  'other-obligations': '16B',
  ancestry: '17A',
  'family-members': '17B',
  dependents: '17C',
  'close-friends': '17D',
  'important-relationships': '17E',
  memorabilia: '17F',
  pets: '17G',
  'family-notes': '17H',
  'current-employment': '18A',
  'business-ownership': '18B',
  'employment-history': '18C',
  'other-income': '18D',
  'valuables-collections': '19A',
  'safe-deposit-boxes': 'safe-deposit-boxes',
  'storage-units': 'storage-units',
  'identity-documents': 'identity_documents',
  'property-title': 'property_title',
  'contracts-agreements': 'contracts_agreements',
  'legal-contacts': 'legal_contacts',
  'court-orders': '20C',
  'notary-witnesses': 'notary_witnesses',
  'business-entities': 'business_entities',
  will: '21A',
  trusts: '21A',
  'powers-of-attorney': '21A',
  'healthcare-directives': '21A',
  beneficiaries: '21A',
  'funeral-preferences': '21B',
  'body-disposition': '21B',
  'memorial-preferences': '21B',
  obituary: '21B',
  'prepaid-arrangements': '21B',
  guardianship: '21C',
  'guardian-instructions': '21C',
  'digital-after-death': '21B',
  notifications: '21B',
  'final-instructions': '21B',
};

/** Subsection-aware aliases so "Expiration date" never steals the driver's license key. */
const FIELD_ALIASES_BY_SUB: Record<string, Record<string, string>> = {
  'personal-details': {
    full_legal_name: 'full_legal_name',
    name_you_go_by: 'other_names',
    other_names_you_have_used: 'other_names',
    date_of_birth: 'date_of_birth',
    social_security_number: 'social_security_number',
  },
  'drivers-license': {
    license_or_id_number: 'drivers_license_number',
    issuing_state: 'drivers_license_state',
    dd_or_audit_number: 'drivers_license_dd_number',
    class: 'drivers_license_class',
    issue_date: 'drivers_license_issue_date',
    expiration_date: 'drivers_license_expiration_date',
  },
  'phone-device-access': {
    mobile_number: 'phone_number',
    phone_passcode_or_pin: 'phone_password',
    voicemail_pin: 'voicemail_pin',
    computer_login_password: 'computer_password',
  },
  'email-accounts': {
    primary_email_address: 'primary_email_username',
    primary_email_password: 'primary_email_password',
    secondary_email_address: 'secondary_email_username',
    secondary_email_password: 'secondary_email_password',
  },
  'secure-locations': {
    where_the_home_safe_is: 'safe_location',
    safe_code_or_combination: 'safe_code',
    safe_key_location_if_it_takes_one: 'safe_keys',
  },
  'property-identity': {
    street_address: 'home_address',
    type_of_residence: 'residence_type',
    do_you_own_or_rent: 'ownership_status',
  },
  'property-details': {
    year_purchased_or_leased: 'year_purchased',
    square_footage: 'square_feet',
  },
  'mortgage-payments': {
    lienholder_or_landlord: 'mortgage_company',
  },
  'current-vehicles': {
    vin: 'vin',
    license_plate: 'license_plate',
    expiration_date: 'registration_expiry',
    expiry_date: 'registration_expiry',
    renewal_date: 'registration_expiry',
    registration_expiry: 'registration_expiry',
    registration_expires: 'registration_expiry',
  },
  'registration-insurance': {
    registration_expires: 'registration_expiry',
    expiration_date: 'registration_expiry',
    insurer: 'insurance_company',
    policy_number: 'insurance_policy',
  },
  'life-insurance': {
    carrier: 'policy_company',
    policy_number: 'policy_number',
    death_benefit: 'coverage_amount',
    premium: 'premium_info',
    primary_beneficiary: 'beneficiaries',
    agent_name_and_phone: 'policy_contact',
    renewal_date: 'policy_expiry',
    expiration_date: 'policy_expiry',
    policy_type: 'life_policy_kind',
  },
  'health-insurance': {
    carrier: 'policy_company',
    plan_name: 'plan_name',
    member_id: 'member_id',
    group_number: 'group_number',
    who_is_covered: 'covered_relationship',
    member_services_phone: 'policy_contact',
    renewal_date: 'policy_expiry',
    expiration_date: 'policy_expiry',
    policy_type: 'health_plan_kind',
  },
  'home-property-insurance': {
    carrier: 'policy_company',
    policy_number: 'policy_number',
    coverage_amount: 'coverage_amount',
    agent: 'policy_contact',
    renewal_date: 'policy_expiry',
    expiration_date: 'policy_expiry',
    policy_type: 'property_policy_kind',
  },
  'auto-insurance': {
    carrier: 'policy_company',
    policy_number: 'policy_number',
    renewal_date: 'policy_expiry',
    expiration_date: 'policy_expiry',
    policy_type: 'auto_policy_kind',
  },
  'other-policies': {
    carrier: 'policy_company',
    policy_number: 'policy_number',
    renewal_date: 'policy_expiry',
    expiration_date: 'policy_expiry',
  },
  'checking-savings': {
    institution: 'bank_name',
    account_type: 'account_type',
    account_number: 'account_number',
    routing_number: 'routing_number',
    joint_owner: 'joint_account_holders',
    beneficiary_on_file: 'beneficiaries',
    what_this_account_is_used_for: 'account_purpose',
    online_banking_username: 'online_banking',
  },
  'certificates-term-deposits': {
    institution: 'bank_name',
    amount: 'account_value',
    maturity_date: 'cd_maturity_date',
    expiration_date: 'cd_maturity_date',
    renewal_date: 'cd_maturity_date',
  },
  'automatic-payments': {
    renewal_date: 'subscription_renewal_date',
    expiration_date: 'subscription_renewal_date',
  },
  'identity-documents': {
    document_type: 'document_type',
    whose_document_it_is: 'assigned_to_name',
    document_number: 'document_number',
    where_the_original_is_kept: 'document_location',
    expires: 'expiration_date',
    expiration_date: 'expiration_date',
    renewal_date: 'expiration_date',
    scan_or_photo_of_the_document: 'document_upload',
  },
  'court-orders': {
    expires_or_renews: 'renewal_requirements',
    renewal_date: 'renewal_requirements',
    expiration_date: 'important_dates',
  },
  'key-contacts': {
    full_name: 'contact_name',
    phone: 'phone_number',
    email: 'email_address',
    relationship: 'relationship',
  },
};

const DATE_PREFER_BY_SUB: Record<string, string> = {
  'drivers-license': 'drivers_license_expiration_date',
  'birth-citizenship': 'expiration_date',
  'current-vehicles': 'registration_expiry',
  'registration-insurance': 'registration_expiry',
  'life-insurance': 'policy_expiry',
  'health-insurance': 'policy_expiry',
  'home-property-insurance': 'policy_expiry',
  'auto-insurance': 'policy_expiry',
  'other-policies': 'policy_expiry',
  'certificates-term-deposits': 'cd_maturity_date',
  'automatic-payments': 'subscription_renewal_date',
  'identity-documents': 'expiration_date',
  'online-accounts': 'account_expiry_date',
};

const INSURANCE_POLICY_TYPE: Record<string, string> = {
  'life-insurance': 'Life',
  'health-insurance': 'Health',
  'home-property-insurance': 'Homeowner/Renter',
  'auto-insurance': 'Vehicle',
  'other-policies': 'Other',
};

const INSURANCE_HINTS: Record<string, string[]> = {
  'life-insurance': ['life'],
  'health-insurance': ['health', 'medical', 'dental', 'vision', 'medicare'],
  'home-property-insurance': ['home', 'property', 'renters', 'hazard', 'umbrella', 'flood'],
  'auto-insurance': ['auto', 'car', 'vehicle', 'motor'],
};

const DATE_SLUG_HINTS = new Set([
  'expiration_date',
  'expiry_date',
  'renewal_date',
  'expires',
  'expires_or_renews',
  'policy_expiry',
  'registration_expiry',
  'subscription_renewal_date',
  'cd_maturity_date',
  'account_expiry_date',
  'passport_expiration',
  'maturity_date',
  'issue_date',
]);

function tokens(value: string) {
  return fieldSlug(value)
    .split('_')
    .filter(part => part.length > 1 && !STOP.has(part));
}

function scoreLabels(htmlLabel: string, storedKey: string, storedLabel?: string) {
  const html = fieldSlug(htmlLabel);
  const key = fieldSlug(storedKey);
  const label = fieldSlug(storedLabel || storedKey);
  if (html === key || html === label) return 100;
  if (key.includes(html) || html.includes(key) || label.includes(html) || html.includes(label)) {
    return 84;
  }
  const a = new Set(tokens(htmlLabel));
  const b = new Set([...tokens(storedKey), ...tokens(storedLabel || '')]);
  if (!a.size || !b.size) return 0;
  let hit = 0;
  a.forEach(part => {
    if (b.has(part)) hit += 1;
  });
  return Math.round((100 * hit) / Math.max(a.size, b.size));
}

function collectFields(sub: Subsection): FieldDefinition[] {
  const fields: FieldDefinition[] = [];
  if (Array.isArray(sub.fields)) fields.push(...sub.fields);
  if (Array.isArray(sub.groups)) {
    sub.groups.forEach(group => {
      if (Array.isArray(group.fields)) fields.push(...group.fields);
    });
  }
  return fields;
}

function isFillable(field: FieldDefinition) {
  return Boolean(field?.key) && !SKIP_FORM_TYPES.has(String(field.type));
}

function formSection(sectionId: string) {
  return formConfig.chunks
    .flatMap(chunk => chunk.sections)
    .find(item => item.id === sectionId);
}

function storedFieldsFor(sectionId: string, storeKey: string): FieldDefinition[] {
  if (storeKey === 'identity_documents') {
    const legal = formSection('20')?.subsections?.find(item => item.id === '20A');
    const group = legal?.groups?.find(item => item.id === 'identity_documents');
    if (group?.fields?.length) return group.fields.filter(isFillable);
  }
  if (storeKey === 'vital_info') {
    const vital = formSection('1')?.subsections?.find(item => item.id === '1A');
    return vital ? collectFields(vital).filter(isFillable) : [];
  }
  if (
    storeKey === 'next_of_kin' ||
    storeKey === 'executor_trustee' ||
    storeKey === 'additional_contacts'
  ) {
    const contacts = formSection('1')?.subsections?.find(item => item.id === '1B');
    if (!contacts) return [];
    const group = contacts.groups?.find(item => item.id === storeKey);
    if (group?.fields?.length) return group.fields.filter(isFillable);
    return collectFields(contacts).filter(isFillable);
  }
  const section = formSection(sectionId);
  if (!section) return [];
  const exact = section.subsections?.filter(item => item.id === storeKey) || [];
  if (exact.length) return exact.flatMap(collectFields).filter(isFillable);
  return (section.subsections || []).flatMap(collectFields).filter(isFillable);
}

function defaultStoreKey(sectionId: string) {
  if (sectionId === '1') return 'vital_info';
  return AI_SECTION_BY_ID[sectionId]?.defaultSubsection || `${sectionId}A`;
}

function storeKeyForSub(sectionId: string, sub: SchemaSub) {
  if (HTML_SUB_STORE[sub.id]) return HTML_SUB_STORE[sub.id];
  const section = formSection(sectionId);
  const candidates = section?.subsections || [];
  let best: { id: string; score: number } | null = null;
  for (const item of candidates) {
    const next = scoreLabels(sub.name, item.id, item.title);
    if (!best || next > best.score) best = { id: item.id, score: next };
  }
  if (best && best.score >= 55) return best.id;
  if (sub.kind === 'form') return defaultStoreKey(sectionId);
  return sub.id;
}

function isFilled(value: unknown) {
  if (value === true) return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return true;
  if (value && typeof value === 'object') {
    const record = value as Dict;
    if (typeof record.text === 'string' && record.text.trim()) return true;
    if (Array.isArray(record.files) && record.files.length) return true;
  }
  return false;
}

export function coerceSchemaValue(value: unknown, field?: SchemaField): unknown {
  if (value == null) return field?.t === 'multi' ? [] : field?.t === 'toggle' ? false : '';
  if (field?.t === 'toggle') {
    if (value === true || value === 1) return true;
    const text = String(value).trim().toLowerCase();
    return text === 'yes' || text === 'true' || text === 'on' || text === '1';
  }
  if (field?.t === 'multi') {
    if (Array.isArray(value)) return value.map(item => String(item));
    if (typeof value === 'string' && value.trim()) {
      return value.split(/[,;]/).map(part => part.trim()).filter(Boolean);
    }
    return [];
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Dict;
    if (field?.t === 'doc') return value;
    for (const key of ['text', 'label', 'name', 'value', 'title']) {
      if (typeof record[key] === 'string' && record[key]) return record[key];
    }
  }
  if (field?.t === 'date') {
    const parsed = parseDateOnly(String(value));
    return parsed ? formatDateOnly(parsed) : String(value);
  }
  if (field?.t === 'choice' && field.opts?.length) {
    const rawValue = String(value);
    const exact = field.opts.find(option => option === rawValue);
    if (exact) return exact;
    const norm = (text: string) => fieldSlug(text);
    const fuzzy = field.opts.find(
      option =>
        norm(option) === norm(rawValue) ||
        norm(option).includes(norm(rawValue)) ||
        norm(rawValue).includes(norm(option)),
    );
    return fuzzy || rawValue;
  }
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? value
    : String(value);
}

function lookupIn(record: Dict, htmlSlug: string, storedKey: string) {
  if (isFilled(record[storedKey])) return record[storedKey];
  if (isFilled(record[htmlSlug])) return record[htmlSlug];
  return undefined;
}

function isDateField(field: FieldDefinition) {
  return field.type === 'DatePicker' || /date|expir|renew|maturity/i.test(`${field.key} ${field.label}`);
}

function mapFieldKey(
  htmlLabel: string,
  stored: FieldDefinition[],
  used: Set<string>,
  opts?: { subId?: string; field?: SchemaField },
) {
  if (opts?.field?.store && stored.some(item => item.key === opts.field!.store) && !used.has(opts.field.store)) {
    return opts.field.store;
  }
  const slug = fieldSlug(htmlLabel);
  const local = opts?.subId ? FIELD_ALIASES_BY_SUB[opts.subId]?.[slug] : undefined;
  if (local && !used.has(local)) {
    return local;
  }
  const preferDate = DATE_PREFER_BY_SUB[opts?.subId || ''];
  const wantsDate = opts?.field?.t === 'date' || DATE_SLUG_HINTS.has(slug);
  if (wantsDate) {
    if (preferDate && !used.has(preferDate) && stored.some(item => item.key === preferDate)) {
      return preferDate;
    }
    let bestDate: { key: string; score: number } | null = null;
    for (const item of stored) {
      if (used.has(item.key) || !isDateField(item)) continue;
      const next = scoreLabels(htmlLabel, item.key, item.label);
      if (!bestDate || next > bestDate.score) bestDate = { key: item.key, score: next };
    }
    if (bestDate && bestDate.score >= 40) return bestDate.key;
  }
  let best: { key: string; score: number } | null = null;
  for (const item of stored) {
    if (used.has(item.key)) continue;
    const next = scoreLabels(htmlLabel, item.key, item.label);
    if (!best || next > best.score) best = { key: item.key, score: next };
  }
  if (best && best.score >= 52) return best.key;
  return slug;
}

function yearMakeModel(row: Dict) {
  if (isFilled(row.year_make_and_model)) return String(row.year_make_and_model);
  return [row.year, row.make, row.model].filter(isFilled).join(' ');
}

function writeYearMakeModel(value: unknown, row: Dict) {
  const text = String(value || '').trim();
  const next: Dict = { ...row, year_make_and_model: text };
  const match = text.match(/^(\d{4})\s+(.+)$/);
  if (match) {
    next.year = match[1];
    const rest = match[2].trim().split(/\s+/);
    next.make = rest[0] || row.make;
    next.model = rest.slice(1).join(' ') || row.model;
  }
  return next;
}

function asRecord(value: unknown): Dict {
  return value && typeof value === 'object' && !Array.isArray(value) ? { ...(value as Dict) } : {};
}

function asRows(value: unknown): Dict[] {
  if (Array.isArray(value)) {
    return value
      .filter(item => item && typeof item === 'object')
      .map(item => ({ ...(item as Dict) }));
  }
  if (value && typeof value === 'object') {
    const record = value as Dict;
    for (const key of ['items', 'vehicles', 'accounts', 'policies', 'entries', 'records', 'contacts']) {
      if (Array.isArray(record[key])) return asRows(record[key]);
    }
  }
  return [];
}

function cloneStored(data: Dict) {
  return JSON.parse(JSON.stringify(data || {})) as Dict;
}

function insuranceBucket(row: Dict) {
  const stamped = String(row.policy_type || '');
  for (const [subId, type] of Object.entries(INSURANCE_POLICY_TYPE)) {
    if (stamped === type) return subId;
  }
  const hay = fieldSlug(
    [row.policy_type, row.type, row.insurance_type, row.coverage_type, row.category]
      .filter(Boolean)
      .join(' '),
  );
  for (const [subId, hints] of Object.entries(INSURANCE_HINTS)) {
    if (hints.some(hint => hay.includes(hint))) return subId;
  }
  return 'other-policies';
}

function bankBucket(row: Dict) {
  const hay = fieldSlug(String(row.account_type || row.type || ''));
  if (
    hay.includes('certificate') ||
    hay === 'cd' ||
    hay.includes('term_deposit') ||
    hay.includes('cd_')
  ) {
    return 'certificates-term-deposits';
  }
  return 'checking-savings';
}

function investmentBucket(row: Dict) {
  const hay = fieldSlug(String(row.account_type || row.plan_type || row.type || ''));
  if (['401', '403', 'ira', 'roth', 'pension', 'sep'].some(part => hay.includes(part))) {
    return 'retirement-accounts';
  }
  if (hay.includes('annuity') || hay.includes('bond') || hay.includes('stock') || hay.includes('mutual')) {
    return 'other-holdings';
  }
  return 'brokerage-taxable';
}

function rowBucket(storeKey: string, subId: string, row: Dict) {
  if (storeKey === '7A' && HTML_SUB_STORE[subId] === '7A') return insuranceBucket(row);
  if (storeKey === '12A' && (subId === 'checking-savings' || subId === 'certificates-term-deposits')) {
    return bankBucket(row);
  }
  if (storeKey === '14A' && ['brokerage-taxable', 'retirement-accounts', 'other-holdings'].includes(subId)) {
    return investmentBucket(row);
  }
  return subId;
}

function stampRow(subId: string, row: Dict) {
  const next = { ...row };
  if (INSURANCE_POLICY_TYPE[subId]) next.policy_type = INSURANCE_POLICY_TYPE[subId];
  if (subId === 'certificates-term-deposits' && !next.account_type) {
    next.account_type = 'Certificate of Deposit (CD)';
  }
  return next;
}

function formTypeToSchema(field: FieldDefinition): SchemaFieldType {
  const type = String(field.type || '');
  if (type === 'TextArea') return 'long';
  if (type === 'DatePicker') return 'date';
  if (type === 'TextInputWithUpload' || type === 'FileUpload' || type === 'DocumentUpload') return 'doc';
  if (type === 'Password' || field.inputType === 'password') return 'masked';
  if (type === 'Email' || field.inputType === 'email') return 'email';
  if (type === 'Phone' || field.inputType === 'tel') return 'tel';
  if (type === 'Number' || field.inputType === 'number') return 'num';
  if (type === 'Currency' || type === 'Money') return 'money';
  if (type === 'URL' || field.inputType === 'url') return 'url';
  if (type === 'Checkbox' && field.options?.length) return 'multi';
  if (type === 'Checkbox' || type === 'Toggle' || type === 'Switch') return 'toggle';
  if (
    type === 'Dropdown' ||
    type === 'Select' ||
    type === 'Radio' ||
    type === 'RadioButtons' ||
    type === 'RadioGroup'
  ) {
    return field.multiple ? 'multi' : 'choice';
  }
  if (type === 'MultiSelect' || type === 'CheckboxGroup') return 'multi';
  return 'text';
}

export function formFieldToSchema(field: FieldDefinition): SchemaField | null {
  if (!isFillable(field)) return null;
  const type = String(field.type || '');
  const t = formTypeToSchema(field);
  const schema: SchemaField = {
    k: field.label || field.key,
    t,
    store: field.key,
    hint: field.helperText,
    ph: field.placeholder,
  };
  if (field.required) schema.req = 1;
  if (field.options?.length) schema.opts = field.options;
  if (type === 'Dropdown' || type === 'Select') schema.ui = 'select';
  else if (type === 'Radio' || type === 'RadioButtons' || type === 'RadioGroup') schema.ui = 'pills';
  else if ((type === 'Checkbox' || type === 'CheckboxGroup' || type === 'MultiSelect') && field.options?.length) {
    schema.ui = 'checks';
  }
  if (t === 'date' || t === 'tel' || t === 'email' || t === 'num' || t === 'money' || t === 'masked') {
    schema.w = 'half';
  } else if (t === 'long' || t === 'doc' || t === 'multi') {
    // full-width in the add/edit drawer
  } else if (t === 'choice' && schema.ui === 'pills' && (field.options?.length || 0) > 6) {
    // long pill groups stay full width
  } else {
    schema.w = 'half';
  }
  return schema;
}

function sharedFormStore(sectionId: string, storeKey: string, section: SchemaSection) {
  const htmlForms = section.subs.filter(
    sub => sub.kind === 'form' && storeKeyForSub(sectionId, sub) === storeKey,
  );
  return htmlForms.length > 1;
}

function ownerHtmlSubForField(
  section: SchemaSection,
  sectionId: string,
  storeKey: string,
  field: FieldDefinition,
) {
  const htmlSubs = section.subs.filter(
    sub => sub.kind === 'form' && storeKeyForSub(sectionId, sub) === storeKey,
  );
  if (htmlSubs.length <= 1) return htmlSubs[0]?.id || null;
  const formSub =
    formSection(sectionId)?.subsections?.find(
      item =>
        item.id === storeKey ||
        (storeKey === 'vital_info' && item.id === '1A') ||
        (storeKey === '21A' && item.id === '21A') ||
        (storeKey === '21B' && item.id === '21B') ||
        (storeKey === '15A' && item.id === '15A') ||
        (storeKey === '6A' && item.id === '6A'),
    ) || formSection(sectionId)?.subsections?.find(item => item.id === storeKey);
  let current = htmlSubs[0].id;
  const walk = formSub?.fields || [];
  for (const item of walk) {
    if (item.type === 'Instructions' || item.type === 'InstructionsModal') {
      let best: { id: string; score: number } | null = null;
      for (const html of htmlSubs) {
        const next = Math.max(
          scoreLabels(item.label || '', html.id, html.name),
          scoreLabels(item.key || '', html.id, html.name),
        );
        if (!best || next > best.score) best = { id: html.id, score: next };
      }
      if (best && best.score >= 55) current = best.id;
      continue;
    }
    if (item.key === field.key) return current;
  }
  let best: { id: string; score: number } | null = null;
  for (const html of htmlSubs) {
    const next = scoreLabels(field.label || field.key, html.id, html.name);
    if (!best || next > best.score) best = { id: html.id, score: next };
  }
  return best && best.score >= 40 ? best.id : htmlSubs[htmlSubs.length - 1].id;
}

function formSubToSchemaSub(sub: Subsection): SchemaSub {
  const repeatable = Boolean(sub.repeatable || sub.groups?.some(group => group.isRepeatable));
  return {
    id: sub.id,
    name: sub.title,
    kind: repeatable ? 'entries' : 'form',
    entry: sub.itemLabel ? sub.itemLabel.toLowerCase() : undefined,
    desc: sub.description,
    fields: collectFields(sub)
      .map(formFieldToSchema)
      .filter((field): field is SchemaField => Boolean(field)),
  };
}

function enrichSchemaSection(section: SchemaSection): SchemaSection {
  if (SKIP_ENRICH_SECTIONS.has(section.apiId)) return section;
  const clone = JSON.parse(JSON.stringify(section)) as SchemaSection;
  const formSec = formSection(clone.apiId);
  if (!formSec) return clone;

  for (const sub of clone.subs) {
    const storeKey = storeKeyForSub(clone.apiId, sub);
    const stored = storedFieldsFor(clone.apiId, storeKey);
    const used = new Set<string>();
    const nextFields: SchemaField[] = [];
    for (const field of sub.fields) {
      const mapped = mapFieldKey(field.k, stored, used, { subId: sub.id, field });
      const storedField = stored.find(item => item.key === mapped);
      if (!storedField || used.has(storedField.key)) continue;
      used.add(storedField.key);
      const converted = formFieldToSchema(storedField);
      if (converted) nextFields.push(converted);
    }
    const missing = stored.filter(item => {
      if (used.has(item.key)) return false;
      if (sub.id !== 'other-policies' && INSURANCE_POLICY_TYPE[sub.id] && item.key === 'policy_type') {
        return false;
      }
      return true;
    });
    const shareForm = sub.kind === 'form' && sharedFormStore(clone.apiId, storeKey, clone);
    for (const item of missing) {
      if (shareForm) {
        const owner = ownerHtmlSubForField(clone, clone.apiId, storeKey, item);
        if (owner && owner !== sub.id) continue;
      }
      const schemaField = formFieldToSchema(item);
      if (schemaField) nextFields.push(schemaField);
    }
    sub.fields = nextFields;
  }
  clone.subs = clone.subs.filter(sub => sub.fields.length > 0);

  const mappedKeys = new Set(
    clone.subs.flatMap(sub => sub.fields.map(field => field.store).filter(Boolean) as string[]),
  );
  const coveredStores = new Set(clone.subs.map(sub => storeKeyForSub(clone.apiId, sub)));
  const aliasCover: Record<string, string> = {
    '1A': 'vital_info',
    '1B': 'next_of_kin',
  };

  for (const formSub of formSec.subsections || []) {
    if (formSub.id === '2A' || formSub.id === '3A' || formSub.id === '4A') continue;
    const storeId = aliasCover[formSub.id] || formSub.id;
    const already = coveredStores.has(formSub.id) || coveredStores.has(storeId);
    const leftover = collectFields(formSub).filter(item => isFillable(item) && !mappedKeys.has(item.key));
    if (formSub.repeatable && !already) {
      const added = formSubToSchemaSub(formSub);
      if (added.fields.length) {
        clone.subs.push(added);
        added.fields.forEach(field => {
          if (field.store) mappedKeys.add(field.store);
        });
      }
      continue;
    }
    if (!leftover.length) continue;
    if (already) {
      const host =
        clone.subs.find(
          sub =>
            sub.kind === 'form' &&
            (storeKeyForSub(clone.apiId, sub) === formSub.id ||
              storeKeyForSub(clone.apiId, sub) === storeId),
        ) || clone.subs.find(sub => storeKeyForSub(clone.apiId, sub) === formSub.id);
      leftover.forEach(item => {
        const schemaField = formFieldToSchema(item);
        if (!schemaField) return;
        const owner = host
          ? ownerHtmlSubForField(clone, clone.apiId, storeKeyForSub(clone.apiId, host), item)
          : null;
        const target = clone.subs.find(sub => sub.id === owner) || host;
        if (target && !target.fields.some(field => field.store === item.key)) {
          target.fields.push(schemaField);
          mappedKeys.add(item.key);
        }
      });
      continue;
    }
    clone.subs.push({
      id: formSub.id,
      name: formSub.title,
      kind: formSub.repeatable ? 'entries' : 'form',
      entry: formSub.itemLabel ? formSub.itemLabel.toLowerCase() : undefined,
      desc: formSub.description,
      fields: leftover.map(formFieldToSchema).filter((field): field is SchemaField => Boolean(field)),
    });
    leftover.forEach(item => mappedKeys.add(item.key));
  }

  return clone;
}

const enrichedCache = new Map<string, SchemaSection>();

export function schemaByApiId(apiId: string): SchemaSection | undefined {
  const key = String(apiId);
  if (enrichedCache.has(key)) return enrichedCache.get(key);
  const found = VAULT_SCHEMA.find(section => section.apiId === key);
  if (!found) return undefined;
  const enriched = enrichSchemaSection(found);
  enrichedCache.set(key, enriched);
  return enriched;
}

function mapRowToView(row: Dict, sub: SchemaSub, storedFields: FieldDefinition[]) {
  const used = new Set<string>();
  const view: Dict = { ...row };
  for (const field of sub.fields) {
    const viewKey = fieldViewKey(field);
    const slug = fieldSlug(field.k);
    if (slug === 'year_make_and_model' || viewKey === 'year_make_and_model') {
      view[viewKey] = yearMakeModel(row);
      continue;
    }
    const storedKey = mapFieldKey(field.k, storedFields, used, { subId: sub.id, field });
    used.add(storedKey);
    const found = lookupIn(row, slug, storedKey);
    view[viewKey] = coerceSchemaValue(found, field);
  }
  return view;
}

function mapRowToStored(viewRow: Dict, existing: Dict, sub: SchemaSub, storedFields: FieldDefinition[]) {
  const used = new Set<string>();
  let next = { ...existing };
  for (const field of sub.fields) {
    const viewKey = fieldViewKey(field);
    const slug = fieldSlug(field.k);
    const value = viewRow[viewKey] ?? viewRow[slug];
    if (slug === 'year_make_and_model' || viewKey === 'year_make_and_model') {
      next = writeYearMakeModel(value, next);
      continue;
    }
    const storedKey = mapFieldKey(field.k, storedFields, used, { subId: sub.id, field });
    used.add(storedKey);
    next[storedKey] = value;
    if (storedKey !== slug) next[slug] = value;
    if (storedKey !== viewKey) next[viewKey] = value;
  }
  return stampRow(sub.id, next);
}

function readBucket(stored: Dict, key: string) {
  if (key in stored) return stored[key];
  if (key === 'identity_documents') {
    const nested = asRecord(stored['20A']).identity_documents;
    if (nested) return nested;
  }
  return undefined;
}

function mergeSplitRows(
  next: Dict,
  storeKey: string,
  incoming: Dict[],
  keepSubIds: string[],
  classify: (row: Dict) => string,
) {
  const existing = asRows(readBucket(next, storeKey)).filter(row => !keepSubIds.includes(classify(row)));
  next[storeKey] = [...existing, ...incoming];
}

export function toSchemaView(apiSectionId: string, stored: Dict | undefined): Dict {
  const section = schemaByApiId(apiSectionId);
  const data = stored && typeof stored === 'object' ? stored : {};
  if (!section) return { ...data };
  if (apiSectionId === '0') return { ...data };

  const view: Dict = {};
  for (const sub of section.subs) {
    const storeKey = storeKeyForSub(apiSectionId, sub);
    const storedFields = storedFieldsFor(apiSectionId, storeKey);
    if (sub.kind === 'entries') {
      let rows = asRows(readBucket(data, storeKey));
      if (sub.id === 'key-contacts') {
        rows = [
          ...asRows(data.next_of_kin).map(row => ({ ...row, _source: 'next_of_kin' })),
          ...asRows(data.executor_trustee).map(row => ({
            ...row,
            _source: 'executor_trustee',
          })),
          ...asRows(data.additional_contacts).map(row => ({
            ...row,
            _source: 'additional_contacts',
          })),
        ];
      }
      if (storeKey === '7A' || storeKey === '12A' || storeKey === '14A') {
        rows = rows.filter(row => rowBucket(storeKey, sub.id, row) === sub.id);
      }
      view[sub.id] = rows.map(row => mapRowToView(row, sub, storedFields));
    } else {
      let record = asRecord(readBucket(data, storeKey));
      if (!Object.keys(record).length) record = asRecord(data);
      const used = new Set<string>();
      const next: Dict = {};
      for (const field of sub.fields) {
        const viewKey = fieldViewKey(field);
        const slug = fieldSlug(field.k);
        const storedKey = mapFieldKey(field.k, storedFields, used, { subId: sub.id, field });
        used.add(storedKey);
        const found =
          lookupIn(record, slug, storedKey) ??
          lookupIn(data, slug, storedKey) ??
          lookupIn(asRecord(data.vital_info), slug, storedKey);
        next[viewKey] = coerceSchemaValue(found, field);
      }
      view[sub.id] = next;
    }
  }
  return view;
}

export function fromSchemaView(
  apiSectionId: string,
  stored: Dict | undefined,
  view: Dict,
): Dict {
  const section = schemaByApiId(apiSectionId);
  const next = cloneStored(stored || {});
  if (!section) return { ...next, ...view };
  if (apiSectionId === '0') return { ...next, ...view };

  const insuranceMerged: Dict[] = [];
  const bankMerged: Dict[] = [];
  const investMerged: Dict[] = [];

  for (const sub of section.subs) {
    const storeKey = storeKeyForSub(apiSectionId, sub);
    const storedFields = storedFieldsFor(apiSectionId, storeKey);
    const bucket = view[sub.id];
    if (sub.kind === 'entries') {
      const rows = asRows(bucket).map(row => mapRowToStored(row, row, sub, storedFields));
      if (storeKey === '7A' && HTML_SUB_STORE[sub.id] === '7A') {
        insuranceMerged.push(...rows);
        continue;
      }
      if (storeKey === '12A' && (sub.id === 'checking-savings' || sub.id === 'certificates-term-deposits')) {
        bankMerged.push(...rows);
        continue;
      }
      if (storeKey === '14A' && ['brokerage-taxable', 'retirement-accounts', 'other-holdings'].includes(sub.id)) {
        investMerged.push(...rows);
        continue;
      }
      next[storeKey] = rows;
      if (sub.id === 'identity-documents') {
        next.identity_documents = rows;
        next['20A'] = { ...asRecord(next['20A']), identity_documents: rows };
      }
      if (sub.id === 'key-contacts') {
        next.next_of_kin = rows
          .filter(row => row._source !== 'executor_trustee' && row._source !== 'additional_contacts')
          .map(row => {
            const copy = { ...row };
            delete copy._source;
            return copy;
          });
        next.executor_trustee = rows
          .filter(row => row._source === 'executor_trustee')
          .map(row => {
            const copy = { ...row };
            delete copy._source;
            return copy;
          });
        next.additional_contacts = rows
          .filter(row => row._source === 'additional_contacts')
          .map(row => {
            const copy = { ...row };
            delete copy._source;
            return copy;
          });
      }
    } else {
      const current = asRecord(readBucket(next, storeKey));
      const incoming = asRecord(bucket);
      const used = new Set<string>();
      for (const field of sub.fields) {
        const viewKey = fieldViewKey(field);
        const slug = fieldSlug(field.k);
        const storedKey = mapFieldKey(field.k, storedFields, used, { subId: sub.id, field });
        used.add(storedKey);
        const value = incoming[viewKey] ?? incoming[slug];
        current[storedKey] = value;
        if (storedKey !== slug) current[slug] = value;
      }
      next[storeKey] = current;
    }
  }

  if (insuranceMerged.length) {
    mergeSplitRows(next, '7A', insuranceMerged, Object.keys(INSURANCE_POLICY_TYPE), insuranceBucket);
  }
  if (bankMerged.length) {
    mergeSplitRows(next, '12A', bankMerged, ['checking-savings', 'certificates-term-deposits'], bankBucket);
  }
  if (investMerged.length) {
    mergeSplitRows(
      next,
      '14A',
      investMerged,
      ['brokerage-taxable', 'retirement-accounts', 'other-holdings'],
      investmentBucket,
    );
  }

  return next;
}

export function mappedSchemaFill(apiSectionId: string, stored: Dict | undefined) {
  const section = schemaByApiId(apiSectionId);
  const view = toSchemaView(apiSectionId, stored);
  if (!section) return { percent: 0, filled: 0, total: 0, complete: false };
  let filled = 0;
  let total = 0;
  for (const sub of section.subs) {
    const bucket = view[sub.id];
    if (sub.kind === 'entries') {
      const rows = asRows(bucket);
      if (!rows.length) {
        total += sub.fields.length || 1;
      } else {
        for (const row of rows) {
          const record = asRecord(row);
          total += sub.fields.length || 1;
          filled += sub.fields.filter(field =>
            isFilled(record[fieldViewKey(field)]),
          ).length;
        }
      }
    } else {
      const record = asRecord(bucket);
      total += sub.fields.length || 1;
      filled += sub.fields.filter(field => isFilled(record[fieldViewKey(field)])).length;
    }
  }
  const percent = total ? Math.round((filled / total) * 100) : 0;
  return { percent, filled, total, complete: percent === 100 && filled > 0 };
}
