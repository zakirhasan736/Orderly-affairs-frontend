'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/ui/dialog';
import { fetchAiDocumentPreviewBlobCached } from '@/utils/aiDocumentPreviewCache';
import { getReadableAiDocumentType } from '@/utils/aiDocumentUploadUi';
import { resolveAiPreviewKind, resolveAiPreviewMime } from '@/utils/aiPreviewKind';
import { AiPdfCanvas } from '@/components/ai/AiPdfCanvas';
import { cn } from '@common/ui/utils';

type AiDocumentPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  /** Called when the server returns 404 (file already deleted). */
  onNotFound?: (fileId: string) => void;
};

export function AiDocumentPreviewDialog({
  open,
  onOpenChange,
  fileId,
  fileName,
  mimeType,
  onNotFound,
}: AiDocumentPreviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [resolvedMime, setResolvedMime] = useState(mimeType || '');
  const [textContent, setTextContent] = useState<string | null>(null);
  const [kind, setKind] = useState<'image' | 'pdf' | 'text' | 'other'>('other');

  useEffect(() => {
    if (!open || !fileId) {
      setError('');
      setTextContent(null);
      setLoading(false);
      setKind('other');
      setPdfBytes(null);
      setObjectUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    let cancelled = false;
    let createdUrl: string | null = null;

    const load = async () => {
      setLoading(true);
      setError('');
      setTextContent(null);
      setKind('other');
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

        const titleHint = fileName || fetchedName || '';
        const mime = resolveAiPreviewMime({
          contentType: fetchedMime,
          blobType: blob.type,
          fileName: titleHint,
          fallbackMime: mimeType,
          bytes: buffer,
        });
        const nextKind = resolveAiPreviewKind({
          mime,
          fileName: titleHint,
          bytes: buffer,
        });

        setResolvedMime(mime);
        setKind(nextKind);

        if (nextKind === 'text') {
          const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
          if (!cancelled) setTextContent(text || '(Empty text file)');
          return;
        }

        if (nextKind === 'pdf') {
          const pdfBlob = new Blob([buffer], { type: 'application/pdf' });
          createdUrl = URL.createObjectURL(pdfBlob);
          if (!cancelled) {
            setPdfBytes(new Uint8Array(buffer));
            setObjectUrl(createdUrl);
          }
          return;
        }

        const previewBlob = new Blob([buffer], {
          type: mime || 'application/octet-stream',
        });
        createdUrl = URL.createObjectURL(previewBlob);
        if (!cancelled) setObjectUrl(createdUrl);
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Could not open document.';
          setError(message);
          // Only purge history when the Mongo row is gone — not when bytes are
          // missing on this server (shared Atlas / VPS path drift).
          if (
            fileId &&
            /document not found\.?/i.test(message) &&
            !/not available on this server|missing on disk|re-upload/i.test(
              message,
            )
          ) {
            onNotFound?.(fileId);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fileId, fileName, mimeType]);

  const title = fileName?.trim() || 'Uploaded document';
  const typeLabel = getReadableAiDocumentType(
    resolvedMime || mimeType || undefined,
  );

  const openPdfInBrowser = () => {
    if (!objectUrl) return;
    window.open(objectUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        Avoid CSS transform on this dialog: Chrome's PDF viewer paints blank
        inside transformed ancestors (Radix centers with translate + zoom).
      */}
      <DialogContent
        className={cn(
          'flex max-h-[92dvh] w-[min(100vw-1.5rem,44rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl',
          '!left-[max(0.75rem,calc(50%-min(22rem,calc(50vw-0.75rem))))] !right-auto !top-[4vh]',
          '!translate-x-0 !translate-y-0',
          'data-[state=open]:!zoom-in-100 data-[state=closed]:!zoom-out-100',
        )}
      >
        <DialogHeader className="shrink-0 border-b border-slate-100 px-4 py-3.5 pr-12 text-left sm:px-5">
          <DialogTitle className="truncate text-[15px] font-semibold text-[#213D59]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-slate-500">
            {typeLabel} · click to view what you uploaded for autofill
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto bg-[#F6F8FA] p-3 sm:p-4">
          {loading ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Loading preview…</p>
            </div>
          ) : null}

          {!loading && error ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-rose-100 bg-white px-4 text-center">
              <X className="h-5 w-5 text-rose-500" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          ) : null}

          {!loading && !error && textContent != null && kind === 'text' ? (
            <pre
              className={cn(
                'max-h-[min(70dvh,520px)] overflow-auto rounded-xl border border-slate-200 bg-white p-4',
                'whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed text-slate-800',
              )}
            >
              {textContent}
            </pre>
          ) : null}

          {!loading && !error && objectUrl && kind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={objectUrl}
              alt={title}
              onError={() =>
                setError('Could not display this image. Try downloading it.')
              }
              className="mx-auto max-h-[min(70dvh,560px)] min-h-[12rem] w-auto max-w-full rounded-xl border border-slate-200 bg-white object-contain shadow-sm"
            />
          ) : null}

          {!loading && !error && pdfBytes && kind === 'pdf' ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-[#eef1f4] p-2 sm:p-3">
              <div className="max-h-[min(70dvh,560px)] overflow-auto">
                <AiPdfCanvas data={pdfBytes} title={title} />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-slate-200/80 px-3 py-2 text-center">
                <button
                  type="button"
                  onClick={openPdfInBrowser}
                  className="text-xs font-medium text-[#2E7FAD] underline-offset-2 hover:underline"
                >
                  Open PDF in new tab
                </button>
                <a
                  href={objectUrl || undefined}
                  download={title.endsWith('.pdf') ? title : `${title}.pdf`}
                  className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline"
                >
                  Download
                </a>
              </div>
            </div>
          ) : null}

          {!loading &&
          !error &&
          !textContent &&
          !objectUrl &&
          !pdfBytes ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-center">
              <FileText className="h-8 w-8 text-slate-400" />
              <p className="text-sm text-slate-600">
                Nothing to preview for this file yet.
              </p>
            </div>
          ) : null}

          {!loading &&
          !error &&
          objectUrl &&
          kind === 'other' &&
          textContent == null ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-center">
              <FileText className="h-8 w-8 text-slate-400" />
              <p className="text-sm text-slate-600">
                Preview is not available for this file type.
              </p>
              <a
                href={objectUrl}
                download={title}
                className="text-sm font-medium text-[#2E7FAD] underline-offset-2 hover:underline"
              >
                Download file
              </a>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
