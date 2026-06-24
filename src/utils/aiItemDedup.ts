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
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

function getUploadText(value: unknown): string {
  if (value && typeof value === 'object' && 'text' in value) {
    return normalizeComparable((value as { text?: string }).text);
  }
  return normalizeComparable(value);
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

  const existingPlate = getUploadText(existing.license_plate);
  const incomingPlate = getUploadText(incoming.license_plate);

  if (existingPlate && incomingPlate && existingPlate === incomingPlate) {
    return true;
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

  return false;
}

export function insurancePoliciesAreDuplicates(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): boolean {
  const existingPolicy = getUploadText(existing.policy_number);
  const incomingPolicy = getUploadText(incoming.policy_number);

  if (existingPolicy && incomingPolicy && existingPolicy === incomingPolicy) {
    return true;
  }

  const existingCompany = normalizeComparable(
    existing.insurance_company ?? existing.policy_company ?? existing.provider,
  );
  const incomingCompany = normalizeComparable(
    incoming.insurance_company ?? incoming.policy_company ?? incoming.provider,
  );
  const existingType = normalizeComparable(existing.policy_type);
  const incomingType = normalizeComparable(incoming.policy_type);

  if (
    existingCompany &&
    incomingCompany &&
    existingType &&
    incomingType &&
    existingCompany === incomingCompany &&
    existingType === incomingType
  ) {
    return true;
  }

  return false;
}

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
