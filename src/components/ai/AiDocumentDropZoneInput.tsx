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
  /** When set, shows bottom-right Eye button for this section's attachments. */
  sectionId?: string | null;
  children?: React.ReactNode;
};

export function AiDocumentDropZoneInput({
  onFile,
  disabled = false,
  className,
  iconClassName,
  uploadTitle = 'Drop document here',
  uploadSubtitle = 'PDF, TXT, PNG, JPG, JPEG, WEBP · Max 15MB',
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
        className,
        'touch-manipulation active:scale-[0.99] transition-transform sm:active:scale-100',
        isDragging && 'border-indigo-400 bg-indigo-50/80 ring-2 ring-indigo-200',
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
        <div className="flex w-full items-center gap-3 text-left sm:flex-col sm:items-center sm:justify-center sm:gap-2 sm:text-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100 sm:h-12 sm:w-12 sm:rounded-2xl">
            <UploadCloud className={cn('h-5 w-5 shrink-0', iconClassName)} />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5 sm:flex-none">
            <p className="text-[15px] font-semibold text-slate-900 sm:text-sm">
              <span className="sm:hidden">Tap to choose document</span>
              <span className="hidden sm:inline">{uploadTitle}</span>
            </p>
            <p className="text-xs text-slate-500">{uploadSubtitle}</p>
          </div>
        </div>
      )}
    </label>
  );

  const withAttachments =
    sectionId != null && String(sectionId).trim() !== '' ? (
      <div className="relative pb-14">
        {dropZone}
        <AiUploadHistoryPopup
          absolute
          sectionId={String(sectionId)}
          variant="inline"
        />
      </div>
    ) : (
      dropZone
    );

  if (!showSupportedHint) {
    return withAttachments;
  }

  return (
    <div className="space-y-1.5">
      {withAttachments}
      <AiUploadSupportedSectionsHint compact />
    </div>
  );
}
