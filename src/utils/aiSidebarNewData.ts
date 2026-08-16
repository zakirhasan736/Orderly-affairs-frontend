import {
  listDashboardAiPatches,
  listDashboardAiPatchesForSection,
} from '@/utils/aiDashboardPatchCache';
import { isAiSectionReviewed } from '@/utils/aiSectionReviewState';
import type { AiPendingUpload } from '@/utils/aiDocumentRouting';

function sameSubsection(
  left?: string | null,
  right?: string | null,
): boolean {
  const a = String(left || '').trim().toLowerCase();
  const b = String(right || '').trim().toLowerCase();
  return Boolean(a && b && a === b);
}

type PendingForBadge = Pick<
  AiPendingUpload,
  | 'file_id'
  | 'targetSectionId'
  | 'targetSubsection'
  | 'documentSummary'
  | 'extractedFields'
  | 'navigateIntent'
  | 'highlightUpload'
>;

/**
 * Whether the left sidebar should show "New data" for a vault section.
 *
 * Upload-card highlighting is intentionally one section per file; badges must
 * still appear on every matching section that has an unread, unpersisted stash
 * (or a pending review pin with substance).
 */
export function sectionHasSidebarNewAiData(
  sectionId: string,
  pendingUploads: PendingForBadge[] = [],
): boolean {
  const sid = String(sectionId || '').trim();
  if (!sid) return false;

  const hasUnreadStash = listDashboardAiPatchesForSection(sid).some(entry => {
    if (entry.vault_persisted) return false;
    return !isAiSectionReviewed(sid, entry.file_id);
  });
  if (hasUnreadStash) return true;

  return pendingUploads.some(upload => {
    if (String(upload.targetSectionId) !== sid) return false;
    if (isAiSectionReviewed(sid, upload.file_id)) return false;

    const hasSubstance =
      Boolean(String(upload.documentSummary || '').trim()) ||
      Boolean(upload.extractedFields?.length);

    // Quiet partner rows keep substance / review intent even when
    // highlightUpload is false (promoteSingleHighlightPerFile).
    return (
      hasSubstance ||
      upload.navigateIntent === 'review' ||
      upload.highlightUpload
    );
  });
}

export function subsectionHasSidebarNewAiData(
  sectionId: string,
  subsectionId: string,
  pendingUploads: PendingForBadge[] = [],
): boolean {
  const sid = String(sectionId || '').trim();
  const sub = String(subsectionId || '').trim();
  if (!sid || !sub) return false;

  const hasUnreadStash = listDashboardAiPatchesForSection(sid).some(entry => {
    if (entry.vault_persisted) return false;
    if (!sameSubsection(entry.subsection, sub)) return false;
    return !isAiSectionReviewed(sid, entry.file_id);
  });
  if (hasUnreadStash) return true;

  return pendingUploads.some(upload => {
    if (String(upload.targetSectionId) !== sid) return false;
    if (!sameSubsection(upload.targetSubsection, sub)) return false;
    if (isAiSectionReviewed(sid, upload.file_id)) return false;
    return (
      Boolean(String(upload.documentSummary || '').trim()) ||
      Boolean(upload.extractedFields?.length) ||
      upload.navigateIntent === 'review' ||
      upload.highlightUpload
    );
  });
}

export type VaultNavGroup<T extends { apiId: string }> = {
  id: string;
  label: string;
  items: T[];
};

/**
 * Pin unread / highlighted match sections to a top "New data" list.
 * After review or persist they return to their original collection.
 */
export function partitionVaultNavForNewData<T extends { apiId: string }>(
  groups: Array<VaultNavGroup<T>>,
  newDataIds: Set<string>,
): { newDataItems: T[]; groupsForNav: Array<VaultNavGroup<T>> } {
  const seen = new Set<string>();
  const newDataItems: T[] = [];
  const groupsForNav = groups
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (item.apiId === 'dashboard') return true;
        if (!newDataIds.has(item.apiId)) return true;
        if (!seen.has(item.apiId)) {
          seen.add(item.apiId);
          newDataItems.push(item);
        }
        return false;
      }),
    }))
    .filter(group => group.items.length > 0);
  return { newDataItems, groupsForNav };
}

/** How many uploaded docs still need Review & fill for this section (or all). */
export function countPendingAiReviews(sectionId?: string): number {
  const sid = String(sectionId || '').trim();
  const list = sid
    ? listDashboardAiPatchesForSection(sid)
    : listDashboardAiPatches();
  const seen = new Set<string>();
  let count = 0;
  list.forEach(entry => {
    const section = entry.section_id;
    if (!section) return;
    if (isAiSectionReviewed(section, entry.file_id)) return;
    const key = `${section}:${entry.file_id || entry.createdAt}`;
    if (seen.has(key)) return;
    seen.add(key);
    count += 1;
  });
  return count;
}
