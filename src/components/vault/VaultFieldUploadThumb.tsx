'use client';

import React, { useEffect, useState } from 'react';
import { FileText, FileType2, ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@common/ui/utils';
import { getSignedUploadUrl } from '@/libs/api/upload';

type VaultFieldUploadThumbProps = {
  publicId?: string;
  /** Direct preview URL when public_id is not yet available (e.g. temp AI upload). */
  previewUrl?: string;
  fileName?: string;
  mimeType?: string;
  className?: string;
};

function guessKind(fileName?: string, mimeType?: string): 'image' | 'pdf' | 'other' {
  const mime = String(mimeType || '').toLowerCase();
  const name = String(fileName || '').toLowerCase();
  if (mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|heic)$/i.test(name)) {
    return 'image';
  }
  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  return 'other';
}

/**
 * Compact preview for vault field attachments (S3 via signed URL).
 */
export function VaultFieldUploadThumb({
  publicId,
  previewUrl,
  fileName,
  mimeType,
  className,
}: VaultFieldUploadThumbProps) {
  const [url, setUrl] = useState<string | null>(previewUrl || null);
  const [loading, setLoading] = useState(Boolean(publicId) && !previewUrl);
  const [failed, setFailed] = useState(false);
  const kind = guessKind(fileName, mimeType);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (previewUrl) {
        setUrl(previewUrl);
        setLoading(false);
        setFailed(false);
        return;
      }
      if (!publicId) {
        setLoading(false);
        setFailed(true);
        return;
      }
      setLoading(true);
      setFailed(false);
      try {
        const signed = await getSignedUploadUrl(publicId);
        if (cancelled) return;
        if (signed?.url) {
          setUrl(signed.url);
        } else {
          setFailed(true);
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
    };
  }, [publicId, previewUrl]);

  return (
    <div
      className={cn(
        'relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/80',
        className,
      )}
    >
      {loading ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-[#213D59]/50" />
        </div>
      ) : url && !failed && kind === 'image' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover object-top"
        />
      ) : url && !failed && kind === 'pdf' ? (
        <div className="relative h-full w-full overflow-hidden bg-white">
          <iframe
            title=""
            src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            className="pointer-events-none absolute left-1/2 top-0 h-[175%] w-[175%] max-w-none -translate-x-1/2 border-0 bg-white"
            aria-hidden
          />
        </div>
      ) : (
        <div
          className={cn(
            'flex h-full flex-col items-center justify-center gap-1 px-2 text-center',
            kind === 'pdf' && 'bg-gradient-to-b from-[#eef3f9] to-white',
            kind === 'image' && 'bg-gradient-to-b from-[#eef8f4] to-white',
            kind === 'other' && 'bg-gradient-to-b from-[#F6F8FA] to-white',
          )}
        >
          {kind === 'pdf' ? (
            <FileType2 className="h-7 w-7 text-[#213D59]/70" />
          ) : kind === 'image' ? (
            <ImageIcon className="h-7 w-7 text-[#2c7a63]/70" />
          ) : (
            <FileText className="h-7 w-7 text-[#213D59]/65" />
          )}
          <p className="max-w-full truncate text-[9px] font-semibold uppercase tracking-wide text-slate-500">
            {kind === 'pdf' ? 'PDF' : kind === 'image' ? 'Image' : 'File'}
          </p>
        </div>
      )}
    </div>
  );
}
