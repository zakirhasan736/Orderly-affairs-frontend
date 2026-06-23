'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import { cn } from '@common/ui/utils';
import {
  AI_DOCUMENT_ACCEPT,
  getReadableAiDocumentType,
} from '@/utils/aiDocumentUploadUi';

export type SectionAiUploaderTone = {
  wrapper?: string;
  glowOne?: string;
  glowTwo?: string;
  icon?: string;
  uploadBox?: string;
};

type SectionAiDocumentUploaderProps = {
  title: string;
  description: string;
  buttonLabel?: string;
  uploadLabel?: string;
  compact?: boolean;
  disabled?: boolean;
  isUploading?: boolean;
  isReading?: boolean;
  uploadedMimeType?: string;
  tone?: SectionAiUploaderTone;
  onUpload: (file: File) => void | Promise<void>;
  onAutofill: () => void | Promise<void>;
};

export function SectionAiDocumentUploader({
  title,
  description,
  buttonLabel = 'Auto-fill',
  uploadLabel = 'Drag and drop or click to upload',
  compact = false,
  disabled = false,
  isUploading = false,
  isReading = false,
  uploadedMimeType,
  tone,
  onUpload,
  onAutofill,
}: SectionAiDocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasUploadedFile = Boolean(uploadedMimeType);
  const isBusy = disabled || isUploading || isReading;

  const processFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file || isBusy) return;
      await onUpload(file);
    },
    [isBusy, onUpload],
  );

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isBusy) setIsDragging(true);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isBusy) setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (isBusy) return;

    const file = event.dataTransfer.files?.[0] ?? null;
    void processFile(file);
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-dashed',
        'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-indigo-50/50',
        'p-4 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-md',
        compact ? 'space-y-3' : 'space-y-4',
        tone?.wrapper,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-100/70 blur-2xl',
          tone?.glowOne,
        )}
      />
      <div
        className={cn(
          'pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-blue-100/70 blur-2xl',
          tone?.glowTwo,
        )}
      />

      <div className="relative space-y-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            {isUploading ? (
              <Loader2
                className={cn('h-5 w-5 animate-spin text-indigo-600', tone?.icon)}
              />
            ) : hasUploadedFile ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <UploadCloud
                className={cn('h-5 w-5 text-indigo-600', tone?.icon)}
              />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-semibold text-slate-900">{title}</p>
            <p className="text-sm leading-relaxed text-slate-600">
              {description}
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => void onAutofill()}
          disabled={isBusy || !hasUploadedFile}
          className="w-auto shrink-0 self-start rounded-xl sm:ml-14"
        >
          {isReading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isReading ? 'Reading…' : buttonLabel}
        </Button>
      </div>

      <div className="relative grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <div
          role="button"
          tabIndex={isBusy ? -1 : 0}
          onClick={() => {
            if (!isBusy) inputRef.current?.click();
          }}
          onKeyDown={event => {
            if (isBusy) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'group flex cursor-pointer flex-col items-center justify-center gap-2',
            'rounded-xl border border-slate-200 bg-white/80 px-4 py-5 text-center transition',
            'hover:border-indigo-300 hover:bg-indigo-50/50',
            compact && 'md:flex-row md:justify-start md:py-3 md:text-left',
            isDragging && 'border-indigo-400 bg-indigo-50/80 ring-2 ring-indigo-200',
            isBusy && 'pointer-events-none opacity-60',
            tone?.uploadBox,
          )}
        >
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept={AI_DOCUMENT_ACCEPT}
            disabled={isBusy}
            onChange={event => {
              const file = event.currentTarget.files?.[0] ?? null;
              void processFile(file);
              event.currentTarget.value = '';
            }}
          />

          <UploadCloud
            className={cn(
              'h-5 w-5 text-slate-500 group-hover:text-indigo-600',
              tone?.icon,
            )}
          />

          <div>
            <p className="text-sm font-medium text-slate-800">{uploadLabel}</p>
            <p className="text-xs text-slate-500">
              PDF, TXT, PNG, JPG, JPEG, WEBP · Max 15MB
            </p>
          </div>
        </div>

        {hasUploadedFile && !isUploading && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <FileText className="h-4 w-4" />
            <span>
              {getReadableAiDocumentType(uploadedMimeType)} ready
              {isReading ? ' · reading…' : ''}
            </span>
          </div>
        )}
      </div>

      {isUploading && (
        <div className="relative flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Uploading document…
        </div>
      )}

      {!isUploading && isReading && (
        <div className="relative flex items-center gap-2 text-xs text-indigo-600">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Running AI autofill…
        </div>
      )}
    </div>
  );
}
