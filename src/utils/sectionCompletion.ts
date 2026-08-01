/**
 * Per-section fill progress for vault sidebar checkmarks.
 * Complete (checkmark) only when percent === 100.
 */

import { formConfig } from '@/config/formConfig';
import type { FieldDefinition, Subsection } from '@/types/formTypes';
import { NOK_LETTER_DEFAULTS } from '@/utils/nokLetterPreview';

export type SectionProgress = {
  percent: number;
  complete: boolean;
  filled: number;
  total: number;
};

export type SectionProgressContext = {
  formData: Record<string, unknown>;
  instructionRead?: boolean;
  myNextKin?: Array<Record<string, unknown>> | null;
  /** Latest API letter for the selected / first NOK (may include metadata only). */
  dashboardNokLetter?: Record<string, unknown> | null;
  disabledSections?: Record<string, boolean>;
};

const EMPTY: SectionProgress = {
  percent: 0,
  complete: false,
  filled: 0,
  total: 0,
};

/** Fields that come from Access Management autofill — count toward progress. */
const NOK_LETTER_PERSONALIZATION_KEYS = [
  'letter_to',
  'nok_email',
  'nok_phone',
  'password_card_location',
  'key_bag_location',
  'documents_bag_location',
  'signer_name',
] as const;

/**
 * Message / template fields. Stock template wording does NOT count — otherwise
 * opening the letter wizard (or GET autofill + saved defaults) marks section 3
 * Done before the owner has written anything.
 */
const NOK_LETTER_MESSAGE_KEYS = [
  'letter_greeting',
  'letter_opening',
  'kit_description',
  'access_url',
  'login_credentials_text',
  'accessible_sections',
  'key_bag_info',
  'documents_bag_info',
  'incomplete_kit_message',
  'closing_message',
  'letter_signature',
] as const;

const NOK_LETTER_CONTENT_KEYS = [
  ...NOK_LETTER_PERSONALIZATION_KEYS,
  ...NOK_LETTER_MESSAGE_KEYS,
] as const;

const ACCESS_CORE_KEYS = [
  'full_name',
  'email',
  'relationship',
] as const;

const ACCESS_LOCATION_KEYS = [
  'card_storage_location',
  'key_bag_location',
  'documents_bag_location',
] as const;

const SKIP_FIELD_TYPES = new Set([
  'Instructions',
  'Header',
  'SectionHeader',
  'Divider',
]);

function result(filled: number, total: number): SectionProgress {
  if (total <= 0) {
    return { ...EMPTY };
  }
  const percent = Math.round((filled / total) * 100);
  return {
    filled,
    total,
    percent,
    complete: filled >= total,
  };
}

export function isMeaningfulFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return true;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return false;
    // Bracket placeholders like [Key Bag Location]
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) return false;
    return true;
  }
  if (Array.isArray(value)) {
    return value.some(item => isMeaningfulFilled(item));
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if ('text' in record || 'files' in record) {
      const text = typeof record.text === 'string' ? record.text.trim() : '';
      const files = Array.isArray(record.files) ? record.files : [];
      return Boolean(text) || files.length > 0;
    }
    if ('label' in record || 'value' in record || 'name' in record) {
      return isMeaningfulFilled(
        record.label ?? record.value ?? record.name ?? record.title,
      );
    }
    return Object.values(record).some(isMeaningfulFilled);
  }
  return false;
}

function normalizeLetterText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function isNokLetterTemplateDefault(key: string, value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return true;

  const defaults = NOK_LETTER_DEFAULTS as Record<string, string>;
  const def = defaults[key];
  if (def && normalizeLetterText(trimmed) === normalizeLetterText(def)) {
    return true;
  }

  if (key === 'letter_greeting' && trimmed.toLowerCase() === 'dear') {
    return true;
  }

  if (key === 'access_url') {
    const lower = trimmed.toLowerCase();
    if (
      lower === 'https://orderly-affairs.com' ||
      lower.endsWith('/next-kin') ||
      lower.includes('portal.orderly-affairs.com/next-kin')
    ) {
      return true;
    }
  }

  if (key === 'accessible_sections') {
    if (
      trimmed.includes('(Autofill sections') ||
      trimmed.includes('(No sections configured)')
    ) {
      return true;
    }
  }

  return false;
}

function isLetterContentFilled(key: string, value: unknown): boolean {
  if (!isMeaningfulFilled(value)) return false;
  if (isNokLetterTemplateDefault(key, value)) return false;
  return true;
}

export function getNokLetterProgress(
  letter: Record<string, unknown> | null | undefined,
): SectionProgress {
  const total = NOK_LETTER_CONTENT_KEYS.length;
  if (!letter) return result(0, total);

  let filled = 0;
  for (const key of NOK_LETTER_CONTENT_KEYS) {
    if (key === 'login_credentials_text') {
      if (isLetterContentFilled(key, letter[key])) {
        filled += 1;
      }
      // Do not credit auto-generated credentials from AM fields alone —
      // that inflated "Done" before the owner touched the letter.
      continue;
    }
    if (isLetterContentFilled(key, letter[key])) filled += 1;
  }
  return result(filled, total);
}

function isPresentNokLetter(letter: unknown): boolean {
  if (!letter || typeof letter !== 'object') return false;
  const doc = letter as Record<string, unknown>;
  // Persisted / API letter row
  if (doc.id || doc._id) return true;
  // Draft tied to a next-of-kin from Access Management
  if (typeof doc.nok_id === 'string' && doc.nok_id.trim()) return true;
  if (typeof doc.next_of_kin_id === 'string' && doc.next_of_kin_id.trim()) {
    return true;
  }
  // Owner has started / personalized the letter for someone
  if (typeof doc.letter_to === 'string' && doc.letter_to.trim()) return true;
  if (typeof doc.nok_email === 'string' && doc.nok_email.trim()) return true;
  return false;
}

/**
 * Letter to Next of Kin is binary: at least one letter exists → Done.
 * Letters are created for Access Management people marked after-death +
 * "Will Receive Next of Kin Letter" — no field-fill percentage.
 */
export function hasAtLeastOneNokLetter(
  section3: Record<string, unknown> | undefined,
  dashboardNokLetter?: Record<string, unknown> | null,
): boolean {
  const byNok = section3?.next_of_kin_letters_by_nok;
  if (byNok && typeof byNok === 'object') {
    for (const letter of Object.values(byNok as Record<string, unknown>)) {
      if (isPresentNokLetter(letter)) return true;
    }
  }

  if (isPresentNokLetter(section3?.next_of_kin_letter_data)) return true;
  if (isPresentNokLetter(dashboardNokLetter)) return true;
  return false;
}

export function getNokLetterSectionProgress(
  section3: Record<string, unknown> | undefined,
  dashboardNokLetter?: Record<string, unknown> | null,
): SectionProgress {
  if (hasAtLeastOneNokLetter(section3, dashboardNokLetter)) {
    return { percent: 100, complete: true, filled: 1, total: 1 };
  }
  return { percent: 0, complete: false, filled: 0, total: 1 };
}

function getAccessManagementProgress(
  people: Array<Record<string, unknown>> | null | undefined,
): SectionProgress {
  if (!Array.isArray(people) || people.length === 0) {
    return result(0, ACCESS_CORE_KEYS.length);
  }

  let filled = 0;
  let total = 0;

  for (const person of people) {
    for (const key of ACCESS_CORE_KEYS) {
      total += 1;
      if (isMeaningfulFilled(person[key])) filled += 1;
    }
    // Location fields matter for Upon Death / password card flow
    const needsLocations =
      person.immediate_access !== true ||
      person.nok_letter_received === true ||
      person.password_card_generated === true;
    if (needsLocations) {
      for (const key of ACCESS_LOCATION_KEYS) {
        total += 1;
        if (isMeaningfulFilled(person[key])) filled += 1;
      }
    }
  }

  return result(filled, total);
}

function getPersonalMessagesProgress(
  section4: Record<string, unknown> | undefined,
): SectionProgress {
  const letters = section4?.['4A'];
  const list =
    (letters &&
      typeof letters === 'object' &&
      Array.isArray((letters as Record<string, unknown>).letters_data) &&
      ((letters as Record<string, unknown>).letters_data as unknown[])) ||
    (Array.isArray(section4?.letters_data) &&
      (section4?.letters_data as unknown[])) ||
    [];

  if (list.length === 0) return result(0, 1);

  const requiredKeys = ['recipient_name', 'message_type', 'title'];
  let filled = 0;
  let total = 0;

  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    for (const key of requiredKeys) {
      total += 1;
      if (isMeaningfulFilled(row[key])) filled += 1;
    }
    // Body / media
    total += 1;
    if (
      isMeaningfulFilled(row.message_body) ||
      isMeaningfulFilled(row.body) ||
      isMeaningfulFilled(row.letter_body) ||
      isMeaningfulFilled(row.attachment_url) ||
      isMeaningfulFilled(row.media_url)
    ) {
      filled += 1;
    }
  }

  return result(filled, Math.max(total, 1));
}

function findSectionConfig(sectionId: string) {
  for (const chunk of formConfig.chunks) {
    const section = chunk.sections.find(s => s.id === sectionId);
    if (section) return section;
  }
  return null;
}

function shouldCountField(
  field: FieldDefinition,
  dataContext: Record<string, unknown>,
): boolean {
  if (SKIP_FIELD_TYPES.has(field.type)) return false;
  // Composite editors handled by specials
  if (
    field.type === 'NextOfKinLetter' ||
    field.type === 'AccessManagement' ||
    field.type === 'PersonalMessages'
  ) {
    return false;
  }

  const cond = field.conditionalDisplay || (field as { conditionalOn?: string }).conditionalOn
    ? {
        field:
          field.conditionalDisplay?.field ||
          (field as { conditionalOn?: string }).conditionalOn ||
          '',
        value:
          field.conditionalDisplay?.value ??
          (field as { conditionalValue?: unknown }).conditionalValue,
      }
    : null;

  if (cond?.field) {
    const current = dataContext[cond.field];
    const expected = cond.value;
    if (Array.isArray(expected)) {
      if (!expected.includes(current as never)) return false;
    } else if (expected !== undefined && current !== expected) {
      return false;
    }
  }

  return true;
}

function resolveObjectBucket(
  sectionData: Record<string, unknown>,
  subsectionId: string,
  sectionId: string,
): Record<string, unknown> | null {
  if (sectionId === '1' && subsectionId === '1A') {
    const vital = sectionData.vital_info;
    if (vital && typeof vital === 'object' && !Array.isArray(vital)) {
      return vital as Record<string, unknown>;
    }
  }

  const direct = sectionData[subsectionId];
  if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
    return direct as Record<string, unknown>;
  }

  // Flat section data (some sections store fields on the root)
  return sectionData;
}

function countFieldsAgainstObject(
  fields: FieldDefinition[] | undefined,
  data: Record<string, unknown>,
): { filled: number; total: number } {
  let filled = 0;
  let total = 0;
  for (const field of fields || []) {
    if (!shouldCountField(field, data)) continue;
    total += 1;
    if (isMeaningfulFilled(data[field.key])) filled += 1;
  }
  return { filled, total };
}

function countRepeatableItems(
  fields: FieldDefinition[] | undefined,
  items: unknown[],
): { filled: number; total: number } {
  const countable = (fields || []).filter(f =>
    shouldCountField(f, {}),
  );
  if (countable.length === 0) {
    return { filled: items.length > 0 ? 1 : 0, total: 1 };
  }

  if (items.length === 0) {
    // No items yet → 0% (need at least one filled item set)
    return { filled: 0, total: countable.length };
  }

  let filled = 0;
  let total = 0;
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    // Skip completely empty shells
    const hasAny = countable.some(f => isMeaningfulFilled(row[f.key]));
    if (!hasAny) continue;

    for (const field of countable) {
      if (!shouldCountField(field, row)) continue;
      total += 1;
      if (isMeaningfulFilled(row[field.key])) filled += 1;
    }
  }

  if (total === 0) {
    return { filled: 0, total: countable.length };
  }
  return { filled, total };
}

function countSubsection(
  subsection: Subsection,
  sectionData: Record<string, unknown>,
  sectionId: string,
): { filled: number; total: number } {
  let filled = 0;
  let total = 0;

  const bucket = sectionData[subsection.id];

  // Array of items under subsection id (vehicles, policies, …)
  if (Array.isArray(bucket)) {
    const counted = countRepeatableItems(subsection.fields, bucket);
    filled += counted.filled;
    total += counted.total;
  } else {
    const objectBucket = resolveObjectBucket(
      sectionData,
      subsection.id,
      sectionId,
    );
    if (objectBucket) {
      const counted = countFieldsAgainstObject(
        subsection.fields,
        objectBucket,
      );
      filled += counted.filled;
      total += counted.total;
    } else if ((subsection.fields || []).some(f => !SKIP_FIELD_TYPES.has(f.type))) {
      const countable = (subsection.fields || []).filter(f =>
        shouldCountField(f, {}),
      );
      total += countable.length;
    }
  }

  // Repeatable groups (e.g. section 1 contacts)
  for (const group of subsection.groups || []) {
    const items = Array.isArray(sectionData[group.id])
      ? (sectionData[group.id] as unknown[])
      : [];
    const counted = countRepeatableItems(group.fields, items);
    filled += counted.filled;
    total += counted.total;
  }

  return { filled, total };
}

function getFormConfigSectionProgress(
  sectionId: string,
  sectionData: Record<string, unknown> | undefined,
): SectionProgress {
  const config = findSectionConfig(sectionId);
  if (!config) return EMPTY;

  let filled = 0;
  let total = 0;
  const data = sectionData && typeof sectionData === 'object' ? sectionData : {};

  if (config.fields?.length) {
    const counted = countFieldsAgainstObject(config.fields, data);
    filled += counted.filled;
    total += counted.total;
  }

  for (const subsection of config.subsections || []) {
    const counted = countSubsection(subsection, data, sectionId);
    filled += counted.filled;
    total += counted.total;
  }

  return result(filled, total);
}

/**
 * Compute fill progress for a vault section.
 * Checkmark should only show when `complete` is true (100%).
 */
export function getSectionProgress(
  sectionId: string,
  ctx: SectionProgressContext,
): SectionProgress {
  if (ctx.disabledSections?.[sectionId]) {
    return { percent: 100, complete: true, filled: 1, total: 1 };
  }

  if (sectionId === '0') {
    return ctx.instructionRead
      ? { percent: 100, complete: true, filled: 1, total: 1 }
      : { percent: 0, complete: false, filled: 0, total: 1 };
  }

  if (sectionId === '2') {
    return getAccessManagementProgress(ctx.myNextKin);
  }

  if (sectionId === '3') {
    const section3 = ctx.formData['3'] as Record<string, unknown> | undefined;
    return getNokLetterSectionProgress(section3, ctx.dashboardNokLetter);
  }

  if (sectionId === '4') {
    return getPersonalMessagesProgress(
      ctx.formData['4'] as Record<string, unknown> | undefined,
    );
  }

  return getFormConfigSectionProgress(
    sectionId,
    ctx.formData[sectionId] as Record<string, unknown> | undefined,
  );
}

export function isSectionComplete(
  sectionId: string,
  ctx: SectionProgressContext,
): boolean {
  return getSectionProgress(sectionId, ctx).complete;
}

export type IncompleteField = {
  key: string;
  label: string;
  field: FieldDefinition;
};

function findSubsectionConfig(
  sectionId: string,
  subsectionId: string,
): Subsection | null {
  const section = findSectionConfig(sectionId);
  if (!section) return null;
  return section.subsections.find(s => s.id === subsectionId) || null;
}

export function getSubsectionProgress(
  sectionId: string,
  subsectionId: string,
  sectionData: Record<string, unknown> | undefined,
): SectionProgress {
  const subsection = findSubsectionConfig(sectionId, subsectionId);
  if (!subsection) return EMPTY;
  const data =
    sectionData && typeof sectionData === 'object' ? sectionData : {};
  const counted = countSubsection(subsection, data, sectionId);
  return result(counted.filled, counted.total);
}

/**
 * Progress for one repeatable topic/item (e.g. Bank Account #5).
 */
export function getTopicItemProgress(
  sectionId: string,
  subsectionId: string,
  itemIndex: number,
  sectionData: Record<string, unknown> | undefined,
  groupId?: string,
): SectionProgress {
  const subsection = findSubsectionConfig(sectionId, subsectionId);
  if (!subsection) return EMPTY;

  const data =
    sectionData && typeof sectionData === 'object' ? sectionData : {};

  if (groupId) {
    const group = (subsection.groups || []).find(g => g.id === groupId);
    if (!group) return EMPTY;
    const items = Array.isArray(data[groupId])
      ? (data[groupId] as unknown[])
      : [];
    const item = items[itemIndex];
    if (!item || typeof item !== 'object') {
      const countable = (group.fields || []).filter(f =>
        shouldCountField(f, {}),
      );
      return result(0, Math.max(countable.length, 1));
    }
    return resultFromFields(group.fields, item as Record<string, unknown>);
  }

  const bucket = data[subsectionId];
  if (Array.isArray(bucket)) {
    const item = bucket[itemIndex];
    if (!item || typeof item !== 'object') {
      const countable = (subsection.fields || []).filter(f =>
        shouldCountField(f, {}),
      );
      return result(0, Math.max(countable.length, 1));
    }
    return resultFromFields(
      subsection.fields,
      item as Record<string, unknown>,
    );
  }

  // Non-array subsection — treat whole object as the "item"
  const objectBucket = resolveObjectBucket(data, subsectionId, sectionId);
  if (!objectBucket) return EMPTY;
  return resultFromFields(subsection.fields, objectBucket);
}

function resultFromFields(
  fields: FieldDefinition[] | undefined,
  row: Record<string, unknown>,
): SectionProgress {
  const counted = countFieldsAgainstObject(fields, row);
  return result(counted.filled, counted.total);
}

/**
 * List empty countable fields for a subsection or a single topic item.
 */
export function listIncompleteFields(
  sectionId: string,
  subsectionId: string,
  sectionData: Record<string, unknown> | undefined,
  options?: { itemIndex?: number; groupId?: string },
): IncompleteField[] {
  const subsection = findSubsectionConfig(sectionId, subsectionId);
  if (!subsection) return [];

  const data =
    sectionData && typeof sectionData === 'object' ? sectionData : {};
  const itemIndex = options?.itemIndex;
  const groupId = options?.groupId;

  let fields: FieldDefinition[] = [];
  let row: Record<string, unknown> = {};

  if (groupId) {
    const group = (subsection.groups || []).find(g => g.id === groupId);
    if (!group) return [];
    fields = group.fields || [];
    const items = Array.isArray(data[groupId])
      ? (data[groupId] as unknown[])
      : [];
    if (typeof itemIndex === 'number') {
      const item = items[itemIndex];
      row =
        item && typeof item === 'object'
          ? (item as Record<string, unknown>)
          : {};
    }
  } else if (typeof itemIndex === 'number' && Array.isArray(data[subsectionId])) {
    fields = subsection.fields || [];
    const item = (data[subsectionId] as unknown[])[itemIndex];
    row =
      item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
  } else {
    fields = subsection.fields || [];
    row = resolveObjectBucket(data, subsectionId, sectionId) || {};
  }

  const incomplete: IncompleteField[] = [];
  for (const field of fields) {
    if (!shouldCountField(field, row)) continue;
    if (isMeaningfulFilled(row[field.key])) continue;
    incomplete.push({
      key: field.key,
      label: field.label || field.key,
      field,
    });
  }
  return incomplete;
}

/**
 * Apply one field value into section data (immutable).
 */
export function applySectionFieldValue(
  sectionData: Record<string, unknown> | undefined,
  subsectionId: string,
  fieldKey: string,
  value: unknown,
  options?: { itemIndex?: number; groupId?: string },
): Record<string, unknown> {
  const base =
    sectionData && typeof sectionData === 'object'
      ? { ...sectionData }
      : {};
  const itemIndex = options?.itemIndex;
  const groupId = options?.groupId;

  if (groupId) {
    const items = Array.isArray(base[groupId])
      ? [...(base[groupId] as unknown[])]
      : [];
    const idx = typeof itemIndex === 'number' ? itemIndex : 0;
    const current =
      items[idx] && typeof items[idx] === 'object'
        ? { ...(items[idx] as Record<string, unknown>) }
        : {};
    current[fieldKey] = value;
    items[idx] = current;
    base[groupId] = items;
    return base;
  }

  const bucket = base[subsectionId];
  if (Array.isArray(bucket) && typeof itemIndex === 'number') {
    const items = [...bucket];
    const current =
      items[itemIndex] && typeof items[itemIndex] === 'object'
        ? { ...(items[itemIndex] as Record<string, unknown>) }
        : {};
    current[fieldKey] = value;
    items[itemIndex] = current;
    base[subsectionId] = items;
    return base;
  }

  if (bucket && typeof bucket === 'object' && !Array.isArray(bucket)) {
    base[subsectionId] = {
      ...(bucket as Record<string, unknown>),
      [fieldKey]: value,
    };
    return base;
  }

  // Flat / vital_info style
  if (subsectionId === '1A' && base.vital_info && typeof base.vital_info === 'object') {
    base.vital_info = {
      ...(base.vital_info as Record<string, unknown>),
      [fieldKey]: value,
    };
    return base;
  }

  base[fieldKey] = value;
  return base;
}

