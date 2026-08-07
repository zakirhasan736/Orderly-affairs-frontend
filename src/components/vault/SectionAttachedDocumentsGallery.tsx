'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Eye, Paperclip } from 'lucide-react';
import { cn } from '@common/ui/utils';
import {
  listAiUploadHistory,
  type AiUploadHistoryItem,
} from '@/utils/aiUploadHistory';
import { AiUploadHistoryThumb } from '@/components/ai/AiUploadHistoryThumb';
import { AiDocumentPreviewDialog } from '@/components/ai/AiDocumentPreviewDialog';
import { VaultFieldUploadThumb } from '@/components/vault/VaultFieldUploadThumb';
import { getSignedUploadUrl } from '@/libs/api/upload';
import { toast } from 'sonner';
import {
  collectSectionFieldUploads,
  type SectionFieldUploadRef,
} from '@/utils/sectionFieldUploads';

type SectionAttachedDocumentsGalleryProps = {
  sectionId?: string | null;
  /** Section form bucket (e.g. formData['21']) for field-level uploads. */
  sectionData?: Record<string, unknown> | null;
  className?: string;
  /** Re-render tick when AI history changes. */
  refreshKey?: number | string;
};

/**
 * Visible thumbnail strip for AI + field attachments on a section.
 * Complements the corner attachments chip with always-on previews.
 */
export function SectionAttachedDocumentsGallery({
  sectionId,
  sectionData,
  className,
  refreshKey = 0,
}: SectionAttachedDocumentsGalleryProps) {
  const [preview, setPreview] = useState<{
    kind: 'ai' | 'field';
    fileId?: string;
    publicId?: string;
    fileName: string;
    mimeType?: string;
  } | null>(null);

  const aiItems = useMemo(() => {
    if (!sectionId) return [] as AiUploadHistoryItem[];
    void refreshKey;
    return listAiUploadHistory({ sectionId }).filter(
      item => Boolean(item.fileId) && item.status !== 'failed',
    );
  }, [sectionId, refreshKey]);

  const fieldItems = useMemo(
    () => collectSectionFieldUploads(sectionData, sectionId),
    [sectionData, sectionId],
  );

  const total = aiItems.length + fieldItems.length;

  const openAi = useCallback((item: AiUploadHistoryItem) => {
    if (!item.fileId) {
      toast.error('Preview is not available for this upload yet.');
      return;
    }
    setPreview({
      kind: 'ai',
      fileId: item.fileId,
      fileName: item.fileName || 'Document',
      mimeType: item.mimeType,
    });
  }, []);

  const openField = useCallback(async (item: SectionFieldUploadRef) => {
    if (!item.publicId) {
      toast.error('This file needs re-upload for secure viewing.');
      return;
    }
    try {
      const signed = await getSignedUploadUrl(item.publicId);
      if (signed.url) {
        window.open(signed.url, '_blank', 'noopener,noreferrer');
        return;
      }
    } catch {
      /* ignore */
    }
    toast.error('Could not open secure file link. Try again.');
  }, []);

  if (total === 0) return null;

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#213D59]/15 bg-gradient-to-br from-[#f4f7fb] to-white p-3 sm:p-4',
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#213D59] text-white">
          <Paperclip className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#213D59]">
            Documents in this section
          </p>
          <p className="text-[11px] text-slate-500">
            {total} file{total === 1 ? '' : 's'} attached — tap a preview to open
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
        {fieldItems.map(item => (
          <button
            key={`field-${item.fieldKey}-${item.publicId || item.fileName}`}
            type="button"
            data-oa-view-ok
            onClick={() => void openField(item)}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-[#213D59]/35 hover:shadow-md"
          >
            <VaultFieldUploadThumb
              publicId={item.publicId}
              fileName={item.fileName}
              mimeType={item.mimeType}
              className="rounded-none border-0 ring-0"
            />
            <div className="space-y-0.5 px-2 py-1.5">
              <p className="truncate text-[10px] font-medium uppercase tracking-wide text-[#2B5A8C]">
                {item.fieldLabel}
              </p>
              <p className="truncate text-xs font-semibold text-slate-800">
                {item.fileName}
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#213D59]">
                <Eye className="h-3 w-3" />
                View
              </span>
            </div>
          </button>
        ))}

        {aiItems.map(item => (
          <button
            key={`ai-${item.id}`}
            type="button"
            data-oa-view-ok
            onClick={() => openAi(item)}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-[#213D59]/35 hover:shadow-md"
          >
            <AiUploadHistoryThumb
              fileId={item.fileId}
              fileName={item.fileName}
              mimeType={item.mimeType}
              className="rounded-none ring-0"
            />
            <div className="space-y-0.5 px-2 py-1.5">
              <p className="truncate text-[10px] font-medium uppercase tracking-wide text-[#2B5A8C]">
                {item.targetSectionLabel || 'AI upload'}
              </p>
              <p className="truncate text-xs font-semibold text-slate-800">
                {item.fileName || 'Document'}
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#213D59]">
                <Eye className="h-3 w-3" />
                View
              </span>
            </div>
          </button>
        ))}
      </div>

      <AiDocumentPreviewDialog
        open={Boolean(preview?.kind === 'ai')}
        onOpenChange={open => {
          if (!open) setPreview(null);
        }}
        fileId={preview?.fileId}
        fileName={preview?.fileName}
        mimeType={preview?.mimeType}
      />
    </div>
  );
}
