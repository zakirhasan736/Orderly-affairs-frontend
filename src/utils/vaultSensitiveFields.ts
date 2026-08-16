/**
 * Hard privacy classes for vault fields (all 22 sections).
 * Locators may live on the server so the owner dashboard and a granted
 * NOK/family view can both show them. Full numbers, logins, and scans never
 * go to readable Mongo or the NOK kit.
 */

export type SensitiveHandling =
  | 'locator'
  | 'secret_last4'
  | 'credential'
  | 'document';

const FINANCE_SECTIONS = new Set(['12', '14', '16']);

const LAST4_KEYS = new Set([
  'account_number',
  'policy_number',
  'document_number',
  'drivers_license_number',
  'license_number',
  'dl_number',
]);

const CREDENTIAL_KEYS = new Set([
  'routing_number',
  'online_banking',
  'online_banking_password',
  'password',
  'account_password',
  'login_credentials',
  'online_account',
  'security_info',
  'phone_password',
  'voicemail_pin',
  'computer_password',
  'primary_email_password',
  'secondary_email_password',
  'google_id_password',
  'apple_id_password',
  'frequent_pins',
  'safe_code',
  'social_security_number',
]);

const DOCUMENT_KEYS = new Set([
  'account_documents',
  'service_documents',
  'card_documents',
  'debit_cards',
  'debt_documents',
  'policy_documents',
  'policy_documents_life',
  'document_upload',
  'tax_documents',
  'military_documents',
  'employment_documents',
  'business_documents',
  'income_documents',
  'item_documents',
  'property_documents',
  'legal_documents',
  'adoption_documents',
  'name_change_documents',
  'contact_documents',
  'paid_off_documentation',
  'item_documentation',
  'documentation',
  'pet_documentation',
  'dependency_documents',
  'relationship_documents',
  'business_tax_documents',
]);

const IGNORE_KEYS = new Set([
  'document_type',
  'document_location',
  'document_description',
]);

function isMetaKey(key: string) {
  return (
    key.endsWith('_instructions') ||
    key.endsWith('_header') ||
    key.endsWith('_label') ||
    IGNORE_KEYS.has(key)
  );
}

export function lastFourDigits(value: unknown): string {
  const text = extractPlainText(value);
  const digits = text.replace(/\D/g, '');
  if (digits.length >= 4) return digits.slice(-4);
  return '';
}

export function extractPlainText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (record.text != null) return String(record.text);
    if (record.value != null) return String(record.value);
  }
  return '';
}

export function last4ServerPayload(value: unknown): unknown {
  const last4 = lastFourDigits(value);
  if (!last4) return '';
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { text: last4 };
  }
  return last4;
}

export function sensitiveHandling(
  sectionId: string,
  fieldKey: string,
): SensitiveHandling | null {
  const sid = String(sectionId || '');
  const key = String(fieldKey || '').trim();
  if (!key || isMetaKey(key)) return null;
  const lower = key.toLowerCase();

  if (DOCUMENT_KEYS.has(lower) || /(_documents|_documentation)$/.test(lower) || lower.includes('upload')) {
    return 'document';
  }
  if (
    CREDENTIAL_KEYS.has(lower) ||
    lower.includes('password') ||
    lower.endsWith('_pin') ||
    lower.includes('ssn') ||
    lower === 'cvv'
  ) {
    return 'credential';
  }
  if (FINANCE_SECTIONS.has(sid) && (lower === 'username' || lower === 'debit_cards')) {
    return lower === 'debit_cards' ? 'document' : 'credential';
  }
  if (LAST4_KEYS.has(lower)) return 'secret_last4';
  if (lower === 'card_number') return 'locator';
  return null;
}

export function nokHintForField(sectionId: string, fieldKey: string): string | null {
  const handling = sensitiveHandling(sectionId, fieldKey);
  if (handling === 'document') return 'Never in NOK — files stay on this device';
  if (handling === 'credential') return 'Never in NOK — login/PIN is zero-knowledge';
  if (handling === 'secret_last4') return 'NOK receives last 4 digits only';
  if (handling === 'locator') return 'NOK can see this if the section is granted';
  return null;
}

export const SENSITIVE_DEFAULT_RULES: Array<{
  sectionId: string;
  fieldKey: string;
  mode: 'zero_knowledge' | 'device_only';
}> = [
  { sectionId: '1', fieldKey: 'social_security_number', mode: 'zero_knowledge' },
  { sectionId: '1', fieldKey: 'phone_password', mode: 'zero_knowledge' },
  { sectionId: '1', fieldKey: 'voicemail_pin', mode: 'zero_knowledge' },
  { sectionId: '1', fieldKey: 'computer_password', mode: 'zero_knowledge' },
  { sectionId: '1', fieldKey: 'primary_email_password', mode: 'zero_knowledge' },
  { sectionId: '1', fieldKey: 'secondary_email_password', mode: 'zero_knowledge' },
  { sectionId: '1', fieldKey: 'google_id_password', mode: 'zero_knowledge' },
  { sectionId: '1', fieldKey: 'apple_id_password', mode: 'zero_knowledge' },
  { sectionId: '1', fieldKey: 'frequent_pins', mode: 'zero_knowledge' },
  { sectionId: '1', fieldKey: 'safe_code', mode: 'zero_knowledge' },
  { sectionId: '1', fieldKey: 'document_upload', mode: 'device_only' },
  { sectionId: '7', fieldKey: 'policy_number', mode: 'zero_knowledge' },
  { sectionId: '7', fieldKey: 'policy_documents', mode: 'device_only' },
  { sectionId: '7', fieldKey: 'policy_documents_life', mode: 'device_only' },
  { sectionId: '12', fieldKey: 'account_number', mode: 'zero_knowledge' },
  { sectionId: '12', fieldKey: 'routing_number', mode: 'zero_knowledge' },
  { sectionId: '12', fieldKey: 'online_banking', mode: 'zero_knowledge' },
  { sectionId: '12', fieldKey: 'online_banking_password', mode: 'zero_knowledge' },
  { sectionId: '12', fieldKey: 'debit_cards', mode: 'device_only' },
  { sectionId: '12', fieldKey: 'account_documents', mode: 'device_only' },
  { sectionId: '12', fieldKey: 'password', mode: 'zero_knowledge' },
  { sectionId: '12', fieldKey: 'username', mode: 'zero_knowledge' },
  { sectionId: '12', fieldKey: 'security_info', mode: 'zero_knowledge' },
  { sectionId: '12', fieldKey: 'service_documents', mode: 'device_only' },
  { sectionId: '13', fieldKey: 'account_password', mode: 'zero_knowledge' },
  { sectionId: '13', fieldKey: 'password', mode: 'zero_knowledge' },
  { sectionId: '13', fieldKey: 'account_documents', mode: 'device_only' },
  { sectionId: '14', fieldKey: 'account_number', mode: 'zero_knowledge' },
  { sectionId: '14', fieldKey: 'login_credentials', mode: 'zero_knowledge' },
  { sectionId: '14', fieldKey: 'account_documents', mode: 'device_only' },
  { sectionId: '16', fieldKey: 'account_number', mode: 'zero_knowledge' },
  { sectionId: '16', fieldKey: 'online_account', mode: 'zero_knowledge' },
  { sectionId: '16', fieldKey: 'card_documents', mode: 'device_only' },
  { sectionId: '16', fieldKey: 'debt_documents', mode: 'device_only' },
  { sectionId: '18', fieldKey: 'employment_documents', mode: 'device_only' },
  { sectionId: '18', fieldKey: 'income_documents', mode: 'device_only' },
  { sectionId: '20', fieldKey: 'document_upload', mode: 'device_only' },
  { sectionId: '20', fieldKey: 'tax_documents', mode: 'device_only' },
];

export const KIT_LOCKED_SECTION_IDS = new Set(['0', '2', '3', '4']);
export const FINANCE_PRESET_SECTION_IDS = ['12', '14', '16'] as const;
