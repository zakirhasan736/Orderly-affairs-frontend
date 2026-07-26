function isEmptyValue(value: unknown): boolean {
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

function normalizeComparable(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['label', 'name', 'value', 'text', 'title', 'type']) {
      const nested = normalizeComparable(record[key]);
      if (nested) return nested;
    }
  }
  return '';
}

function getUploadText(value: unknown): string {
  if (value && typeof value === 'object' && 'text' in value) {
    return normalizeComparable((value as { text?: string }).text);
  }
  return normalizeComparable(value);
}

function normalizePolicyNumber(value: unknown): string {
  return getUploadText(value).replace(/[\s\-_.#]/g, '');
}

function getInsuranceCompany(item: Record<string, unknown>): string {
  return normalizeComparable(
    item.policy_company ??
      item.insurance_company ??
      item.provider ??
      item.carrier ??
      item.company,
  );
}

function getPolicyType(item: Record<string, unknown>): string {
  return normalizeComparable(item.policy_type ?? item.type);
}

function companiesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  // "State Farm Insurance" vs "State Farm"
  return a.includes(b) || b.includes(a);
}

function isUploadShape(value: unknown): value is { text?: string; files?: unknown[] } {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    ('text' in value || 'files' in value)
  );
}

export function vehiclesAreDuplicates(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): boolean {
  const existingVin = getUploadText(existing.vin);
  const incomingVin = getUploadText(incoming.vin);

  if (existingVin && incomingVin && existingVin === incomingVin) {
    return true;
  }

  // Conflicting VINs = different vehicles.
  if (existingVin && incomingVin && existingVin !== incomingVin) {
    return false;
  }

  const existingPlate = getUploadText(existing.license_plate);
  const incomingPlate = getUploadText(incoming.license_plate);

  if (existingPlate && incomingPlate && existingPlate === incomingPlate) {
    return true;
  }

  if (existingPlate && incomingPlate && existingPlate !== incomingPlate) {
    return false;
  }

  const existingYear = normalizeComparable(existing.year);
  const incomingYear = normalizeComparable(incoming.year);
  const existingMake = normalizeComparable(existing.make);
  const incomingMake = normalizeComparable(incoming.make);
  const existingModel = normalizeComparable(existing.model);
  const incomingModel = normalizeComparable(incoming.model);

  if (
    existingYear &&
    incomingYear &&
    existingMake &&
    incomingMake &&
    existingModel &&
    incomingModel &&
    existingYear === incomingYear &&
    existingMake === incomingMake &&
    existingModel === incomingModel
  ) {
    return true;
  }

  // Soft match: thin insurance seed ↔ richer vehicle extract sharing a policy.
  // Prevents overview multi-write from appending 2–3 partial vehicle rows.
  const existingPolicy = normalizePolicyNumber(
    existing.insurance_policy ?? existing.policy_number,
  );
  const incomingPolicy = normalizePolicyNumber(
    incoming.insurance_policy ?? incoming.policy_number,
  );
  if (existingPolicy && incomingPolicy && existingPolicy === incomingPolicy) {
    const existingIdentity =
      Boolean(existingVin || existingPlate) ||
      Boolean(existingYear && existingMake && existingModel);
    const incomingIdentity =
      Boolean(incomingVin || incomingPlate) ||
      Boolean(incomingYear && incomingMake && incomingModel);
    // Same policy + at least one side lacks full identity → treat as one car.
    if (!existingIdentity || !incomingIdentity) {
      return true;
    }
    // Both have identity but no conflicting VIN/plate and make matches.
    if (
      existingMake &&
      incomingMake &&
      existingMake === incomingMake &&
      (!existingYear || !incomingYear || existingYear === incomingYear)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Same insurance policy (renewal / re-upload) when:
 * - both have the same policy number, OR
 * - neither has a policy number AND company + type (+ other subtype) match
 *
 * Different policy numbers, or same company/type with a conflicting number,
 * are treated as separate policies (vehicle, bank/loan, home, etc.).
 */
export function insurancePoliciesAreDuplicates(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): boolean {
  const existingPolicy = normalizePolicyNumber(existing.policy_number);
  const incomingPolicy = normalizePolicyNumber(incoming.policy_number);

  if (existingPolicy && incomingPolicy) {
    return existingPolicy === incomingPolicy;
  }

  // One side has a number and the other doesn't (or numbers differ) → different policies.
  // Do not collapse multiple Vehicle/State Farm cards into one.
  if (existingPolicy || incomingPolicy) {
    return false;
  }

  const existingCompany = getInsuranceCompany(existing);
  const incomingCompany = getInsuranceCompany(incoming);
  const existingType = getPolicyType(existing);
  const incomingType = getPolicyType(incoming);
  const existingOther = normalizeComparable(
    existing.policy_type_other ?? existing.type_other,
  );
  const incomingOther = normalizeComparable(
    incoming.policy_type_other ?? incoming.type_other,
  );

  if (
    !existingCompany ||
    !incomingCompany ||
    !existingType ||
    !incomingType ||
    !companiesMatch(existingCompany, incomingCompany) ||
    existingType !== incomingType
  ) {
    return false;
  }

  // "Other" subtypes must also match when both specify them.
  if (existingType === 'other') {
    if (existingOther && incomingOther && existingOther !== incomingOther) {
      return false;
    }
  }

  return true;
}

/** Merge non-empty incoming fields into an existing card (never wipe with empties). */
export function mergeAutofillItemFields<T extends Record<string, unknown>>(
  existing: T,
  incoming: T,
): T {
  const next: Record<string, unknown> = { ...existing };

  for (const [key, value] of Object.entries(incoming)) {
    if (key === '__rowId') continue;
    // Owner-configured email recipients must survive AI merges.
    if (key === 'reminder_recipients') continue;
    if (isEmptyValue(value)) continue;

    const current = next[key];

    if (isUploadShape(value) || isUploadShape(current)) {
      const incomingUpload = isUploadShape(value)
        ? value
        : { text: String(value ?? ''), files: [] as unknown[] };
      const existingUpload = isUploadShape(current)
        ? current
        : { text: '', files: [] as unknown[] };

      const incomingText =
        typeof incomingUpload.text === 'string' ? incomingUpload.text.trim() : '';
      const existingText =
        typeof existingUpload.text === 'string' ? existingUpload.text.trim() : '';
      const incomingFiles = Array.isArray(incomingUpload.files)
        ? incomingUpload.files
        : [];
      const existingFiles = Array.isArray(existingUpload.files)
        ? existingUpload.files
        : [];

      next[key] = {
        text: incomingText || existingText,
        files: incomingFiles.length > 0 ? incomingFiles : existingFiles,
      };
      continue;
    }

    next[key] = value;
  }

  const existingRowId = (existing as Record<string, unknown>).__rowId;
  const incomingRowId = (incoming as Record<string, unknown>).__rowId;
  if (existingRowId && !incomingRowId) {
    next.__rowId = existingRowId;
  }

  return next as T;
}

/** Fill only empty fields — keep any existing values the user already entered. */
export function mergeAutofillItemFieldsEmptyOnly<T extends Record<string, unknown>>(
  existing: T,
  incoming: T,
): T {
  const next: Record<string, unknown> = { ...existing };

  for (const [key, value] of Object.entries(incoming)) {
    if (key === '__rowId' || key === 'reminder_recipients') continue;
    if (isEmptyValue(value)) continue;
    if (!isEmptyValue(next[key])) continue;

    if (isUploadShape(value)) {
      next[key] = {
        text: typeof value.text === 'string' ? value.text : '',
        files: Array.isArray(value.files) ? value.files : [],
      };
      continue;
    }

    next[key] = value;
  }

  const existingRowId = (existing as Record<string, unknown>).__rowId;
  if (existingRowId) next.__rowId = existingRowId;

  return next as T;
}

/** True when incoming would replace a non-empty existing field with a different value. */
export function itemWouldOverwriteExisting(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): boolean {
  for (const [key, value] of Object.entries(incoming)) {
    if (key === '__rowId' || key === 'reminder_recipients') continue;
    if (isEmptyValue(value)) continue;
    const current = existing[key];
    if (isEmptyValue(current)) continue;

    if (isUploadShape(value) || isUploadShape(current)) {
      const a = getUploadText(current);
      const b = getUploadText(value);
      if (a && b && a !== b) return true;
      continue;
    }

    const a = normalizeComparable(current);
    const b = normalizeComparable(value);
    if (a && b && a !== b) return true;
  }
  return false;
}

const IDENTITY_FIELD_GROUPS: string[][] = [
  ['charity_name', 'organization_name'],
  ['group_name', 'organization_name', 'name'],
  ['institution', 'school', 'college'],
  ['platform', 'website', 'service_name', 'account_name'],
  ['bank_name', 'institution_name', 'account_name'],
  ['provider_name', 'doctor_name', 'clinic_name'],
  ['employer', 'business_name', 'company_name'],
  ['creditor', 'card_name', 'lender'],
  ['document_name', 'title'],
  ['pet_name'],
  ['branch', 'service_branch'],
  ['make', 'model', 'year'],
  ['full_name', 'name', 'title'],
];

/**
 * Soft identity match for multi-card sections (charities, memberships, etc.).
 * Same document re-upload should update the card, not create another form.
 */
export function namedItemsAreDuplicates(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
  preferredKeys?: string[],
): boolean {
  const groups = preferredKeys?.length
    ? [preferredKeys]
    : IDENTITY_FIELD_GROUPS;

  for (const keys of groups) {
    for (const key of keys) {
      const a = getUploadText(existing[key]) || normalizeComparable(existing[key]);
      const b = getUploadText(incoming[key]) || normalizeComparable(incoming[key]);
      if (!a || !b) continue;
      if (a === b || a.includes(b) || b.includes(a)) return true;
    }
  }
  return false;
}

export function duplicateMatcherForSection(
  sectionId: string,
  subsectionKey?: string,
): ((existing: Record<string, unknown>, incoming: Record<string, unknown>) => boolean) | null {
  if (sectionId === '5' && (!subsectionKey || subsectionKey === '5A')) {
    return vehiclesAreDuplicates;
  }
  if (sectionId === '7' && (!subsectionKey || subsectionKey === '7A')) {
    return insurancePoliciesAreDuplicates;
  }

  const preferred: Record<string, string[]> = {
    '8': ['organization_name', 'group_name', 'name'],
    '9': ['charity_name', 'organization_name', 'name'],
    '10': ['institution', 'school', 'degree', 'name'],
    '11': ['branch', 'service_branch', 'rank'],
    '12': ['bank_name', 'institution_name', 'account_name', 'account_number'],
    '13': ['platform', 'website', 'account_name', 'username'],
    '14': ['institution', 'account_name', 'account_number', 'brokerage'],
    '15': ['provider_name', 'doctor_name', 'clinic_name', 'name'],
    '16': ['creditor', 'card_name', 'lender', 'account_name'],
    '17': ['name', 'full_name', 'pet_name', 'title'],
    '18': ['employer', 'business_name', 'company_name', 'name'],
    '19': ['item_name', 'property_name', 'name', 'title', 'description'],
    '20': ['document_name', 'title', 'name'],
  };

  const keys = preferred[sectionId];
  if (!keys) {
    return (existing, incoming) => namedItemsAreDuplicates(existing, incoming);
  }
  return (existing, incoming) =>
    namedItemsAreDuplicates(existing, incoming, keys);
}

export type AutofillConflictMode = 'overwrite' | 'keep' | 'ask';

/**
 * Update matching items in place; append only when no same-topic match exists.
 * `ask` prompts once when incoming would change existing non-empty values.
 */
export function upsertAutofillItems<T extends Record<string, unknown>>(
  currentItems: T[],
  incomingItems: T[],
  isDuplicate: (existing: T, incoming: T) => boolean,
  conflictMode: AutofillConflictMode = 'overwrite',
): { items: T[]; added: number; updated: number } {
  const items = [...currentItems];
  let added = 0;
  let updated = 0;
  let overwriteDecision: boolean | null = null;

  for (const incoming of incomingItems) {
    const hasData = Object.entries(incoming).some(
      ([key, value]) => key !== '__rowId' && !isEmptyValue(value),
    );
    if (!hasData) continue;

    const matchIndex = items.findIndex(existing => isDuplicate(existing, incoming));
    if (matchIndex >= 0) {
      const existing = items[matchIndex];
      let mode: 'overwrite' | 'keep' = conflictMode === 'keep' ? 'keep' : 'overwrite';

      if (
        conflictMode === 'ask' &&
        itemWouldOverwriteExisting(existing, incoming)
      ) {
        if (overwriteDecision === null) {
          overwriteDecision =
            typeof window !== 'undefined'
              ? window.confirm(
                  'This document matches information you already saved. Overwrite existing fields with the new values?\n\nChoose Cancel to keep your current values and only fill empty fields.',
                )
              : true;
        }
        mode = overwriteDecision ? 'overwrite' : 'keep';
      }

      items[matchIndex] =
        mode === 'keep'
          ? mergeAutofillItemFieldsEmptyOnly(existing, incoming)
          : mergeAutofillItemFields(existing, incoming);
      updated += 1;
    } else {
      items.push(incoming);
      added += 1;
    }
  }

  return { items, added, updated };
}

/** @deprecated Prefer upsertAutofillItems — kept for tests/callers that only need unique appends. */
export function filterDuplicateAutofillItems<T extends Record<string, unknown>>(
  currentItems: T[],
  incomingItems: T[],
  isDuplicate: (existing: T, incoming: T) => boolean,
): { unique: T[]; skipped: number } {
  const unique: T[] = [];
  let skipped = 0;

  for (const incoming of incomingItems) {
    const hasData = Object.entries(incoming).some(
      ([key, value]) => key !== '__rowId' && !isEmptyValue(value),
    );
    if (!hasData) continue;

    const duplicate = currentItems.some(existing => isDuplicate(existing, incoming));
    if (duplicate) {
      skipped += 1;
      continue;
    }

    const duplicateAmongIncoming = unique.some(item => isDuplicate(item, incoming));
    if (duplicateAmongIncoming) {
      skipped += 1;
      continue;
    }

    unique.push(incoming);
  }

  return { unique, skipped };
}

export function buildDuplicateSkippedNotice(
  skipped: number,
  itemLabel: string,
): string | null {
  if (skipped <= 0) return null;
  const label = itemLabel.toLowerCase();
  return skipped === 1
    ? `1 ${label} was already on file and was skipped.`
    : `${skipped} ${label}s were already on file and were skipped.`;
}

export function buildUpsertAutofillNotice(
  added: number,
  updated: number,
  itemLabel: string,
  targetIndex?: number,
): string | null {
  const label = itemLabel.toLowerCase();

  if (typeof targetIndex === 'number' && added + updated > 0) {
    if (updated > 0 && added === 0) {
      return `AI updated ${itemLabel} #${targetIndex + 1}. Please review the fields.`;
    }
    if (added === 1 && updated === 0) {
      return `AI filled ${itemLabel} #${targetIndex + 1}. Please review the fields.`;
    }
  }

  if (updated > 0 && added === 0) {
    return updated === 1
      ? `AI updated 1 existing ${label} with the latest document details. Please review the fields.`
      : `AI updated ${updated} existing ${label}s with the latest document details. Please review the fields.`;
  }

  if (added > 0 && updated === 0) {
    return added === 1
      ? `AI added 1 ${label}. Please review the fields.`
      : `AI added ${added} ${label}s. Please review the fields.`;
  }

  if (added > 0 && updated > 0) {
    return `AI updated ${updated} and added ${added} ${label}${added + updated === 1 ? '' : 's'}. Please review the fields.`;
  }

  return null;
}
