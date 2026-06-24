'use client';

import React, { useEffect, useRef } from 'react';
import { useAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import { AiPendingUploadBanner } from '@/components/ai/AiPendingUploadBanner';
import { getAiSectionLabel } from '@/utils/aiSectionRegistry';
import {
  runGuidedNavigationToUpload,
  scrollToAiUploadZone,
  triggerAiAutofillWhenReady,
} from '@/utils/aiRoutingUi';

type Props = {
  activeSectionId: string;
};

export function AiPendingUploadSectionBanner({ activeSectionId }: Props) {
  const {
    getPendingUploadsForSection,
    dismissHighlight,
    clearNavigateIntent,
  } = useAiDocumentRouting();
  const pendingUploads = getPendingUploadsForSection(activeSectionId);
  const pendingUpload = pendingUploads.find(item => item.highlightUpload);
  const handledIntentRef = useRef<string | null>(null);
  const shouldAutofillRef = useRef(false);

  useEffect(() => {
    if (!pendingUpload?.navigateIntent) return;

    const intentKey = `${pendingUpload.targetSectionId}:${pendingUpload.uploadScope}:${pendingUpload.navigateIntent}`;
    if (handledIntentRef.current === intentKey) return;

    handledIntentRef.current = intentKey;
    shouldAutofillRef.current = pendingUpload.navigateIntent === 'autofill';
    clearNavigateIntent(pendingUpload.targetSectionId, pendingUpload.uploadScope);

    const timer = window.setTimeout(() => {
      runGuidedNavigationToUpload(
        getAiSectionLabel(pendingUpload.targetSectionId),
        {
          autofill: shouldAutofillRef.current,
        },
      );
    }, 400);

    return () => window.clearTimeout(timer);
  }, [clearNavigateIntent, pendingUpload]);

  useEffect(() => {
    const handlePendingRestored = (event: Event) => {
      const detail = (event as CustomEvent<{ sectionId: string }>).detail;
      if (!detail || detail.sectionId !== activeSectionId) return;
      if (!shouldAutofillRef.current) return;

      window.setTimeout(() => {
        scrollToAiUploadZone();
        triggerAiAutofillWhenReady(8000);
        shouldAutofillRef.current = false;
      }, 150);
    };

    window.addEventListener('orderly-ai-pending-restored', handlePendingRestored);
    return () => {
      window.removeEventListener(
        'orderly-ai-pending-restored',
        handlePendingRestored,
      );
    };
  }, [activeSectionId]);

  if (!pendingUpload) {
    return null;
  }

  return (
    <AiPendingUploadBanner
      pendingUpload={pendingUpload}
      onDismiss={() =>
        dismissHighlight(pendingUpload.targetSectionId, pendingUpload.uploadScope)
      }
      onScrollToUpload={scrollToAiUploadZone}
      onAutofillNow={() => {
        shouldAutofillRef.current = true;
        runGuidedNavigationToUpload(
          getAiSectionLabel(pendingUpload.targetSectionId),
          { autofill: true },
        );
      }}
    />
  );
}
