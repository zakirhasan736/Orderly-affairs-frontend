'use client';

import React, { useState } from 'react';
import { Eye, FileText, Paperclip } from 'lucide-react';
import { cn } from '@common/ui/utils';
import {
  formatAiUploadDate,
  getReadableAiDocumentType,
  type UploadedAIFile,
} from '@/utils/aiDocumentUploadUi';
import { AiDocumentPreviewDialog } from '@/components/ai/AiDocumentPreviewDialog';

type AiUploadedAttachmentListProps = {
  file?: UploadedAIFile | null;
  className?: string;
};

export function AiUploadedAttachmentList({
  file,
  className,
}: AiUploadedAttachmentListProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!file?.file_id) return null;

  const displayName =
    file.file_name?.trim() ||
    `${getReadableAiDocumentType(file.mime_type)} document`;
  const uploadedLabel = formatAiUploadDate(file.uploaded_at);

  return (
    <>
      <div
        className={cn(
          'rounded-lg border border-slate-200 bg-white/90 px-2 py-1.5 shadow-sm',
          className,
        )}
        data-ai-upload-attachment
      >
        <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-500">
          <Paperclip className="h-3 w-3" />
          Attached file
        </div>
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="flex w-full items-start gap-2.5 rounded-lg text-left transition hover:bg-slate-50"
          title="Click to view document"
        >
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 ring-1 ring-emerald-100">
            <FileText className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-medium text-slate-900"
              title={displayName}
            >
              {displayName}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {getReadableAiDocumentType(file.mime_type)}
              {uploadedLabel ? ` · Uploaded ${uploadedLabel}` : ''}
              <span className="ml-1.5 inline-flex items-center gap-0.5 font-medium text-[#2E7FAD]">
                <Eye className="h-3 w-3" />
                View
              </span>
            </p>
          </div>
        </button>
      </div>

      <AiDocumentPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        fileId={file.file_id}
        fileName={displayName}
        mimeType={file.mime_type}
      />
    </>
  );
}
