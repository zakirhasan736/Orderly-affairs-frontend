'use client';

import React from 'react';
import { Files } from 'lucide-react';
import { cn } from '@common/ui/utils';
import { AiUploadHistoryThumb } from '@/components/ai/AiUploadHistoryThumb';
import { openVaultUploadDrawer } from '@/components/vault-prototype/VaultUploadDrawer';
import { useUploadedDocuments } from '@/hooks/useUploadedDocuments';

type UploadedDocumentsButtonProps = {
  sectionId?: string | null;
  className?: string;
  /** Smaller chip for headers and dense bars. */
  dense?: boolean;
  /** Hide when there are no files yet. */
  hideWhenEmpty?: boolean;
};

/**
 * Stacked-thumbnail pill from the uploaded-history design.
 * Opens the right-hand upload drawer with preview / review.
 */
export function UploadedDocumentsButton({
  sectionId = null,
  className,
  dense = false,
  hideWhenEmpty = false,
}: UploadedDocumentsButtonProps) {
  const { count, processingCount, previewItems, isLoading } =
    useUploadedDocuments(sectionId);

  if (hideWhenEmpty && !isLoading && count === 0) return null;

  const titleText =
    count === 0
      ? 'Documents'
      : count === 1
        ? previewItems[0]?.fileName || '1 document'
        : `${count > 99 ? '99+' : count} documents`;
  const subtitleText =
    isLoading && count === 0
      ? 'Loading documents…'
      : count === 0
        ? 'None uploaded yet'
        : processingCount > 0
          ? `${processingCount} processing · tap to open`
          : 'Tap to open & preview';

  return (
    <button
      type="button"
      data-oa-view-ok
      title={
        count > 0
          ? 'Open uploaded documents'
          : 'No documents yet — upload a file first'
      }
      aria-label={
        count > 0
          ? `View uploaded documents, ${count} file${count === 1 ? '' : 's'}`
          : 'No documents uploaded yet'
      }
      onClick={event => {
        event.stopPropagation();
        openVaultUploadDrawer(sectionId || undefined);
      }}
      className={cn(
        'inline-flex items-center text-left shadow-md transition',
        dense
          ? 'max-w-[min(100%,14rem)] gap-1.5 rounded-lg border px-2 py-1'
          : 'max-w-[min(100%,18rem)] gap-2.5 rounded-2xl border px-2.5 py-2',
        count > 0
          ? 'border-[#213D59]/30 bg-white text-[#213D59] ring-1 ring-[#213D59]/10 hover:border-[#213D59]/50 hover:bg-[#f4f7fb]'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
        className,
      )}
    >
      {count > 0 ? (
        <span
          className={cn(
            'relative flex shrink-0 items-center',
            dense ? 'h-7 w-8' : 'h-10 w-[3.25rem]',
          )}
        >
          {previewItems.map((item, index) => (
            <span
              key={item.id}
              className={cn(
                'absolute top-0 overflow-hidden border-2 border-white bg-slate-100 shadow-sm',
                dense ? 'h-7 w-7 rounded-md' : 'h-10 w-10 rounded-lg',
              )}
              style={{
                left: `${index * (dense ? 7 : 10)}px`,
                zIndex: previewItems.length - index,
              }}
            >
              <AiUploadHistoryThumb
                fileId={item.fileId}
                fileName={item.fileName}
                mimeType={item.mimeType}
                className="h-full w-full rounded-none border-0"
              />
            </span>
          ))}
        </span>
      ) : (
        <span
          className={cn(
            'flex shrink-0 items-center justify-center bg-slate-100 text-[#213D59]',
            dense ? 'h-7 w-7 rounded-md' : 'h-10 w-10 rounded-xl',
          )}
        >
          <Files className={dense ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden />
        </span>
      )}
      <span className="min-w-0 pr-0.5">
        <span
          className={cn(
            'block truncate font-semibold leading-tight text-[#213D59]',
            dense ? 'text-[11px]' : 'text-[12px]',
          )}
        >
          {titleText}
        </span>
        {!dense ? (
          <span className="block truncate text-[10px] font-medium leading-tight text-slate-500">
            {subtitleText}
          </span>
        ) : null}
      </span>
      {count > 0 ? (
        <span
          className={cn(
            'ml-auto inline-flex shrink-0 items-center justify-center rounded-full bg-[#213D59] font-bold text-white',
            dense
              ? 'h-5 min-w-5 px-1 text-[10px]'
              : 'h-7 min-w-7 px-1.5 text-[11px]',
          )}
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </button>
  );
}
