/**
 * After Accept / background persist, write New-fill markers for every saved
 * card so Overview “Just saved” and sidebar Review these first stay accurate.
 */

import {
  duplicateMatcherForSection,
  namedItemsAreDuplicates,
} from '@/utils/aiItemDedup';
import { coerceSubsectionItems } from '@/utils/aiSectionFormApply';
import { unwrapAiAutofillPatch } from '@/utils/aiPatchNormalizer';
import {
  AI_SECTION_BY_ID,
  getAiSectionLabel,
} from '@/utils/aiSectionRegistry';
import {
  getItemDisplayLabel,
  subsectionHasDynamicTopics,
} from '@/utils/dynamicVaultTopics';
import { identityDocumentCardLabel } from '@/utils/identityDocumentFields';
import { recordNewFill, type NewFillMarker } from '@/utils/newFillMarkers';

function isSubsectionBucketKey(key: string) {
  return /^\d+[A-Z]$/.test(key);
}

function softIdentityMatch(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
) {
  const typeA = String(existing.document_type || '')
    .trim()
    .toLowerCase();
  const typeB = String(incoming.document_type || '')
    .trim()
    .toLowerCase();
  if (typeA && typeB && typeA === typeB) return true;
  const nameA = String(
    existing.full_legal_name || existing.assigned_to_name || '',
  )
    .trim()
    .toLowerCase();
  const nameB = String(
    incoming.full_legal_name || incoming.assigned_to_name || '',
  )
    .trim()
    .toLowerCase();
  return Boolean(nameA && nameB && nameA === nameB);
}

function pickIncomingForSubsection(
  patch: Record<string, unknown>,
  sectionId: string,
  subKey: string,
  defaultSub: string | null,
): Record<string, unknown>[] {
  const direct = coerceSubsectionItems(patch[subKey]);
  if (direct.length) return direct;

  if (defaultSub !== subKey) return [];

  // Flat single-card patches (common for vehicles / insurance).
  const nestedKeys = Object.keys(patch).filter(
    key =>
      isSubsectionBucketKey(key) ||
      key === 'identity_documents' ||
      key === 'vital_info',
  );
  if (nestedKeys.length) return [];

  const hasCardSignal = Boolean(
    patch.make ||
      patch.model ||
      patch.vin ||
      patch.policy_company ||
      patch.insurance_company ||
      patch.policy_type ||
      patch.policy_name ||
      patch.named_insured,
  );
  if (!hasCardSignal) return [];
  if (!subsectionHasDynamicTopics(sectionId, subKey) && sectionId !== '5' && sectionId !== '7') {
    return [];
  }
  return [patch];
}

/**
 * Record one New-fill marker per card written by a successful persist.
 * Safe to call from every Accept path; duplicate unseen markers collapse.
 */
export function recordNewFillsFromPersistResult(args: {
  sectionId: string;
  subsection?: string | null;
  data?: Record<string, unknown> | null;
  result?: unknown;
  ownerId?: string | null;
}): NewFillMarker[] {
  if (typeof window === 'undefined') return [];

  const { sectionId, ownerId } = args;
  if (!sectionId) return [];

  const data =
    args.data && typeof args.data === 'object' && !Array.isArray(args.data)
      ? args.data
      : {};
  const patch = unwrapAiAutofillPatch(args.result);
  const recorded: NewFillMarker[] = [];
  const dedupe = new Set<string>();

  const push = (
    marker: Omit<NewFillMarker, 'id' | 'createdAt' | 'seenAt'> & { id?: string },
  ) => {
    const key = `${marker.sectionId}|${marker.subsectionId || ''}|${
      marker.topicGroupKey || ''
    }|${marker.index ?? ''}|${marker.label}`;
    if (dedupe.has(key)) return;
    dedupe.add(key);
    recorded.push(recordNewFill(marker, ownerId));
  };

  const defaultSub =
    args.subsection ||
    AI_SECTION_BY_ID[sectionId]?.defaultSubsection ||
    null;

  // Identity document cards (Vital / Legal).
  const nestedIdentity =
    patch['20A'] &&
    typeof patch['20A'] === 'object' &&
    !Array.isArray(patch['20A'])
      ? (patch['20A'] as Record<string, unknown>).identity_documents
      : null;
  const identityIncoming = coerceSubsectionItems(
    Array.isArray(patch.identity_documents)
      ? patch.identity_documents
      : nestedIdentity,
  );

  if (
    identityIncoming.length > 0 &&
    (sectionId === '1' || sectionId === '20')
  ) {
    const subsectionId = sectionId === '20' ? '20A' : '1A';
    const mode = sectionId === '20' ? 'family' : 'owner';
    const saved = coerceSubsectionItems(data.identity_documents);
    const used = new Set<number>();

    identityIncoming.forEach((incoming, offset) => {
      let index = saved.findIndex(
        (existing, i) =>
          !used.has(i) && softIdentityMatch(existing, incoming),
      );
      if (index < 0) {
        // Prefer newly appended slots when matcher misses.
        index =
          saved.length > 0
            ? Math.min(
                Math.max(saved.length - identityIncoming.length + offset, 0),
                saved.length - 1,
              )
            : -1;
      }
      if (index < 0 || used.has(index)) return;
      used.add(index);
      const card = saved[index] || incoming;
      push({
        sectionId,
        subsectionId,
        topicGroupKey: 'identity_documents',
        index,
        label: identityDocumentCardLabel(card, index, mode),
      });
    });
  }

  const candidateKeys = new Set<string>();
  if (defaultSub) candidateKeys.add(defaultSub);
  Object.keys(patch).forEach(key => {
    if (isSubsectionBucketKey(key) || subsectionHasDynamicTopics(sectionId, key)) {
      candidateKeys.add(key);
    }
  });
  // Saved card buckets even when patch used a flat shape.
  Object.keys(data).forEach(key => {
    if (
      (isSubsectionBucketKey(key) || subsectionHasDynamicTopics(sectionId, key)) &&
      Array.isArray(data[key])
    ) {
      candidateKeys.add(key);
    }
  });

  for (const subKey of candidateKeys) {
    const savedItems = coerceSubsectionItems(data[subKey]);
    const incoming = pickIncomingForSubsection(
      patch,
      sectionId,
      subKey,
      defaultSub,
    );
    if (!incoming.length || !savedItems.length) continue;

    const matcher =
      duplicateMatcherForSection(sectionId, subKey) ||
      ((a: Record<string, unknown>, b: Record<string, unknown>) =>
        namedItemsAreDuplicates(a, b));

    const used = new Set<number>();
    incoming.forEach((incomingItem, offset) => {
      let index = savedItems.findIndex(
        (existing, i) => !used.has(i) && matcher(existing, incomingItem),
      );
      if (index < 0) {
        index =
          savedItems.length > 0
            ? Math.min(
                Math.max(savedItems.length - incoming.length + offset, 0),
                savedItems.length - 1,
              )
            : -1;
      }
      if (index < 0 || used.has(index)) return;
      used.add(index);
      push({
        sectionId,
        subsectionId: subKey,
        index,
        label: getItemDisplayLabel(
          sectionId,
          subKey,
          savedItems[index],
          index,
        ),
      });
    });
  }

  // Object / non-card sections (e.g. vital_info, residence) still get a hub entry.
  if (!recorded.length) {
    const sectionLabel = getAiSectionLabel(sectionId) || `Section ${sectionId}`;
    push({
      sectionId,
      subsectionId: defaultSub || undefined,
      label: sectionLabel,
    });
  }

  return recorded;
}
