/**
 * Universal smart field placement for EVERY section.
 *
 * Flow:
 * 1) Read AI key + value
 * 2) Understand what it means (synonyms / label wording)
 * 3) Score against target form fields (key + label + helper)
 * 4) Place on the single best exact field — never confuse similar labels
 */

export type SmartFieldTarget = {
  key: string;
  label?: string;
  helperText?: string;
  placeholder?: string;
  type?: string;
  options?: string[];
};

type MeaningGroup = {
  id: string;
  /** Words/phrases that mean this concept */
  terms: string[];
};

/**
 * Cross-domain meaning groups. Used only to understand wording —
 * final placement always prefers the section's real field key/label.
 */
const MEANING_GROUPS: MeaningGroup[] = [
  {
    id: 'person_name',
    terms: [
      'full_legal_name',
      'full_name',
      'legal_name',
      'name',
      'first_name',
      'last_name',
      'account_holder',
      'cardholder',
      'insured_name',
      'member_name',
      'patient_name',
    ],
  },
  {
    id: 'date_of_birth',
    terms: ['date_of_birth', 'dob', 'birth_date', 'birthday', 'born'],
  },
  {
    id: 'phone',
    terms: [
      'phone',
      'phone_number',
      'mobile',
      'cell',
      'telephone',
      'contact_phone',
      'primary_phone',
    ],
  },
  {
    id: 'email',
    terms: ['email', 'e_mail', 'primary_email', 'email_address', 'username_email'],
  },
  {
    id: 'address',
    terms: [
      'address',
      'current_address',
      'home_address',
      'property_address',
      'mailing_address',
      'street',
      'residence',
    ],
  },
  {
    id: 'policy_number',
    terms: [
      'policy_number',
      'policy_no',
      'policy_id',
      'insurance_policy',
      'insurance_policy_number',
      'insurance_number',
      'insurance_no',
      'member_id',
      'certificate_number',
      'plan_number',
      'policy',
    ],
  },
  {
    id: 'policy_company',
    terms: [
      'policy_company',
      'insurance_company',
      'carrier',
      'carrier_name',
      'insurer',
      'provider',
      'underwriter',
    ],
  },
  {
    id: 'expiry_date',
    terms: [
      'expiry',
      'expiration',
      'expires',
      'policy_expiry',
      'registration_expiry',
      'valid_through',
      'valid_until',
      'valid_thru',
      'end_date',
      'period_end',
      'account_expiry_date',
      'account_expiry',
    ],
  },
  {
    id: 'renewal_date',
    terms: [
      'renewal_date',
      'renewal',
      'renews',
      'dues_renewal',
      'membership_renewal',
      'subscription_renewal_date',
      'subscription_renewal',
      'plan_renewal',
      'next_billing_date',
    ],
  },
  {
    id: 'maturity_date',
    terms: [
      'cd_maturity_date',
      'maturity_date',
      'maturity',
      'matures',
      'cd_maturity',
    ],
  },
  {
    id: 'last_statement_date',
    terms: [
      'last_statement_date',
      'statement_date',
      'statement_as_of',
      'as_of_date',
    ],
  },
  {
    id: 'account_number',
    terms: [
      'account_number',
      'acct_number',
      'acct_no',
      'account_no',
      'iban',
      'account_id',
    ],
  },
  {
    id: 'routing_number',
    terms: ['routing_number', 'routing', 'aba', 'sort_code'],
  },
  {
    id: 'bank_name',
    terms: ['bank_name', 'bank', 'financial_institution', 'institution', 'credit_union'],
  },
  {
    id: 'account_type',
    terms: ['account_type', 'type_of_account', 'acct_type'],
  },
  {
    id: 'employer',
    terms: ['employer', 'employer_name', 'company_name', 'business_name', 'organization'],
  },
  {
    id: 'job_title',
    terms: ['job_title', 'title', 'position', 'role', 'occupation'],
  },
  {
    id: 'salary',
    terms: ['salary', 'income', 'wages', 'pay', 'compensation', 'annual_income'],
  },
  {
    id: 'vin',
    terms: ['vin', 'vehicle_identification_number'],
  },
  {
    id: 'license_plate',
    terms: ['license_plate', 'licence_plate', 'plate', 'plate_number', 'tag_number'],
  },
  {
    id: 'vehicle_make',
    terms: ['make', 'manufacturer', 'vehicle_make'],
  },
  {
    id: 'vehicle_model',
    terms: ['model', 'vehicle_model'],
  },
  {
    id: 'vehicle_year',
    terms: ['year', 'model_year', 'vehicle_year'],
  },
  {
    id: 'coverage_amount',
    terms: [
      'coverage_amount',
      'coverage',
      'coverage_limit',
      'death_benefit',
      'liability_limit',
      'insured_amount',
    ],
  },
  {
    id: 'beneficiaries',
    terms: ['beneficiary', 'beneficiaries', 'contingent_beneficiary'],
  },
  {
    id: 'doctor',
    terms: ['doctor', 'doctor_name', 'physician', 'primary_care', 'provider_name'],
  },
  {
    id: 'medication',
    terms: ['medication', 'medications', 'prescription', 'rx'],
  },
  {
    id: 'allergy',
    terms: ['allergy', 'allergies', 'allergic'],
  },
  {
    id: 'credit_card',
    terms: ['card_name', 'credit_card', 'card_type', 'last_four', 'last4'],
  },
  {
    id: 'creditor',
    terms: ['creditor', 'lender', 'mortgage_company', 'loan_company'],
  },
  {
    id: 'balance',
    terms: ['balance', 'amount_owed', 'outstanding', 'payoff'],
  },
  {
    id: 'password_username',
    terms: ['username', 'user_name', 'login', 'account_username'],
  },
  {
    id: 'website',
    terms: ['website', 'url', 'site', 'portal', 'platform'],
  },
  {
    id: 'notes',
    terms: ['notes', 'note', 'comments', 'additional_info', 'remarks'],
  },
  {
    id: 'ssn_safe',
    terms: ['ssn', 'social_security', 'national_id'],
  },
  {
    id: 'mortgage',
    terms: ['mortgage', 'mortgage_balance', 'loan_number', 'mortgage_number'],
  },
  {
    id: 'property_tax',
    terms: ['property_tax', 'tax_amount', 'annual_tax'],
  },
  {
    id: 'school',
    terms: ['school', 'institution', 'university', 'college', 'campus'],
  },
  {
    id: 'degree',
    terms: ['degree', 'diploma', 'certification', 'credential'],
  },
  {
    id: 'military_branch',
    terms: ['branch', 'service_branch', 'military_branch', 'armed_forces'],
  },
  {
    id: 'rank',
    terms: ['rank', 'grade', 'pay_grade'],
  },
  {
    id: 'charity',
    terms: ['charity', 'charity_name', 'organization_name', 'nonprofit'],
  },
  {
    id: 'attorney',
    terms: ['attorney', 'lawyer', 'counsel', 'legal_counsel'],
  },
  {
    id: 'will_trust',
    terms: ['will', 'trust', 'estate_document', 'living_will'],
  },
  {
    id: 'policy_type',
    terms: [
      'policy_type',
      'coverage_type',
      'insurance_type',
      'type_of_policy',
      'plan_type',
    ],
  },
  {
    id: 'ownership',
    terms: [
      'ownership_status',
      'ownership_type',
      'owned',
      'rented',
      'lease',
    ],
  },
  {
    id: 'residence_type',
    terms: ['residence_type', 'property_type', 'home_type', 'dwelling_type'],
  },
  {
    id: 'debt_type',
    terms: ['debt_type', 'loan_type', 'type_of_debt', 'credit_type'],
  },
  {
    id: 'card_type',
    terms: ['card_type', 'credit_card_type'],
  },
  {
    id: 'document_type',
    terms: ['document_type', 'doc_type', 'record_type'],
  },
  {
    id: 'marital_status',
    terms: ['marital_status', 'marriage_status', 'relationship_status'],
  },
  {
    id: 'yes_no',
    terms: ['yes_no', 'true_false', 'enabled', 'active', 'autopay'],
  },
];

function normalizeTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function normalizeKey(value: string): string {
  return normalizeTokens(value).join('_');
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function fieldMeaningText(field: SmartFieldTarget): string {
  return [
    field.key,
    field.label,
    field.helperText,
    field.placeholder,
    ...(field.options || []),
  ]
    .filter(Boolean)
    .join(' ');
}

function meaningGroupIdsForText(text: string): Set<string> {
  const n = normalizeKey(text);
  const spaced = normalizeTokens(text).join(' ');
  const ids = new Set<string>();

  for (const group of MEANING_GROUPS) {
    for (const term of group.terms) {
      const t = normalizeKey(term);
      if (!t) continue;
      if (n === t || spaced === term.toLowerCase()) {
        ids.add(group.id);
        continue;
      }
      // Longer terms only for contains (avoid "name" / "policy" swallowing everything)
      if (t.length >= 6 && (n.includes(t) || t.includes(n))) {
        ids.add(group.id);
      }
    }
  }

  return ids;
}

function jaccard(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  setA.forEach(token => {
    if (setB.has(token)) inter += 1;
  });
  const union = new Set([...a, ...b]).size;
  return union ? inter / union : 0;
}

/**
 * Score how well an incoming AI key/label matches a form field.
 * Higher = better. Threshold used by callers to avoid confused placement.
 */
export function scoreFieldMatch(
  incomingKey: string,
  field: SmartFieldTarget,
): number {
  const inKey = normalizeKey(incomingKey);
  const fieldKey = normalizeKey(field.key);
  const fieldLabel = normalizeKey(field.label || '');
  const fieldText = normalizeKey(fieldMeaningText(field));

  if (!inKey || !fieldKey) return 0;

  // Exact / near-exact wins hard — never confuse with a weaker sibling field.
  if (inKey === fieldKey) return 100;
  if (fieldLabel && inKey === fieldLabel) return 96;

  const inTokens = normalizeTokens(incomingKey);
  const fieldTokens = unique([
    ...normalizeTokens(field.key),
    ...normalizeTokens(field.label || ''),
    ...normalizeTokens(field.helperText || ''),
  ]);

  let score = 0;

  // Token overlap with key+label (not helper alone — helpers are noisy)
  const keyLabelTokens = unique([
    ...normalizeTokens(field.key),
    ...normalizeTokens(field.label || ''),
  ]);
  score += jaccard(inTokens, keyLabelTokens) * 40;

  // Light helper overlap
  score += jaccard(inTokens, normalizeTokens(field.helperText || '')) * 8;

  // Shared meaning group (policy number, expiry, bank, etc.)
  const inGroups = meaningGroupIdsForText(incomingKey);
  const fieldGroups = meaningGroupIdsForText(fieldMeaningText(field));
  const shared = [...inGroups].filter(id => fieldGroups.has(id));
  if (shared.length) {
    score += 45;

    // Exact synonym of a shared concept (acct_no → account_number, member_id → policy_number)
    const exactAlias = MEANING_GROUPS.some(
      group =>
        shared.includes(group.id) &&
        group.terms.some(term => normalizeKey(term) === inKey),
    );
    if (exactAlias) score = Math.max(score, 88);
  }

  // Prefix / contains for compound keys (primary_email_username ↔ email)
  if (inKey.length >= 4 && fieldKey.length >= 4) {
    if (fieldKey.includes(inKey) || inKey.includes(fieldKey)) score += 12;
    if (fieldLabel && (fieldLabel.includes(inKey) || inKey.includes(fieldLabel))) {
      score += 10;
    }
  }

  // Penalize very short generic tokens matching many fields
  if (inTokens.length === 1 && inTokens[0].length <= 3) score -= 15;

  // Tiny boost if normalized strings share a long substring
  if (fieldText.includes(inKey) && inKey.length >= 5) score += 6;

  // Option vocabulary boost — e.g. key "coverage_kind" near Dropdown with Vehicle/Life
  if (field.options?.length) {
    const optionBlob = normalizeKey(field.options.join(' '));
    const optionOverlap = jaccard(inTokens, normalizeTokens(field.options.join(' ')));
    score += optionOverlap * 18;
    if (optionBlob.includes(inKey) && inKey.length >= 4) score += 8;
  }

  return Math.max(0, Math.min(100, score));
}

const MIN_ACCEPT_SCORE = 28;

export type SmartMatchResult = {
  fieldKey: string;
  score: number;
};

/**
 * Pick the single best field for an incoming AI key among form fields.
 * Returns null when nothing is confidently matching (avoids wrong placement).
 */
export function findBestFieldMatch(
  incomingKey: string,
  fields: SmartFieldTarget[],
  options?: { usedKeys?: Set<string>; minScore?: number },
): SmartMatchResult | null {
  const minScore = options?.minScore ?? MIN_ACCEPT_SCORE;
  const used = options?.usedKeys;

  let best: SmartMatchResult | null = null;

  for (const field of fields) {
    if (!field?.key) continue;
    if (field.type === 'Instructions' || field.type === 'InstructionsModal') continue;
    if (used?.has(field.key)) continue;

    const score = scoreFieldMatch(incomingKey, field);
    if (score < minScore) continue;
    if (!best || score > best.score) {
      best = { fieldKey: field.key, score };
    }
  }

  return best;
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if ('text' in record || 'files' in record) {
      const text = record.text;
      const files = record.files;
      return !(
        (typeof text === 'string' && text.trim()) ||
        (Array.isArray(files) && files.length)
      );
    }
  }
  return false;
}

/** Score how well a free-text VALUE matches a field's dropdown/radio options. */
function valueMatchesFieldOptions(
  text: string,
  options: string[] | undefined,
): number {
  if (!options?.length) return 0;
  const lower = text.toLowerCase();
  let score = 0;

  for (const option of options) {
    const opt = String(option);
    if (opt.toLowerCase() === lower) return 95;
    if (lower.includes(opt.toLowerCase()) || opt.toLowerCase().includes(lower)) {
      score = Math.max(score, 70);
    }
    const overlap = jaccard(normalizeTokens(text), normalizeTokens(opt));
    if (overlap >= 0.5) score = Math.max(score, 55 + overlap * 30);
  }

  const synonymHits: Array<[RegExp, string[]]> = [
    [/\b(auto|automobile|car|vehicle)\b/i, ['Vehicle', 'Auto', 'Automobile', 'Car']],
    [/\b(life)\b/i, ['Life']],
    [/\b(health|medical)\b/i, ['Health', 'Medical']],
    [
      /\b(homeowner|homeowners|renter|renters)\b/i,
      ['Homeowner/Renter', 'Homeowners', 'Renters'],
    ],
    [/\b(checking)\b/i, ['Checking']],
    [/\b(savings)\b/i, ['Savings']],
    [/\b(yes|true)\b/i, ['Yes', 'True']],
    [/\b(no|false)\b/i, ['No', 'False']],
    [/\b(owned|own)\b/i, ['Owned', 'Own']],
    [/\b(rented|rent|lease|leased)\b/i, ['Rented', 'Rent', 'Leased', 'Lease']],
  ];
  for (const [pattern, preferred] of synonymHits) {
    if (!pattern.test(text)) continue;
    for (const pref of preferred) {
      const hit = options.find(
        opt =>
          normalizeKey(opt) === normalizeKey(pref) ||
          normalizeKey(opt).includes(normalizeKey(pref)) ||
          normalizeKey(pref).includes(normalizeKey(opt)),
      );
      if (hit) return Math.max(score, 92);
    }
  }

  return score;
}

/**
 * Remap an object of AI keys → values onto exact form field keys using meaning.
 * Each target field receives at most one incoming value (highest score wins).
 * Second pass: unmatched values that clearly match a Dropdown/Radio option
 * land on that option field even when the AI key name differs.
 */
export function smartPlaceOntoFields(
  incoming: Record<string, unknown>,
  fields: SmartFieldTarget[],
): Record<string, unknown> {
  if (!incoming || !fields?.length) return { ...incoming };

  type Candidate = {
    fromKey: string;
    toKey: string;
    score: number;
    value: unknown;
  };

  const candidates: Candidate[] = [];

  Object.entries(incoming).forEach(([key, value]) => {
    if (key === '__rowId' || key.endsWith('_instructions') || key.endsWith('_header')) {
      return;
    }
    if (isEmptyValue(value)) return;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      // Nested plain objects are remapped recursively later by callers.
      if (!('text' in record || 'files' in record)) return;
    }

    const match = findBestFieldMatch(key, fields);
    if (match) {
      candidates.push({
        fromKey: key,
        toKey: match.fieldKey,
        score: match.score,
        value,
      });
    }
  });

  candidates.sort((a, b) => b.score - a.score);

  const next: Record<string, unknown> = {};
  const usedTargets = new Set<string>();
  const usedSources = new Set<string>();

  for (const candidate of candidates) {
    if (usedTargets.has(candidate.toKey) || usedSources.has(candidate.fromKey)) {
      continue;
    }
    usedTargets.add(candidate.toKey);
    usedSources.add(candidate.fromKey);
    next[candidate.toKey] = candidate.value;
  }

  // Second pass: place by VALUE ↔ dropdown/radio options when key match failed.
  Object.entries(incoming).forEach(([key, value]) => {
    if (usedSources.has(key)) return;
    if (isEmptyValue(value)) return;
    if (typeof value === 'object' && value !== null) return;

    const text = String(value).trim();
    if (!text || text.length > 120) return;

    let best: { fieldKey: string; score: number } | null = null;
    for (const field of fields) {
      if (!field?.key || usedTargets.has(field.key)) continue;
      if (
        field.type === 'Instructions' ||
        field.type === 'InstructionsModal'
      ) {
        continue;
      }
      if (!field.options?.length) continue;

      let score = valueMatchesFieldOptions(text, field.options);
      score = Math.max(score, scoreFieldMatch(key, field) * 0.5);

      if (score < 50) continue;
      if (!best || score > best.score) {
        best = { fieldKey: field.key, score };
      }
    }

    if (best) {
      usedTargets.add(best.fieldKey);
      usedSources.add(key);
      next[best.fieldKey] = value;
    }
  });

  // Keep unmatched keys so callers can still inspect / nested-handle them.
  Object.entries(incoming).forEach(([key, value]) => {
    if (usedSources.has(key)) return;
    if (key in next) return;
    next[key] = value;
  });

  return next;
}

/**
 * Deep smart-place for section patches (objects + arrays of cards).
 */
export function smartPlacePatch(
  patch: Record<string, unknown>,
  fields: SmartFieldTarget[],
): Record<string, unknown> {
  if (!patch || typeof patch !== 'object') return patch;

  const next: Record<string, unknown> = {};

  Object.entries(patch).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      next[key] = value.map(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
        return smartPlaceOntoFields(item as Record<string, unknown>, fields);
      });
      return;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      if ('text' in record || 'files' in record) {
        // Upload shape at subsection root — remap the key only.
        const placed = smartPlaceOntoFields({ [key]: value }, fields);
        Object.assign(next, placed);
        return;
      }
      next[key] = smartPlaceOntoFields(record, fields);
      return;
    }

    const placed = smartPlaceOntoFields({ [key]: value }, fields);
    Object.assign(next, placed);
  });

  return next;
}

/**
 * When field definitions are missing, still remap using destination object keys
 * as the available "input names".
 */
export function smartPlaceUsingExistingKeys(
  incoming: Record<string, unknown>,
  existingKeys: string[],
): Record<string, unknown> {
  const fakeFields: SmartFieldTarget[] = existingKeys.map(key => ({
    key,
    label: key.replace(/_/g, ' '),
  }));
  return smartPlaceOntoFields(incoming, fakeFields);
}
