'use client';

import React from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { cn } from '@common/ui/utils';
import { AiPdfCanvas } from '@/components/ai/AiPdfCanvas';
import { useAiDocumentPreview } from '@/hooks/useAiDocumentPreview';

type AiReviewDocumentPaneProps = {
  fileId?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  active?: boolean;
  className?: string;
};

/** Live preview of the uploaded image / PDF next to Review & fill fields. */
export function AiReviewDocumentPane({
  fileId,
  fileName,
  mimeType,
  active = true,
  className,
}: AiReviewDocumentPaneProps) {
  const { loading, error, objectUrl, pdfBytes, textContent, kind } =
    useAiDocumentPreview(fileId, fileName, mimeType, active);

  return (
    <div
      className={cn(
        'flex min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-[#E4EAF0] bg-[#EAF6FD]',
        className,
      )}
    >
      <div className="min-h-0 flex-1 overflow-auto">
        {loading ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-[#7A8794]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-sm">Loading document…</p>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 px-4 text-center">
            <FileText className="h-8 w-8 text-[#E4EAF0]" />
            <p className="text-sm text-[#C2442E]">{error}</p>
          </div>
        ) : null}

        {!loading && !error && textContent != null ? (
          <pre className="whitespace-pre-wrap break-words p-4 font-mono text-[12px] leading-relaxed text-[#213D59]">
            {textContent}
          </pre>
        ) : null}

        {!loading && !error && objectUrl && kind === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={objectUrl}
            alt={fileName || 'Uploaded document'}
            className="mx-auto max-h-full w-full bg-white object-contain object-top"
          />
        ) : null}

        {!loading && !error && pdfBytes && kind === 'pdf' ? (
          <div className="p-2 sm:p-3">
            <AiPdfCanvas data={pdfBytes} title={fileName || 'PDF'} />
          </div>
        ) : null}

        {!loading &&
        !error &&
        !textContent &&
        kind !== 'image' &&
        kind !== 'pdf' ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 px-4 text-center">
            <FileText className="h-8 w-8 text-[#E4EAF0]" />
            <p className="text-sm text-[#6A7481]">Preview is not available.</p>
          </div>
        ) : null}
      </div>

      {fileName ? (
        <div className="flex items-center justify-between gap-2 border-t border-[#E4EAF0] bg-white/90 px-3 py-2">
          <p className="truncate text-[12px] font-medium text-[#213D59]" title={fileName}>
            {fileName}
          </p>
          {objectUrl && (kind === 'pdf' || kind === 'image') ? (
            <button
              type="button"
              onClick={() => window.open(objectUrl, '_blank')}
              className="shrink-0 text-[11px] font-semibold text-[#2E7FAD] underline-offset-2 hover:underline"
            >
              Open full size
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
