'use client';

import React, { useRef, useState } from 'react';
import { cn } from '@common/ui/utils';
import { useOptionalDashboardAiBatch } from '@/contexts/DashboardAiBatchContext';
import { AI_DOCUMENT_ACCEPT } from '@/utils/aiDocumentUploadUi';

type SectionFileDropZoneProps = {
  sectionId: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Inner subsection shortcut: pick or drop a file to fill this section.
 * Does not open the history drawer.
 */
export function SectionFileDropZone({
  sectionId,
  disabled,
  className,
}: SectionFileDropZoneProps) {
  const batch = useOptionalDashboardAiBatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const enqueue = (list: FileList | File[] | null) => {
    if (disabled || !list || !list.length) return;
    batch?.enqueueFiles(list, { sectionId, source: 'section' });
  };

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  return (
    <div
      className={cn(
        'mt-3 flex flex-col items-stretch gap-2.5 rounded-[12px] border border-dashed bg-[#F6F8FA] px-3.5 py-3 transition sm:flex-row sm:flex-wrap sm:items-center',
        disabled
          ? 'border-[#E4EAF0] opacity-60'
          : dragging
            ? 'cursor-pointer border-[#3EB1E5] bg-[#EAF6FD]'
            : 'cursor-pointer border-[#E4EAF0] hover:border-[#619FCE]',
        className,
      )}
      onClick={openPicker}
      onDragEnter={event => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragOver={event => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={event => {
        event.preventDefault();
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setDragging(false);
      }}
      onDrop={event => {
        event.preventDefault();
        setDragging(false);
        enqueue(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={AI_DOCUMENT_ACCEPT}
        multiple
        disabled={disabled}
        onChange={event => {
          enqueue(event.currentTarget.files);
          event.currentTarget.value = '';
        }}
      />
      <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-[#7A8794]">
        Have a document that covers this? Upload it and these fields fill
        themselves.
      </p>
      <span className="hidden text-[12px] font-bold tracking-wide text-[#7A8794] sm:inline">
        OR
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={event => {
          event.stopPropagation();
          openPicker();
        }}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#E4EAF0] bg-white px-3.5 text-[13px] font-semibold text-[#213D59] hover:border-[#619FCE] disabled:opacity-50 sm:w-auto md:h-[34px] md:min-h-[34px]"
      >
        Upload a document
      </button>
    </div>
  );
}
