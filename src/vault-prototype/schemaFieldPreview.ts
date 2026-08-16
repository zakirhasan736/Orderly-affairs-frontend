import { fieldViewKey, type SchemaField } from '@/vault-prototype/types';

export function schemaValueIsFilled(value: unknown): boolean {
  if (value === true) return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return true;
  if (value && typeof value === 'object') {
    const record = value as { text?: string; files?: unknown[] };
    if (typeof record.text === 'string' && record.text.trim()) return true;
    if (Array.isArray(record.files) && record.files.length > 0) return true;
  }
  return false;
}

export function schemaFieldPreview(
  field: SchemaField,
  value: unknown,
  opts?: { revealMasked?: boolean },
): string {
  if (!schemaValueIsFilled(value)) return '';

  if (Array.isArray(value)) {
    return value.map(item => String(item)).filter(Boolean).join(', ');
  }

  if (typeof value === 'boolean') return value ? 'Yes' : 'No';

  if (typeof value === 'number') {
    if (field.t === 'money') {
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return String(value);
  }

  if (value && typeof value === 'object') {
    const record = value as { text?: string; files?: Array<{ name?: string }> };
    return (
      record.text?.trim() ||
      record.files?.[0]?.name ||
      ''
    );
  }

  const text = String(value).trim();
  if (field.t === 'masked' && !opts?.revealMasked) {
    return '•'.repeat(Math.min(10, Math.max(4, text.length)));
  }
  return text;
}

export function partitionSchemaFields(
  fields: SchemaField[],
  values: Record<string, unknown>,
) {
  const empty: SchemaField[] = [];
  const filled: SchemaField[] = [];
  for (const field of fields) {
    if (schemaValueIsFilled(values[fieldViewKey(field)])) filled.push(field);
    else empty.push(field);
  }
  return { empty, filled };
}
