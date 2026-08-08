'use client';

import React from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '@common/ui/utils';
import { AiUploadSupportedSectionsHint } from '@/components/ai/AiUploadSupportedSectionsHint';
import { AiUploadHistoryPopup } from '@/components/ai/AiUploadHistoryPopup';
import { useAiDocumentDropZone } from '@/hooks/useAiDocumentDropZone';
import { AI_DOCUMENT_ACCEPT } from '@/utils/aiDocumentUploadUi';

type AiDocumentDropZoneInputProps = {
  onFile: (file: File) => void;
  disabled?: boolean;
  className?: string;
  iconClassName?: string;
  uploadTitle?: string;
  uploadSubtitle?: string;
  showSupportedHint?: boolean;
  /** When set, shows attachments chip for this section. */
  sectionId?: string | null;
  children?: React.ReactNode;
};

export function AiDocumentDropZoneInput({
  onFile,
  disabled = false,
  className,
  iconClassName,
  uploadTitle = 'Upload document',
  uploadSubtitle = 'PDF, images · max 15MB',
  showSupportedHint = false,
  sectionId = null,
  children,
}: AiDocumentDropZoneInputProps) {
  const { isDragging, processFile, dropZoneProps } = useAiDocumentDropZone(
    onFile,
    disabled,
  );

  const dropZone = (
    <label
      {...dropZoneProps}
      className={cn(
        // Callers may still pass legacy flex-col / py-3.5; layout utilities below win.
        className,
        'group flex min-w-0 flex-1 cursor-pointer flex-row items-center justify-start gap-2.5 rounded-lg border border-dashed px-2.5 py-2 text-left transition touch-manipulation active:scale-[0.99]',
        'border-slate-200 bg-white/80 hover:border-indigo-300 hover:bg-indigo-50/50',
        isDragging && 'border-indigo-400 bg-indigo-50/80 ring-2 ring-indigo-200',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <input
        type="file"
        className="sr-only"
        accept={AI_DOCUMENT_ACCEPT}
        disabled={disabled}
        onChange={event => {
          const file = event.currentTarget.files?.[0] ?? null;
          processFile(file);
          event.currentTarget.value = '';
        }}
      />

      {children ?? (
        <>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 ring-1 ring-indigo-100">
            <UploadCloud
              className={cn('h-4 w-4 shrink-0 text-indigo-600', iconClassName)}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-slate-900">
              <span className="sm:hidden">Tap to choose document</span>
              <span className="hidden sm:inline">{uploadTitle}</span>
            </p>
            <p className="truncate text-[11px] leading-snug text-slate-500">
              {uploadSubtitle}
            </p>
          </div>
        </>
      )}
    </label>
  );

  const withAttachments =
    sectionId != null && String(sectionId).trim() !== '' ? (
      <div className="flex flex-wrap items-center gap-2">
        {dropZone}
        <AiUploadHistoryPopup
          absolute={false}
          dense
          sectionId={String(sectionId)}
          variant="inline"
          className="shrink-0"
        />
      </div>
    ) : (
      dropZone
    );

  if (!showSupportedHint) {
    return withAttachments;
  }

  return (
    <div className="space-y-1">
      {withAttachments}
      <AiUploadSupportedSectionsHint compact className="!mt-0 opacity-80" />
    </div>
  );
}
