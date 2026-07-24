'use client';

import React, { useEffect, useRef } from 'react';
import { useAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import { AiPendingUploadBanner } from '@/components/ai/AiPendingUploadBanner';
import { getAiSectionLabel } from '@/utils/aiSectionRegistry';
import { wasAiSectionRecentlyFilled } from '@/utils/aiSectionFillGuard';
import {
  getAiAutofillDoneForSection,
  isAiAutofillDoneForSection,
} from '@/utils/aiAutofillDoneSections';
import { deleteAIDocument } from '@/services/aiDocumentUpload';
import {
  runGuidedNavigationToUpload,
  scrollToAiUploadZone,
} from '@/utils/aiRoutingUi';

type Props = {
  activeSectionId: string;
};

/**
 * When the user opens a section that overview already filled, show "done"
 * guidance and delete the temporary AI document once no pending sections remain.
 */
async function cleanupTempDocumentIfReady(args: {
  fileId: string;
  pendingForFile: number;
  clearAllPendingForFile: (fileId: string) => void;
}) {
  if (!args.fileId) return;
  // Keep the temp file while other sections for this file still need review.
  if (args.pendingForFile > 0) return;

  await deleteAIDocument(args.fileId);
  args.clearAllPendingForFile(args.fileId);
}

export function AiPendingUploadSectionBanner({ activeSectionId }: Props) {
  const {
    getPendingUploadsForSection,
    pendingUploads,
    dismissHighlight,
    clearNavigateIntent,
    clearPendingForSection,
    clearAllPendingForFile,
  } = useAiDocumentRouting();
  const pendingForSection = getPendingUploadsForSection(activeSectionId);
  const pendingUpload = pendingForSection.find(item => item.highlightUpload);
  const handledIntentRef = useRef<string | null>(null);
  const cleanedFileRef = useRef<string | null>(null);

  const sectionAlreadyFilled = isAiAutofillDoneForSection(activeSectionId);
  const doneRecord = getAiAutofillDoneForSection(activeSectionId);

  useEffect(() => {
    const fileId = doneRecord?.fileId || pendingUpload?.file_id;
    if (!fileId || cleanedFileRef.current === fileId) return;
    if (!sectionAlreadyFilled && !wasAiSectionRecentlyFilled(activeSectionId, 120000)) {
      return;
    }

    const stillPending = pendingUploads.filter(
      item =>
        item.file_id === fileId &&
        item.targetSectionId !== activeSectionId &&
        !isAiAutofillDoneForSection(item.targetSectionId),
    ).length;

    cleanedFileRef.current = fileId;
    void cleanupTempDocumentIfReady({
      fileId,
      pendingForFile: stillPending,
      clearAllPendingForFile,
    });

    // Clear pending autofill hooks for this section so UI shows "Auto fill done".
    clearPendingForSection(activeSectionId, pendingUpload?.uploadScope || 'full');
    dismissHighlight(activeSectionId, pendingUpload?.uploadScope || 'full');
  }, [
    activeSectionId,
    clearAllPendingForFile,
    clearPendingForSection,
    dismissHighlight,
    doneRecord?.fileId,
    pendingUpload?.file_id,
    pendingUpload?.uploadScope,
    pendingUploads,
    sectionAlreadyFilled,
  ]);

  useEffect(() => {
    if (!pendingUpload?.navigateIntent) return;

    const intentKey = `${pendingUpload.targetSectionId}:${pendingUpload.uploadScope}:${pendingUpload.navigateIntent}`;
    if (handledIntentRef.current === intentKey) return;
    handledIntentRef.current = intentKey;

    // Overview already filled — never re-run Auto-fill for the same temp file.
    if (
      sectionAlreadyFilled ||
      wasAiSectionRecentlyFilled(activeSectionId, 120000) ||
      pendingUpload.navigateIntent === 'review'
    ) {
      clearNavigateIntent(
        pendingUpload.targetSectionId,
        pendingUpload.uploadScope,
      );
      const timer = window.setTimeout(() => {
        runGuidedNavigationToUpload(
          getAiSectionLabel(pendingUpload.targetSectionId),
          { autofill: false },
        );
      }, 350);
      return () => window.clearTimeout(timer);
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
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <p className="font-semibold">Auto fill done for this section</p>
        <p className="mt-1 text-xs text-emerald-800/90">
          Fields were filled from your overview upload
          {doneRecord?.fileName ? ` (${doneRecord.fileName})` : ''}. The temporary
          document is removed after you review — do not run Auto-fill again for
          that file.
        </p>
      </div>
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
