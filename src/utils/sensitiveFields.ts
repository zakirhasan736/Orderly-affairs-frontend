/**
 * Detect vault fields that should stay masked until the user taps Show.
 */

const SENSITIVE_KEY_RE =
  /(password|passwd|passcode|passphrase|pin\b|ssn|social_security|tax_id|itin|account_number|routing_number|card_number|cvv|cvc|safe_code|voicemail_pin|frequent_pins|master_password|secret|api_key|private_key)/i;

const SENSITIVE_LABEL_RE =
  /\b(password|passcode|pin|ssn|social\s*security|tax\s*id|account\s*number|routing\s*number|card\s*number|cvv|cvc|safe\s*code|secret)\b/i;

/** Keys that are identifiers but not secrets — keep visible. */
const NON_SENSITIVE_KEY_RE =
  /(username|user_name|email|phone|policy_number|vin|drivers_license|license_number|dd_number)/i;

export function isSensitiveFieldKey(key?: string | null): boolean {
  if (!key) return false;
  if (NON_SENSITIVE_KEY_RE.test(key) && !/password|pin|ssn|social/i.test(key)) {
    return false;
  }
  return SENSITIVE_KEY_RE.test(key);
}

export function isSensitiveFieldLabel(label?: string | null): boolean {
  if (!label) return false;
  return SENSITIVE_LABEL_RE.test(label);
}

export function fieldShouldMask(field: {
  key?: string;
  label?: string;
  inputType?: string;
}): boolean {
  if (field.inputType === 'password') return true;
  if (isSensitiveFieldKey(field.key)) return true;
  if (isSensitiveFieldLabel(field.label)) return true;
  return false;
}

/** Display mask like XXXX1234 (keep last 4) or XXXX for short values. */
export function maskSensitiveDisplay(value: string): string {
  const text = String(value || '');
  if (!text) return '';
  const chars = Array.from(text);
  if (chars.length <= 4) return 'X'.repeat(chars.length);
  const visible = chars.slice(-4).join('');
  return `${'X'.repeat(Math.min(chars.length - 4, 12))}${visible}`;
}
