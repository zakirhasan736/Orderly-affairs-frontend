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
import { AiGuidedNavigationCallout } from '@/components/ai/AiGuidedNavigationCallout';
import { AiRoutingFloatingNotifications } from '@/components/ai/AiRoutingFloatingNotifications';
import { AiSectionMismatchDialog } from '@/components/ai/AiSectionMismatchDialog';
import {
  isAiAutofillDoneForSection,
} from '@/utils/aiAutofillDoneSections';
import { peekDashboardAiPatch } from '@/utils/aiDashboardPatchCache';
import {
  type AiAdditionalSection,
  type AiAutofillSuccessMeta,
  type AiDocumentMismatchDetail,
  type AiNavigateIntent,
  type AiPendingUpload,
  type FilledSectionsByFile,
  clearFilledSectionsForFile,
  isAiPendingUploadConsumed,
  isSectionFilledForFile,
  markSectionFilledForFile,
  pendingUploadKey,
  pendingUploadToAiFile,
  promoteSingleHighlightPerFile,
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
import {
  getAiUploadMeta,
  type UploadedAIFile,
} from '@/utils/aiDocumentUploadUi';

type NavigateToSection = (
  sectionId: string,
  subsectionId?: string | null,
) => void;

type AiDocumentRoutingContextValue = {
  currentSectionId: string;
  pendingUploads: AiPendingUpload[];
  batchSilentMode: boolean;
  setBatchSilentMode: (enabled: boolean) => void;
  queueRoutedSectionsSilently: (
    detail: AiDocumentMismatchDetail,
    context?: {
      currentSectionId?: string;
      uploadScope?: string;
      navigateIntent?: AiNavigateIntent;
    },
  ) => void;
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
  /** Overview already read/filled this section — show pin, do not re-read. */
  shouldShowOverviewPin: (sectionId: string) => boolean;
  clearPendingForSection: (sectionId: string, scope?: string) => void;
  clearAllPendingForFile: (fileId: string) => void;
  dismissHighlight: (sectionId: string, scope?: string) => void;
  clearNavigateIntent: (sectionId: string, scope?: string) => void;
  handleMismatch: (
    detail: AiDocumentMismatchDetail,
    context?: {
      currentSectionId?: string;
      uploadScope?: string;
      silent?: boolean;
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

function isSectionDoneForUpload(sectionId: string, fileId?: string) {
  // File-aware: accepting vehicle doc A must not mark vehicle doc B as done.
  if (fileId) {
    return isAiAutofillDoneForSection(sectionId, fileId);
  }
  return isAiAutofillDoneForSection(sectionId);
}

export function AiDocumentRoutingProvider({
  children,
  currentSectionId,
  onNavigateToSection,
}: Props) {
  const [pendingUploads, setPendingUploads] = useState<AiPendingUpload[]>([]);
  const [filledSectionsByFile, setFilledSectionsByFile] =
    useState<FilledSectionsByFile>({});
  const [batchSilentMode, setBatchSilentMode] = useState(false);

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
    const stored = readPendingUploadsFromStorage();
    // Drop stale "New data" pins from failed fills (e.g. Gemini 503 after
    // classify queued review sections but never wrote a stash / done marker).
    const cleaned = stored.filter(upload => {
      if (peekDashboardAiPatch(upload.targetSectionId, upload.file_id)) {
        return true;
      }
      if (
        isAiAutofillDoneForSection(upload.targetSectionId, upload.file_id)
      ) {
        return true;
      }
      if (upload.navigateIntent === 'review') return false;
      return true;
    });
    if (cleaned.length !== stored.length) {
      writePendingUploadsToStorage(cleaned);
    }
    setPendingUploads(cleaned);
    setFilledSectionsByFile(readFilledSectionsFromStorage());
  }, []);

  /** Drop resolved section cards and keep one highlight per file. */
  const pruneAndPromotePending = useCallback(
    (
      uploads: AiPendingUpload[],
      filledMap: FilledSectionsByFile = filledSectionsByFile,
    ) => {
      const pruned = uploads.filter(
        upload =>
          !isAiPendingUploadConsumed(
            upload,
            filledMap,
            isSectionDoneForUpload,
          ),
      );
      return promoteSingleHighlightPerFile(
        pruned,
        filledMap,
        isSectionDoneForUpload,
      );
    },
    [filledSectionsByFile],
  );

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
        const next = pruneAndPromotePending(
          upsertPendingUpload(current, upload),
        );
        writePendingUploadsToStorage(next);
        return next;
      });
    },
    [pruneAndPromotePending],
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
      const next = pruneAndPromotePending(
        current.filter(
          item => pendingUploadKey(item.targetSectionId, item.uploadScope) !== key,
        ),
      );
      writePendingUploadsToStorage(next);
      return next;
    });
  }, [pruneAndPromotePending]);

  const clearAllPendingForFile = useCallback((fileId: string) => {
    setPendingUploads(current => {
      const next = pruneAndPromotePending(
        purgePendingUploadsForFile(current, fileId),
      );
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
  }, [pruneAndPromotePending]);

  const dismissHighlight = useCallback((sectionId: string, scope = 'full') => {
    setPendingUploads(current => {
      // Remove dismissed card entirely, then light the next related section.
      const key = pendingUploadKey(sectionId, scope);
      const next = pruneAndPromotePending(
        current.filter(
          item => pendingUploadKey(item.targetSectionId, item.uploadScope) !== key,
        ),
      );
      writePendingUploadsToStorage(next);
      return next;
    });
  }, [pruneAndPromotePending]);

  const clearNavigateIntent = useCallback(
    (sectionId: string, scope = 'full') => {
      patchPendingUpload(sectionId, scope, upload => ({
        ...upload,
        navigateIntent: null,
      }));
    },
    [patchPendingUpload],
  );

  // Visiting a section drops only uploads already filled for that document —
  // sibling docs for the same section (2nd vehicle, 2nd policy) stay queued.
  useEffect(() => {
    if (!currentSectionId || currentSectionId === 'dashboard') return;

    setPendingUploads(current => {
      const related = current.filter(
        item => item.targetSectionId === currentSectionId,
      );
      if (!related.length) return current;

      const keepRelated = related.filter(item => {
        // Still waiting on Accept / review for this exact document.
        if (peekDashboardAiPatch(currentSectionId, item.file_id)) {
          return true;
        }
        if (
          isAiPendingUploadConsumed(
            item,
            filledSectionsByFile,
            isSectionDoneForUpload,
          ) ||
          isSectionDoneForUpload(currentSectionId, item.file_id)
        ) {
          return false;
        }
        return true;
      });

      if (keepRelated.length === related.length) return current;

      const next = pruneAndPromotePending(
        [
          ...current.filter(item => item.targetSectionId !== currentSectionId),
          ...keepRelated,
        ],
        filledSectionsByFile,
      );
      writePendingUploadsToStorage(next);
      return next;
    });
  }, [currentSectionId, filledSectionsByFile, pruneAndPromotePending]);

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

      const uploadMeta = getAiUploadMeta(detail.file_id);

      addPendingUpload({
        file_id: detail.file_id,
        mime_type: detail.mime_type || 'application/pdf',
        file_name: uploadMeta?.file_name,
        uploaded_at: uploadMeta?.uploaded_at,
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
      setPendingUploads(current => {
        const next = current.map(upload => {
          if (upload.file_id !== pending.file_id) {
            return upload;
          }

          const isTarget =
            upload.targetSectionId === pending.targetSectionId &&
            upload.uploadScope === pending.uploadScope;

          return {
            ...upload,
            highlightUpload: isTarget,
            navigateIntent: isTarget ? intent : null,
          };
        });
        writePendingUploadsToStorage(next);
        return next;
      });

      onNavigateToSection(
        pending.targetSectionId,
        pending.targetSubsection || null,
      );
    },
    [onNavigateToSection],
  );

  const queueRoutedSectionsSilently = useCallback(
    (
      detail: AiDocumentMismatchDetail,
      context?: {
        currentSectionId?: string;
        uploadScope?: string;
        navigateIntent?: AiNavigateIntent;
      },
    ) => {
      const suggestedMeta =
        (detail.suggested_section_id &&
          AI_SECTION_BY_ID[detail.suggested_section_id]) ||
        AI_SECTION_BY_KEY[detail.suggested_section] ||
        null;

      const suggestedId =
        suggestedMeta?.id || detail.suggested_section_id || '';
      const navigateIntent = context?.navigateIntent ?? 'review';
      let highlightedOnce = false;

      if (
        suggestedId &&
        !isSectionFilledForFile(filledSectionsByFile, detail.file_id, suggestedId) &&
        !isSectionDoneForUpload(suggestedId, detail.file_id)
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
          {
            currentSectionId: context?.currentSectionId,
            uploadScope: context?.uploadScope || 'full',
            highlight: true,
            navigateIntent,
          },
        );
        highlightedOnce = true;
      }

      (detail.additional_sections || []).forEach(section => {
        const sectionId =
          section.section_id ||
          AI_SECTION_BY_KEY[section.section_key]?.id ||
          '';
        if (
          !sectionId ||
          isSectionFilledForFile(filledSectionsByFile, detail.file_id, sectionId) ||
          isSectionDoneForUpload(sectionId, detail.file_id)
        ) {
          return;
        }

        const shouldHighlight = !highlightedOnce;
        queuePendingForSection(
          {
            file_id: detail.file_id,
            mime_type: detail.mime_type || 'application/pdf',
            section_key: section.section_key,
            section_id: section.section_id,
            section_label: section.section_label,
            subsection: section.subsection,
            data_summary: section.data_summary,
            extracted_fields: section.extracted_fields,
          },
          {
            currentSectionId: context?.currentSectionId,
            uploadScope: 'full',
            // Only the next section card lights up — rest stay queued quietly.
            highlight: shouldHighlight,
            navigateIntent: shouldHighlight ? navigateIntent : null,
          },
        );
        if (shouldHighlight) highlightedOnce = true;
      });
    },
    [filledSectionsByFile, queuePendingForSection],
  );

  const handleMismatch = useCallback(
    (
      detail: AiDocumentMismatchDetail,
      context?: {
        currentSectionId?: string;
        uploadScope?: string;
        silent?: boolean;
      },
    ) => {
      const silent = Boolean(context?.silent || batchSilentMode);

      queueRoutedSectionsSilently(detail, {
        currentSectionId: context?.currentSectionId,
        uploadScope: context?.uploadScope,
        navigateIntent: silent ? 'review' : null,
      });

      if (silent) {
        return;
      }

      const suggestedMeta =
        (detail.suggested_section_id &&
          AI_SECTION_BY_ID[detail.suggested_section_id]) ||
        AI_SECTION_BY_KEY[detail.suggested_section] ||
        null;

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
    [batchSilentMode, queueRoutedSectionsSilently],
  );

  const handleAutofillSuccess = useCallback(
    (meta: AiAutofillSuccessMeta) => {
      const nextFilled = markSectionFilledForFile(
        filledSectionsByFile,
        meta.file_id,
        meta.currentSectionId,
      );
      persistFilledSections(nextFilled);

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
          !isSectionFilledForFile(nextFilled, meta.file_id, section.section_id) &&
          !isSectionDoneForUpload(section.section_id, meta.file_id),
      );

      // Rebuild pending for this file: drop the filled section, keep only
      // remaining related sections, and light up a single "next" card.
      setPendingUploads(current => {
        let next = current.filter(
          item =>
            !(
              item.file_id === meta.file_id &&
              item.targetSectionId === meta.currentSectionId
            ),
        );

        extras.forEach(section => {
          const already = next.some(
            item =>
              item.file_id === meta.file_id &&
              item.targetSectionId === section.section_id,
          );
          if (already) return;

          const uploadMeta = getAiUploadMeta(meta.file_id);
          next = upsertPendingUpload(next, {
            file_id: meta.file_id,
            mime_type: meta.mime_type || 'application/pdf',
            file_name: uploadMeta?.file_name,
            uploaded_at: uploadMeta?.uploaded_at,
            targetSectionId: section.section_id,
            targetSectionKey: section.section_key,
            targetSubsection: section.subsection,
            uploadScope: 'full',
            documentSummary: section.data_summary,
            extractedFields: section.extracted_fields,
            navigateIntent: null,
            uploadedFromSectionId: meta.currentSectionId,
            highlightUpload: false,
            createdAt: Date.now(),
          });
        });

        next = pruneAndPromotePending(next, nextFilled);
        writePendingUploadsToStorage(next);
        return next;
      });
    },
    [
      clearAllPendingForFile,
      filledSectionsByFile,
      persistFilledSections,
      pruneAndPromotePending,
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
      const isOpen = (item: (typeof pendingUploads)[number]) =>
        item.targetSectionId === sectionId &&
        item.highlightUpload &&
        !isAiAutofillDoneForSection(sectionId, item.file_id);

      const match =
        pendingUploads.find(
          item => item.uploadScope === scope && isOpen(item),
        ) ||
        pendingUploads.find(
          item => item.uploadScope === 'full' && isOpen(item),
        );

      return match ? pendingUploadToAiFile(match) : null;
    },
    [pendingUploads],
  );

  const shouldHighlightUpload = useCallback(
    (sectionId: string, scope = 'full') => {
      const isOpenPending = (item: (typeof pendingUploads)[number]) =>
        item.targetSectionId === sectionId &&
        item.highlightUpload &&
        item.navigateIntent !== 'review' &&
        !isAiAutofillDoneForSection(sectionId, item.file_id);

      return (
        pendingUploads.some(
          item => item.uploadScope === scope && isOpenPending(item),
        ) ||
        pendingUploads.some(
          item => item.uploadScope === 'full' && isOpenPending(item),
        )
      );
    },
    [pendingUploads],
  );

  const shouldShowOverviewPin = useCallback(
    (sectionId: string) => {
      if (!sectionId) return false;
      if (isAiAutofillDoneForSection(sectionId)) return true;
      return pendingUploads.some(
        item =>
          item.targetSectionId === sectionId &&
          (item.navigateIntent === 'review' ||
            item.uploadedFromSectionId === 'dashboard'),
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
    // Popup disabled — discard any deferred additional-section prompt.
    deferredAdditionalRef.current = null;
    setAdditionalSections([]);
    setAdditionalContext(null);
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
      batchSilentMode,
      setBatchSilentMode,
      queueRoutedSectionsSilently,
      navigateToPendingSection,
      getPendingUploadsForSection,
      getPendingFileForSection,
      shouldHighlightUpload,
      shouldShowOverviewPin,
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
      batchSilentMode,
      queueRoutedSectionsSilently,
      navigateToPendingSection,
      getPendingUploadsForSection,
      getPendingFileForSection,
      shouldHighlightUpload,
      shouldShowOverviewPin,
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
        open={Boolean(mismatchDetail) && !batchSilentMode}
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
