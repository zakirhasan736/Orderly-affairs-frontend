/**
 * Per-section fill progress for vault sidebar checkmarks.
 * Complete (checkmark) only when percent === 100.
 */

import { formConfig } from '@/config/formConfig';
import type { FieldDefinition, Subsection } from '@/types/formTypes';
import { NOK_LETTER_DEFAULTS } from '@/utils/nokLetterPreview';
import { countSectionFieldUploads } from '@/utils/sectionFieldUploads';
import { listAiUploadHistory } from '@/utils/aiUploadHistory';

export type SectionProgress = {
  percent: number;
  complete: boolean;
  filled: number;
  total: number;
};

/** Shape used for Access Management progress (NOK people list). */
export type AccessPersonLike = {
  full_name?: unknown;
  email?: unknown;
  relationship?: unknown;
  immediate_access?: unknown;
  nok_letter_received?: unknown;
  password_card_generated?: unknown;
  card_storage_location?: unknown;
  key_bag_location?: unknown;
  documents_bag_location?: unknown;
};

export type SectionProgressContext = {
  formData: Record<string, unknown>;
  instructionRead?: boolean;
  myNextKin?: AccessPersonLike[] | null;
  /** Latest API letter for the selected / first NOK (may include metadata only). */
  dashboardNokLetter?: Record<string, unknown> | null;
  disabledSections?: Record<string, boolean>;
  /**
   * AI vault documents linked to each section id (from upload history).
   * Used so a section shows partial progress when docs exist but fields are empty.
   */
  sectionAiDocumentCounts?: Record<string, number>;
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

/**
 * When related documents exist but field fill is still 0%, credit one "started"
 * slot so the sidebar shows a partial ring instead of an empty circle.
 */
function withDocumentStartedBoost(
  progress: SectionProgress,
  documentCount: number,
): SectionProgress {
  if (documentCount <= 0 || progress.complete || progress.percent > 0) {
    return progress;
  }
  const total = Math.max(progress.total, 1);
  return result(1, total);
}

function countDocumentsForSection(
  sectionId: string,
  sectionData: Record<string, unknown> | undefined,
  ctx: SectionProgressContext,
): number {
  const fieldDocs = countSectionFieldUploads(sectionData, sectionId);
  const fromCtx = ctx.sectionAiDocumentCounts?.[sectionId];
  if (typeof fromCtx === 'number') {
    return fieldDocs + Math.max(0, fromCtx);
  }
  try {
    const aiDocs = listAiUploadHistory({ sectionId }).filter(
      item => item.status !== 'failed',
    ).length;
    return fieldDocs + aiDocs;
  } catch {
    return fieldDocs;
  }
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

/**
 * A letter "exists" when:
 * - it was saved to the API (has an id), or
 * - the owner customized at least one message field.
 *
 * Access Management autofill alone (name/email) without a save does NOT count.
 * GET no longer auto-creates stubs, so an id means the owner added a letter.
 */
function isPresentNokLetter(letter: unknown): boolean {
  if (!letter || typeof letter !== 'object') return false;
  const doc = letter as Record<string, unknown>;
  if (typeof doc.id === 'string' && doc.id.trim()) return true;
  for (const key of NOK_LETTER_MESSAGE_KEYS) {
    if (isLetterContentFilled(key, doc[key])) return true;
  }
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

/**
 * Access Management is binary: at least one trusted person → Done.
 * No field-fill percentage in the sidebar (same pattern as NOK letter).
 */
export function hasAtLeastOneAccessPerson(
  people: AccessPersonLike[] | null | undefined,
): boolean {
  return Array.isArray(people) && people.length > 0;
}

export function getAccessManagementSectionProgress(
  people: AccessPersonLike[] | null | undefined,
): SectionProgress {
  if (hasAtLeastOneAccessPerson(people)) {
    return { percent: 100, complete: true, filled: 1, total: 1 };
  }
  return { percent: 0, complete: false, filled: 0, total: 1 };
}

/**
 * Personal Messages is binary: at least one message exists → Done.
 * No field-fill percentage in the sidebar (same as Access Management / NOK letter).
 */
export function listPersonalMessages(
  section4: Record<string, unknown> | undefined,
): unknown[] {
  let list: unknown[] = [];
  const letters = section4?.['4A'];
  if (letters && typeof letters === 'object' && !Array.isArray(letters)) {
    const nested = (letters as Record<string, unknown>).letters_data;
    if (Array.isArray(nested)) list = nested;
  }
  if (list.length === 0 && Array.isArray(section4?.letters_data)) {
    list = section4.letters_data as unknown[];
  }
  return list;
}

function isPresentPersonalMessage(item: unknown): boolean {
  if (!item || typeof item !== 'object') return false;
  const row = item as Record<string, unknown>;
  if (row.id || row._id) return true;
  if (isMeaningfulFilled(row.recipient_name) || isMeaningfulFilled(row.recipientName)) {
    return true;
  }
  if (isMeaningfulFilled(row.title)) return true;
  if (
    isMeaningfulFilled(row.message_body) ||
    isMeaningfulFilled(row.body) ||
    isMeaningfulFilled(row.letter_body) ||
    isMeaningfulFilled(row.attachment_url) ||
    isMeaningfulFilled(row.media_url)
  ) {
    return true;
  }
  return false;
}

export function hasAtLeastOnePersonalMessage(
  section4: Record<string, unknown> | undefined,
): boolean {
  return listPersonalMessages(section4).some(isPresentPersonalMessage);
}

export function getPersonalMessagesSectionProgress(
  section4: Record<string, unknown> | undefined,
): SectionProgress {
  if (hasAtLeastOnePersonalMessage(section4)) {
    return { percent: 100, complete: true, filled: 1, total: 1 };
  }
  return { percent: 0, complete: false, filled: 0, total: 1 };
}

function getPersonalMessagesProgress(
  section4: Record<string, unknown> | undefined,
): SectionProgress {
  return getPersonalMessagesSectionProgress(section4);
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

  const formData =
    ctx.formData && typeof ctx.formData === 'object' ? ctx.formData : {};

  if (sectionId === '2') {
    return getAccessManagementSectionProgress(ctx.myNextKin);
  }

  if (sectionId === '3') {
    const section3 = formData['3'] as Record<string, unknown> | undefined;
    return getNokLetterSectionProgress(section3, ctx.dashboardNokLetter);
  }

  if (sectionId === '4') {
    return getPersonalMessagesProgress(
      formData['4'] as Record<string, unknown> | undefined,
    );
  }

  const sectionData = formData[sectionId] as Record<string, unknown> | undefined;
  const progress = getFormConfigSectionProgress(sectionId, sectionData);
  return withDocumentStartedBoost(
    progress,
    countDocumentsForSection(sectionId, sectionData, ctx),
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
  /** Current stored value when listing the full area. */
  value?: unknown;
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
  // Access Management / NOK letter / Personal messages: section-level binary only.
  if (sectionId === '2' || sectionId === '3' || sectionId === '4') {
    return EMPTY;
  }

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
 * All countable fields for a subsection or topic item (filled + empty).
 */
export function listAreaFields(
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

  const pushFields = (
    fields: FieldDefinition[] | undefined,
    row: Record<string, unknown>,
    labelPrefix?: string,
  ) => {
    const all: IncompleteField[] = [];
    for (const field of fields || []) {
      if (!shouldCountField(field, row)) continue;
      const baseLabel = field.label || field.key;
      all.push({
        key: field.key,
        label: labelPrefix ? `${labelPrefix} · ${baseLabel}` : baseLabel,
        field,
        value: row[field.key],
      });
    }
    return all;
  };

  if (groupId) {
    const group = (subsection.groups || []).find(g => g.id === groupId);
    if (!group) return [];
    const items = Array.isArray(data[groupId])
      ? (data[groupId] as unknown[])
      : [];
    if (typeof itemIndex === 'number') {
      const item = items[itemIndex];
      const row =
        item && typeof item === 'object'
          ? (item as Record<string, unknown>)
          : {};
      return pushFields(group.fields, row);
    }
    // Whole group: walk every non-empty item card
    const out: IncompleteField[] = [];
    const countable = (group.fields || []).filter(f => shouldCountField(f, {}));
    if (items.length === 0) {
      return pushFields(group.fields, {});
    }
    items.forEach((item, idx) => {
      if (!item || typeof item !== 'object') return;
      const row = item as Record<string, unknown>;
      const hasAny = countable.some(f => isMeaningfulFilled(row[f.key]));
      if (!hasAny) return;
      out.push(
        ...pushFields(group.fields, row, `${group.title || 'Item'} #${idx + 1}`),
      );
    });
    if (out.length === 0) return pushFields(group.fields, {});
    return out;
  }

  const bucket = data[subsectionId];

  if (typeof itemIndex === 'number' && Array.isArray(bucket)) {
    const item = bucket[itemIndex];
    const row =
      item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    return pushFields(subsection.fields, row);
  }

  // Repeatable subsection cards (vehicles, policies, …)
  if (Array.isArray(bucket)) {
    const countable = (subsection.fields || []).filter(f =>
      shouldCountField(f, {}),
    );
    if (bucket.length === 0) {
      return pushFields(subsection.fields, {});
    }
    const out: IncompleteField[] = [];
    const itemNoun =
      subsection.itemLabel ||
      subsection.title?.replace(/s$/i, '') ||
      'Item';
    bucket.forEach((item, idx) => {
      if (!item || typeof item !== 'object') return;
      const row = item as Record<string, unknown>;
      const hasAny = countable.some(f => isMeaningfulFilled(row[f.key]));
      if (!hasAny) return;
      out.push(
        ...pushFields(subsection.fields, row, `${itemNoun} #${idx + 1}`),
      );
    });
    if (out.length === 0) return pushFields(subsection.fields, {});
    return out;
  }

  const row = resolveObjectBucket(data, subsectionId, sectionId) || {};
  return pushFields(subsection.fields, row);
}

/**
 * Empty countable fields across every subsection / card in a section.
 */
export function listIncompleteFieldsForSection(
  sectionId: string,
  sectionData: Record<string, unknown> | undefined,
): IncompleteField[] {
  const config = findSectionConfig(sectionId);
  if (!config) return [];
  const data =
    sectionData && typeof sectionData === 'object' ? sectionData : {};
  const out: IncompleteField[] = [];

  if (config.fields?.length) {
    for (const field of config.fields) {
      if (!shouldCountField(field, data)) continue;
      if (isMeaningfulFilled(data[field.key])) continue;
      out.push({
        key: field.key,
        label: field.label || field.key,
        field,
        value: data[field.key],
      });
    }
  }

  for (const subsection of config.subsections || []) {
    out.push(
      ...listIncompleteFields(sectionId, subsection.id, data).map(item => ({
        ...item,
        label: item.label.includes('·')
          ? item.label
          : `${subsection.title || subsection.id} · ${item.label}`,
      })),
    );
    for (const group of subsection.groups || []) {
      out.push(
        ...listIncompleteFields(sectionId, subsection.id, data, {
          groupId: group.id,
        }),
      );
    }
  }

  return out;
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
  return listAreaFields(sectionId, subsectionId, sectionData, options).filter(
    item => !isMeaningfulFilled(item.value),
  );
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

