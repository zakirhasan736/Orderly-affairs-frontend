/** Shared helpers for AI autofill when documents contain multiple repeatable entries. */

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
}: {
  currentItems: T[];
  extractedItems: T[];
  targetIndex?: number;
  createEmpty: () => T;
  preserveRowId?: boolean;
}): T[] {
  if (extractedItems.length === 0) return currentItems;

  if (typeof targetIndex === 'number') {
    const next = [...currentItems];

    extractedItems.forEach((item, offset) => {
      const index = targetIndex + offset;
      const existing = next[index] || createEmpty();
      const merged = {
        ...existing,
        ...item,
      } as T;

      const existingRowId = (existing as Record<string, unknown>).__rowId;
      const itemRowId = (item as Record<string, unknown>).__rowId;

      if (preserveRowId && existingRowId && !itemRowId) {
        (merged as Record<string, unknown>).__rowId = existingRowId;
      }

      if (index < next.length) {
        next[index] = merged;
      } else {
        next.push(merged);
      }
    });

    return next;
  }

  return [...currentItems, ...extractedItems];
}

export function describeAutofillItem(
  item: Record<string, unknown>,
  preferredFields: string[] = DEFAULT_DESCRIBE_FIELDS,
): string {
  for (const field of preferredFields) {
    const value = item[field];
    if (!isEmptyAutofillValue(value)) {
      return String(value);
    }
  }

  for (const field of DEFAULT_DESCRIBE_FIELDS) {
    const value = item[field];
    if (!isEmptyAutofillValue(value)) {
      return String(value);
    }
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
