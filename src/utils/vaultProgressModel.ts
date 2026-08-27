/**
 * Vault section progress v2: started / incomplete / complete + item counts.
 * UI should not treat field-fill % as "done" for variable-length (entries) sections.
 */

import { VAULT_SCHEMA } from '@/vault-prototype';
import { toSchemaView } from '@/vault-prototype/schemaDataBridge';
import {
  fieldSlug,
  fieldViewKey,
  type SchemaField,
  type SchemaSub,
} from '@/vault-prototype/types';
import type { SectionProgress, SectionStatus } from '@/utils/sectionCompletion';

export type { SectionStatus };

export type SectionProgressV2 = {
  status: SectionStatus;
  started: boolean;
  complete: boolean;
  itemCount: number;
  completeItemCount: number;
  percent?: number;
  filled: number;
  total: number;
};

type Dict = Record<string, unknown>;

function isFilled(value: unknown): boolean {
  if (value === true) return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (value && typeof value === 'object') {
    const record = value as Dict;
    if (typeof record.text === 'string' && record.text.trim()) return true;
    if (Array.isArray(record.files) && record.files.length) return true;
  }
  return false;
}

function valueForField(record: Dict, field: SchemaField): unknown {
  const keys = [fieldViewKey(field), fieldSlug(field.k), field.store].filter(
    (key): key is string => Boolean(key),
  );
  for (const key of keys) {
    if (isFilled(record[key])) return record[key];
  }
  return undefined;
}

function requiredFields(fields: SchemaField[]): SchemaField[] {
  return fields.filter(field => field.req === 1 || field.req === true);
}

function rowStarted(record: Dict, fields: SchemaField[]): boolean {
  return fields.some(field => isFilled(valueForField(record, field)));
}

function rowComplete(record: Dict, fields: SchemaField[]): boolean {
  const needed = requiredFields(fields);
  if (needed.length === 0) return rowStarted(record, fields);
  return needed.every(field => isFilled(valueForField(record, field)));
}

function countFields(record: Dict, fields: SchemaField[]): {
  filled: number;
  total: number;
} {
  let filled = 0;
  const total = fields.length;
  for (const field of fields) {
    if (isFilled(valueForField(record, field))) filled += 1;
  }
  return { filled, total: total || 0 };
}

function formSurface(subs: SchemaSub[], view: Dict) {
  const formSubs = subs.filter(sub => sub.kind === 'form');
  let filled = 0;
  let total = 0;
  let started = false;
  let complete = true;

  for (const sub of formSubs) {
    const record =
      view[sub.id] && typeof view[sub.id] === 'object' && !Array.isArray(view[sub.id])
        ? (view[sub.id] as Dict)
        : {};
    const counted = countFields(record, sub.fields);
    filled += counted.filled;
    total += counted.total;
    if (!rowStarted(record, sub.fields)) continue;
    started = true;
    if (!rowComplete(record, sub.fields)) complete = false;
  }

  if (formSubs.length === 0) {
    return { started: false, complete: true, filled: 0, total: 0, hasForm: false };
  }

  if (!started) complete = false;
  return { started, complete: started && complete, filled, total, hasForm: true };
}

export function buildSectionProgress(args: {
  filled: number;
  total: number;
  complete: boolean;
  started: boolean;
  itemCount: number;
  completeItemCount: number;
}): SectionProgress {
  const total = Math.max(0, args.total);
  const filled = Math.max(0, args.filled);
  const percent = total <= 0 ? 0 : Math.round((filled / total) * 100);
  const started = Boolean(args.started || args.itemCount > 0 || args.complete);
  const complete = Boolean(args.complete && started);
  const status: SectionStatus = complete
    ? 'complete'
    : started
      ? 'incomplete'
      : 'not_started';
  const itemCount = started ? Math.max(args.itemCount, 1) : 0;
  const completeItemCount = complete
    ? Math.max(args.completeItemCount, 1)
    : Math.max(0, Math.min(args.completeItemCount, itemCount));

  return {
    percent,
    filled,
    total,
    complete,
    started,
    status,
    itemCount,
    completeItemCount,
  };
}

/**
 * Schema-aware section progress: entries count as started rows, not a target length.
 */
export function getVaultSectionProgress(
  sectionId: string,
  sectionData: Record<string, unknown> | undefined,
  opts?: { documentCount?: number; disabled?: boolean },
): SectionProgress {
  if (opts?.disabled) {
    return buildSectionProgress({
      filled: 1,
      total: 1,
      complete: true,
      started: true,
      itemCount: 1,
      completeItemCount: 1,
    });
  }

  const section = VAULT_SCHEMA.find(item => item.apiId === String(sectionId));
  const documentCount = Math.max(0, opts?.documentCount ?? 0);

  if (!section) {
    const data = sectionData && typeof sectionData === 'object' ? sectionData : {};
    const started = documentCount > 0 || Object.values(data).some(isFilled);
    return buildSectionProgress({
      filled: started ? 1 : 0,
      total: 1,
      complete: false,
      started,
      itemCount: started ? 1 : 0,
      completeItemCount: 0,
    });
  }

  const view = toSchemaView(sectionId, sectionData);
  const hasEntries = section.subs.some(sub => sub.kind === 'entries');
  let filled = 0;
  let total = 0;
  let itemCount = 0;
  let completeItemCount = 0;

  for (const sub of section.subs) {
    if (sub.kind !== 'entries') continue;
    const rows = Array.isArray(view[sub.id]) ? (view[sub.id] as Dict[]) : [];
    for (const row of rows) {
      const record = row && typeof row === 'object' ? row : {};
      const counted = countFields(record, sub.fields);
      if (sub.fields.length === 0) {
        total += 1;
      } else {
        filled += counted.filled;
        total += counted.total;
      }
      if (!rowStarted(record, sub.fields) && sub.fields.length > 0) continue;
      itemCount += 1;
      if (rowComplete(record, sub.fields) || sub.fields.length === 0) {
        completeItemCount += 1;
      }
    }
  }

  const form = formSurface(section.subs, view);
  filled += form.filled;
  total += form.total;

  if (hasEntries) {
    if (form.started) {
      itemCount += 1;
      if (form.complete) completeItemCount += 1;
    }
  } else if (form.hasForm) {
    if (form.started) {
      itemCount = 1;
      completeItemCount = form.complete ? 1 : 0;
    }
  }

  if (itemCount === 0 && documentCount > 0) {
    itemCount = 1;
    completeItemCount = 0;
    if (total <= 0) total = 1;
    if (filled <= 0) filled = 1;
  }

  const started = itemCount > 0;
  const complete = started && completeItemCount === itemCount && itemCount >= 1;

  return buildSectionProgress({
    filled,
    total: total || (started ? 1 : 0),
    complete,
    started,
    itemCount,
    completeItemCount,
  });
}
