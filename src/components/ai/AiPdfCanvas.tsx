'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FileType2, Loader2 } from 'lucide-react';
import { cn } from '@common/ui/utils';

let workerConfigured = false;

async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist');
  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
    workerConfigured = true;
  }
  return pdfjs;
}

function clonePdfBytes(data: ArrayBuffer | Uint8Array): Uint8Array {
  const src = data instanceof Uint8Array ? data : new Uint8Array(data);
  const copy = new Uint8Array(src.byteLength);
  copy.set(src);
  return copy;
}

type AiPdfCanvasProps = {
  data: ArrayBuffer | Uint8Array;
  className?: string;
  /** First page, cropped for history cards. */
  thumb?: boolean;
  title?: string;
};

/**
 * Draw PDF pages to canvas so previews work inside Radix dialogs.
 * Chrome's built-in PDF plugin paints blank when any ancestor has CSS transform.
 */
export function AiPdfCanvas({ data, className, thumb, title }: AiPdfCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return undefined;
    host.replaceChildren();
    setLoading(true);
    setError('');

    const run = async () => {
      try {
        const pdfjs = await loadPdfjs();
        const pdf = await pdfjs.getDocument({ data: clonePdfBytes(data) }).promise;
        if (cancelled) {
          await pdf.destroy();
          return;
        }

        const pageLimit = thumb ? 1 : pdf.numPages;
        const hostWidth = Math.max(host.clientWidth || 0, thumb ? 240 : 480);

        for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          if (cancelled) break;
          const unscaled = page.getViewport({ scale: 1 });
          const scale = Math.min(
            2.4,
            Math.max(0.9, hostWidth / Math.max(unscaled.width, 1)),
          );
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          canvas.setAttribute('aria-hidden', thumb ? 'true' : 'false');
          if (title && !thumb) {
            canvas.setAttribute('aria-label', `${title} page ${pageNumber}`);
          }
          canvas.className = thumb
            ? 'absolute inset-x-0 top-0 w-full'
            : 'mx-auto mb-3 w-full max-w-full rounded-lg border border-slate-200 bg-white shadow-sm last:mb-0';
          const context = canvas.getContext('2d', { alpha: false });
          if (!context) continue;
          await page.render({ canvasContext: context, viewport }).promise;
          if (cancelled) break;
          host.appendChild(canvas);
        }

        await pdf.destroy();
        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Could not display this PDF.',
          );
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      host.replaceChildren();
    };
  }, [data, thumb, title]);

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-white',
        thumb ? 'h-full' : 'min-h-[12rem]',
        className,
      )}
    >
      <div
        ref={hostRef}
        className={cn(thumb ? 'absolute inset-0 overflow-hidden' : 'w-full')}
      />
      {loading ? (
        <div
          className={cn(
            'flex items-center justify-center bg-[#F6F8FA]',
            thumb ? 'absolute inset-0' : 'min-h-[12rem]',
          )}
        >
          <Loader2 className="h-5 w-5 animate-spin text-[#213D59]/50" />
        </div>
      ) : null}
      {error ? (
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-[#eef3f9] to-white px-3 text-center',
            thumb ? 'absolute inset-0' : 'min-h-[12rem]',
          )}
        >
          <FileType2 className="h-8 w-8 text-[#213D59]/70" />
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5a6b80]">
            PDF
          </p>
          {!thumb ? (
            <p className="max-w-sm text-xs text-rose-700">{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
