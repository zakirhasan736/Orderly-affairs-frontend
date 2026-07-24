import type { FieldDefinition } from '@/types/formTypes';
import {
  createEmptyItemFromFields as createEmptyItemFromSectionFields,
  normalizeUploadField,
} from '@/utils/sectionUploadFields';
import { smartPlaceOntoFields } from '@/utils/smartFieldPlacement';

const SKIP_FIELD_TYPES = new Set(['Instructions', 'InstructionsModal']);

const OPTION_TYPE_SET = new Set([
  'Dropdown',
  'Radio',
  'RadioButtons',
  'Select',
  'MultiSelect',
]);

/** Common free-text → canonical option synonyms (any section). */
const OPTION_SYNONYMS: Array<{ match: RegExp; prefer: string[] }> = [
  {
    match: /\b(auto|automobile|car|motor\s*vehicle|vehicle)\b/i,
    prefer: ['Vehicle', 'Auto', 'Automobile', 'Car'],
  },
  {
    match: /\b(home\s*owner|homeowners?|home\s*insurance|dwelling)\b/i,
    prefer: ['Homeowner/Renter', 'Homeowners', 'Home', "Homeowner's"],
  },
  {
    match: /\b(renter|renters|tenant)\b/i,
    prefer: ['Homeowner/Renter', 'Renters', 'Renter'],
  },
  {
    match: /\b(life\s*insurance|term\s*life|whole\s*life)\b/i,
    prefer: ['Life'],
  },
  {
    match: /\b(health|medical|dental|vision)\b/i,
    prefer: ['Health', 'Medical', 'Dental'],
  },
  { match: /\b(umbrella)\b/i, prefer: ['Umbrella'] },
  { match: /\b(checking)\b/i, prefer: ['Checking'] },
  { match: /\b(savings)\b/i, prefer: ['Savings'] },
  { match: /\b(money\s*market)\b/i, prefer: ['Money Market'] },
  {
    match: /\b(cd|certificate\s*of\s*deposit)\b/i,
    prefer: ['CD', 'Certificate of Deposit'],
  },
  { match: /\b(credit\s*card)\b/i, prefer: ['Credit Card'] },
  { match: /\b(personal\s*loan)\b/i, prefer: ['Personal Loan'] },
  { match: /\b(student\s*loan)\b/i, prefer: ['Student Loan'] },
  { match: /\b(auto\s*loan|car\s*loan)\b/i, prefer: ['Auto Loan'] },
  {
    match: /\b(mortgage|home\s*loan|heloc)\b/i,
    prefer: ['Home Equity Loan', 'Mortgage', 'Line of Credit'],
  },
  {
    match: /\b(yes|y|true|checked|enabled|on)\b/i,
    prefer: ['Yes', 'Y', 'True'],
  },
  {
    match: /\b(no|n|false|unchecked|disabled|off)\b/i,
    prefer: ['No', 'N', 'False'],
  },
  { match: /\b(owned|own|owner)\b/i, prefer: ['Owned', 'Own', 'Owner'] },
  {
    match: /\b(rented|rent|lease|leased)\b/i,
    prefer: ['Rented', 'Rent', 'Leased', 'Lease'],
  },
  { match: /\b(married)\b/i, prefer: ['Married'] },
  { match: /\b(single)\b/i, prefer: ['Single'] },
  { match: /\b(divorced)\b/i, prefer: ['Divorced'] },
  { match: /\b(widowed)\b/i, prefer: ['Widowed'] },
  { match: /\b(male|man)\b/i, prefer: ['Male', 'Man'] },
  { match: /\b(female|woman)\b/i, prefer: ['Female', 'Woman'] },
];

function normalizeLoose(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function optionTokens(text: string): string[] {
  return normalizeLoose(text).split(/\s+/).filter(Boolean);
}

/**
 * Map any free-text AI value onto the closest allowed option string.
 * Works for Dropdown, RadioButtons, Select, etc.
 */
export function resolveClosestOption(
  rawValue: unknown,
  options: string[] | undefined | null,
): string | null {
  if (!options?.length) return null;

  const raw =
    typeof rawValue === 'boolean'
      ? rawValue
        ? 'yes'
        : 'no'
      : String(rawValue ?? '').trim();
  if (!raw) return null;

  const optionStrs = options.map(opt => String(opt).trim()).filter(Boolean);
  if (!optionStrs.length) return null;

  const lower = raw.toLowerCase();
  const loose = normalizeLoose(raw);

  // 1) Exact (case-insensitive)
  const exact = optionStrs.find(opt => opt.toLowerCase() === lower);
  if (exact) return exact;

  // 2) Synonym preference list → first option that matches prefer list
  for (const rule of OPTION_SYNONYMS) {
    if (!rule.match.test(raw)) continue;
    for (const preferred of rule.prefer) {
      const hit = optionStrs.find(
        opt =>
          normalizeLoose(opt) === normalizeLoose(preferred) ||
          normalizeLoose(opt).includes(normalizeLoose(preferred)) ||
          normalizeLoose(preferred).includes(normalizeLoose(opt)),
      );
      if (hit) return hit;
    }
  }

  // 3) Contains either way
  const contains = optionStrs.find(
    opt =>
      lower.includes(opt.toLowerCase()) || opt.toLowerCase().includes(lower),
  );
  if (contains) return contains;

  // 4) Token overlap
  const rawTok = new Set(optionTokens(raw));
  let best: { option: string; score: number } | null = null;
  for (const option of optionStrs) {
    const optTok = optionTokens(option);
    const overlap = optTok.filter(token => rawTok.has(token)).length;
    if (overlap <= 0) continue;
    const score = overlap / Math.max(optTok.length, 1);
    if (!best || score > best.score) best = { option, score };
  }
  if (best && best.score >= 0.34) return best.option;

  // 5) Loose normalized equality / partial
  const looseHit = optionStrs.find(opt => {
    const o = normalizeLoose(opt);
    return (
      o === loose ||
      (loose.length >= 3 && (o.includes(loose) || loose.includes(o)))
    );
  });
  if (looseHit) return looseHit;

  return null;
}

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

function isEmptyAiValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) {
    return value.length === 0 || value.every(isEmptyAiValue);
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;

    // TextInputWithUpload shape only — do NOT treat nested form objects as empty.
    if ('text' in record || 'files' in record) {
      const hasText =
        record.text !== null &&
        record.text !== undefined &&
        String(record.text).trim() !== '';
      const hasFiles = Array.isArray(record.files) && record.files.length > 0;
      return !hasText && !hasFiles;
    }

    const values = Object.values(record);
    if (!values.length) return true;
    return values.every(isEmptyAiValue);
  }

  return false;
}

export function cleanAiPatchObject(
  patch: Record<string, unknown> | null | undefined,
) {
  if (!patch || typeof patch !== 'object') return {};

  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => !isEmptyAiValue(value)),
  );
}

export function remapAiPatchKeys(
  patch: Record<string, unknown>,
  fields: FieldDefinition[],
): Record<string, unknown> {
  const usableFields = fields.filter(
    field =>
      field?.key &&
      field.type !== 'Instructions' &&
      field.type !== 'InstructionsModal',
  );

  return smartPlaceOntoFields(
    patch,
    usableFields.map(field => ({
      key: field.key,
      label: field.label,
      helperText: field.helperText,
      placeholder: field.placeholder,
      type: field.type,
      options: field.options,
    })),
  );
}

function isTruthyFlag(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value !== 'string') return null;
  const n = value.trim().toLowerCase();
  if (
    ['true', 'yes', 'y', '1', 'checked', 'enabled', 'on', 'active'].includes(n)
  ) {
    return true;
  }
  if (
    [
      'false',
      'no',
      'n',
      '0',
      'unchecked',
      'disabled',
      'off',
      'inactive',
    ].includes(n)
  ) {
    return false;
  }
  return null;
}

export function coerceAiFieldValue(field: FieldDefinition, value: unknown) {
  if (isEmptyAiValue(value)) {
    return getEmptyValueForFieldType(field.type);
  }

  if (field.type === 'TextInputWithUpload') {
    return normalizeUploadField(value);
  }

  if (field.type === 'Checkbox') {
    const flag = isTruthyFlag(value);
    if (flag !== null) return flag;
    return Boolean(value);
  }

  // Single-option RadioButtons render as a checkbox in the UI.
  if (
    field.type === 'RadioButtons' &&
    Array.isArray(field.options) &&
    field.options.length === 1
  ) {
    const only = String(field.options[0]);
    const flag = isTruthyFlag(value);
    if (flag === true) return only;
    if (flag === false) return '';
    const resolved = resolveClosestOption(value, field.options);
    return resolved || (String(value).trim() === only ? only : '');
  }

  if (OPTION_TYPE_SET.has(field.type) && field.options?.length) {
    if (field.type === 'MultiSelect') {
      const parts = Array.isArray(value)
        ? value
        : String(value)
            .split(/[,;|/]+/)
            .map(part => part.trim())
            .filter(Boolean);
      const resolved = parts
        .map(part => resolveClosestOption(part, field.options) || String(part))
        .filter(Boolean);
      return [...new Set(resolved)];
    }

    const resolved = resolveClosestOption(value, field.options);
    if (resolved) return resolved;

    // Keep raw string so UI can still show placeholder text of unrecognized value.
    return String(value).trim();
  }

  if (
    field.key === 'year' &&
    value !== null &&
    value !== undefined &&
    value !== ''
  ) {
    return String(value);
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }

  // Nested upload-like objects without a field type match
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if ('text' in record || 'files' in record) {
      return normalizeUploadField(value);
    }
  }

  return value;
}

export function coerceAiFieldValues(
  patch: Record<string, unknown>,
  fields: FieldDefinition[],
) {
  const remapped = remapAiPatchKeys(patch, fields);
  const fieldMap = new Map(fields.map(field => [field.key, field]));
  const next: Record<string, unknown> = {};

  Object.entries(remapped).forEach(([key, value]) => {
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

/** Sparse patch: only AI-filled keys, coerced to form field shapes. */
export function buildAiFieldPatch(
  patch: Record<string, unknown> | null | undefined,
  fields: FieldDefinition[],
): Record<string, unknown> {
  return coerceAiFieldValues(cleanAiPatchObject(patch), fields);
}

/**
 * Normalize autofill API/stash payloads into the form patch object.
 * Handles both `{ patch: {...} }` and accidental top-level field shapes.
 */
export function unwrapAiAutofillPatch(result: unknown): Record<string, unknown> {
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    return {};
  }

  const record = result as Record<string, unknown>;
  const nested = record.patch;

  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }

  // Some responses accidentally put section fields at the top level.
  const metaKeys = new Set([
    'section',
    'scope',
    'subsection',
    'confidence',
    'patch',
    'document_summary',
    'additional_sections',
  ]);

  const topLevelFields = Object.fromEntries(
    Object.entries(record).filter(([key]) => !metaKeys.has(key)),
  );

  return topLevelFields;
}

export function aiPatchHasValues(patch: unknown): boolean {
  if (!patch || typeof patch !== 'object') return false;
  return !isEmptyAiValue(patch);
}

/**
 * Pull a subsection object/array from a section patch with smart fallbacks.
 */
export function extractSubsectionPatch(
  patch: Record<string, unknown> | null | undefined,
  subsection: string,
): Record<string, unknown> {
  if (!patch || typeof patch !== 'object') return {};

  const direct = patch[subsection];
  if (Array.isArray(direct) && direct[0] && typeof direct[0] === 'object') {
    return cleanAiPatchObject(direct[0] as Record<string, unknown>);
  }
  if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
    return cleanAiPatchObject(direct as Record<string, unknown>);
  }

  // If AI returned flat fields (no subsection wrapper), use the patch itself.
  const nestedKeys = Object.keys(patch).filter(key =>
    /^(?:\d+[A-Z]|vital_info|next_of_kin|executor_trustee|additional_contacts)$/.test(
      key,
    ),
  );
  if (!nestedKeys.length) {
    return cleanAiPatchObject(patch);
  }

  return {};
}
