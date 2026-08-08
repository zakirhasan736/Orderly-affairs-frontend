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

/** Display text from string or `{ text, files }` — preserves original casing. */
function extractDisplayText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    return value.map(extractDisplayText).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if ('text' in record || 'files' in record) {
      return extractDisplayText(record.text);
    }
    for (const key of ['label', 'name', 'value', 'title']) {
      const nested = extractDisplayText(record[key]);
      if (nested) return nested;
    }
  }
  return '';
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

const VEHICLE_MAKE_BRAND_RE =
  /\b(toyota|honda|jeep|ford|chevrolet|chevy|bmw|mercedes|nissan|hyundai|kia|subaru|mazda|lexus|gmc|ram|dodge|volkswagen|vw|audi|tesla|chrysler|buick|cadillac|acura|infiniti|lincoln|volvo|porsche|mini|mitsubishi)\b/i;
const DATE_LIKE_RE = /^\d{1,2}[./\-]\d{1,2}([./\-]\d{2,4})?$/;
/** e.g. TO.01/08 — OCR date fragments mistaken for a vehicle title */
const DATEISH_VEHICLE_TITLE_RE = /^[A-Za-z]{1,3}\.?\s*\d{1,2}[./\-]\d{1,2}/;

/**
 * Drop bogus vehicle cards (date snippets like "TO.01/08") so only real
 * Toyota / Honda / Jeep extracts become inner subsections.
 */
export function isJunkVehicleCard(item: Record<string, unknown>): boolean {
  const make = extractDisplayText(item.make);
  const model = extractDisplayText(item.model);
  const year = extractDisplayText(item.year);
  const vin = extractDisplayText(item.vin).replace(/\s+/g, '');
  const plate = extractDisplayText(item.license_plate);

  // Date / OCR garbage always junk — even if policy fields were copied onto the row.
  if (
    DATEISH_VEHICLE_TITLE_RE.test(make) ||
    DATEISH_VEHICLE_TITLE_RE.test(model) ||
    DATEISH_VEHICLE_TITLE_RE.test(`${make} ${model}`.trim())
  ) {
    return true;
  }
  if (DATE_LIKE_RE.test(make) && !VEHICLE_MAKE_BRAND_RE.test(make)) {
    return true;
  }
  if (
    DATE_LIKE_RE.test(year) &&
    !/^(19|20)\d{2}$/.test(year) &&
    !VEHICLE_MAKE_BRAND_RE.test(make) &&
    !vin
  ) {
    return true;
  }

  const hasNamedMake = VEHICLE_MAKE_BRAND_RE.test(make);
  const hasNamedModel = VEHICLE_MAKE_BRAND_RE.test(model);
  if (hasNamedMake || hasNamedModel) return false;
  if (vin && vin.length >= 11) return false;
  if (
    /^(19|20)\d{2}$/.test(year) &&
    make.length >= 3 &&
    !DATE_LIKE_RE.test(make) &&
    !DATEISH_VEHICLE_TITLE_RE.test(make)
  ) {
    return false;
  }
  if (plate && plate.length >= 4 && make.length >= 3 && !DATE_LIKE_RE.test(make)) {
    return false;
  }

  const bits = [make, model, year, plate].filter(Boolean);
  if (!bits.length) {
    // Insurance-only bridge (no YMM/VIN/plate) — do not create a vehicle subsection.
    return true;
  }

  if (
    bits.every(
      bit =>
        DATE_LIKE_RE.test(bit) ||
        DATEISH_VEHICLE_TITLE_RE.test(bit) ||
        bit.length <= 2,
    )
  ) {
    return true;
  }

  // Year field holding a day/month date with no real make → junk.
  if (DATE_LIKE_RE.test(year) && (!make || make.length <= 2) && !model && !vin) {
    return true;
  }

  // Unnamed / thin rows without a brand → hide from accordion + sidebar.
  return true;
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
  // Never collapse two distinct cars that share one policy number.
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

    // Any conflicting identity signal = different vehicles.
    if (
      (existingMake && incomingMake && existingMake !== incomingMake) ||
      (existingModel && incomingModel && existingModel !== incomingModel) ||
      (existingYear && incomingYear && existingYear !== incomingYear)
    ) {
      return false;
    }

    // Both thin seeds on the same policy → one placeholder card.
    if (!existingIdentity && !incomingIdentity) {
      return true;
    }

    // Enrich a thin seed with a full extract (not the reverse — a full Toyota
    // card must not absorb a thin Honda/Jeep seed that only shares a policy #).
    if (!existingIdentity && incomingIdentity) {
      return true;
    }
    if (existingIdentity && !incomingIdentity) {
      return false;
    }

    // Both identified and YMM aligns (no conflicts above).
    if (
      existingMake &&
      incomingMake &&
      existingMake === incomingMake &&
      (!existingYear || !incomingYear || existingYear === incomingYear) &&
      (!existingModel || !incomingModel || existingModel === incomingModel)
    ) {
      return true;
    }

    return false;
  }

  return false;
}

function insuranceDetailScore(item: Record<string, unknown>): number {
  const detailKeys = [
    'policy_number',
    'coverage_amount',
    'premium_info',
    'beneficiaries',
    'policy_contact',
    'notes',
    'additional_notes',
    'effective_date',
    'expiration_date',
    'renewal_date',
    'policy_documents',
    'policy_documents_life',
    'policy_name',
    'named_insured',
    'insured_name',
  ];
  let score = 0;
  for (const key of detailKeys) {
    if (!isEmptyValue(item[key])) score += 1;
  }
  return score;
}

/** Thin partner seed (company+type only) vs a fuller declarations extract. */
function isThinInsuranceCard(item: Record<string, unknown>): boolean {
  return insuranceDetailScore(item) <= 1;
}

const VEHICLE_BRAND_RE =
  /\b(toyota|honda|jeep|ford|chevrolet|chevy|bmw|mercedes|nissan|hyundai|kia|subaru|mazda|lexus|gmc|ram|dodge|volkswagen|vw|audi|tesla|chrysler|buick|cadillac|acura|infiniti|lincoln|volvo|porsche|mini|mitsubishi)\b/i;

function getInsuranceDisplayName(item: Record<string, unknown>): string {
  return normalizeComparable(
    item.policy_name ??
      item.named_insured ??
      item.insured_name ??
      item.policy_title ??
      item.account_name,
  );
}

function getInsuranceNotes(item: Record<string, unknown>): string {
  return normalizeComparable(
    item.notes ?? item.additional_notes ?? item.additional_note ?? item.comments,
  );
}

/**
 * Fingerprint for which vehicle a policy covers (Honda vs Toyota vs Jeep).
 * Uses explicit make/model/VIN first, then brand words inside notes / names.
 */
function getInsuranceVehicleFingerprint(item: Record<string, unknown>): string {
  const vin = getUploadText(
    item.vin ?? item.vehicle_vin ?? item.insured_vin,
  );
  if (vin) return `vin:${vin}`;

  const make = normalizeComparable(
    item.make ?? item.vehicle_make ?? item.insured_vehicle_make,
  );
  const model = normalizeComparable(
    item.model ?? item.vehicle_model ?? item.insured_vehicle_model,
  );
  const year = normalizeComparable(
    item.year ?? item.vehicle_year ?? item.insured_vehicle_year,
  );
  if (make || model || year) {
    return `ymm:${year}|${make}|${model}`;
  }

  const blob = [
    getInsuranceNotes(item),
    getInsuranceDisplayName(item),
    normalizeComparable(item.vehicle_description),
    normalizeComparable(item.description),
    normalizeComparable(item.policy_type_other),
  ]
    .filter(Boolean)
    .join(' ');
  const brand = blob.match(VEHICLE_BRAND_RE)?.[1];
  if (brand) return `brand:${brand.toLowerCase()}`;
  return '';
}

/** Parse brand/make (+ optional model) from vin/ymm/brand fingerprints. */
function parseInsuranceVehicleFingerprint(fp: string): {
  vin: string;
  brand: string;
  model: string;
} {
  if (!fp) return { vin: '', brand: '', model: '' };
  if (fp.startsWith('vin:')) {
    return { vin: fp.slice(4), brand: '', model: '' };
  }
  if (fp.startsWith('brand:')) {
    return { vin: '', brand: fp.slice(6), model: '' };
  }
  if (fp.startsWith('ymm:')) {
    const [, make = '', model = ''] = fp.slice(4).split('|');
    return { vin: '', brand: make, model };
  }
  return { vin: '', brand: '', model: '' };
}

/**
 * Treat ymm:|bmw|ix and brand:bmw as the same car; only conflict when both
 * sides name different makes/models (or different VINs).
 */
function insuranceVehicleFingerprintsMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;

  const parsedA = parseInsuranceVehicleFingerprint(a);
  const parsedB = parseInsuranceVehicleFingerprint(b);

  if (parsedA.vin || parsedB.vin) {
    return Boolean(parsedA.vin && parsedB.vin && parsedA.vin === parsedB.vin);
  }

  if (!parsedA.brand || !parsedB.brand || parsedA.brand !== parsedB.brand) {
    return false;
  }

  if (
    parsedA.model &&
    parsedB.model &&
    parsedA.model !== parsedB.model &&
    !parsedA.model.includes(parsedB.model) &&
    !parsedB.model.includes(parsedA.model)
  ) {
    return false;
  }

  return true;
}

/**
 * Honda / Jeep / Toyota vehicle policies must not collapse into one card when
 * insured vehicles clearly differ — even if carrier + type match.
 *
 * Same-vehicle re-uploads with slightly different OCR notes must still merge.
 */
function insuranceIdentityConflicts(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): boolean {
  const vehicleA = getInsuranceVehicleFingerprint(existing);
  const vehicleB = getInsuranceVehicleFingerprint(incoming);
  if (vehicleA && vehicleB) {
    if (insuranceVehicleFingerprintsMatch(vehicleA, vehicleB)) {
      // Same insured vehicle → ignore noisy note/name differences.
      return false;
    }
    return true;
  }

  const nameA = getInsuranceDisplayName(existing);
  const nameB = getInsuranceDisplayName(incoming);
  if (
    nameA &&
    nameB &&
    nameA !== nameB &&
    !nameA.includes(nameB) &&
    !nameB.includes(nameA)
  ) {
    // Names that both embed different vehicle brands are distinct policies.
    // Generic OCR title differences ("Allstate Insurance" vs "Allstate Policy")
    // must not block company+type merges.
    const brandA = nameA.match(VEHICLE_BRAND_RE)?.[1]?.toLowerCase() || '';
    const brandB = nameB.match(VEHICLE_BRAND_RE)?.[1]?.toLowerCase() || '';
    if (brandA && brandB && brandA !== brandB) return true;
  }

  const notesA = getInsuranceNotes(existing);
  const notesB = getInsuranceNotes(incoming);
  if (
    notesA &&
    notesB &&
    notesA !== notesB &&
    !notesA.includes(notesB) &&
    !notesB.includes(notesA)
  ) {
    const brandA = notesA.match(VEHICLE_BRAND_RE)?.[1]?.toLowerCase() || '';
    const brandB = notesB.match(VEHICLE_BRAND_RE)?.[1]?.toLowerCase() || '';
    // Only treat notes as a conflict when they clearly name different vehicles.
    if (brandA && brandB && brandA !== brandB) return true;
  }

  return false;
}

function insuranceTypesCompatible(
  existingType: string,
  incomingType: string,
  existingOther: string,
  incomingOther: string,
): boolean {
  if (!existingType || !incomingType || existingType !== incomingType) {
    return false;
  }
  if (
    existingType === 'other' &&
    existingOther &&
    incomingOther &&
    existingOther !== incomingOther
  ) {
    return false;
  }
  return true;
}

/**
 * Same insurance policy (renewal / re-upload) when:
 * - both have the same policy number (and no conflicting vehicle), OR
 * - same company+type with the same vehicle fingerprint, OR
 * - same vehicle fingerprint + type even when company is missing on a card, OR
 * - same company+type for non-vehicle policies, OR
 * - thin seed ↔ fuller extract for the same company+type
 *
 * Distinct Honda / Jeep / Toyota Vehicle policies stay separate cards.
 */
export function insurancePoliciesAreDuplicates(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): boolean {
  // Different cars / strongly conflicting names → never the same card.
  if (insuranceIdentityConflicts(existing, incoming)) {
    return false;
  }

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

  const typesMatch = insuranceTypesCompatible(
    existingType,
    incomingType,
    existingOther,
    incomingOther,
  );
  const companiesCompatible =
    !existingCompany ||
    !incomingCompany ||
    companiesMatch(existingCompany, incomingCompany);
  const companyAndTypeMatch =
    Boolean(existingCompany) &&
    Boolean(incomingCompany) &&
    typesMatch &&
    companiesMatch(existingCompany, incomingCompany);

  const vehicleA = getInsuranceVehicleFingerprint(existing);
  const vehicleB = getInsuranceVehicleFingerprint(incoming);
  if (vehicleA && vehicleB) {
    if (!insuranceVehicleFingerprintsMatch(vehicleA, vehicleB)) {
      return false;
    }
    // Same car: merge when types align and companies don't contradict.
    // Sidebar often shows "Bmw · Vehicle" cards with no policy_company.
    return typesMatch && companiesCompatible;
  }

  if (!companyAndTypeMatch) {
    return false;
  }

  const isVehicleType =
    existingType === 'vehicle' ||
    existingType === 'auto' ||
    incomingType === 'vehicle' ||
    incomingType === 'auto';

  // Home / life / health / etc.: same carrier + type is the same policy card.
  if (!isVehicleType) {
    return true;
  }

  // One side identified the vehicle; only absorb a thin company/type seed into it.
  if (vehicleA || vehicleB) {
    return isThinInsuranceCard(existing) || isThinInsuranceCard(incoming);
  }

  // Neither card identifies a vehicle. Prefer collapsing OCR re-accepts of the
  // same carrier shell (see Allstate sidebar duplicates) over keeping anonymous
  // multi-car placeholders. Distinct cars should carry brand/VIN in notes.
  return true;
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
        : { text: value, files: [] as unknown[] };
      const existingUpload = isUploadShape(current)
        ? current
        : { text: current, files: [] as unknown[] };

      const incomingText =
        extractDisplayText(incomingUpload.text) || extractDisplayText(value);
      const existingText =
        extractDisplayText(existingUpload.text) || extractDisplayText(current);
      const incomingFiles = Array.isArray(incomingUpload.files)
        ? incomingUpload.files
        : [];
      const existingFiles = Array.isArray(existingUpload.files)
        ? existingUpload.files
        : [];
      const mergedFiles =
        incomingFiles.length > 0 ? incomingFiles : existingFiles;
      const mergedText = incomingText || existingText;

      // VIN / insurance_policy are plain TextInputs. Never re-wrap a text-only
      // value as `{ text, files }` or the input shows "[object Object]".
      if (mergedFiles.length === 0) {
        next[key] = mergedText;
        continue;
      }

      next[key] = {
        text: mergedText,
        files: mergedFiles,
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
      const text = extractDisplayText(value);
      const files = Array.isArray(value.files) ? value.files : [];
      next[key] = files.length > 0 ? { text, files } : text;
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

/**
 * True when incoming has any new or different non-empty field vs existing.
 * Same Toyota re-upload with identical fields → false (no fill needed).
 * Even one changed field (VIN, color, etc.) → true (overwrite/merge).
 */
export function itemHasIncomingChanges(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): boolean {
  for (const [key, value] of Object.entries(incoming)) {
    if (key === '__rowId' || key === 'reminder_recipients') continue;
    if (isEmptyValue(value)) continue;

    const current = existing[key];
    if (isEmptyValue(current)) return true;

    if (isUploadShape(value) || isUploadShape(current)) {
      const aText = getUploadText(current);
      const bText = getUploadText(value);
      if (aText !== bText) return true;
      const aFiles = isUploadShape(current) && Array.isArray(current.files)
        ? current.files.length
        : 0;
      const bFiles = isUploadShape(value) && Array.isArray(value.files)
        ? value.files.length
        : 0;
      if (bFiles > aFiles) return true;
      continue;
    }

    if (normalizeComparable(current) !== normalizeComparable(value)) {
      return true;
    }
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
): { items: T[]; added: number; updated: number; unchanged: number } {
  const items = [...currentItems];
  let added = 0;
  let updated = 0;
  let unchanged = 0;
  let overwriteDecision: boolean | null = null;

  for (const incoming of incomingItems) {
    const hasData = Object.entries(incoming).some(
      ([key, value]) => key !== '__rowId' && !isEmptyValue(value),
    );
    if (!hasData) continue;

    const matchIndex = items.findIndex(existing => isDuplicate(existing, incoming));
    if (matchIndex >= 0) {
      const existing = items[matchIndex];

      // Same vehicle/policy already on file with identical data — do not
      // count as a new fill or rewrite the card.
      if (!itemHasIncomingChanges(existing, incoming)) {
        unchanged += 1;
        continue;
      }

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

  return { items, added, updated, unchanged };
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
): { items: T[]; updated: number; added: number; unchanged: number } {
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
  unchanged = 0,
): string | null {
  const label = itemLabel.toLowerCase();

  if (added === 0 && updated === 0 && unchanged > 0) {
    return unchanged === 1
      ? `That ${label} is already on file with the same data — nothing new to fill.`
      : `${unchanged} matching ${label}s are already on file with the same data — nothing new to fill.`;
  }

  if (typeof targetIndex === 'number' && added + updated > 0) {
    if (updated > 0 && added === 0) {
      return `AI updated ${itemLabel} #${targetIndex + 1} with new data from this document.`;
    }
    if (added === 1 && updated === 0) {
      return `AI filled ${itemLabel} #${targetIndex + 1}. Please review the fields.`;
    }
  }

  if (updated > 0 && added === 0) {
    return updated === 1
      ? `That ${label} is already on file — new/changed fields were updated from this document. No new card was created.`
      : `${updated} matching ${label}s were already on file and were updated with new data. No new cards were created.`;
  }

  if (added > 0 && updated === 0) {
    const sameNote =
      unchanged > 0
        ? ` ${unchanged} matching ${label}${unchanged === 1 ? ' was' : 's were'} already on file (same data).`
        : '';
    return added === 1
      ? `AI added 1 new ${label} card.${sameNote} Please review the fields.`
      : `AI added ${added} new ${label} cards.${sameNote} Please review the fields.`;
  }

  if (added > 0 && updated > 0) {
    return `AI updated ${updated} existing ${label}${updated === 1 ? '' : 's'} with new data and added ${added} new card${added === 1 ? '' : 's'}. Please review.`;
  }

  return null;
}
