import { listDashboardAiPatchesForSection } from '@/utils/aiDashboardPatchCache';
import { isAiSectionReviewed } from '@/utils/aiSectionReviewState';
import type { AiPendingUpload } from '@/utils/aiDocumentRouting';

type PendingForBadge = Pick<
  AiPendingUpload,
  | 'file_id'
  | 'targetSectionId'
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
