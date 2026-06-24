import type { FieldDefinition } from '@/types/formTypes';
import {
  createEmptyItemFromFields as createEmptyItemFromSectionFields,
  createEmptyUploadField,
  normalizeUploadField,
} from '@/utils/sectionUploadFields';

const SKIP_FIELD_TYPES = new Set(['Instructions', 'InstructionsModal']);

export function humanizeFieldKey(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

export function getAiFieldDisplayLabel(field: FieldDefinition) {
  const label = field.label?.trim();
  if (label) return label;

  const helper = field.helperText?.trim();
  if (helper) return helper;

  const placeholder = field.placeholder?.trim();
  if (placeholder) return placeholder;

  return humanizeFieldKey(field.key);
}

export function buildFieldCatalogForAi(fields: FieldDefinition[]) {
  return fields
    .filter(field => !SKIP_FIELD_TYPES.has(field.type))
    .map(field => ({
      key: field.key,
      label: getAiFieldDisplayLabel(field),
      type: field.type,
      helperText: field.helperText || '',
      placeholder: field.placeholder || '',
      options: field.options || [],
    }));
}

export function getEmptyValueForFieldType(type: string) {
  if (type === 'TextInputWithUpload') {
    return { text: '', files: [], _deleted_files: [] };
  }

  if (type === 'Checkbox') {
    return false;
  }

  return '';
}

export function createEmptyItemFromFields(fields: FieldDefinition[]) {
  return createEmptyItemFromSectionFields(fields);
}

function isEmptyAiValue(value: unknown) {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const text = record.text;
    const files = record.files;
    const hasText = text !== null && text !== undefined && text !== '';
    const hasFiles = Array.isArray(files) && files.length > 0;
    return !hasText && !hasFiles;
  }

  return false;
}

export function cleanAiPatchObject(patch: Record<string, unknown> | null | undefined) {
  if (!patch || typeof patch !== 'object') return {};

  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => !isEmptyAiValue(value)),
  );
}

export function coerceAiFieldValue(
  field: FieldDefinition,
  value: unknown,
) {
  if (isEmptyAiValue(value)) {
    return getEmptyValueForFieldType(field.type);
  }

  if (field.type === 'TextInputWithUpload') {
    return normalizeUploadField(value);
  }

  if (field.type === 'Checkbox') {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return ['true', 'yes', '1', 'checked'].includes(normalized);
    }
    return Boolean(value);
  }

  if (field.type === 'Dropdown' && field.options?.length) {
    const raw = String(value).trim();
    if (!raw) return '';

    const exact = field.options.find(
      option => option.toLowerCase() === raw.toLowerCase(),
    );
    if (exact) return exact;

    const partial = field.options.find(option =>
      raw.toLowerCase().includes(option.toLowerCase()),
    );
    return partial || raw;
  }

  if (field.key === 'year' && value !== null && value !== undefined && value !== '') {
    return String(value);
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return value;
}

export function coerceAiFieldValues(
  patch: Record<string, unknown>,
  fields: FieldDefinition[],
) {
  const fieldMap = new Map(fields.map(field => [field.key, field]));
  const next: Record<string, unknown> = {};

  Object.entries(patch).forEach(([key, value]) => {
    const field = fieldMap.get(key);
    if (!field || SKIP_FIELD_TYPES.has(field.type)) return;
    next[key] = coerceAiFieldValue(field, value);
  });

  return next;
}

export function mergeAiPatchWithDefaults<T extends Record<string, unknown>>(
  patch: Record<string, unknown> | null | undefined,
  fields: FieldDefinition[],
  createEmpty: () => T,
) {
  const cleaned = cleanAiPatchObject(patch);
  const coerced = coerceAiFieldValues(cleaned, fields);

  return {
    ...createEmpty(),
    ...coerced,
  } as T;
}
