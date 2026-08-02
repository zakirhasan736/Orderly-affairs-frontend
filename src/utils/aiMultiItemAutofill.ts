/** Shared helpers for AI autofill when documents contain multiple repeatable entries. */

import {
  itemHasIncomingChanges,
  mergeAutofillItemFields,
  upsertAutofillItems,
} from '@/utils/aiItemDedup';

const DEFAULT_DESCRIBE_FIELDS = [
  'name',
  'full_name',
  'title',
  'account_name',
  'bank_name',
  'service_name',
  'insurance_company',
  'policy_type',
  'charity_name',
  'organization_name',
  'group_name',
  'institution',
  'school',
  'provider_name',
  'doctor_name',
  'business_name',
  'employer',
  'creditor',
  'card_name',
  'document_name',
  'pet_name',
  'platform',
  'website',
  'make',
  'model',
  'year',
  'vin',
  'branch',
  'service_branch',
  'branch_of_service',
  'rank_achieved',
  'service_dates',
];

export function isEmptyAutofillValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (
    typeof value === 'object' &&
    value !== null &&
    'text' in value &&
    'files' in value
  ) {
    const uploadValue = value as { text?: string; files?: unknown[] };
    return (
      !uploadValue.text &&
      (!uploadValue.files || uploadValue.files.length === 0)
    );
  }
  return false;
}

export function cleanAutofillPatchObject(
  patch: Record<string, unknown> | null | undefined,
  options?: { skipKeys?: string[] },
): Record<string, unknown> {
  if (!patch || typeof patch !== 'object') return {};

  const skip = new Set([
    '__rowId',
    ...(options?.skipKeys ?? []),
  ]);

  const entries: [string, unknown][] = [];

  for (const [key, value] of Object.entries(patch) as [string, unknown][]) {
    if (skip.has(key)) continue;
    if (key.endsWith('_instructions')) continue;
    if (key.endsWith('_header')) continue;
    if (key.endsWith('_section')) continue;

    const normalizedValue =
      key === 'year' && !isEmptyAutofillValue(value) ? String(value) : value;

    if (!isEmptyAutofillValue(normalizedValue)) {
      entries.push([key, normalizedValue]);
    }
  }

  return Object.fromEntries(entries);
}

export function itemHasAutofillData(
  item: Record<string, unknown>,
  ignoreKeys: string[] = ['__rowId'],
): boolean {
  const ignore = new Set(ignoreKeys);
  return Object.entries(item).some(
    ([key, value]) => !ignore.has(key) && !isEmptyAutofillValue(value),
  );
}

export function extractAutofillArrayFromPatch<T extends Record<string, unknown>>({
  patch,
  subsectionKey,
  normalizeItem,
  singleObjectDetectKeys = [],
}: {
  patch: unknown;
  subsectionKey: string;
  normalizeItem: (raw: unknown) => T;
  singleObjectDetectKeys?: string[];
}): T[] {
  const root =
    patch &&
    typeof patch === 'object' &&
    'patch' in (patch as object) &&
    (patch as { patch?: unknown }).patch &&
    typeof (patch as { patch?: unknown }).patch === 'object'
      ? (patch as { patch: Record<string, unknown> }).patch
      : (patch as Record<string, unknown> | null | undefined);

  let rawItems = root?.[subsectionKey];

  if (
    !rawItems &&
    root &&
    typeof root === 'object' &&
    !Array.isArray(root) &&
    singleObjectDetectKeys.some(key => !isEmptyAutofillValue(root[key]))
  ) {
    rawItems = root;
  }

  if (Array.isArray(rawItems)) {
    return rawItems
      .map(item => normalizeItem(item))
      .filter(item => itemHasAutofillData(item));
  }

  if (rawItems && typeof rawItems === 'object') {
    const item = normalizeItem(rawItems);
    return itemHasAutofillData(item) ? [item] : [];
  }

  return [];
}

export function applyItemsToIndexedList<T extends Record<string, unknown>>({
  currentItems,
  extractedItems,
  targetIndex,
  createEmpty,
  preserveRowId = true,
  isDuplicate,
  conflictMode = 'overwrite',
}: {
  currentItems: T[];
  extractedItems: T[];
  targetIndex?: number;
  createEmpty: () => T;
  preserveRowId?: boolean;
  isDuplicate?: (existing: T, incoming: T) => boolean;
  conflictMode?: import('@/utils/aiItemDedup').AutofillConflictMode;
}): {
  items: T[];
  added: number;
  updated: number;
  unchanged: number;
  skipped: number;
} {
  if (extractedItems.length === 0) {
    return {
      items: currentItems,
      added: 0,
      updated: 0,
      unchanged: 0,
      skipped: 0,
    };
  }

  const mergeAt = (base: T[], index: number, item: T): T[] => {
    const next = [...base];
    const existing = next[index] || createEmpty();
    const merged = mergeAutofillItemFields(existing, item);

    const existingRowId = (existing as Record<string, unknown>).__rowId;
    const itemRowId = (item as Record<string, unknown>).__rowId;

    if (preserveRowId && existingRowId && !itemRowId) {
      (merged as Record<string, unknown>).__rowId = existingRowId;
    }

    if (index < next.length) {
      next[index] = merged;
    } else {
      while (next.length < index) {
        next.push(createEmpty());
      }
      next.push(merged);
    }

    return next;
  };

  // Explicit card target: always fill that card with the first extracted item
  // (user chose this card). Remaining items upsert (update same topic / add new).
  if (typeof targetIndex === 'number') {
    const hadTarget = targetIndex < currentItems.length;
    const existingTarget = hadTarget
      ? currentItems[targetIndex]
      : createEmpty();
    let next = currentItems;
    let added = 0;
    let updated = 0;
    let unchanged = 0;

    if (
      hadTarget &&
      !itemHasIncomingChanges(
        existingTarget as Record<string, unknown>,
        extractedItems[0] as Record<string, unknown>,
      )
    ) {
      unchanged = 1;
      next = [...currentItems];
    } else {
      next = mergeAt(currentItems, targetIndex, extractedItems[0]);
      added = hadTarget ? 0 : 1;
      updated = hadTarget ? 1 : 0;
    }
    const remaining = extractedItems.slice(1);

    if (remaining.length > 0) {
      if (isDuplicate) {
        const upserted = upsertAutofillItems(
          next,
          remaining,
          isDuplicate,
          conflictMode,
        );
        next = upserted.items;
        added += upserted.added;
        updated += upserted.updated;
        unchanged += upserted.unchanged;
      } else {
        next = [...next, ...remaining];
        added += remaining.length;
      }
    }

    return { items: next, added, updated, unchanged, skipped: 0 };
  }

  if (isDuplicate) {
    const upserted = upsertAutofillItems(
      currentItems,
      extractedItems,
      isDuplicate,
      conflictMode,
    );
    return {
      items: upserted.items,
      added: upserted.added,
      updated: upserted.updated,
      unchanged: upserted.unchanged,
      skipped: 0,
    };
  }

  return {
    items: [...currentItems, ...extractedItems],
    added: extractedItems.length,
    updated: 0,
    unchanged: 0,
    skipped: 0,
  };
}

export function describeAutofillItem(
  item: Record<string, unknown>,
  preferredFields: string[] = DEFAULT_DESCRIBE_FIELDS,
): string {
  const asLabel = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value).trim();
    }
    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      for (const key of ['label', 'name', 'value', 'text', 'title', 'type']) {
        const nested = asLabel(record[key]);
        if (nested) return nested;
      }
    }
    return '';
  };

  for (const field of preferredFields) {
    const label = asLabel(item[field]);
    if (label) return label;
  }

  for (const field of DEFAULT_DESCRIBE_FIELDS) {
    const label = asLabel(item[field]);
    if (label) return label;
  }

  return 'Entry';
}

export function buildAutofillSuccessNotice(
  count: number,
  itemLabel: string,
  targetIndex?: number,
  addedAll = true,
): string {
  const label = itemLabel.toLowerCase();

  if (count === 1 && typeof targetIndex === 'number') {
    return `AI filled ${itemLabel} #${targetIndex + 1}. Please review the fields.`;
  }

  if (typeof targetIndex === 'number') {
    return addedAll
      ? `AI filled ${count} ${label}s starting at ${itemLabel} #${targetIndex + 1}. Please review each card.`
      : `AI filled only ${itemLabel} #${targetIndex + 1}. Please review the fields.`;
  }

  return count === 1
    ? `AI added 1 ${label}. Please review the fields.`
    : `AI added ${count} ${label}s. Please review the fields.`;
}

export function buildMultiItemFoundNotice(count: number, itemLabel: string) {
  return `Found ${count} ${itemLabel.toLowerCase()} entries in this document.`;
}
