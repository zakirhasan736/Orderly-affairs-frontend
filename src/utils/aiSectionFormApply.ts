import { applySection1AIPatch } from '@/utils/applySection1AIPatch';
import { normalizeUploadField } from '@/utils/sectionUploadFields';
import {
  aiPatchHasValues,
  coerceAiFieldValues,
  extractSubsectionPatch,
  unwrapAiAutofillPatch,
} from '@/utils/aiPatchNormalizer';
import { AI_SECTION_BY_ID } from '@/utils/aiSectionRegistry';
import {
  upsertAutofillItems,
  duplicateMatcherForSection,
  namedItemsAreDuplicates,
  collapseMilitaryServicePeriods,
  collapseInsurancePolicies,
  collapseItemsByMatcher,
  type AutofillConflictMode,
} from '@/utils/aiItemDedup';
import { applySemanticConceptsToPatch, applySemanticConceptsToItem } from '@/utils/aiSemanticFieldMatch';
import {
  smartPlaceOntoFields,
  smartPlaceUsingExistingKeys,
} from '@/utils/smartFieldPlacement';
import { getSectionFieldDefinitions } from '@/utils/aiSectionFieldCatalog';
import type { FieldDefinition } from '@/types/formTypes';

const UPLOADISH_KEY =
  /(location|document|upload|copy|scan|photo|image|file|attorney|home|marker|portal|contact_info|contact_details|account_info|tax_documents|will_|trust_|poa|dnr|obituary|policy_contact|policy_documents)/i;

function isUploadShape(value: unknown) {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    ('text' in (value as object) || 'files' in (value as object))
  );
}

function coerceFieldValue(
  key: string,
  value: unknown,
  existing?: unknown,
  field?: FieldDefinition,
) {
  if (value === null || value === undefined || value === '') return existing;

  if (field) {
    const coerced = coerceAiFieldValues({ [key]: value }, [field])[key];
    if (coerced !== undefined && coerced !== null && coerced !== '') {
      if (isUploadShape(existing) && typeof coerced === 'string') {
        return normalizeUploadField(coerced);
      }
      return coerced;
    }
  }

  if (typeof value === 'string' || typeof value === 'number') {
    if (isUploadShape(existing) || UPLOADISH_KEY.test(key)) {
      return normalizeUploadField(value);
    }
    return String(value);
  }

  if (isUploadShape(value)) {
    return normalizeUploadField(value);
  }

  if (Array.isArray(value)) {
    return value.map(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
      return mergeObjectFields({}, item as Record<string, unknown>);
    });
  }

  if (value && typeof value === 'object') {
    const base =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? (existing as Record<string, unknown>)
        : {};
    return mergeObjectFields(base, value as Record<string, unknown>);
  }

  return value;
}

function mergeObjectFields(
  current: Record<string, unknown>,
  incoming: Record<string, unknown>,
  fields?: FieldDefinition[],
) {
  const fieldList =
    fields && fields.length
      ? fields
      : undefined;

  // Meaning-aware placement onto catalog keys (or existing keys as fallback).
  const existingKeys = Object.keys(current);
  let placed: Record<string, unknown>;

  if (fieldList?.length) {
    placed = smartPlaceOntoFields(
      incoming,
      fieldList.map(field => ({
        key: field.key,
        label: field.label,
        helperText: field.helperText,
        placeholder: field.placeholder,
        type: field.type,
        options: field.options,
      })),
    );
    // Meaning pass: insurance_number / policy_no → section's real field key
    const sectionHint =
      fieldList.some(field => field.key === 'policy_number')
        ? '7'
        : fieldList.some(field => field.key === 'insurance_policy')
          ? '5'
          : '';
    if (sectionHint) {
      placed = applySemanticConceptsToItem(placed, sectionHint);
    }
    // Coerce dropdowns / uploads using real form field defs (incl. options).
    placed = coerceAiFieldValues(placed, fieldList);
  } else if (existingKeys.length > 0) {
    placed = smartPlaceUsingExistingKeys(incoming, existingKeys);
  } else {
    placed = { ...incoming };
  }

  const next = { ...current };
  const fieldMap = new Map((fieldList || []).map(field => [field.key, field]));

  Object.entries(placed).forEach(([key, value]) => {
    if (
      key === '__rowId' ||
      key.endsWith('_instructions') ||
      key.endsWith('_header')
    ) {
      return;
    }
    if (value === null || value === undefined || value === '') return;

    next[key] = coerceFieldValue(key, value, current[key], fieldMap.get(key));
  });

  return next;
}

function isSubsectionKey(key: string) {
  return (
    /^\d+[A-Z]$/.test(key) ||
    key === 'vital_info' ||
    key === 'next_of_kin' ||
    key === 'executor_trustee' ||
    key === 'additional_contacts'
  );
}

/**
 * Same-topic cards: merge instead of appending duplicates.
 * Vehicles/insurance use dedicated detectors; other sections use soft name match.
 */
function mergeArraySubsection(
  sectionId: string,
  key: string,
  currentItems: Record<string, unknown>[],
  incomingItems: Record<string, unknown>[],
  conflictMode: AutofillConflictMode = 'overwrite',
) {
  const matcher =
    duplicateMatcherForSection(sectionId, key) ||
    ((a, b) => namedItemsAreDuplicates(a, b));

  let collapsedIncoming = incomingItems;
  if (sectionId === '11' && (!key || key === '11A')) {
    collapsedIncoming = collapseMilitaryServicePeriods(incomingItems);
  } else if (sectionId === '7' && (!key || key === '7A')) {
    collapsedIncoming = collapseInsurancePolicies(incomingItems);
  } else {
    collapsedIncoming = collapseItemsByMatcher(incomingItems, matcher);
  }

  return upsertAutofillItems(
    currentItems,
    collapsedIncoming,
    matcher,
    conflictMode,
  ).items;
}

/**
 * Apply a temp-stored AI extraction result onto section form data.
 * Matches subsection buckets and field names, coercing upload + dropdown fields.
 *
 * conflictMode:
 * - overwrite (default for background): update matching cards with new non-empty values
 * - ask: prompt when existing non-empty fields would change
 * - keep: only fill empty fields on matches
 */
export function applyAiResultToSectionForm(
  sectionId: string,
  currentData: unknown,
  result: unknown,
  subsection?: string | null,
  options?: { conflictMode?: AutofillConflictMode },
): Record<string, unknown> | null {
  const conflictMode = options?.conflictMode ?? 'overwrite';
  const fields = getSectionFieldDefinitions(sectionId, subsection);
  const patch = applySemanticConceptsToPatch(
    unwrapAiAutofillPatch(result),
    sectionId,
  );
  if (!aiPatchHasValues(patch)) return null;

  const current =
    currentData && typeof currentData === 'object' && !Array.isArray(currentData)
      ? (currentData as Record<string, unknown>)
      : {};

  if (sectionId === '1') {
    return applySection1AIPatch(current, patch);
  }

  const next: Record<string, unknown> = { ...current };
  let changed = false;

  const defaultSub =
    subsection || AI_SECTION_BY_ID[sectionId]?.defaultSubsection || null;

  // Apply nested subsection buckets from patch (e.g. 21A, 15A, 5A).
  Object.entries(patch).forEach(([key, value]) => {
    if (!isSubsectionKey(key)) return;

    if (Array.isArray(value)) {
      const incomingItems = value
        .map(item => {
          if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
          return mergeObjectFields({}, item as Record<string, unknown>, fields);
        })
        .filter((item): item is Record<string, unknown> => !!item);

      const currentItems = Array.isArray(next[key])
        ? (next[key] as Record<string, unknown>[])
        : [];
      next[key] = mergeArraySubsection(
        sectionId,
        key,
        currentItems,
        incomingItems,
        conflictMode,
      );
      changed = true;
      return;
    }

    if (value && typeof value === 'object') {
      const existing =
        next[key] && typeof next[key] === 'object' && !Array.isArray(next[key])
          ? (next[key] as Record<string, unknown>)
          : {};
      next[key] = mergeObjectFields(
        existing,
        value as Record<string, unknown>,
        fields,
      );
      changed = true;
    }
  });

  // Flat patch for a known subsection (dashboard often targets one subsection).
  if (defaultSub && !patch[defaultSub]) {
    const extracted = extractSubsectionPatch(patch, defaultSub);
    if (aiPatchHasValues(extracted)) {
      const existingRaw = next[defaultSub];
      if (Array.isArray(existingRaw)) {
        const incomingItems = [mergeObjectFields({}, extracted, fields)];
        next[defaultSub] = mergeArraySubsection(
          sectionId,
          defaultSub,
          existingRaw as Record<string, unknown>[],
          incomingItems,
          conflictMode,
        );
      } else {
        const existing =
          existingRaw && typeof existingRaw === 'object' && !Array.isArray(existingRaw)
            ? (existingRaw as Record<string, unknown>)
            : {};
        next[defaultSub] = mergeObjectFields(existing, extracted, fields);
      }
      changed = true;
    }
  }

  return changed ? next : null;
}

export function countFilledAiFields(data: Record<string, unknown> | null) {
  if (!data) return 0;

  let count = 0;
  const visit = (value: unknown) => {
    if (value === null || value === undefined || value === '') return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if ('text' in record || 'files' in record) {
        const text = record.text;
        const files = record.files;
        if (
          (typeof text === 'string' && text.trim()) ||
          (Array.isArray(files) && files.length)
        ) {
          count += 1;
        }
        return;
      }
      Object.values(record).forEach(visit);
      return;
    }
    count += 1;
  };

  visit(data);
  return count;
}
