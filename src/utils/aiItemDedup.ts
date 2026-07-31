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
 * - same company + type and at most one side has a policy number (thin seed ↔ full extract), OR
 * - neither has a policy number AND company + type (+ other subtype) match
 *
 * Conflicting non-empty policy numbers are always separate policies.
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

  const companyAndTypeMatch =
    Boolean(existingCompany) &&
    Boolean(incomingCompany) &&
    Boolean(existingType) &&
    Boolean(incomingType) &&
    companiesMatch(existingCompany, incomingCompany) &&
    existingType === incomingType &&
    !(
      existingType === 'other' &&
      existingOther &&
      incomingOther &&
      existingOther !== incomingOther
    );

  // One side has a number, the other doesn't → same policy when company+type align
  // (e.g. vehicle seed card without number + full declarations page).
  if ((existingPolicy || incomingPolicy) && companyAndTypeMatch) {
    return true;
  }

  if (existingPolicy || incomingPolicy) {
    return false;
  }

  return companyAndTypeMatch;
}

/** Collapse near-duplicate extracted items into one card before apply. */
export function collapseItemsByMatcher(
  items: Record<string, unknown>[],
  isDuplicate: (
    existing: Record<string, unknown>,
    incoming: Record<string, unknown>,
  ) => boolean,
): Record<string, unknown>[] {
  if (!Array.isArray(items) || items.length <= 1) return items;

  const merged: Record<string, unknown>[] = [];
  for (const item of items) {
    const matchIndex = merged.findIndex(existing =>
      isDuplicate(existing, item),
    );
    if (matchIndex === -1) {
      merged.push({ ...item });
      continue;
    }
    merged[matchIndex] = mergeAutofillItemFields(merged[matchIndex], item);
  }
  return merged;
}

/** Collapse near-duplicate insurance extracts into one card before apply. */
export function collapseInsurancePolicies(
  items: Record<string, unknown>[],
): Record<string, unknown>[] {
  return collapseItemsByMatcher(items, insurancePoliciesAreDuplicates);
}

/**
 * Soft identity match for accounts that share a number or institution+type.
 */
export function accountsAreDuplicates(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
  options: {
    numberKeys: string[];
    institutionKeys: string[];
    typeKeys?: string[];
  },
): boolean {
  const numberA = options.numberKeys
    .map(key => normalizePolicyNumber(existing[key]))
    .find(Boolean);
  const numberB = options.numberKeys
    .map(key => normalizePolicyNumber(incoming[key]))
    .find(Boolean);

  if (numberA && numberB) return numberA === numberB;

  const institutionA = options.institutionKeys
    .map(key => normalizeComparable(existing[key]) || getUploadText(existing[key]))
    .find(Boolean);
  const institutionB = options.institutionKeys
    .map(key => normalizeComparable(incoming[key]) || getUploadText(incoming[key]))
    .find(Boolean);

  const typeKeys = options.typeKeys ?? [];
  const typeA = typeKeys
    .map(key => normalizeComparable(existing[key]))
    .find(Boolean);
  const typeB = typeKeys
    .map(key => normalizeComparable(incoming[key]))
    .find(Boolean);

  const sameInstitution =
    Boolean(institutionA) &&
    Boolean(institutionB) &&
    (institutionA === institutionB ||
      institutionA!.includes(institutionB!) ||
      institutionB!.includes(institutionA!));

  const sameType =
    !typeA ||
    !typeB ||
    typeA === typeB ||
    typeA.includes(typeB) ||
    typeB.includes(typeA);

  if ((numberA || numberB) && sameInstitution && sameType) {
    return true;
  }

  if (numberA || numberB) {
    return false;
  }

  return Boolean(sameInstitution && sameType && institutionA && institutionB);
}

export function bankAccountsAreDuplicates(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): boolean {
  return accountsAreDuplicates(existing, incoming, {
    numberKeys: ['account_number'],
    institutionKeys: ['bank_name', 'institution_name', 'account_name'],
    typeKeys: ['account_type'],
  });
}

export function investmentAccountsAreDuplicates(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): boolean {
  return accountsAreDuplicates(existing, incoming, {
    numberKeys: ['account_number'],
    institutionKeys: [
      'financial_institution',
      'institution',
      'brokerage',
      'account_name',
    ],
    typeKeys: ['account_type'],
  });
}

export function onlineAccountsAreDuplicates(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): boolean {
  const serviceA =
    normalizeComparable(existing.service_name) ||
    normalizeComparable(existing.platform) ||
    normalizeComparable(existing.website) ||
    normalizeComparable(existing.account_name);
  const serviceB =
    normalizeComparable(incoming.service_name) ||
    normalizeComparable(incoming.platform) ||
    normalizeComparable(incoming.website) ||
    normalizeComparable(incoming.account_name);

  if (!serviceA || !serviceB) {
    return namedItemsAreDuplicates(existing, incoming, [
      'service_name',
      'platform',
      'website',
      'account_name',
      'account_username',
      'username',
    ]);
  }

  const sameService =
    serviceA === serviceB ||
    serviceA.includes(serviceB) ||
    serviceB.includes(serviceA);
  if (!sameService) return false;

  const userA =
    normalizeComparable(existing.account_username) ||
    normalizeComparable(existing.username) ||
    normalizeComparable(existing.email_associated);
  const userB =
    normalizeComparable(incoming.account_username) ||
    normalizeComparable(incoming.username) ||
    normalizeComparable(incoming.email_associated);

  if (!userA || !userB) return true;
  return userA === userB || userA.includes(userB) || userB.includes(userA);
}

export function educationEntriesAreDuplicates(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): boolean {
  const schoolA =
    normalizeComparable(existing.institution_name) ||
    normalizeComparable(existing.institution) ||
    normalizeComparable(existing.school);
  const schoolB =
    normalizeComparable(incoming.institution_name) ||
    normalizeComparable(incoming.institution) ||
    normalizeComparable(incoming.school);

  if (!schoolA || !schoolB) {
    return namedItemsAreDuplicates(existing, incoming, [
      'institution_name',
      'degree_type',
      'field_of_study',
      'graduation_year',
    ]);
  }

  const sameSchool =
    schoolA === schoolB ||
    schoolA.includes(schoolB) ||
    schoolB.includes(schoolA);
  if (!sameSchool) return false;

  const degreeA =
    normalizeComparable(existing.degree_type) ||
    normalizeComparable(existing.degree);
  const degreeB =
    normalizeComparable(incoming.degree_type) ||
    normalizeComparable(incoming.degree);
  if (!degreeA || !degreeB) return true;
  return (
    degreeA === degreeB || degreeA.includes(degreeB) || degreeB.includes(degreeA)
  );
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
  ['institution_name', 'institution', 'school', 'college'],
  ['service_name', 'platform', 'website', 'account_name'],
  ['bank_name', 'institution_name', 'account_name'],
  ['financial_institution', 'brokerage', 'institution'],
  ['provider_name', 'doctor_name', 'clinic_name'],
  ['employer_name', 'employer', 'business_name', 'company_name'],
  ['creditor_name', 'creditor', 'card_name', 'lender'],
  ['document_type', 'document_name', 'title'],
  ['pet_name'],
  ['branch_of_service', 'branch', 'service_branch'],
  ['make', 'model', 'year'],
  ['item_description', 'item_name', 'property_address', 'full_name', 'name', 'title'],
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

function getMilitaryBranch(item: Record<string, unknown>): string {
  return (
    normalizeComparable(item.branch_of_service) ||
    normalizeComparable(item.branch) ||
    normalizeComparable(item.service_branch) ||
    normalizeComparable(item.branch_of_service_other)
  );
}

function getMilitaryDates(item: Record<string, unknown>): string {
  return normalizeComparable(item.service_dates);
}

/**
 * Same branch + overlapping/missing dates = same service period (update in place).
 * Same branch with clearly different date ranges = distinct periods (append).
 */
export function militaryServicePeriodsAreDuplicates(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): boolean {
  const branchA = getMilitaryBranch(existing);
  const branchB = getMilitaryBranch(incoming);
  const datesA = getMilitaryDates(existing);
  const datesB = getMilitaryDates(incoming);

  if (branchA && branchB) {
    const sameBranch =
      branchA === branchB || branchA.includes(branchB) || branchB.includes(branchA);
    if (!sameBranch) return false;
    if (!datesA || !datesB) return true;
    return (
      datesA === datesB || datesA.includes(datesB) || datesB.includes(datesA)
    );
  }

  if (datesA && datesB) {
    return (
      datesA === datesB || datesA.includes(datesB) || datesB.includes(datesA)
    );
  }

  return namedItemsAreDuplicates(existing, incoming, [
    'rank_achieved',
    'rank',
    'military_occupational_specialty',
  ]);
}

/** Collapse DD-214 fragment splits into one card before autofill apply. */
export function collapseMilitaryServicePeriods(
  items: Record<string, unknown>[],
): Record<string, unknown>[] {
  return collapseItemsByMatcher(items, militaryServicePeriodsAreDuplicates);
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
  if (sectionId === '11' && (!subsectionKey || subsectionKey === '11A')) {
    return militaryServicePeriodsAreDuplicates;
  }
  if (sectionId === '10' && (!subsectionKey || subsectionKey === '10A')) {
    return educationEntriesAreDuplicates;
  }
  if (sectionId === '13' && (!subsectionKey || subsectionKey === '13A')) {
    return onlineAccountsAreDuplicates;
  }
  if (sectionId === '14' && (!subsectionKey || subsectionKey === '14A')) {
    return investmentAccountsAreDuplicates;
  }
  if (
    sectionId === '12' &&
    (!subsectionKey || subsectionKey === '12A' || subsectionKey === '12B')
  ) {
    if (subsectionKey === '12B') {
      return (existing, incoming) =>
        namedItemsAreDuplicates(existing, incoming, [
          'service_name',
          'username',
          'account_email_phone',
          'account_name',
        ]);
    }
    return bankAccountsAreDuplicates;
  }
  if (sectionId === '16') {
    if (subsectionKey === '16B') {
      return (existing, incoming) =>
        accountsAreDuplicates(existing, incoming, {
          numberKeys: ['account_number'],
          institutionKeys: ['creditor_name', 'creditor', 'lender'],
          typeKeys: ['debt_type'],
        });
    }
    return (existing, incoming) =>
      accountsAreDuplicates(existing, incoming, {
        numberKeys: ['card_number', 'account_number'],
        institutionKeys: ['card_name', 'creditor_name', 'creditor'],
        typeKeys: ['card_type', 'debt_type'],
      });
  }

  const preferred: Record<string, string[]> = {
    '8': ['organization_name', 'group_name', 'name'],
    '9': ['charity_name', 'organization_name', 'name'],
    '15': ['provider_name', 'doctor_name', 'clinic_name', 'name'],
    '17': [
      'person_name',
      'friend_name',
      'pet_name',
      'dependent_name',
      'item_name',
      'full_name',
      'name',
    ],
    '18': [
      'employer_name',
      'employer',
      'business_name',
      'company_name',
      'income_source',
      'name',
    ],
    '19': [
      'item_description',
      'item_type',
      'property_address',
      'property_name',
      'current_location',
      'name',
      'title',
    ],
    '20': [
      'document_type',
      'document_description',
      'document_name',
      'parties_involved',
      'title',
      'name',
    ],
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

/**
 * Collapse same-topic incoming fragments, then upsert onto current cards.
 * Same data → update; truly new entity → append.
 */
export function applyExtractedArrayWithDedup<T extends Record<string, unknown>>(
  sectionId: string,
  subsectionKey: string | undefined,
  currentItems: T[],
  incomingItems: T[],
  conflictMode: AutofillConflictMode = 'overwrite',
): { items: T[]; updated: number; added: number } {
  const matcher =
    duplicateMatcherForSection(sectionId, subsectionKey) ||
    ((a, b) => namedItemsAreDuplicates(a, b));

  const collapsed = collapseItemsByMatcher(
    incomingItems as Record<string, unknown>[],
    matcher,
  ) as T[];

  return upsertAutofillItems(currentItems, collapsed, matcher, conflictMode);
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
