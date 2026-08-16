import type { DetectedAiFact } from '@/utils/aiDashboardPatchCache';
import {
  duplicateMatcherForSection,
  itemHasIncomingChanges,
} from '@/utils/aiItemDedup';
import { composeEntryTitle } from '@/vault-prototype/entryDisplayTitle';

export type AiFillKind = 'new' | 'update' | 'same';
export type AiFieldFillKind = 'new' | 'update' | 'same' | 'empty';

export type AiFillPreview = {
  kind: AiFillKind;
  title: string;
  fieldKind: Record<string, AiFieldFillKind>;
  /** Vault card that matches this document, if any — never the whole section list. */
  matchedItem?: Record<string, unknown>;
};

function asText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    return value.map(asText).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['label', 'name', 'value', 'text', 'title']) {
      const nested = asText(record[key]);
      if (nested) return nested;
    }
  }
  return '';
}

function norm(value: unknown) {
  return asText(value)
    .toLowerCase()
    .replace(/[\s\-_.#]/g, '');
}

function factKey(fact: DetectedAiFact) {
  return String(fact.field_key || fact.label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function factsToItem(facts: DetectedAiFact[]): Record<string, unknown> {
  const item: Record<string, unknown> = {};
  facts.forEach(fact => {
    const key = factKey(fact);
    const value = String(fact.value || '').trim();
    if (key && value && !item[key]) item[key] = value;
  });
  return item;
}

function collectItems(sectionData: unknown): Record<string, unknown>[] {
  if (!sectionData) return [];
  if (Array.isArray(sectionData)) {
    return sectionData.filter(
      item => item && typeof item === 'object',
    ) as Record<string, unknown>[];
  }
  if (typeof sectionData !== 'object') return [];
  const record = sectionData as Record<string, unknown>;
  const out: Record<string, unknown>[] = [];
  Object.values(record).forEach(value => {
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          out.push(item as Record<string, unknown>);
        }
      });
    } else if (value && typeof value === 'object') {
      const nested = value as Record<string, unknown>;
      const looksLikeItem = Object.values(nested).some(
        entry =>
          typeof entry === 'string' ||
          typeof entry === 'number' ||
          Array.isArray(entry),
      );
      if (looksLikeItem && !Object.values(nested).some(entry => Array.isArray(entry))) {
        out.push(nested);
      }
    }
  });
  return out;
}

function lookupCurrent(
  match: Record<string, unknown> | undefined,
  key: string,
) {
  if (!match) return '';
  if (asText(match[key])) return asText(match[key]);
  const found = Object.entries(match).find(
    ([name]) =>
      name.toLowerCase().replace(/[^a-z0-9]+/g, '_') === key,
  );
  return found ? asText(found[1]) : '';
}

/**
 * Compare AI extract to what is already in the vault so the review popup
 * can say Update vs Already have this data vs Accept (new item).
 */
export function previewAiFillAgainstVault(args: {
  sectionId: string;
  facts: DetectedAiFact[];
  sectionData?: unknown;
}): AiFillPreview {
  const incoming = factsToItem(args.facts);
  const hasIdentity = Boolean(
    norm(incoming.vin) ||
      norm(incoming.make) ||
      norm(incoming.model) ||
      norm(incoming.license_plate) ||
      norm(incoming.policy_number) ||
      norm(incoming.policy_company || incoming.insurance_company),
  );
  const items = hasIdentity ? collectItems(args.sectionData) : [];
  const matcher = duplicateMatcherForSection(args.sectionId);
  const match =
    matcher && items.length
      ? items.find(existing => matcher(existing, incoming))
      : items.find(existing => {
          const vin = norm(incoming.vin);
          const make = norm(incoming.make);
          const model = norm(incoming.model);
          if (vin && vin === norm(existing.vin)) return true;
          if (make && model && make === norm(existing.make) && model === norm(existing.model)) {
            return true;
          }
          const company = norm(
            incoming.policy_company || incoming.insurance_company,
          );
          const number = norm(incoming.policy_number);
          if (
            company &&
            number &&
            company ===
              norm(existing.policy_company || existing.insurance_company) &&
            number === norm(existing.policy_number)
          ) {
            return true;
          }
          return false;
        });

  const fieldKind: Record<string, AiFieldFillKind> = {};
  args.facts.forEach(fact => {
    const key = factKey(fact);
    if (!key) return;
    const ai = String(fact.value || '').trim();
    const current = lookupCurrent(match, key);
    if (!ai && !current) fieldKind[key] = 'empty';
    else if (!ai && current) fieldKind[key] = 'same';
    else if (ai && current && norm(ai) === norm(current)) fieldKind[key] = 'same';
    else if (ai && current) fieldKind[key] = 'update';
    else fieldKind[key] = 'new';
  });

  const title =
    composeEntryTitle(incoming) ||
    composeEntryTitle(match || {}) ||
    '';

  if (!match) {
    return { kind: 'new', title, fieldKind };
  }
  if (itemHasIncomingChanges(match, incoming)) {
    return { kind: 'update', title, fieldKind, matchedItem: match };
  }
  return { kind: 'same', title, fieldKind, matchedItem: match };
}

export function combineAiFillKinds(kinds: AiFillKind[]): AiFillKind {
  if (kinds.some(kind => kind === 'update')) return 'update';
  if (kinds.length > 0 && kinds.every(kind => kind === 'same')) return 'same';
  return 'new';
}

export function aiFillActionLabel(kind: AiFillKind) {
  if (kind === 'update') return 'Update';
  if (kind === 'same') return 'Already have this data';
  return 'Accept filing location';
}

export function aiFieldBadge(kind?: AiFieldFillKind) {
  if (kind === 'new') return 'New data';
  if (kind === 'update') return 'Updated';
  if (kind === 'same') return 'Already on file';
  return '';
}
