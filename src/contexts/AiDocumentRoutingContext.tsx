'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { AiAdditionalSectionsDialog } from '@/components/ai/AiAdditionalSectionsDialog';
import { AiGuidedNavigationCallout } from '@/components/ai/AiGuidedNavigationCallout';
import { AiRoutingFloatingNotifications } from '@/components/ai/AiRoutingFloatingNotifications';
import { AiSectionMismatchDialog } from '@/components/ai/AiSectionMismatchDialog';
import {
  type AiAdditionalSection,
  type AiAutofillSuccessMeta,
  type AiDocumentMismatchDetail,
  type AiNavigateIntent,
  type AiPendingUpload,
  type FilledSectionsByFile,
  clearFilledSectionsForFile,
  isSectionFilledForFile,
  markSectionFilledForFile,
  pendingUploadKey,
  pendingUploadToAiFile,
  purgePendingUploadsForFile,
  readFilledSectionsFromStorage,
  readPendingUploadsFromStorage,
  writeFilledSectionsToStorage,
  writePendingUploadsToStorage,
} from '@/utils/aiDocumentRouting';
import { runGuidedNavigationToUpload } from '@/utils/aiRoutingUi';
import {
  AI_SECTION_BY_ID,
  AI_SECTION_BY_KEY,
  getAiSectionLabel,
} from '@/utils/aiSectionRegistry';
import type { UploadedAIFile } from '@/utils/aiDocumentUploadUi';

type NavigateToSection = (
  sectionId: string,
  subsectionId?: string | null,
) => void;

type AiDocumentRoutingContextValue = {
  currentSectionId: string;
  pendingUploads: AiPendingUpload[];
  navigateToPendingSection: (
    pending: AiPendingUpload,
    intent?: AiNavigateIntent,
  ) => void;
  getPendingUploadsForSection: (sectionId: string) => AiPendingUpload[];
  getPendingFileForSection: (
    sectionId: string,
    scope?: string,
  ) => UploadedAIFile | null;
  shouldHighlightUpload: (sectionId: string, scope?: string) => boolean;
  clearPendingForSection: (sectionId: string, scope?: string) => void;
  clearAllPendingForFile: (fileId: string) => void;
  dismissHighlight: (sectionId: string, scope?: string) => void;
  clearNavigateIntent: (sectionId: string, scope?: string) => void;
  handleMismatch: (
    detail: AiDocumentMismatchDetail,
    context?: {
      currentSectionId?: string;
      uploadScope?: string;
    },
  ) => void;
  handleAutofillSuccess: (meta: AiAutofillSuccessMeta) => void;
  /** Show deferred other-section popup after current-section UI completes */
  releaseAdditionalSectionsDialog: () => void;
};

const AiDocumentRoutingContext =
  createContext<AiDocumentRoutingContextValue | null>(null);

type Props = {
  children: React.ReactNode;
  currentSectionId: string;
  onNavigateToSection: NavigateToSection;
};

function upsertPendingUpload(
  uploads: AiPendingUpload[],
  next: AiPendingUpload,
): AiPendingUpload[] {
  const key = pendingUploadKey(next.targetSectionId, next.uploadScope);
  const filtered = uploads.filter(
    item => pendingUploadKey(item.targetSectionId, item.uploadScope) !== key,
  );
  return [...filtered, next];
}

function updatePendingUpload(
  uploads: AiPendingUpload[],
  sectionId: string,
  scope: string,
  updater: (upload: AiPendingUpload) => AiPendingUpload,
) {
  const key = pendingUploadKey(sectionId, scope);
  return uploads.map(item => {
    if (pendingUploadKey(item.targetSectionId, item.uploadScope) !== key) {
      return item;
    }
    return updater(item);
  });
}

export function AiDocumentRoutingProvider({
  children,
  currentSectionId,
  onNavigateToSection,
}: Props) {
  const [pendingUploads, setPendingUploads] = useState<AiPendingUpload[]>([]);
  const [filledSectionsByFile, setFilledSectionsByFile] =
    useState<FilledSectionsByFile>({});

  const [mismatchDetail, setMismatchDetail] =
    useState<AiDocumentMismatchDetail | null>(null);
  const [mismatchContext, setMismatchContext] = useState<{
    currentSectionId?: string;
    uploadScope?: string;
  } | null>(null);
  const [additionalSections, setAdditionalSections] = useState<
    AiAdditionalSection[]
  >([]);
  const [additionalContext, setAdditionalContext] = useState<{
    currentSectionId?: string;
    documentSummary?: string;
    sectionPreviews?: import('@/utils/aiDocumentRouting').AiSectionPreview[];
  } | null>(null);

  const deferredAdditionalRef = useRef<{
    sections: AiAdditionalSection[];
    context: {
      currentSectionId?: string;
      documentSummary?: string;
      sectionPreviews?: import('@/utils/aiDocumentRouting').AiSectionPreview[];
    };
  } | null>(null);

  useEffect(() => {
    setPendingUploads(readPendingUploadsFromStorage());
    setFilledSectionsByFile(readFilledSectionsFromStorage());
  }, []);

  const persistFilledSections = useCallback((next: FilledSectionsByFile) => {
    setFilledSectionsByFile(next);
    writeFilledSectionsToStorage(next);
  }, []);

  const persistPendingUploads = useCallback((next: AiPendingUpload[]) => {
    setPendingUploads(next);
    writePendingUploadsToStorage(next);
  }, []);

  const addPendingUpload = useCallback(
    (upload: AiPendingUpload) => {
      setPendingUploads(current => {
        const next = upsertPendingUpload(current, upload);
        writePendingUploadsToStorage(next);
        return next;
      });
    },
    [],
  );

  const patchPendingUpload = useCallback(
    (
      sectionId: string,
      scope: string,
      updater: (upload: AiPendingUpload) => AiPendingUpload,
    ) => {
      setPendingUploads(current => {
        const next = updatePendingUpload(current, sectionId, scope, updater);
        writePendingUploadsToStorage(next);
        return next;
      });
    },
    [],
  );

  const clearPendingForSection = useCallback((sectionId: string, scope = 'full') => {
    const key = pendingUploadKey(sectionId, scope);
    setPendingUploads(current => {
      const next = current.filter(
        item => pendingUploadKey(item.targetSectionId, item.uploadScope) !== key,
      );
      writePendingUploadsToStorage(next);
      return next;
    });
  }, []);

  const clearAllPendingForFile = useCallback((fileId: string) => {
    setPendingUploads(current => {
      const next = purgePendingUploadsForFile(current, fileId);
      writePendingUploadsToStorage(next);
      return next;
    });

    setFilledSectionsByFile(current => {
      const next = clearFilledSectionsForFile(current, fileId);
      writeFilledSectionsToStorage(next);
      return next;
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('orderly-ai-document-consumed', {
          detail: { fileId },
        }),
      );
    }
  }, []);

  const dismissHighlight = useCallback((sectionId: string, scope = 'full') => {
    patchPendingUpload(sectionId, scope, upload => ({
      ...upload,
      highlightUpload: false,
      navigateIntent: null,
    }));
  }, [patchPendingUpload]);

  const clearNavigateIntent = useCallback(
    (sectionId: string, scope = 'full') => {
      patchPendingUpload(sectionId, scope, upload => ({
        ...upload,
        navigateIntent: null,
      }));
    },
    [patchPendingUpload],
  );

  const queuePendingForSection = useCallback(
    (
      detail: {
        file_id: string;
        mime_type: string;
        section_key: string;
        section_id: string;
        section_label?: string;
        subsection?: string;
        data_summary?: string;
        extracted_fields?: AiDocumentMismatchDetail['extracted_fields'];
      },
      context?: {
        currentSectionId?: string;
        uploadScope?: string;
        highlight?: boolean;
        navigateIntent?: AiNavigateIntent;
      },
    ) => {
      const targetSectionId = detail.section_id;
      if (!targetSectionId) return;

      addPendingUpload({
        file_id: detail.file_id,
        mime_type: detail.mime_type || 'application/pdf',
        targetSectionId,
        targetSectionKey: detail.section_key,
        targetSubsection: detail.subsection,
        uploadScope: context?.uploadScope || 'full',
        documentSummary: detail.data_summary,
        extractedFields: detail.extracted_fields,
        navigateIntent: context?.navigateIntent ?? null,
        uploadedFromSectionId: context?.currentSectionId,
        highlightUpload: context?.highlight ?? true,
        createdAt: Date.now(),
      });
    },
    [addPendingUpload],
  );

  const navigateToPending = useCallback(
    (pending: AiPendingUpload, intent: AiNavigateIntent = 'autofill') => {
      patchPendingUpload(
        pending.targetSectionId,
        pending.uploadScope,
        upload => ({
          ...upload,
          navigateIntent: intent,
          highlightUpload: true,
        }),
      );

      onNavigateToSection(
        pending.targetSectionId,
        pending.targetSubsection || null,
      );
    },
    [onNavigateToSection, patchPendingUpload],
  );

  const handleMismatch = useCallback(
    (
      detail: AiDocumentMismatchDetail,
      context?: {
        currentSectionId?: string;
        uploadScope?: string;
      },
    ) => {
      const suggestedMeta =
        (detail.suggested_section_id &&
          AI_SECTION_BY_ID[detail.suggested_section_id]) ||
        AI_SECTION_BY_KEY[detail.suggested_section] ||
        null;

      const suggestedId =
        suggestedMeta?.id || detail.suggested_section_id || '';

      if (
        suggestedId &&
        !isSectionFilledForFile(filledSectionsByFile, detail.file_id, suggestedId)
      ) {
        queuePendingForSection(
          {
            file_id: detail.file_id,
            mime_type: detail.mime_type || 'application/pdf',
            section_key: suggestedMeta?.key || detail.suggested_section,
            section_id: suggestedId,
            section_label: detail.suggested_section_label,
            subsection:
              detail.suggested_subsection || suggestedMeta?.defaultSubsection,
            data_summary: detail.document_summary,
            extracted_fields: detail.extracted_fields,
          },
          context,
        );
      }

      (detail.additional_sections || []).forEach(section => {
        const sectionId =
          section.section_id ||
          AI_SECTION_BY_KEY[section.section_key]?.id ||
          '';
        if (
          sectionId &&
          isSectionFilledForFile(filledSectionsByFile, detail.file_id, sectionId)
        ) {
          return;
        }

        queuePendingForSection(
          {
            file_id: detail.file_id,
            mime_type: detail.mime_type || 'application/pdf',
            section_key: section.section_key,
            section_id: section.section_id,
            section_label: section.section_label,
            subsection: section.subsection,
            data_summary: section.data_summary,
          },
          {
            currentSectionId: context?.currentSectionId,
            uploadScope: 'full',
            highlight: true,
          },
        );
      });

      const suggestedLabel =
        detail.suggested_section_label ||
        getAiSectionLabel(suggestedMeta?.id || detail.suggested_section_id || '');

      if (detail.mismatch_type === 'companion_section_first') {
        toast.info(`Fill ${suggestedLabel} first`, {
          description:
            'This document has vehicle and insurance details. Vehicles will be filled first — then return here.',
        });
      } else {
        toast.info(`This document belongs in ${suggestedLabel}`, {
          description: 'No re-upload needed — go there to auto-fill instantly.',
        });
      }

      setMismatchDetail(detail);
      setMismatchContext(context || null);
    },
    [filledSectionsByFile, queuePendingForSection],
  );

  const handleAutofillSuccess = useCallback(
    (meta: AiAutofillSuccessMeta) => {
      const nextFilled = markSectionFilledForFile(
        filledSectionsByFile,
        meta.file_id,
        meta.currentSectionId,
      );
      persistFilledSections(nextFilled);

      clearPendingForSection(meta.currentSectionId, meta.uploadScope);

      if (meta.document_deleted) {
        clearAllPendingForFile(meta.file_id);
        return;
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('orderly-ai-document-consumed', {
            detail: {
              sectionId: meta.currentSectionId,
              uploadScope: meta.uploadScope,
              fileId: meta.file_id,
            },
          }),
        );
      }

      const extras = (meta.additional_sections || []).filter(
        section =>
          section.section_id !== meta.currentSectionId &&
          !isSectionFilledForFile(nextFilled, meta.file_id, section.section_id),
      );
      const previews = (meta.section_previews || []).filter(
        preview =>
          preview.status === 'pending' &&
          preview.section_id !== meta.currentSectionId &&
          (!preview.section_id ||
            !isSectionFilledForFile(
              nextFilled,
              meta.file_id,
              preview.section_id,
            )),
      );

      if (!extras.length && !previews.length) return;

      extras.forEach(section => {
        if (
          isSectionFilledForFile(nextFilled, meta.file_id, section.section_id)
        ) {
          return;
        }

        queuePendingForSection(
          {
            file_id: meta.file_id,
            mime_type: meta.mime_type,
            section_key: section.section_key,
            section_id: section.section_id,
            section_label: section.section_label,
            subsection: section.subsection,
            data_summary: section.data_summary,
            extracted_fields: section.extracted_fields,
          },
          {
            currentSectionId: meta.currentSectionId,
            uploadScope: 'full',
            highlight: true,
          },
        );
      });

      const dialogPayload = {
        sections: extras,
        context: {
          currentSectionId: meta.currentSectionId,
          documentSummary:
            meta.document_summary || extras[0]?.data_summary || undefined,
          sectionPreviews: previews.length ? previews : undefined,
        },
      };

      if (meta.deferAdditionalDialog) {
        deferredAdditionalRef.current = dialogPayload;
        return;
      }

      setAdditionalSections(extras);
      setAdditionalContext(dialogPayload.context);
    },
    [
      clearAllPendingForFile,
      clearPendingForSection,
      filledSectionsByFile,
      persistFilledSections,
      queuePendingForSection,
    ],
  );

  const getPendingUploadsForSection = useCallback(
    (sectionId: string) => {
      return pendingUploads.filter(item => item.targetSectionId === sectionId);
    },
    [pendingUploads],
  );

  const getPendingFileForSection = useCallback(
    (sectionId: string, scope = 'full') => {
      const match =
        pendingUploads.find(
          item =>
            item.targetSectionId === sectionId &&
            item.uploadScope === scope &&
            item.highlightUpload,
        ) ||
        pendingUploads.find(
          item =>
            item.targetSectionId === sectionId &&
            item.uploadScope === 'full' &&
            item.highlightUpload,
        );

      return match ? pendingUploadToAiFile(match) : null;
    },
    [pendingUploads],
  );

  const shouldHighlightUpload = useCallback(
    (sectionId: string, scope = 'full') => {
      return pendingUploads.some(
        item =>
          item.targetSectionId === sectionId &&
          item.uploadScope === scope &&
          item.highlightUpload,
      ) || pendingUploads.some(
        item =>
          item.targetSectionId === sectionId &&
          item.uploadScope === 'full' &&
          item.highlightUpload,
      );
    },
    [pendingUploads],
  );

  const closeMismatchDialog = useCallback(() => {
    setMismatchDetail(null);
    setMismatchContext(null);
  }, []);

  const closeAdditionalDialog = useCallback(() => {
    setAdditionalSections([]);
    setAdditionalContext(null);
    deferredAdditionalRef.current = null;
  }, []);

  const releaseAdditionalSectionsDialog = useCallback(() => {
    const deferred = deferredAdditionalRef.current;
    if (!deferred) return;

    deferredAdditionalRef.current = null;
    setAdditionalSections(deferred.sections);
    setAdditionalContext(deferred.context);
  }, []);

  const latestMismatchPending = useMemo(() => {
    if (!mismatchDetail) return null;

    const suggestedId =
      mismatchDetail.suggested_section_id ||
      AI_SECTION_BY_KEY[mismatchDetail.suggested_section]?.id;

    return (
      pendingUploads.find(item => item.targetSectionId === suggestedId) ||
      pendingUploads[pendingUploads.length - 1] ||
      null
    );
  }, [mismatchDetail, pendingUploads]);

  const goToSuggestedSection = useCallback(() => {
    if (!latestMismatchPending) return;

    closeMismatchDialog();
    navigateToPending(latestMismatchPending, 'autofill');
  }, [closeMismatchDialog, latestMismatchPending, navigateToPending]);

  const goToAdditionalSection = useCallback(
    (section: AiAdditionalSection) => {
      const pending = pendingUploads.find(
        item => item.targetSectionId === section.section_id,
      );

      closeAdditionalDialog();

      if (pending) {
        navigateToPending(pending, 'autofill');
        return;
      }

      onNavigateToSection(section.section_id, section.subsection || null);
    },
    [closeAdditionalDialog, navigateToPending, onNavigateToSection, pendingUploads],
  );

  const navigateToPendingSection = useCallback(
    (pending: AiPendingUpload, intent: AiNavigateIntent = 'autofill') => {
      navigateToPending(pending, intent);
    },
    [navigateToPending],
  );

  const value = useMemo(
    () => ({
      currentSectionId,
      pendingUploads,
      navigateToPendingSection,
      getPendingUploadsForSection,
      getPendingFileForSection,
      shouldHighlightUpload,
      clearPendingForSection,
      clearAllPendingForFile,
      dismissHighlight,
      clearNavigateIntent,
      handleMismatch,
      handleAutofillSuccess,
      releaseAdditionalSectionsDialog,
    }),
    [
      currentSectionId,
      pendingUploads,
      navigateToPendingSection,
      getPendingUploadsForSection,
      getPendingFileForSection,
      shouldHighlightUpload,
      clearPendingForSection,
      clearAllPendingForFile,
      dismissHighlight,
      clearNavigateIntent,
      handleMismatch,
      handleAutofillSuccess,
      releaseAdditionalSectionsDialog,
    ],
  );

  const currentSectionLabel = mismatchContext?.currentSectionId
    ? getAiSectionLabel(mismatchContext.currentSectionId)
    : additionalContext?.currentSectionId
      ? getAiSectionLabel(additionalContext.currentSectionId)
      : 'this section';

  const suggestedSectionLabel =
    mismatchDetail?.suggested_section_label ||
    (latestMismatchPending
      ? getAiSectionLabel(latestMismatchPending.targetSectionId)
      : '');

  return (
    <AiDocumentRoutingContext.Provider value={value}>
      {children}

      <AiSectionMismatchDialog
        open={Boolean(mismatchDetail)}
        onOpenChange={open => {
          if (!open) closeMismatchDialog();
        }}
        currentSectionLabel={currentSectionLabel}
        suggestedSectionLabel={suggestedSectionLabel}
        documentSummary={mismatchDetail?.document_summary}
        extractedFieldCount={mismatchDetail?.extracted_fields?.length || 0}
        additionalSections={mismatchDetail?.additional_sections || []}
        sectionPreviews={mismatchDetail?.section_previews}
        mismatchType={mismatchDetail?.mismatch_type}
        onStayHere={closeMismatchDialog}
        onGoToSection={goToSuggestedSection}
      />

      <AiAdditionalSectionsDialog
        open={additionalSections.length > 0 || Boolean(additionalContext?.sectionPreviews?.length)}
        onOpenChange={open => {
          if (!open) closeAdditionalDialog();
        }}
        currentSectionLabel={currentSectionLabel}
        documentSummary={additionalContext?.documentSummary}
        additionalSections={additionalSections}
        sectionPreviews={additionalContext?.sectionPreviews}
        onLater={closeAdditionalDialog}
        onGoToSection={goToAdditionalSection}
      />

      <AiRoutingFloatingNotifications />
      <AiGuidedNavigationCallout />
    </AiDocumentRoutingContext.Provider>
  );
}

export function useAiDocumentRouting() {
  const context = useContext(AiDocumentRoutingContext);

  if (!context) {
    throw new Error(
      'useAiDocumentRouting must be used within AiDocumentRoutingProvider',
    );
  }

  return context;
}

export function useOptionalAiDocumentRouting() {
  return useContext(AiDocumentRoutingContext);
}

export type { AiDocumentRoutingContextValue };
