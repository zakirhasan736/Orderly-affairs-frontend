'use client';

import React, { useEffect, useRef } from 'react';
import { useAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import { AiPendingUploadBanner } from '@/components/ai/AiPendingUploadBanner';
import { InlineNotice } from '@/components/common/ui/inline-notice';
import { getAiSectionLabel } from '@/utils/aiSectionRegistry';
import { wasAiSectionRecentlyFilled } from '@/utils/aiSectionFillGuard';
import {
  getAiAutofillDoneForSection,
  isAiAutofillDoneForSection,
} from '@/utils/aiAutofillDoneSections';
import {
  runGuidedNavigationToUpload,
  scrollToAiUploadZone,
} from '@/utils/aiRoutingUi';

type Props = {
  activeSectionId: string;
};

/**
 * When the user opens a section that overview already filled, show guidance.
 * Multi-document review/fill lives in AiSectionFieldMatchDialog (tabs per doc).
 */
export function AiPendingUploadSectionBanner({ activeSectionId }: Props) {
  const {
    getPendingUploadsForSection,
    dismissHighlight,
    clearNavigateIntent,
    clearAllPendingForFile,
  } = useAiDocumentRouting();
  const pendingForSection = getPendingUploadsForSection(activeSectionId);
  const openPending = pendingForSection.filter(
    item => !isAiAutofillDoneForSection(activeSectionId, item.file_id),
  );
  const pendingUpload =
    openPending.find(item => item.highlightUpload) || openPending[0] || null;
  const handledIntentRef = useRef<string | null>(null);
  const clearedFilesRef = useRef<Set<string>>(new Set());

  const sectionAlreadyFilled = isAiAutofillDoneForSection(activeSectionId);
  const doneRecord = getAiAutofillDoneForSection(activeSectionId);

  useEffect(() => {
    pendingForSection.forEach(item => {
      if (!item.file_id) return;
      if (!isAiAutofillDoneForSection(activeSectionId, item.file_id)) return;
      if (clearedFilesRef.current.has(item.file_id)) return;
      clearedFilesRef.current.add(item.file_id);
      clearAllPendingForFile(item.file_id);
    });
  }, [activeSectionId, clearAllPendingForFile, pendingForSection]);

  useEffect(() => {
    if (!pendingUpload?.navigateIntent) return;

    const intentKey = `${pendingUpload.targetSectionId}:${pendingUpload.uploadScope}:${pendingUpload.navigateIntent}:${pendingUpload.file_id}`;
    if (handledIntentRef.current === intentKey) return;
    handledIntentRef.current = intentKey;

    const thisFileDone = isAiAutofillDoneForSection(
      activeSectionId,
      pendingUpload.file_id,
    );

    if (
      thisFileDone ||
      wasAiSectionRecentlyFilled(activeSectionId, 120000) ||
      pendingUpload.navigateIntent === 'review'
    ) {
      clearNavigateIntent(
        pendingUpload.targetSectionId,
        pendingUpload.uploadScope,
      );
      return;
    }

    clearNavigateIntent(
      pendingUpload.targetSectionId,
      pendingUpload.uploadScope,
    );

    const timer = window.setTimeout(() => {
      runGuidedNavigationToUpload(
        getAiSectionLabel(pendingUpload.targetSectionId),
        { autofill: false },
      );
    }, 400);

    return () => window.clearTimeout(timer);
  }, [activeSectionId, clearNavigateIntent, pendingUpload]);

  if (pendingUpload) {
    return (
      <AiPendingUploadBanner
        pendingUpload={pendingUpload}
        mode="review"
        onDismiss={() =>
          dismissHighlight(
            pendingUpload.targetSectionId,
            pendingUpload.uploadScope,
          )
        }
        onScrollToUpload={() => {
          scrollToAiUploadZone();
        }}
      />
    );
  }

  if (!sectionAlreadyFilled) return null;

  return (
    <InlineNotice
      variant="info"
      title="Pinned from Overview"
      description={
        <>
          Fields were filled from your overview upload
          {doneRecord?.fileName ? ` (${doneRecord.fileName})` : ''}. The
          document was only read there — the section drop zone shows a pin, not
          another read. Upload another document to add a new vehicle, policy, or
          card.
        </>
      }
    />
  );
}
