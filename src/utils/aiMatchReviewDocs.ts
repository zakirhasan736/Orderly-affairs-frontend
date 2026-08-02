/**
 * Pick the real documents to show in the section match/fill popup.
 * Avoids counting leftover partner seeds + old stashes as "7 documents"
 * when the owner only uploaded 3 insurance files.
 */

import type { StashedAiPatch } from '@/utils/aiDashboardPatchCache';
import { isAiAutofillDoneForSection } from '@/utils/aiAutofillDoneSections';
import { isAiSectionReviewed } from '@/utils/aiSectionReviewState';
import { AI_SECTION_BY_ID } from '@/utils/aiSectionRegistry';
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
  const items = cardItemsFromStash(sectionId, stash);
  const first = items[0] || {};
  if (sectionId === '7') {
    return [
      extractDisplay(first.policy_company || first.insurance_company).toLowerCase(),
      extractDisplay(first.policy_type).toLowerCase(),
      normalizePolicyNumber(first.policy_number),
      extractDisplay(first.notes || first.additional_notes)
        .toLowerCase()
        .slice(0, 40),
      extractDisplay(first.policy_name || first.named_insured).toLowerCase(),
    ].join('|');
  }
  if (sectionId === '5') {
    return [
      extractDisplay(first.vin).toLowerCase(),
      extractDisplay(first.make).toLowerCase(),
      extractDisplay(first.model).toLowerCase(),
      extractDisplay(first.year).toLowerCase(),
    ].join('|');
  }
  return stash.file_id || String(stash.createdAt || '');
}

/**
 * Documents to show in Review & fill for a section — unique, meaningful,
 * not already filled/reviewed.
 */
export function selectMatchReviewDocuments(
  sectionId: string,
  stashes: StashedAiPatch[],
): StashedAiPatch[] {
  const eligible = stashes.filter(stash => {
    if (!stash) return false;
    if (isAiSectionReviewed(sectionId, stash.file_id)) return false;
    if (isAiAutofillDoneForSection(sectionId, stash.file_id)) return false;
    if (!stash.result && !(stash.detectedFields || []).length) return false;
    return stashHasMeaningfulSectionData(sectionId, stash);
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
