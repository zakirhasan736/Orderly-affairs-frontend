/**
 * Pick the real documents to show in the section match/fill popup.
 * Avoids counting leftover partner seeds + old stashes as "7 documents"
 * when the owner only uploaded 3 insurance files.
 */

import {
  peekDashboardAiPatch,
  type StashedAiPatch,
} from '@/utils/aiDashboardPatchCache';
import { isAiSectionReviewed } from '@/utils/aiSectionReviewState';
import { AI_SECTION_BY_ID } from '@/utils/aiSectionRegistry';
import { composeEntryTitle } from '@/vault-prototype/entryDisplayTitle';
import {
  unwrapAiAutofillPatch,
  asPlainFieldText,
} from '@/utils/aiPatchNormalizer';
import { isJunkVehicleCard } from '@/utils/aiItemDedup';

function coerceItems(raw: unknown): Record<string, unknown>[] {
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

function extractDisplay(value: unknown): string {
  return asPlainFieldText(value).trim();
}

function normalizePolicyNumber(value: unknown): string {
  return extractDisplay(value)
    .toLowerCase()
    .replace(/[\s\-_.#]/g, '');
}

function cardItemsFromStash(
  sectionId: string,
  stash: StashedAiPatch,
): Record<string, unknown>[] {
  const patch = unwrapAiAutofillPatch(stash.result || stash.patch);
  const defaultSub =
    stash.subsection ||
    AI_SECTION_BY_ID[sectionId]?.defaultSubsection ||
    null;

  if (defaultSub && patch[defaultSub] != null) {
    return coerceItems(patch[defaultSub]);
  }

  for (const [key, value] of Object.entries(patch)) {
    if (/^\d+[A-Z]$/.test(key) || key === '5A' || key === '7A') {
      const items = coerceItems(value);
      if (items.length) return items;
    }
  }

  // Flat single-card extract
  if (Object.keys(patch).some(key => !/^\d+[A-Z]$/.test(key))) {
    const flat = Object.fromEntries(
      Object.entries(patch).filter(([key]) => !/^\d+[A-Z]$/.test(key)),
    );
    return coerceItems(flat);
  }

  return [];
}

/** Thin insurance partner seed: company+type only, no real policy body. */
function isThinInsuranceSeed(item: Record<string, unknown>): boolean {
  const number = normalizePolicyNumber(item.policy_number);
  if (number) return false;
  const notes = extractDisplay(item.notes || item.additional_notes);
  const name = extractDisplay(
    item.policy_name || item.named_insured || item.insured_name,
  );
  const coverage = extractDisplay(item.coverage_amount);
  const premium = extractDisplay(item.premium_info);
  const detailCount = [notes, name, coverage, premium].filter(Boolean).length;
  return detailCount === 0;
}

function stashHasMeaningfulSectionData(
  sectionId: string,
  stash: StashedAiPatch,
): boolean {
  const items = cardItemsFromStash(sectionId, stash);
  if (items.length) {
    if (sectionId === '7') {
      return items.some(item => !isThinInsuranceSeed(item));
    }
    if (sectionId === '5') {
      return items.some(item => !isJunkVehicleCard(item));
    }
    return items.some(item =>
      Object.entries(item).some(
        ([key, value]) =>
          key !== '__rowId' && extractDisplay(value).length > 0,
      ),
    );
  }

  return Boolean(
    (stash.detectedFields && stash.detectedFields.length > 0) ||
      stash.document_summary,
  );
}

function stashRichness(sectionId: string, stash: StashedAiPatch): number {
  const items = cardItemsFromStash(sectionId, stash);
  let score = items.length * 10;
  items.forEach(item => {
    Object.values(item).forEach(value => {
      if (extractDisplay(value)) score += 1;
    });
  });
  score += (stash.detectedFields || []).length;
  return score;
}

function contentFingerprint(sectionId: string, stash: StashedAiPatch): string {
  const fileFallback = String(stash.file_id || stash.createdAt || '').trim();
  const items = cardItemsFromStash(sectionId, stash);
  const first = items[0] || {};
  if (sectionId === '7') {
    const company = extractDisplay(
      first.policy_company || first.insurance_company,
    ).toLowerCase();
    const type = extractDisplay(first.policy_type).toLowerCase();
    const number = normalizePolicyNumber(first.policy_number);
    const notes = extractDisplay(first.notes || first.additional_notes)
      .toLowerCase()
      .slice(0, 40);
    const name = extractDisplay(
      first.policy_name || first.named_insured,
    ).toLowerCase();
    if (!company && !type && !number && !notes && !name) return fileFallback;
    return [company, type, number, notes, name].join('|');
  }
  if (sectionId === '5') {
    const vin = extractDisplay(first.vin).toLowerCase();
    const make = extractDisplay(first.make).toLowerCase();
    const model = extractDisplay(first.model).toLowerCase();
    const year = extractDisplay(first.year).toLowerCase();
    if (!vin && !make && !model && !year) return fileFallback;
    return vin ? `vin:${vin}` : [make, model, year].join('|');
  }
  return fileFallback;
}

/** Keep Review clicks on the file that was pressed. */
export function pickDocsByFileId<T>(
  docs: T[],
  fileId: string | undefined | null,
  getId: (doc: T) => string | undefined | null,
  opts?: { strict?: boolean },
): T[] {
  const id = String(fileId || '').trim();
  if (!id) return docs;
  const match = docs.filter(doc => String(getId(doc) || '').trim() === id);
  if (match.length) return match;
  return opts?.strict ? [] : docs;
}

function factsFromVaultItem(
  item: Record<string, unknown>,
  subsection?: string | null,
): StashedAiPatch['detectedFields'] {
  return Object.entries(item)
    .filter(([key, value]) => key !== '__rowId' && extractDisplay(value))
    .map(([key, value]) => ({
      field_key: key,
      label: key.replace(/_/g, ' '),
      value: extractDisplay(value),
      subsection: subsection || undefined,
    }));
}

function scoreVaultItemForDocument(
  item: Record<string, unknown>,
  haystack: string,
): number {
  const blob = haystack.toLowerCase();
  if (!blob.trim()) return 0;
  const title = composeEntryTitle(item).toLowerCase();
  let score = 0;
  if (title && blob.includes(title)) score += 50;
  const vin = extractDisplay(item.vin).toLowerCase();
  const make = extractDisplay(item.make).toLowerCase();
  const model = extractDisplay(item.model).toLowerCase();
  const year = extractDisplay(item.year).toLowerCase();
  const company = extractDisplay(
    item.policy_company || item.insurance_company,
  ).toLowerCase();
  const number = normalizePolicyNumber(item.policy_number);
  if (vin && vin.length >= 6 && blob.includes(vin.slice(-6))) score += 40;
  if (year && blob.includes(year)) score += 12;
  if (make && blob.includes(make)) score += 10;
  if (model) {
    const first = model.split(/[\s/]+/)[0];
    if (first && blob.includes(first)) score += 16;
  }
  if (company && blob.includes(company)) score += 12;
  if (number && blob.includes(number)) score += 20;
  return score;
}

/** Rebuild Review & fill after Accept when the stash was already persisted. */
export function synthesizeReviewStashFromVault(args: {
  sectionId: string;
  fileId: string;
  fileName?: string;
  documentSummary?: string;
  sectionData?: unknown;
}): StashedAiPatch | null {
  const sectionId = String(args.sectionId || '').trim();
  const fileId = String(args.fileId || '').trim();
  if (!sectionId || !fileId) return null;

  const peeked = peekDashboardAiPatch(sectionId, fileId);
  if (peeked?.result || (peeked?.detectedFields || []).length) {
    return peeked;
  }

  const subsection =
    AI_SECTION_BY_ID[sectionId]?.defaultSubsection || `${sectionId}A`;
  const raw =
    args.sectionData &&
    typeof args.sectionData === 'object' &&
    !Array.isArray(args.sectionData)
      ? (args.sectionData as Record<string, unknown>)[subsection]
      : args.sectionData;
  const items = coerceItems(raw);
  if (!items.length) return null;

  const haystack = [args.fileName, args.documentSummary]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  let picked = items[0];
  if (items.length > 1 && haystack) {
    let best = -1;
    items.forEach(item => {
      const score = scoreVaultItemForDocument(item, haystack);
      if (score > best) {
        best = score;
        picked = item;
      }
    });
    if (best < 10) return null;
  }

  const facts = factsFromVaultItem(picked, subsection);
  if (!facts?.length) return null;

  return {
    file_id: fileId,
    section_id: sectionId,
    section_key: AI_SECTION_BY_ID[sectionId]?.key || sectionId,
    subsection,
    file_name: args.fileName,
    document_summary: args.documentSummary,
    detectedFields: facts,
    result: { patch: { [subsection]: [picked] } },
    createdAt: Date.now(),
    vault_persisted: true,
  };
}

/**
 * Documents to show in Review & fill for a section — unique, meaningful,
 * not already filled/reviewed.
 */
export function selectMatchReviewDocuments(
  sectionId: string,
  stashes: StashedAiPatch[],
  opts?: { includeFileId?: string },
): StashedAiPatch[] {
  const includeFileId = String(opts?.includeFileId || '').trim();
  const eligible = stashes.filter(stash => {
    if (!stash) return false;
    const isFocused =
      Boolean(includeFileId) && String(stash.file_id || '').trim() === includeFileId;
    if (!isFocused && isAiSectionReviewed(sectionId, stash.file_id)) {
      return false;
    }
    if (!stash.result && !(stash.detectedFields || []).length) return false;
    return isFocused || stashHasMeaningfulSectionData(sectionId, stash);
  });

  // One stash per uploaded file (newest wins first pass).
  const byFile = new Map<string, StashedAiPatch>();
  [...eligible]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .forEach(stash => {
      const key = String(stash.file_id || '').trim() || `anon:${stash.createdAt}`;
      if (!byFile.has(key)) byFile.set(key, stash);
    });

  // Collapse partner+primary duplicates that describe the same card content.
  const byContent = new Map<string, StashedAiPatch>();
  [...byFile.values()]
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .forEach(stash => {
      const fp = contentFingerprint(sectionId, stash) || stash.file_id;
      const existing = byContent.get(fp);
      if (
        !existing ||
        stashRichness(sectionId, stash) > stashRichness(sectionId, existing)
      ) {
        byContent.set(fp, stash);
      }
    });

  return [...byContent.values()].sort(
    (a, b) => (a.createdAt || 0) - (b.createdAt || 0),
  );
}
