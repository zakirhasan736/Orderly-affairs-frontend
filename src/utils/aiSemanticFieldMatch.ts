/**
 * Smart semantic field matching: understand wording mismatches, then place
 * values onto the correct section field keys (Vehicles ↔ Insurance, etc.).
 */

export type SemanticConcept =
  | 'policy_number'
  | 'policy_company'
  | 'policy_expiry'
  | 'coverage_amount'
  | 'vehicle_vin'
  | 'license_plate';

type ConceptMeta = {
  label: string;
  aliases: string[];
  targets: Record<string, string>;
};

const CONCEPTS: Record<SemanticConcept, ConceptMeta> = {
  policy_number: {
    label: 'Policy / insurance number',
    aliases: [
      'policy_number',
      'policy_no',
      'policy_num',
      'policy_id',
      'insurance_policy',
      'insurance_policy_number',
      'insurance_number',
      'insurance_no',
      'insurance_num',
      'insurance_id',
      'ins_policy',
      'ins_number',
      'member_id',
      'member_number',
      'member_no',
      'certificate_number',
      'certificate_no',
      'plan_number',
      'plan_id',
      'naic',
      'naic_number',
      'policy #',
      'pol no',
      'pol_num',
      'pol_number',
    ],
    targets: {
      vehicles: 'insurance_policy',
      '5': 'insurance_policy',
      insurance_policies: 'policy_number',
      '7': 'policy_number',
    },
  },
  policy_company: {
    label: 'Insurance company',
    aliases: [
      'policy_company',
      'insurance_company',
      'insurance_carrier',
      'insurance_provider',
      'carrier',
      'carrier_name',
      'provider',
      'provider_name',
      'insurer',
      'underwriter',
    ],
    targets: {
      vehicles: 'insurance_company',
      '5': 'insurance_company',
      insurance_policies: 'policy_company',
      '7': 'policy_company',
    },
  },
  policy_expiry: {
    label: 'Policy / registration expiry',
    aliases: [
      'policy_expiry',
      'policy_expiration',
      'policy_expires',
      'registration_expiry',
      'registration_expiration',
      'expiration_date',
      'expiry_date',
    'expires',
    'expire',
    'valid_through',
    'valid_thru',
    'valid_until',
    'valid_to',
    'policy_period_end',
    'period_end',
    'end_date',
    'coverage_ends',
    'term_end',
    'renewal_date',
    'policy_period',
    'coverage_period',
    'effective_dates',
    ],
    targets: {
      vehicles: 'registration_expiry',
      '5': 'registration_expiry',
      insurance_policies: 'policy_expiry',
      '7': 'policy_expiry',
    },
  },
  coverage_amount: {
    label: 'Coverage amount',
    aliases: [
      'coverage_amount',
      'coverage',
      'coverage_limit',
      'death_benefit',
      'liability_limit',
      'insured_amount',
      'benefit_amount',
    ],
    targets: {
      insurance_policies: 'coverage_amount',
      '7': 'coverage_amount',
    },
  },
  vehicle_vin: {
    label: 'VIN',
    aliases: ['vin', 'vehicle_identification_number', 'vin_number'],
    targets: { vehicles: 'vin', '5': 'vin' },
  },
  license_plate: {
    label: 'License plate',
    aliases: [
      'license_plate',
      'licence_plate',
      'plate',
      'plate_number',
      'tag_number',
    ],
    targets: { vehicles: 'license_plate', '5': 'license_plate' },
  },
};

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function asPlainText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['text', 'label', 'name', 'value', 'title', 'type']) {
      const nested = asPlainText(record[key]);
      if (nested) return nested;
    }
  }
  return '';
}

const PERIOD_END_RE =
  /(?:policy\s*period|period|valid(?:\s*(?:from|thru|through|until))?|expires?(?:\s*on)?|expiration|coverage\s*(?:period|ends?)|term|effective|from)[^\d]{0,48}(?:(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}).{0,24}?(?:to|through|thru|until|–|-|—)\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|(\d{4}-\d{2}-\d{2}).{0,24}?(?:to|through|thru|until|–|-|—)\s*(\d{4}-\d{2}-\d{2})|(?:to|through|thru|until|ends?)\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2}))/i;

const BARE_RANGE_RE =
  /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\s*(?:to|through|thru|until|–|-|—)\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})/i;

const MONTH_RANGE_RE =
  /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4}).{0,24}?(?:to|through|thru|until|–|-|—)\s*(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i;

const MONTH_NAME_TO_NUM: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

export function normalizeDateToIso(value: string | null | undefined): string {
  if (!value) return '';
  const text = String(value).trim();
  if (!text) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const slash = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slash) {
    let a = Number(slash[1]);
    let b = Number(slash[2]);
    let y = Number(slash[3]);
    if (y < 100) y += y < 70 ? 2000 : 1900;
    let month = a;
    let day = b;
    if (a > 12 && b <= 12) {
      day = a;
      month = b;
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${String(y).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return text;
}

export function extractEndDateFromText(text: string | null | undefined): string {
  if (!text) return '';
  const raw = String(text);

  const monthMatch = raw.match(MONTH_RANGE_RE);
  if (monthMatch) {
    const month = MONTH_NAME_TO_NUM[monthMatch[4].toLowerCase().replace(/\.$/, '')];
    if (month) {
      const day = Number(monthMatch[5]);
      const year = Number(monthMatch[6]);
      return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const match = raw.match(PERIOD_END_RE);
  if (match) {
    const end = (match[2] || match[4] || match[5] || match[3] || match[1] || '').trim();
    return normalizeDateToIso(end);
  }

  const bare = raw.match(BARE_RANGE_RE);
  if (bare) return normalizeDateToIso(bare[2]);

  if (/^(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})$/.test(raw.trim())) {
    return normalizeDateToIso(raw.trim());
  }

  return '';
}

export function resolveSemanticConcept(key: string): SemanticConcept | null {
  const n = normalizeKey(key);
  const spaced = key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  for (const [concept, meta] of Object.entries(CONCEPTS) as [
    SemanticConcept,
    ConceptMeta,
  ][]) {
    for (const alias of meta.aliases) {
      if (n === normalizeKey(alias)) return concept;
    }
  }

  // Human meaning: insurance number ≈ policy number
  if (
    (spaced.includes('insurance') ||
      spaced.includes('policy') ||
      spaced.includes('member')) &&
    (spaced.includes('number') ||
      spaced.includes('num') ||
      spaced.endsWith(' no') ||
      spaced.includes(' id')) &&
    !spaced.includes('plate') &&
    !spaced.includes('company') &&
    !spaced.includes('carrier') &&
    !spaced.includes('type')
  ) {
    return 'policy_number';
  }

  if (
    (spaced.includes('insurance') || spaced.includes('carrier')) &&
    (spaced.includes('company') ||
      spaced.includes('provider') ||
      spaced === 'carrier')
  ) {
    return 'policy_company';
  }

  for (const [concept, meta] of Object.entries(CONCEPTS) as [
    SemanticConcept,
    ConceptMeta,
  ][]) {
    for (const alias of meta.aliases) {
      const a = normalizeKey(alias);
      if (a.length >= 8 && (n.includes(a) || a.includes(n))) {
        if (
          concept === 'policy_number' &&
          /(company|carrier|provider|type)/.test(n)
        ) {
          continue;
        }
        return concept;
      }
    }
  }

  return null;
}

export function targetFieldForConcept(
  concept: SemanticConcept,
  sectionIdOrKey: string,
): string | null {
  return CONCEPTS[concept]?.targets[sectionIdOrKey] || null;
}

export function conceptLabel(concept: SemanticConcept | string | null | undefined) {
  if (!concept) return '';
  return CONCEPTS[concept as SemanticConcept]?.label || String(concept).replace(/_/g, ' ');
}

export function collectConceptsFromItem(
  item: Record<string, unknown>,
): Partial<Record<SemanticConcept, string>> {
  const found: Partial<Record<SemanticConcept, string>> = {};

  Object.entries(item).forEach(([key, value]) => {
    if (key === '__rowId') return;
    const text = asPlainText(value);
    if (!text) return;
    const concept = resolveSemanticConcept(key);
    if (concept && !found[concept]) {
      if (concept === 'policy_expiry') {
        found[concept] = extractEndDateFromText(text) || normalizeDateToIso(text) || text;
      } else {
        found[concept] = text;
      }
    }
  });

  if (!found.policy_expiry) {
    for (const key of [
      'premium_info',
      'notes',
      'policy_documents',
      'registration_expiry',
      'policy_expiry',
      'policy_period',
      'coverage_period',
      'effective_dates',
      'term',
    ]) {
      const end = extractEndDateFromText(asPlainText(item[key]));
      if (end) {
        found.policy_expiry = end;
        break;
      }
    }
  }

  if (!found.policy_expiry) {
    for (const [key, value] of Object.entries(item)) {
      if (key === '__rowId') continue;
      const end = extractEndDateFromText(asPlainText(value));
      if (end) {
        found.policy_expiry = end;
        break;
      }
    }
  }

  if (found.policy_expiry) {
    found.policy_expiry =
      normalizeDateToIso(found.policy_expiry) || found.policy_expiry;
  }

  return found;
}

/**
 * Remap / fill fields on a patch object using semantic meaning for a section.
 */
export function applySemanticConceptsToItem(
  item: Record<string, unknown>,
  sectionIdOrKey: string,
): Record<string, unknown> {
  const next = { ...item };
  const concepts = collectConceptsFromItem(item);

  (Object.entries(concepts) as [SemanticConcept, string][]).forEach(
    ([concept, value]) => {
      const target = targetFieldForConcept(concept, sectionIdOrKey);
      if (!target) return;
      if (asPlainText(next[target])) return;
      next[target] = value;
    },
  );

  return next;
}

export function applySemanticConceptsToPatch(
  patch: Record<string, unknown>,
  sectionId: string,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...patch };

  Object.entries(patch).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      next[key] = value.map(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
        return applySemanticConceptsToItem(
          item as Record<string, unknown>,
          sectionId,
        );
      });
      return;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      next[key] = applySemanticConceptsToItem(
        value as Record<string, unknown>,
        sectionId,
      );
    }
  });

  // Also remap top-level semantic aliases onto known section targets when flat.
  const flatConcepts = collectConceptsFromItem(patch);
  (Object.entries(flatConcepts) as [SemanticConcept, string][]).forEach(
    ([concept, value]) => {
      const target = targetFieldForConcept(concept, sectionId);
      if (!target) return;
      if (asPlainText(next[target])) return;
      // Prefer nesting into default array buckets when present.
      const bucket =
        sectionId === '5' || sectionId === 'vehicles'
          ? '5A'
          : sectionId === '7' || sectionId === 'insurance_policies'
            ? '7A'
            : null;
      if (bucket && Array.isArray(next[bucket]) && next[bucket].length) {
        const items = [...(next[bucket] as Record<string, unknown>[])];
        const first = { ...(items[0] || {}) };
        if (!asPlainText(first[target])) first[target] = value;
        items[0] = first;
        next[bucket] = items;
      } else {
        next[target] = value;
      }
    },
  );

  return next;
}

export type DetectedFact = {
  concept?: string | null;
  field_key?: string;
  label: string;
  value: string;
  section_key?: string;
  subsection?: string | null;
};

export function flattenDetectedFactsFromPatch(
  patch: Record<string, unknown> | null | undefined,
  sectionKey?: string,
): DetectedFact[] {
  if (!patch || typeof patch !== 'object') return [];

  const facts: DetectedFact[] = [];
  const seen = new Set<string>();

  const add = (fieldKey: string, value: unknown, subsection?: string | null) => {
    const text = asPlainText(value);
    if (!text) return;
    const concept = resolveSemanticConcept(fieldKey);
    const label = concept
      ? conceptLabel(concept)
      : fieldKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const dedupe = `${concept || fieldKey}|${text.toLowerCase()}`;
    if (seen.has(dedupe)) return;
    seen.add(dedupe);
    facts.push({
      concept,
      field_key: fieldKey,
      label,
      value: text,
      section_key: sectionKey,
      subsection,
    });
  };

  Object.entries(patch).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return;
        Object.entries(item as Record<string, unknown>).forEach(([fk, fv]) =>
          add(fk, fv, key),
        );
      });
      return;
    }
    if (value && typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(([fk, fv]) =>
        add(fk, fv, key),
      );
      return;
    }
    add(key, value);
  });

  return facts;
}
