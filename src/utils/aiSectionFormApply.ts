import { applySection1AIPatch } from '@/utils/applySection1AIPatch';
import { normalizeUploadField } from '@/utils/sectionUploadFields';
import {
  aiPatchHasValues,
  asPlainFieldText,
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
  isJunkVehicleCard,
  normalizeCardSectionData,
  type AutofillConflictMode,
} from '@/utils/aiItemDedup';
import { applySemanticConceptsToPatch, applySemanticConceptsToItem } from '@/utils/aiSemanticFieldMatch';
import {
  smartPlaceOntoFields,
  smartPlaceUsingExistingKeys,
} from '@/utils/smartFieldPlacement';
import { getSectionFieldDefinitions } from '@/utils/aiSectionFieldCatalog';
import { subsectionHasDynamicTopics } from '@/utils/dynamicVaultTopics';
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

function isPlainTextFieldType(type?: string) {
  return (
    type === 'TextInput' ||
    type === 'TextArea' ||
    type === 'DatePicker' ||
    type === 'DateInput'
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
      if (field.type === 'TextInputWithUpload' && typeof coerced === 'string') {
        return normalizeUploadField(coerced);
      }
      return coerced;
    }
  }

  if (typeof value === 'string' || typeof value === 'number') {
    if (isPlainTextFieldType(field?.type)) {
      return String(value);
    }
    if (
      field?.type === 'TextInputWithUpload' ||
      (!field && (isUploadShape(existing) || UPLOADISH_KEY.test(key)))
    ) {
      return normalizeUploadField(value);
    }
    return String(value);
  }

  if (isUploadShape(value)) {
    // VIN / insurance_policy are TextInput — keep plain text, not `{ text, files }`.
    if (field?.type === 'TextInputWithUpload' || (!field && UPLOADISH_KEY.test(key))) {
      return normalizeUploadField(value);
    }
    return asPlainFieldText(value);
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

    if (key === 'identity_documents' && Array.isArray(value)) {
      const existing = Array.isArray(next[key])
        ? (next[key] as unknown[])
        : [];
      next[key] = existing.length ? [...existing, ...value] : value;
      return;
    }

    next[key] = coerceFieldValue(key, value, current[key], fieldMap.get(key));
  });

  return next;
}

function isSubsectionKey(key: string) {
  return (
    /^\d+[A-Z]$/.test(key) ||
    key === 'vital_info' ||
    key === 'executor_trustee' ||
    key === 'additional_contacts'
  );
}

/** Contact arrays and any vault subsection that renders repeatable cards. */
function isCardArraySubsection(sectionId: string, key: string) {
  if (key === 'executor_trustee' || key === 'additional_contacts') {
    return true;
  }
  return subsectionHasDynamicTopics(sectionId, key);
}

/** Coerce a mistaken single-object save into a one-item card list. */
export function coerceSubsectionItems(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (item): item is Record<string, unknown> =>
        !!item && typeof item === 'object' && !Array.isArray(item),
    );
  }
  if (raw && typeof raw === 'object') {
    return [raw as Record<string, unknown>];
  }
  return [];
}

/**
 * Same-topic cards: merge instead of appending duplicates.
 * Vehicles/insurance use dedicated detectors; other sections use soft name match.
 */
export type AiSectionApplyStats = {
  added: number;
  updated: number;
  unchanged: number;
};

function emptyApplyStats(): AiSectionApplyStats {
  return { added: 0, updated: 0, unchanged: 0 };
}

function mergeApplyStats(
  a: AiSectionApplyStats,
  b: AiSectionApplyStats,
): AiSectionApplyStats {
  return {
    added: a.added + b.added,
    updated: a.updated + b.updated,
    unchanged: a.unchanged + b.unchanged,
  };
}

function mergeArraySubsection(
  sectionId: string,
  key: string,
  currentItems: Record<string, unknown>[],
  incomingItems: Record<string, unknown>[],
  conflictMode: AutofillConflictMode = 'overwrite',
): {
  items: Record<string, unknown>[];
  stats: AiSectionApplyStats;
} {
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

  const upserted = upsertAutofillItems(
    currentItems,
    collapsedIncoming,
    matcher,
    conflictMode,
  );
  return {
    items: upserted.items,
    stats: {
      added: upserted.added,
      updated: upserted.updated,
      unchanged: upserted.unchanged,
    },
  };
}

function upsertCardSubsection(
  sectionId: string,
  key: string,
  existingRaw: unknown,
  incomingRaw: unknown,
  fields: FieldDefinition[] | undefined,
  conflictMode: AutofillConflictMode,
): {
  items: Record<string, unknown>[];
  stats: AiSectionApplyStats;
} {
  const incomingItems = coerceSubsectionItems(incomingRaw)
    .map(item => mergeObjectFields({}, item, fields))
    .filter(item =>
      sectionId === '5' ? !isJunkVehicleCard(item) : true,
    );
  // Re-coerce existing cards too so stale `{ text, files }` VIN/policy values
  // become plain strings before merge (avoids "[object Object]" in TextInputs).
  // Also drop junk date-title vehicles (e.g. "TO.01/08") from the vault list.
  const currentItems = coerceSubsectionItems(existingRaw)
    .map(item =>
      fields?.length ? mergeObjectFields({}, item, fields) : item,
    )
    .filter(item =>
      sectionId === '5' ? !isJunkVehicleCard(item) : true,
    );
  // Collapse stale duplicate cards already in the vault (repeated Accept).
  const matcher =
    duplicateMatcherForSection(sectionId, key) ||
    ((a: Record<string, unknown>, b: Record<string, unknown>) =>
      namedItemsAreDuplicates(a, b));
  const normalizedCurrent =
    sectionId === '7'
      ? collapseInsurancePolicies(currentItems)
      : collapseItemsByMatcher(currentItems, matcher);
  return mergeArraySubsection(
    sectionId,
    key,
    normalizedCurrent,
    incomingItems,
    conflictMode,
  );
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
export function applyAiResultToSectionFormDetailed(
  sectionId: string,
  currentData: unknown,
  result: unknown,
  subsection?: string | null,
  options?: { conflictMode?: AutofillConflictMode },
): { data: Record<string, unknown> | null; stats: AiSectionApplyStats } {
  const conflictMode = options?.conflictMode ?? 'overwrite';
  const fields = getSectionFieldDefinitions(sectionId, subsection);
  const patch = applySemanticConceptsToPatch(
    unwrapAiAutofillPatch(result),
    sectionId,
  );
  if (!aiPatchHasValues(patch)) {
    return { data: null, stats: emptyApplyStats() };
  }

  const current =
    currentData && typeof currentData === 'object' && !Array.isArray(currentData)
      ? (currentData as Record<string, unknown>)
      : {};

  if (sectionId === '1') {
    const data = applySection1AIPatch(current, patch);
    return {
      data,
      stats: data
        ? { added: 0, updated: 1, unchanged: 0 }
        : emptyApplyStats(),
    };
  }

  const next: Record<string, unknown> = { ...current };
  let changed = false;
  let stats = emptyApplyStats();

  const defaultSub =
    subsection || AI_SECTION_BY_ID[sectionId]?.defaultSubsection || null;

  // Apply nested subsection buckets from patch (e.g. 21A, 15A, 5A).
  Object.entries(patch).forEach(([key, value]) => {
    if (!isSubsectionKey(key)) return;

    const treatAsCards =
      isCardArraySubsection(sectionId, key) ||
      Array.isArray(value) ||
      Array.isArray(next[key]);

    if (treatAsCards && (Array.isArray(value) || (value && typeof value === 'object'))) {
      // Always keep card subsections as arrays so the UI can render multiple
      // inner forms (Toyota / Honda / Jeep). Never overwrite with a bare object.
      const upserted = upsertCardSubsection(
        sectionId,
        key,
        next[key],
        value,
        fields,
        conflictMode,
      );
      next[key] = upserted.items;
      stats = mergeApplyStats(stats, upserted.stats);
      // Only mark changed when something was added/updated (not identical re-upload).
      if (upserted.stats.added > 0 || upserted.stats.updated > 0) {
        changed = true;
      }
      return;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
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
      stats = mergeApplyStats(stats, { added: 0, updated: 1, unchanged: 0 });
    }
  });

  // Flat patch for a known subsection (dashboard often targets one subsection).
  if (defaultSub && !patch[defaultSub]) {
    const extracted = extractSubsectionPatch(patch, defaultSub);
    if (aiPatchHasValues(extracted)) {
      if (
        isCardArraySubsection(sectionId, defaultSub) ||
        Array.isArray(next[defaultSub])
      ) {
        const upserted = upsertCardSubsection(
          sectionId,
          defaultSub,
          next[defaultSub],
          extracted,
          fields,
          conflictMode,
        );
        next[defaultSub] = upserted.items;
        stats = mergeApplyStats(stats, upserted.stats);
        if (upserted.stats.added > 0 || upserted.stats.updated > 0) {
          changed = true;
        }
      } else {
        const existingRaw = next[defaultSub];
        const existing =
          existingRaw &&
          typeof existingRaw === 'object' &&
          !Array.isArray(existingRaw)
            ? (existingRaw as Record<string, unknown>)
            : {};
        next[defaultSub] = mergeObjectFields(existing, extracted, fields);
        changed = true;
        stats = mergeApplyStats(stats, { added: 0, updated: 1, unchanged: 0 });
      }
    }
  }

  // Identical re-upload: still return data so callers can clear the stash,
  // but stats.unchanged tells them not to count it as a new fill.
  if (!changed && stats.unchanged > 0) {
    const normalized = normalizeCardSectionData(sectionId, next);
    return {
      data: (normalized || next) as Record<string, unknown>,
      stats,
    };
  }

  if (!changed) return { data: null, stats };

  const normalized = normalizeCardSectionData(sectionId, next);
  return {
    data: (normalized || next) as Record<string, unknown>,
    stats,
  };
}

export function applyAiResultToSectionForm(
  sectionId: string,
  currentData: unknown,
  result: unknown,
  subsection?: string | null,
  options?: { conflictMode?: AutofillConflictMode },
): Record<string, unknown> | null {
  const { data, stats } = applyAiResultToSectionFormDetailed(
    sectionId,
    currentData,
    result,
    subsection,
    options,
  );
  // Identical re-upload: legacy callers should not treat this as a new fill.
  if (
    data &&
    stats.added === 0 &&
    stats.updated === 0 &&
    stats.unchanged > 0
  ) {
    return null;
  }
  return data;
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
