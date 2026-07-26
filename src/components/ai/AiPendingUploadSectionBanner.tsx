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
 * When the user opens a section that overview already filled, show "done"
 * guidance. Keep the uploaded AI document on the server so section / overview
 * history preview still works until TTL expiry or the user deletes it.
 */
export function AiPendingUploadSectionBanner({ activeSectionId }: Props) {
  const {
    getPendingUploadsForSection,
    dismissHighlight,
    clearNavigateIntent,
    clearPendingForSection,
  } = useAiDocumentRouting();
  const pendingForSection = getPendingUploadsForSection(activeSectionId);
  const pendingUpload = pendingForSection.find(item => item.highlightUpload);
  const handledIntentRef = useRef<string | null>(null);
  const clearedPendingRef = useRef<string | null>(null);

  const sectionAlreadyFilled = isAiAutofillDoneForSection(activeSectionId);
  const doneRecord = getAiAutofillDoneForSection(activeSectionId);

  useEffect(() => {
    if (!sectionAlreadyFilled && !wasAiSectionRecentlyFilled(activeSectionId, 120000)) {
      return;
    }

    const clearKey = `${activeSectionId}:${doneRecord?.fileId || pendingUpload?.file_id || 'done'}`;
    if (clearedPendingRef.current === clearKey) return;
    clearedPendingRef.current = clearKey;

    // Clear pending autofill hooks for this section so UI shows "Auto fill done".
    // Do NOT delete the temp AI document here — history preview needs it.
    clearPendingForSection(activeSectionId, pendingUpload?.uploadScope || 'full');
    dismissHighlight(activeSectionId, pendingUpload?.uploadScope || 'full');
  }, [
    activeSectionId,
    clearPendingForSection,
    dismissHighlight,
    doneRecord?.fileId,
    pendingUpload?.file_id,
    pendingUpload?.uploadScope,
    sectionAlreadyFilled,
  ]);

  useEffect(() => {
    if (!pendingUpload?.navigateIntent) return;

    const intentKey = `${pendingUpload.targetSectionId}:${pendingUpload.uploadScope}:${pendingUpload.navigateIntent}`;
    if (handledIntentRef.current === intentKey) return;
    handledIntentRef.current = intentKey;

    // Overview already filled — never re-run Auto-fill; pin stays on the zone.
    if (
      sectionAlreadyFilled ||
      wasAiSectionRecentlyFilled(activeSectionId, 120000) ||
      pendingUpload.navigateIntent === 'review'
    ) {
      clearNavigateIntent(
        pendingUpload.targetSectionId,
        pendingUpload.uploadScope,
      );
      // Do not scroll/pulse the section drop zone as if it needs another read.
      return;
    }

    // Legacy autofill intent without done marker — still do not auto-click if
    // the section data was already persisted in background.
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
  }, [
    activeSectionId,
    clearNavigateIntent,
    pendingUpload,
    sectionAlreadyFilled,
  ]);

  if (!pendingUpload && !sectionAlreadyFilled) return null;

  if (sectionAlreadyFilled) {
    return (
      <InlineNotice
        variant="info"
        title="Pinned from Overview"
        description={
          <>
            Fields were filled from your overview upload
            {doneRecord?.fileName ? ` (${doneRecord.fileName})` : ''}. The
            document was only read there — the section drop zone shows a pin, not
            another read.
          </>
        }
      />
    );
  }

  return (
    <AiPendingUploadBanner
      pendingUpload={pendingUpload!}
      mode="review"
      onDismiss={() =>
        dismissHighlight(
          pendingUpload!.targetSectionId,
          pendingUpload!.uploadScope,
        )
      }
      onScrollToUpload={() => {
        scrollToAiUploadZone();
      }}
    />
  );
}
