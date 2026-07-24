'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
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
import { AiUploadedAttachmentList } from '@/components/ai/AiUploadedAttachmentList';
import { AiUploadHistoryPopup } from '@/components/ai/AiUploadHistoryPopup';
import { AI_PENDING_ROUTED_HINT } from '@/utils/aiRoutingUi';
import { AI_MOBILE_ACTION_BUTTON } from '@/utils/aiMobileUi';
import {
  clearAiAutofillDoneForSection,
  getAiAutofillDoneForSection,
  isAiAutofillDoneForSection,
} from '@/utils/aiAutofillDoneSections';
import { useAiActiveSectionId } from '@/contexts/AiActiveSectionContext';
import { upsertAiUploadHistory } from '@/utils/aiUploadHistory';
import { getAiSectionLabel } from '@/utils/aiSectionRegistry';

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
  /** Force "Auto fill done" (overview already filled this section). */
  autofillDone?: boolean;
  onUpload: (file: File) => void | Promise<void>;
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
  autofillDone: autofillDoneProp,
  onUpload,
  onAutofill,
}: SectionAiDocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [doneTick, setDoneTick] = useState(0);
  const activeSectionId = useAiActiveSectionId();
  const resolvedSectionId = sectionId || activeSectionId || undefined;
  const resolvedMimeType = uploadedFile?.mime_type || uploadedMimeType;
  const hasUploadedFile = Boolean(resolvedMimeType || uploadedFile?.file_id);
  const isBusy = disabled || isUploading || isReading;

  const doneRecord = resolvedSectionId
    ? getAiAutofillDoneForSection(resolvedSectionId)
    : null;
  const autofillDone =
    autofillDoneProp ??
    (resolvedSectionId ? isAiAutofillDoneForSection(resolvedSectionId) : false);

  useEffect(() => {
    const onDone = () => setDoneTick(value => value + 1);
    window.addEventListener('orderly-ai-autofill-done', onDone);
    return () => window.removeEventListener('orderly-ai-autofill-done', onDone);
  }, []);

  // Keep lint happy — doneTick forces re-read of session map.
  void doneTick;

  const processFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file || isBusy) return;
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
        sectionId: resolvedSectionId,
        sectionIds: resolvedSectionId ? [String(resolvedSectionId)] : undefined,
        source: 'section',
        targetSectionLabel: resolvedSectionId
          ? getAiSectionLabel(resolvedSectionId)
          : undefined,
      });

      try {
        await onUpload(file);
        upsertAiUploadHistory({
          id: historyId,
          fileName: file.name,
          status: 'done',
          progress: 100,
          createdAt: now,
          updatedAt: new Date().toISOString(),
          sectionId: resolvedSectionId,
          sectionIds: resolvedSectionId ? [String(resolvedSectionId)] : undefined,
          source: 'section',
          targetSectionLabel: resolvedSectionId
            ? getAiSectionLabel(resolvedSectionId)
            : undefined,
        });
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
          error: error?.message || 'Upload failed',
          targetSectionLabel: resolvedSectionId
            ? getAiSectionLabel(resolvedSectionId)
            : undefined,
        });
        throw error;
      }
    },
    [isBusy, onUpload, resolvedSectionId],
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

    const file = event.dataTransfer.files?.[0] ?? null;
    void processFile(file);
  };

  const openFilePicker = () => {
    if (!isBusy) inputRef.current?.click();
  };

  return (
    <div
      data-ai-upload-zone={highlightUpload && !autofillDone ? 'highlight' : undefined}
      data-ai-autofill-done={autofillDone ? 'true' : undefined}
      className={cn(
        'relative rounded-2xl border border-dashed',
        'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-indigo-50/50',
        'overflow-visible p-3 pb-16 shadow-sm transition-all duration-200 sm:p-4 sm:pb-16',
        'hover:border-indigo-300 hover:shadow-md',
        compact ? 'space-y-2.5' : 'space-y-3',
        highlightUpload &&
          !autofillDone &&
          'border-indigo-400 bg-indigo-50/40 ring-2 ring-indigo-300 ring-offset-2 animate-pulse',
        autofillDone && 'border-emerald-300 bg-emerald-50/40',
        tone?.wrapper,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-100/70 blur-2xl',
          tone?.glowOne,
        )}
      />
      <div
        className={cn(
          'pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-blue-100/70 blur-2xl',
          tone?.glowTwo,
        )}
      />

      <div className="relative space-y-3">
        {autofillDone && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-snug text-emerald-900">
            <p className="font-semibold">Auto fill done</p>
            <p className="mt-0.5 text-xs text-emerald-800/90">
              This section was already filled from your uploaded document
              {doneRecord?.fileName ? ` (${doneRecord.fileName})` : ''}. Do not
              run Auto-fill again for that file — upload a new document only if
              you want to update fields.
            </p>
          </div>
        )}

        {highlightUpload && !autofillDone && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm leading-snug text-indigo-800">
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
              ? 'border-emerald-200 bg-emerald-50/50'
              : 'border-slate-200 bg-white/90 hover:border-indigo-300 hover:bg-indigo-50/40',
            isDragging && 'border-indigo-400 bg-indigo-50/80 ring-2 ring-indigo-200',
            isBusy && 'pointer-events-none opacity-60',
            tone?.uploadBox,
          )}
        >
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept={AI_DOCUMENT_ACCEPT}
            disabled={isBusy}
            onChange={event => {
              const file = event.currentTarget.files?.[0] ?? null;
              void processFile(file);
              event.currentTarget.value = '';
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
                className={cn('h-5 w-5 animate-spin text-indigo-600', tone?.icon)}
              />
            ) : hasUploadedFile || autofillDone ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <UploadCloud
                className={cn('h-5 w-5 text-indigo-600', tone?.icon)}
              />
            )}
          </div>

          <div className="min-w-0 flex-1 text-left sm:flex-none sm:text-center">
            {autofillDone && !hasUploadedFile ? (
              <>
                <p className="text-[15px] font-semibold text-emerald-800">
                  Auto fill done
                </p>
                <p className="text-xs text-slate-500">
                  Tap to upload a new document if you need updates
                </p>
              </>
            ) : hasUploadedFile ? (
              <>
                <p className="text-[15px] font-semibold text-emerald-800">
                  {getReadableAiDocumentType(resolvedMimeType)} ready
                </p>
                <p className="text-xs text-slate-500">
                  {isReading
                    ? 'Reading document…'
                    : autofillDone
                      ? 'Already filled — upload a new file to replace'
                      : 'Tap to replace document'}
                </p>
              </>
            ) : (
              <>
                <p className="text-[15px] font-semibold text-slate-900 sm:text-sm">
                  <span className="sm:hidden">Tap to choose document</span>
                  <span className="hidden sm:inline">
                    {uploadLabel || 'Drop document here'}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  PDF, TXT, PNG, JPG, JPEG, WEBP · Max 15MB
                </p>
              </>
            )}
          </div>
        </div>

        {hasUploadedFile && !autofillDone && (
          <Button
            type="button"
            size="sm"
            data-ai-autofill-trigger
            onClick={() => void onAutofill()}
            disabled={isBusy}
            className={cn(AI_MOBILE_ACTION_BUTTON, 'bg-indigo-600 hover:bg-indigo-700')}
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
              'bg-emerald-600 text-white opacity-100',
            )}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Auto fill done
          </Button>
        )}

        {isUploading && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading document…
          </div>
        )}

        {!isUploading && isReading && !hasUploadedFile && (
          <div className="flex items-center gap-2 text-xs text-indigo-600">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Running AI autofill…
          </div>
        )}

        <AiUploadedAttachmentList file={uploadedFile} />

        <AiUploadSupportedSectionsHint />
      </div>

      <AiUploadHistoryPopup
        absolute
        sectionId={resolvedSectionId || null}
        variant="inline"
      />
    </div>
  );
}
