import type { DetectedAiFact } from '@/utils/aiDashboardPatchCache';
import { getSectionFieldDefinitions } from '@/utils/aiSectionFieldCatalog';
import {
  AI_SECTION_BY_ID,
  resolveAiSectionId,
} from '@/utils/aiSectionRegistry';

function norm(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');
}

const SKIP_TYPES = new Set([
  'Instructions',
  'InstructionsModal',
  'AccessManagement',
  'NextOfKinLetter',
  'LettersToNextOfKin',
]);

function factLookupKey(fact: DetectedAiFact) {
  return norm(fact.field_key || fact.label);
}

/** License-specific keys win over generic identity-card aliases (issue date twice). */
const ALIAS_OF_PREFERRED: Record<string, string[]> = {
  issue_date: ['drivers_license_issue_date', 'passport_issue_date'],
  expiration_date: [
    'drivers_license_expiration_date',
    'passport_expiration_date',
  ],
  full_legal_name_on_id: ['full_legal_name'],
  document_number: ['drivers_license_number', 'passport_number'],
};

export function collapseDuplicateIdentityFacts<T extends DetectedAiFact>(
  facts: T[],
): T[] {
  const keys = new Set(
    facts.map(fact => norm(fact.field_key || '')).filter(Boolean),
  );
  return facts.filter(fact => {
    const key = norm(fact.field_key || '');
    const preferred = ALIAS_OF_PREFERRED[key];
    if (!preferred) return true;
    return !preferred.some(item => keys.has(norm(item)));
  });
}

/**
 * Merge AI-extracted facts with the vault section field list so empty
 * rows still appear as Add in Review & fill.
 */
export function mergeFactsWithSectionCatalog(args: {
  facts: DetectedAiFact[];
  sectionIds: string[];
}): DetectedAiFact[] {
  const facts = args.facts || [];
  const sectionIds = (args.sectionIds || []).filter(Boolean);
  const byKey = new Map<string, DetectedAiFact>();
  facts.forEach(fact => {
    const key = factLookupKey(fact);
    if (!key) return;
    const existing = byKey.get(key);
    if (!existing || (!existing.value && fact.value)) byKey.set(key, fact);
  });

  const merged: DetectedAiFact[] = [];
  const seen = new Set<string>();

  const pushField = (
    fieldKey: string,
    label: string,
    hit: DetectedAiFact | undefined,
    sectionId: string,
  ) => {
    const aliases = ALIAS_OF_PREFERRED[norm(fieldKey)];
    if (
      aliases?.some(preferred =>
        seen.has(`${norm(sectionId)}::${norm(preferred)}`),
      )
    ) {
      return;
    }
    const sectionKey =
      hit?.section_key || AI_SECTION_BY_ID[sectionId]?.key || sectionId;
    const key = `${norm(sectionId)}::${norm(fieldKey)}`;
    if (!norm(fieldKey) || seen.has(key)) return;
    seen.add(key);
    merged.push({
      field_key: fieldKey,
      label: label || hit?.label || fieldKey,
      value: String(hit?.value || '').trim(),
      subsection: hit?.subsection,
      section_key: sectionKey,
      concept: hit?.concept || 'catalog',
    });
  };

  sectionIds.forEach(sectionId => {
    const fields = getSectionFieldDefinitions(sectionId, null);
    fields.forEach(field => {
      if (!field?.key || SKIP_TYPES.has(String(field.type))) return;
      const hit =
        byKey.get(norm(field.key)) || byKey.get(norm(field.label || ''));
      pushField(field.key, field.label || field.key, hit, sectionId);
    });
  });

  facts.forEach(fact => {
    const sectionId = resolveAiSectionId(fact.section_key, sectionIds[0]);
    const lookup = factLookupKey(fact);
    const key = `${norm(sectionId)}::${lookup}`;
    if (!lookup || seen.has(key)) return;
    seen.add(key);
    merged.push({
      ...fact,
      section_key:
        fact.section_key || AI_SECTION_BY_ID[sectionId]?.key || sectionId,
    });
  });

  return collapseDuplicateIdentityFacts(merged);
}

export function uniqueEditableFacts<T extends DetectedAiFact>(
  facts: T[],
): Array<T & { editId: string }> {
  const seen = new Set<string>();
  const list: Array<T & { editId: string }> = [];
  collapseDuplicateIdentityFacts(facts).forEach((fact, index) => {
    const sectionId = resolveAiSectionId(fact.section_key);
    const key = `${norm(sectionId)}::${factLookupKey(fact) || `row-${index}`}`;
    if (seen.has(key)) return;
    seen.add(key);
    list.push({
      ...fact,
      editId: `${sectionId || 'x'}-${fact.field_key || fact.label || 'field'}-${index}`,
    });
  });
  return list;
}
