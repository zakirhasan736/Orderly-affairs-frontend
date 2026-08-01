import type { DetectedAiFact, StashedAiPatch } from '@/utils/aiDashboardPatchCache';
import { unwrapAiAutofillPatch } from '@/utils/aiPatchNormalizer';

function setDeepField(
  target: Record<string, unknown>,
  fieldKey: string,
  value: string,
) {
  const key = String(fieldKey || '').trim();
  if (!key) return;

  // Direct key on object
  if (key in target || !key.includes('.') && !/^\d+[A-Z]\./i.test(key)) {
    // Prefer writing onto first array item when this looks like a card field
    // and the patch root has subsection arrays (5A, 7A, …).
    for (const [arrayKey, items] of Object.entries(target)) {
      if (!Array.isArray(items) || !items.length) continue;
      if (!/^\d+[A-Z]$/i.test(arrayKey) && arrayKey !== 'vital_info') continue;
      const first = items[0];
      if (first && typeof first === 'object' && !Array.isArray(first)) {
        const row = first as Record<string, unknown>;
        if (key in row || Object.keys(row).length > 0) {
          row[key] = value;
          return;
        }
      }
    }
    target[key] = value;
    return;
  }

  // path like "12A.0.account_number"
  const parts = key.split('.');
  let cursor: any = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    const next = parts[i + 1];
    const index = Number(part);
    if (!Number.isNaN(index) && Array.isArray(cursor)) {
      if (!cursor[index] || typeof cursor[index] !== 'object') {
        cursor[index] = Number.isNaN(Number(next)) ? {} : [];
      }
      cursor = cursor[index];
      continue;
    }
    if (cursor[part] == null) {
      cursor[part] = Number.isNaN(Number(next)) ? {} : [];
    }
    cursor = cursor[part];
  }
  const last = parts[parts.length - 1];
  if (cursor && typeof cursor === 'object') {
    cursor[last] = value;
  }
}

/** Apply user-edited review facts onto a stashed AI result before save. */
export function applyEditedFactsToStash(
  stash: StashedAiPatch,
  editedFacts: DetectedAiFact[],
): StashedAiPatch {
  const basePatch =
    (stash.patch && typeof stash.patch === 'object'
      ? structuredClone(stash.patch)
      : unwrapAiAutofillPatch(stash.result)) || {};

  const patch =
    basePatch && typeof basePatch === 'object'
      ? (structuredClone(basePatch) as Record<string, unknown>)
      : {};

  for (const fact of editedFacts) {
    const value = String(fact.value ?? '').trim();
    const fieldKey = String(fact.field_key || '').trim();
    if (!fieldKey) continue;
    setDeepField(patch, fieldKey, value);
  }

  const nextResult =
    stash.result && typeof stash.result === 'object'
      ? {
          ...(stash.result as Record<string, unknown>),
          patch,
        }
      : { patch };

  return {
    ...stash,
    patch,
    result: nextResult,
    detectedFields: editedFacts,
  };
}
