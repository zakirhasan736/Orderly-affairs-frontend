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
import { fetchAiDocumentPreviewBlob } from '@/services/aiDocumentUpload';
import { getReadableAiDocumentType } from '@/utils/aiDocumentUploadUi';
import { cn } from '@common/ui/utils';

type AiDocumentPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
};

export function AiDocumentPreviewDialog({
  open,
  onOpenChange,
  fileId,
  fileName,
  mimeType,
}: AiDocumentPreviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [resolvedMime, setResolvedMime] = useState(mimeType || '');
  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !fileId) {
      setError('');
      setTextContent(null);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        setObjectUrl(null);
      }
      return;
    }

    let cancelled = false;
    let createdUrl: string | null = null;

    const load = async () => {
      setLoading(true);
      setError('');
      setTextContent(null);
      try {
        const { blob, mimeType: fetchedMime, fileName: fetchedName } =
          await fetchAiDocumentPreviewBlob(fileId);
        if (cancelled) return;

        const mime = fetchedMime || mimeType || blob.type || '';
        setResolvedMime(mime);

        if (mime.startsWith('text/') || mime === 'application/json') {
          const text = await blob.text();
          if (!cancelled) setTextContent(text);
        } else {
          createdUrl = URL.createObjectURL(blob);
          setObjectUrl(createdUrl);
        }

        if (fetchedName && !fileName) {
          // Title already passed from parent when available.
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Could not open document.',
          );
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
  }, [open, fileId]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const title = fileName?.trim() || 'Uploaded document';
  const typeLabel = getReadableAiDocumentType(resolvedMime || mimeType || undefined);
  const isImage = (resolvedMime || '').startsWith('image/');
  const isPdf =
    (resolvedMime || '') === 'application/pdf' ||
    title.toLowerCase().endsWith('.pdf');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[min(100vw-1.5rem,44rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-4 py-3.5 pr-12 text-left sm:px-5">
          <DialogTitle className="truncate text-[15px] font-semibold text-[#132b26]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-slate-500">
            {typeLabel} · click to view what you uploaded for autofill
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto bg-[#f7f6f2] p-3 sm:p-4">
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

          {!loading && !error && textContent != null ? (
            <pre
              className={cn(
                'max-h-[min(70dvh,520px)] overflow-auto rounded-xl border border-slate-200 bg-white p-4',
                'whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed text-slate-800',
              )}
            >
              {textContent}
            </pre>
          ) : null}

          {!loading && !error && objectUrl && isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={objectUrl}
              alt={title}
              className="mx-auto max-h-[min(70dvh,560px)] w-auto max-w-full rounded-xl border border-slate-200 bg-white object-contain shadow-sm"
            />
          ) : null}

          {!loading && !error && objectUrl && isPdf ? (
            <iframe
              title={title}
              src={objectUrl}
              className="h-[min(70dvh,560px)] w-full rounded-xl border border-slate-200 bg-white"
            />
          ) : null}

          {!loading &&
          !error &&
          objectUrl &&
          !isImage &&
          !isPdf &&
          textContent == null ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-center">
              <FileText className="h-8 w-8 text-slate-400" />
              <p className="text-sm text-slate-600">
                Preview is not available for this file type.
              </p>
              <a
                href={objectUrl}
                download={title}
                className="text-sm font-medium text-[#2e7d6e] underline-offset-2 hover:underline"
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
