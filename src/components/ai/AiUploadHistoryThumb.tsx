'use client';

import React, { useEffect, useState } from 'react';
import { FileText, FileType2, ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@common/ui/utils';
import { fetchAiDocumentPreviewBlobCached } from '@/utils/aiDocumentPreviewCache';
import {
  resolveAiPreviewKind,
  resolveAiPreviewMime,
} from '@/utils/aiPreviewKind';
import { AiPdfCanvas } from '@/components/ai/AiPdfCanvas';

type AiUploadHistoryThumbProps = {
  fileId?: string;
  fileName: string;
  mimeType?: string;
  className?: string;
};

/**
 * Document thumbnail for overview history cards (image or first-page PDF).
 *
 * Important: never put CSS `transform` on the PDF iframe (or ancestors).
 * Chrome's built-in PDF viewer paints blank inside transformed layers.
 */
export function AiUploadHistoryThumb({
  fileId,
  fileName,
  mimeType: mimeHint,
  className,
}: AiUploadHistoryThumbProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [mimeType, setMimeType] = useState<string>(mimeHint || '');
  const [loading, setLoading] = useState(Boolean(fileId));
  const [failed, setFailed] = useState(false);
  const [previewKind, setPreviewKind] = useState<'image' | 'pdf' | null>(null);

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;

    async function load() {
      if (!fileId) {
        setLoading(false);
        setFailed(true);
        return;
      }

      setLoading(true);
      setFailed(false);
      setPreviewKind(null);
      setPdfBytes(null);
      setObjectUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });

      try {
        const { blob, mimeType: fetchedMime, fileName: fetchedName } =
          await fetchAiDocumentPreviewBlobCached(fileId);
        if (cancelled) return;

        const buffer = await blob.arrayBuffer();
        if (cancelled) return;

        const titleHint = fetchedName || fileName;
        const mime = resolveAiPreviewMime({
          contentType: fetchedMime,
          blobType: blob.type,
          fileName: titleHint,
          fallbackMime: mimeHint,
          bytes: buffer,
        });
        setMimeType(mime);

        const kind = resolveAiPreviewKind({
          mime,
          fileName: titleHint,
          bytes: buffer,
        });

        if (kind === 'image') {
          createdUrl = URL.createObjectURL(
            new Blob([buffer], { type: mime || 'image/png' }),
          );
          setPreviewKind('image');
          setObjectUrl(createdUrl);
        } else if (kind === 'pdf') {
          setPreviewKind('pdf');
          setPdfBytes(new Uint8Array(buffer));
        } else {
          setObjectUrl(null);
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [fileId, fileName, mimeHint]);

  const kind = resolveAiPreviewKind({ mime: mimeType || mimeHint, fileName });
  const kindLabel =
    kind === 'pdf'
      ? 'PDF'
      : kind === 'text'
        ? 'Text'
        : kind === 'image'
          ? 'Image'
          : 'File';

  return (
    <div
      className={cn(
        'relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-white',
        'ring-1 ring-black/5',
        className,
      )}
    >
      {loading ? (
        <div className="flex h-full items-center justify-center bg-[#F6F8FA]">
          <Loader2 className="h-5 w-5 animate-spin text-[#213D59]/50" />
        </div>
      ) : objectUrl && !failed && previewKind === 'image' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={objectUrl}
          alt=""
          className="h-full w-full object-cover object-top"
        />
      ) : pdfBytes && !failed && previewKind === 'pdf' ? (
        <div className="relative h-full w-full">
          <AiPdfCanvas data={pdfBytes} thumb title={fileName} />
          <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded bg-[#213D59]/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            PDF
          </span>
        </div>
      ) : (
        <div
          className={cn(
            'flex h-full flex-col items-center justify-center gap-2 px-3 text-center',
            kind === 'pdf' && 'bg-gradient-to-b from-[#eef3f9] to-white',
            kind === 'text' && 'bg-gradient-to-b from-[#f7f5f0] to-white',
            kind === 'image' && 'bg-gradient-to-b from-[#eef8f4] to-white',
            kind === 'other' && 'bg-gradient-to-b from-[#F6F8FA] to-white',
          )}
        >
          {kind === 'pdf' ? (
            <FileType2 className="h-10 w-10 text-[#213D59]/70" />
          ) : kind === 'image' ? (
            <ImageIcon className="h-10 w-10 text-[#2c7a63]/70" />
          ) : (
            <FileText className="h-10 w-10 text-[#213D59]/65" />
          )}
          <p className="max-w-full truncate text-[10px] font-semibold uppercase tracking-wide text-[#5a6b80]">
            {kindLabel}
          </p>
        </div>
      )}
    </div>
  );
}
