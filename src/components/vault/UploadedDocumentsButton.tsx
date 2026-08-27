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
  /** Header/toolbar: thumbnail + count only, no filename. */
  iconOnly?: boolean;
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
  iconOnly = false,
  hideWhenEmpty = false,
}: UploadedDocumentsButtonProps) {
  const { count, processingCount, previewItems, isLoading } =
    useUploadedDocuments(sectionId);

  if (hideWhenEmpty && !isLoading && count === 0) return null;

  const titleText =
    count === 0
      ? 'Documents'
      : count === 1
        ? iconOnly || dense
          ? '1 document'
          : previewItems[0]?.fileName || '1 document'
        : `${count > 99 ? '99+' : count} documents`;
  const subtitleText =
    isLoading && count === 0
      ? 'Loading documents…'
      : count === 0
        ? 'None uploaded yet'
        : processingCount > 0
          ? `${processingCount} processing · tap to open`
          : 'Tap to open & preview';
  const hoverTitle =
    count === 0
      ? 'No documents yet — upload a file first'
      : count === 1
        ? previewItems[0]?.fileName || 'Open uploaded document'
        : `Open uploaded documents (${count})`;

  return (
    <button
      type="button"
      data-oa-view-ok
      title={hoverTitle}
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
        iconOnly
          ? 'relative h-[38px] w-[38px] shrink-0 justify-center rounded-full border p-0'
          : dense
            ? 'max-w-[9.5rem] gap-1.5 rounded-lg border px-2 py-1'
            : 'max-w-[12.5rem] gap-2 rounded-2xl border px-2 py-1.5',
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
            iconOnly
              ? 'h-7 w-7'
              : dense
                ? 'h-7 w-8'
                : 'h-9 w-[2.75rem]',
          )}
        >
          {previewItems.slice(0, iconOnly ? 1 : 3).map((item, index) => (
            <span
              key={item.id}
              className={cn(
                'overflow-hidden border-2 border-white bg-slate-100 shadow-sm',
                iconOnly
                  ? 'h-7 w-7 rounded-full'
                  : dense
                    ? 'absolute top-0 h-7 w-7 rounded-md'
                    : 'absolute top-0 h-9 w-9 rounded-lg',
              )}
              style={
                iconOnly
                  ? undefined
                  : {
                      left: `${index * (dense ? 7 : 9)}px`,
                      zIndex: previewItems.length - index,
                    }
              }
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
            iconOnly
              ? 'h-7 w-7 rounded-full'
              : dense
                ? 'h-7 w-7 rounded-md'
                : 'h-9 w-9 rounded-xl',
          )}
        >
          <Files
            className={iconOnly || dense ? 'h-3.5 w-3.5' : 'h-4 w-4'}
            aria-hidden
          />
        </span>
      )}
      {iconOnly ? null : (
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
      )}
      {count > 0 ? (
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-full bg-[#213D59] font-bold text-white',
            iconOnly
              ? 'absolute -right-1 -top-1 h-4 min-w-4 px-0.5 text-[9px]'
              : dense
                ? 'ml-auto h-5 min-w-5 px-1 text-[10px]'
                : 'ml-auto h-6 min-w-6 px-1.5 text-[11px]',
          )}
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </button>
  );
}
