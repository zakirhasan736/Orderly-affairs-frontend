'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Pin,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import { cn } from '@common/ui/utils';
import {
  AI_DOCUMENT_ACCEPT,
  getReadableAiDocumentType,
  type UploadedAIFile,
} from '@/utils/aiDocumentUploadUi';
import { AiUploadSupportedSectionsHint } from '@/components/ai/AiUploadSupportedSectionsHint';
import { AiUploadHistoryPopup } from '@/components/ai/AiUploadHistoryPopup';
import { AI_PENDING_ROUTED_HINT } from '@/utils/aiRoutingUi';
import { AI_MOBILE_ACTION_BUTTON } from '@/utils/aiMobileUi';
import {
  clearAiAutofillDoneForSection,
  getAiAutofillDoneForSection,
  isAiAutofillDoneForSection,
} from '@/utils/aiAutofillDoneSections';
import { toAiUserFacingMessage } from '@/utils/aiUserFacingError';
import { useAiActiveSectionId, useAiActiveSubsectionId } from '@/contexts/AiActiveSectionContext';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import { useFamilyAcl } from '@/contexts/FamilyAclContext';
import {
  hydrateAiUploadHistoryFromServer,
  listAiUploadHistory,
  removeReplacedAiUploadFileIds,
  upsertAiUploadHistory,
} from '@/utils/aiUploadHistory';
import { listOwnerAiDocuments } from '@/services/aiDocumentUpload';
import { getAiSectionLabel } from '@/utils/aiSectionRegistry';
import { SectionLastUpdatedPin } from '@/components/vault/SectionLastUpdatedPin';

export type SectionAiUploaderTone = {
  wrapper?: string;
  glowOne?: string;
  glowTwo?: string;
  icon?: string;
  uploadBox?: string;
};

type SectionAiDocumentUploaderProps = {
  title: string;
  description: string;
  buttonLabel?: string;
  uploadLabel?: string;
  compact?: boolean;
  disabled?: boolean;
  isUploading?: boolean;
  isReading?: boolean;
  /** @deprecated Prefer uploadedFile */
  uploadedMimeType?: string;
  uploadedFile?: UploadedAIFile | null;
  highlightUpload?: boolean;
  pendingHint?: string;
  tone?: SectionAiUploaderTone;
  /** Vault section id — enables autofill-done state + shared history popup. */
  sectionId?: string;
  /** Subsection id for footprint pin (e.g. 5A). */
  subsectionId?: string;
  /** Force "Auto fill done" (overview already filled this section). */
  autofillDone?: boolean;
  /** Force overview pin even if session flag not set yet. */
  showOverviewPin?: boolean;
  onUpload: (
    file: File,
  ) => void | Promise<void | UploadedAIFile | { file_id?: string }>;
  onAutofill: () => void | Promise<void>;
};

export function SectionAiDocumentUploader({
  title,
  description,
  buttonLabel = 'Auto-fill',
  uploadLabel = 'Drag and drop or click to upload',
  compact = false,
  disabled = false,
  isUploading = false,
  isReading = false,
  uploadedMimeType,
  uploadedFile = null,
  highlightUpload = false,
  pendingHint,
  tone,
  sectionId,
  subsectionId,
  autofillDone: autofillDoneProp,
  showOverviewPin: showOverviewPinProp,
  onUpload,
  onAutofill,
}: SectionAiDocumentUploaderProps) {
  const familyAcl = useFamilyAcl();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [doneTick, setDoneTick] = useState(0);
  const activeSectionId = useAiActiveSectionId();
  const activeSubsectionId = useAiActiveSubsectionId();
  const aiRouting = useOptionalAiDocumentRouting();
  const resolvedSectionId = sectionId || activeSectionId || undefined;
  const resolvedSubsectionId = subsectionId || activeSubsectionId || undefined;
  const resolvedMimeType = uploadedFile?.mime_type || uploadedMimeType;
  const hasUploadedFile = Boolean(resolvedMimeType || uploadedFile?.file_id);
  const allowSectionUpload =
    !resolvedSectionId ||
    familyAcl.canUseSectionUploads(resolvedSectionId);
  const allowAutofill = familyAcl.canWrite;
  const isBusy = disabled || !allowSectionUpload || isUploading || isReading;

  const doneRecord = resolvedSectionId
    ? getAiAutofillDoneForSection(resolvedSectionId)
    : null;
  const autofillDone =
    autofillDoneProp ??
    (resolvedSectionId ? isAiAutofillDoneForSection(resolvedSectionId) : false);

  const overviewPin = useMemo(() => {
    if (showOverviewPinProp) return true;
    if (autofillDone) return true;
    if (
      resolvedSectionId &&
      aiRouting?.shouldShowOverviewPin?.(resolvedSectionId)
    ) {
      return true;
    }
    if (!resolvedSectionId) return false;
    return listAiUploadHistory({ sectionId: resolvedSectionId }).some(
      item => item.source === 'overview' && item.status === 'done',
    );
  }, [showOverviewPinProp, autofillDone, resolvedSectionId, aiRouting, doneTick]);

  // Overview-linked: pin only — do not pulse as "ready to read again".
  const activeHighlight = highlightUpload && !autofillDone && !overviewPin;

  useEffect(() => {
    const onDone = () => setDoneTick(value => value + 1);
    window.addEventListener('orderly-ai-autofill-done', onDone);
    window.addEventListener('orderly-ai-upload-history', onDone);
    return () => {
      window.removeEventListener('orderly-ai-autofill-done', onDone);
      window.removeEventListener('orderly-ai-upload-history', onDone);
    };
  }, []);

  const processFile = useCallback(
    async (
      file: File | null | undefined,
      options?: { ignoreBusy?: boolean },
    ) => {
      if (!file) return;
      if (!options?.ignoreBusy && isBusy) return;
      // Clear only so a new document can fill again; other docs already in the
      // vault stay — apply/upsert merges by identity (VIN/policy/etc.).
      if (resolvedSectionId) clearAiAutofillDoneForSection(resolvedSectionId);

      const historyId = `section-${resolvedSectionId || 'local'}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`;
      const now = new Date().toISOString();
      upsertAiUploadHistory({
        id: historyId,
        fileName: file.name,
        status: 'uploading',
        progress: 12,
        createdAt: now,
        updatedAt: now,
        mimeType: file.type || undefined,
        sectionId: resolvedSectionId,
        sectionIds: resolvedSectionId ? [String(resolvedSectionId)] : undefined,
        source: 'section',
        targetSectionLabel: resolvedSectionId
          ? getAiSectionLabel(resolvedSectionId)
          : undefined,
      });

      try {
        const result = await onUpload(file);
        const fileId =
          result && typeof result === 'object'
            ? String(
                ('file_id' in result && result.file_id) ||
                  ('fileId' in result && (result as { fileId?: string }).fileId) ||
                  '',
              ) || undefined
            : undefined;
        const mimeType =
          result && typeof result === 'object' && 'mime_type' in result
            ? String((result as { mime_type?: string }).mime_type || '') ||
              file.type ||
              undefined
            : file.type || undefined;
        const replacedIds =
          result &&
          typeof result === 'object' &&
          Array.isArray((result as { replaced_file_ids?: string[] }).replaced_file_ids)
            ? ((result as { replaced_file_ids?: string[] }).replaced_file_ids || []).map(
                String,
              )
            : [];
        if (replacedIds.length) {
          removeReplacedAiUploadFileIds(replacedIds);
        }
        upsertAiUploadHistory({
          id: historyId,
          fileName: file.name,
          status: 'done',
          progress: 100,
          createdAt: now,
          updatedAt: new Date().toISOString(),
          fileId,
          mimeType,
          sectionId: resolvedSectionId,
          sectionIds: resolvedSectionId ? [String(resolvedSectionId)] : undefined,
          source: 'section',
          targetSectionLabel: resolvedSectionId
            ? getAiSectionLabel(resolvedSectionId)
            : undefined,
        });
        try {
          const docs = await listOwnerAiDocuments();
          hydrateAiUploadHistoryFromServer(docs);
        } catch {
          // memory upsert above is enough for this session
        }
      } catch (error: any) {
        upsertAiUploadHistory({
          id: historyId,
          fileName: file.name,
          status: 'error',
          progress: 100,
          createdAt: now,
          updatedAt: new Date().toISOString(),
          sectionId: resolvedSectionId,
          sectionIds: resolvedSectionId ? [String(resolvedSectionId)] : undefined,
          source: 'section',
          error: toAiUserFacingMessage(error?.message || 'Upload failed'),
          targetSectionLabel: resolvedSectionId
            ? getAiSectionLabel(resolvedSectionId)
            : undefined,
        });
        throw error;
      }
    },
    [isBusy, onUpload, resolvedSectionId],
  );

  const processFiles = useCallback(
    async (files: File[]) => {
      const list = files.filter(Boolean);
      if (!list.length) return;
      for (const file of list) {
        try {
          await processFile(file, { ignoreBusy: true });
        } catch {
          // Continue remaining documents — one failure shouldn't stop the batch.
        }
      }
    },
    [processFile],
  );

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isBusy) setIsDragging(true);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isBusy) setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (isBusy) return;

    const files = Array.from(event.dataTransfer.files || []);
    void processFiles(files);
  };

  const openFilePicker = () => {
    if (!isBusy) inputRef.current?.click();
  };

  return (
    <div
      data-ai-upload-zone={
        activeHighlight ? 'highlight' : overviewPin ? 'pinned' : undefined
      }
      data-ai-autofill-done={autofillDone ? 'true' : undefined}
      className={cn(
        'relative rounded-2xl border border-dashed',
        'border-[#7688a1] bg-[#e7eef7]/40',
        'overflow-visible p-3 pb-16 shadow-sm transition-all duration-200 sm:p-4 sm:pb-16',
        'hover:border-[#2B5A8C] hover:shadow-md',
        compact ? 'space-y-2.5' : 'space-y-3',
        activeHighlight &&
          'border-[#2B5A8C] bg-[#e7eef7] ring-2 ring-[#2B5A8C]/30 ring-offset-2 animate-pulse',
        overviewPin &&
          'border-[#2B5A8C]/50 bg-[#e7eef7]/70 ring-1 ring-[#2B5A8C]/20',
        autofillDone && 'border-[#2c7a63] bg-[#e7f2ee]',
        tone?.wrapper,
      )}
    >
      {overviewPin ? (
        <div
          className="absolute -right-2 -top-2 z-10 flex items-center gap-1 rounded-full border border-[#2B5A8C]/30 bg-white px-2 py-1 text-[11px] font-semibold text-[#2B5A8C] shadow-sm"
          title="Document was read on Overview and pinned to this section"
        >
          <Pin className="h-3.5 w-3.5 fill-[#2B5A8C]/20" />
          Overview
        </div>
      ) : null}
      <div
        className={cn(
          'pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#e7eef7] blur-2xl',
          tone?.glowOne,
        )}
      />
      <div
        className={cn(
          'pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-[#e7eef7]/80 blur-2xl',
          tone?.glowTwo,
        )}
      />

      <div className="relative space-y-3">
        {resolvedSectionId ? (
          <SectionLastUpdatedPin
            sectionId={resolvedSectionId}
            subsectionId={resolvedSubsectionId}
            label="Last update here"
            compact
          />
        ) : null}
        {autofillDone && (
          <div className="rounded-xl border border-[#2c7a63]/30 bg-[#e7f2ee] px-3 py-2 text-sm leading-snug text-[#213D59]">
            <p className="font-semibold text-[#2c7a63]">Pinned from Overview</p>
            <p className="mt-0.5 text-xs text-[#33506e]">
              This section was filled from your overview upload
              {doneRecord?.fileName ? ` (${doneRecord.fileName})` : ''}. The
              document was only read there — upload a new file here only if you
              want to update fields.
            </p>
          </div>
        )}

        {overviewPin && !autofillDone && (
          <div className="rounded-xl border border-[#2B5A8C]/30 bg-[#e7eef7] px-3 py-2 text-sm leading-snug text-[#213D59]">
            <p className="font-semibold text-[#2B5A8C]">Linked from Overview</p>
            <p className="mt-0.5 text-xs text-[#33506e]">
              {pendingHint || AI_PENDING_ROUTED_HINT}
            </p>
          </div>
        )}

        {activeHighlight && !overviewPin && (
          <div className="rounded-xl border border-[#2B5A8C]/30 bg-[#e7eef7] px-3 py-2 text-sm leading-snug text-[#213D59]">
            {pendingHint || AI_PENDING_ROUTED_HINT}
          </div>
        )}

        {!compact && (
          <div className="space-y-0.5">
            <p className="text-[15px] font-semibold leading-snug text-slate-900 sm:text-base">
              {title}
            </p>
            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              {description}
            </p>
          </div>
        )}

        {!allowSectionUpload ? (
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
            Document upload is not available for your family role. You can still
            open documents already uploaded for this section.
          </div>
        ) : (
        <div
          role="button"
          tabIndex={isBusy ? -1 : 0}
          onClick={openFilePicker}
          onKeyDown={event => {
            if (isBusy) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openFilePicker();
            }
          }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'group flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed p-3 transition touch-manipulation active:scale-[0.99]',
            'sm:flex-col sm:items-center sm:gap-2 sm:p-5 sm:text-center',
            hasUploadedFile || autofillDone
              ? 'border-[#2c7a63]/40 bg-[#e7f2ee]/60'
              : 'border-[#7688a1] bg-white hover:border-[#2B5A8C] hover:bg-[#e7eef7]/50',
            isDragging && 'border-[#2B5A8C] bg-[#e7eef7] ring-2 ring-[#2B5A8C]/25',
            isBusy && 'pointer-events-none opacity-60',
            tone?.uploadBox,
          )}
        >
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept={AI_DOCUMENT_ACCEPT}
            multiple
            disabled={isBusy}
            onChange={event => {
              const files = Array.from(event.currentTarget.files || []);
              event.currentTarget.value = '';
              void processFiles(files);
            }}
          />

          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200',
              'sm:h-12 sm:w-12 sm:rounded-2xl',
            )}
          >
            {isUploading ? (
              <Loader2
                className={cn('h-5 w-5 animate-spin text-[#2B5A8C]', tone?.icon)}
              />
            ) : hasUploadedFile || autofillDone ? (
              <CheckCircle2 className="h-5 w-5 text-[#2c7a63]" />
            ) : (
              <UploadCloud
                className={cn('h-5 w-5 text-[#2B5A8C]', tone?.icon)}
              />
            )}
          </div>

          <div className="min-w-0 flex-1 text-left sm:flex-none sm:text-center">
            {autofillDone && !hasUploadedFile ? (
              <>
                <p className="text-[15px] font-semibold text-[#2c7a63]">
                  Pinned from Overview
                </p>
                <p className="text-xs text-[#5a6b80]">
                  Already filled — tap only to upload a new document
                </p>
              </>
            ) : overviewPin && !hasUploadedFile ? (
              <>
                <p className="text-[15px] font-semibold text-[#2B5A8C]">
                  Linked from Overview
                </p>
                <p className="text-xs text-[#5a6b80]">
                  Document was read on Overview — no re-read here
                </p>
              </>
            ) : hasUploadedFile ? (
              <>
                <p className="text-[15px] font-semibold text-[#2c7a63]">
                  {getReadableAiDocumentType(resolvedMimeType)} ready
                </p>
                <p className="text-xs text-[#5a6b80]">
                  {isReading
                    ? 'Reading document…'
                    : autofillDone
                      ? 'Already filled — upload a new file to replace'
                      : 'Tap to replace document'}
                </p>
              </>
            ) : (
              <>
                <p className="text-[15px] font-semibold text-[#213D59] sm:text-sm">
                  <span className="sm:hidden">Tap to choose document</span>
                  <span className="hidden sm:inline">
                    {uploadLabel || 'Drop document here'}
                  </span>
                </p>
                <p className="text-xs text-[#5a6b80]">
                  PDF, TXT, PNG, JPG, JPEG, WEBP · Max 15MB · Multiple OK
                </p>
              </>
            )}
          </div>
        </div>
        )}

        {allowSectionUpload && hasUploadedFile && !autofillDone && !overviewPin && allowAutofill && (
          <Button
            type="button"
            size="sm"
            data-ai-autofill-trigger
            onClick={() => void onAutofill()}
            disabled={isBusy}
            className={cn(AI_MOBILE_ACTION_BUTTON, 'bg-[#2B5A8C] hover:bg-[#3d6f9e]')}
          >
            {isReading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isReading ? 'Reading…' : buttonLabel}
          </Button>
        )}

        {autofillDone && (
          <Button
            type="button"
            size="sm"
            disabled
            className={cn(
              AI_MOBILE_ACTION_BUTTON,
              'bg-[#2c7a63] text-white opacity-100',
            )}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Auto fill done
          </Button>
        )}

        {autofillDone && (
          <p className="w-full text-[11px] leading-snug text-[#5a6b80]">
            Next: scroll the form for remaining blanks, or tap{' '}
            <span className="font-semibold text-[#213D59]">Fill empty fields</span>{' '}
            at the top of this section.
          </p>
        )}

        {isUploading && (
          <div className="flex items-center gap-2 text-xs text-[#5a6b80]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading document…
          </div>
        )}

        {!isUploading && isReading && !hasUploadedFile && (
          <div className="flex items-center gap-2 text-xs text-[#2B5A8C]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Running AI autofill…
          </div>
        )}

        {allowSectionUpload && <AiUploadSupportedSectionsHint />}
      </div>

      <AiUploadHistoryPopup
        absolute
        sectionId={resolvedSectionId || null}
        variant="inline"
      />
    </div>
  );
}
