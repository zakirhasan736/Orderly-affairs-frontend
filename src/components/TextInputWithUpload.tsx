
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@common/ui/button';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import { Download, Eye, EyeOff, FileText, Upload, X } from 'lucide-react';
import { getSignedUploadUrl, uploadFile } from '@/libs/api/upload';
import { VaultFieldUploadThumb } from '@/components/vault/VaultFieldUploadThumb';
import { cn } from '@common/ui/utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

type UploadFileEntry = {
  public_id?: string;
  url?: string;
  name?: string;
  original_filename?: string;
  mime_type?: string;
  content_type?: string;
  version?: number;
  scan_status?: string;
  scan_sanitized?: boolean;
  uploaded_by_name?: string;
  uploaded_by_email?: string;
  uploaded_by_role?: string;
  uploaded_at?: string;
};

function asUploadFiles(value: unknown): UploadFileEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is UploadFileEntry =>
      !!item && typeof item === 'object' && !Array.isArray(item),
  );
}

function fileDisplayName(file: UploadFileEntry, index: number): string {
  const name =
    String(file.name || file.original_filename || '').trim() ||
    `Attached document ${index + 1}`;
  return name;
}

export function TextInputWithUpload({
  label,
  value = {},
  onChange,
  helperText,
  placeholder,
  disabled = false,
  sensitive = false,
  /** Field-level upload is off by default — use the section Upload document control. */
  showUploadButton = false,
}: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    setShowSecret(false);
  }, [label, sensitive]);

  const unwrapText = (raw: unknown): string => {
    if (raw === null || raw === undefined) return '';
    if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
      return String(raw);
    }
    if (Array.isArray(raw)) {
      return raw.map(unwrapText).filter(Boolean).join(', ');
    }
    if (typeof raw === 'object') {
      const record = raw as Record<string, unknown>;
      if ('text' in record || 'files' in record) return unwrapText(record.text);
      for (const key of ['label', 'name', 'value', 'title']) {
        const nested = unwrapText(record[key]);
        if (nested) return nested;
      }
    }
    return '';
  };

  // AI often returns a plain string; form state expects { text, files }.
  const normalizedValue =
    typeof value === 'string' || typeof value === 'number'
      ? { text: String(value), files: [] as UploadFileEntry[], _deleted_files: [] as string[] }
      : value && typeof value === 'object'
        ? {
            ...(value as Record<string, unknown>),
            text: unwrapText(
              (value as { text?: unknown }).text ?? value,
            ),
            files: asUploadFiles((value as { files?: unknown }).files),
            _deleted_files: Array.isArray(
              (value as { _deleted_files?: unknown })._deleted_files,
            )
              ? ((value as { _deleted_files: string[] })._deleted_files)
              : [],
          }
        : { text: '', files: [] as UploadFileEntry[], _deleted_files: [] as string[] };

  const files = asUploadFiles(normalizedValue.files);
  const deleted = Array.isArray(normalizedValue._deleted_files)
    ? normalizedValue._deleted_files
    : [];

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    onChange({
      ...normalizedValue,
      text: e.target.value,
      files,
      _deleted_files: deleted,
    });
  };

  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Unsupported file type. Only images and PDFs are allowed.';
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'File is too large. Maximum size is 10MB.';
    }

    return null;
  }

    async function handleUpload(file: File) {
    if (disabled) return;
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      const uploaded = await uploadFile(file);
      const previousPublicId = files[0]?.public_id;

      onChange({
        ...normalizedValue,
        files: [
          {
            ...uploaded,
            name: uploaded?.name || uploaded?.original_filename || file.name,
            mime_type: uploaded?.mime_type || file.type,
            version: 1,
            scan_status: uploaded.scan_status || 'clean',
            scan_sanitized: uploaded.scan_sanitized,
          },
        ],
        _deleted_files: previousPublicId ? [previousPublicId] : [],
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    }
  }

  function removeFile(file: UploadFileEntry, index: number) {
    if (disabled) return;
    onChange({
      ...normalizedValue,
      files: files.filter((_, i) => i !== index),
      _deleted_files: file.public_id ? [...deleted, file.public_id] : deleted,
    });
  }

  async function openFile(file: UploadFileEntry) {
    if (file.public_id) {
      try {
        const signed = await getSignedUploadUrl(file.public_id);
        if (signed.url) {
          window.open(signed.url, '_blank', 'noopener,noreferrer');
          return;
        }
      } catch {
        // Prefer fail-closed over opening a possibly public legacy URL.
      }
      toast.error('Could not open secure file link. Try again.');
      return;
    }
    toast.error('This file needs re-upload for secure viewing.');
  }

  async function downloadFile(file: UploadFileEntry) {
    if (!file.public_id) {
      toast.error('This file needs re-upload for secure download.');
      return;
    }
    try {
      const signed = await getSignedUploadUrl(file.public_id);
      if (!signed.url) throw new Error('missing url');
      const res = await fetch(signed.url);
      if (!res.ok) throw new Error('download failed');
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = fileDisplayName(file, 0);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch {
      toast.error('Could not download this file. Try View instead.');
    }
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="relative min-w-0 flex-1">
          <Input
            value={normalizedValue?.text || ''}
            onChange={handleTextChange}
            placeholder={placeholder}
            readOnly={disabled}
            autoComplete={sensitive ? 'off' : undefined}
            type={sensitive && !showSecret ? 'password' : 'text'}
            className={cn(
              'w-full',
              disabled && 'cursor-default bg-slate-50',
              sensitive && 'pr-20',
            )}
          />
          {sensitive ? (
            <button
              type="button"
              data-oa-view-ok
              onClick={() => setShowSecret(prev => !prev)}
              className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label={showSecret ? 'Hide value' : 'Show value'}
            >
              {showSecret ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              <span>{showSecret ? 'Hide' : 'Show'}</span>
            </button>
          ) : null}
        </div>
        {!disabled && showUploadButton && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-oa-mutate
            onClick={() => fileRef.current?.click()}
            className="h-10 shrink-0 rounded-xl sm:self-auto"
          >
            <Upload className="mr-1 h-4 w-4" />
            {files.length > 0 ? 'Replace' : 'Upload'}
          </Button>
        )}
      </div>

      {showUploadButton ? (
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          disabled={disabled}
          accept="image/*,application/pdf"
          onChange={e => e.target.files && handleUpload(e.target.files[0])}
        />
      ) : null}
      {files.length > 0 ? (
        <div className="space-y-2">
          {files.map((f, i) => {
            const title = fileDisplayName(f, i);
            return (
              <div
                key={f.public_id || `${title}-${i}`}
                className="overflow-hidden rounded-2xl border border-[#213D59]/15 bg-gradient-to-br from-[#eef3f9] to-white shadow-sm"
              >
                <div className="flex gap-3 p-2.5 sm:p-3">
                  <button
                    type="button"
                    data-oa-view-ok
                    onClick={() => void openFile(f)}
                    className="w-[4.75rem] shrink-0 sm:w-24"
                    title={`Open ${title}`}
                    aria-label={`Open ${title}`}
                  >
                    <VaultFieldUploadThumb
                      publicId={f.public_id}
                      fileName={title}
                      mimeType={f.mime_type || f.content_type}
                    />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[#213D59]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#213D59]">
                      <FileText className="h-3 w-3" />
                      Document attached
                    </div>
                    <p className="truncate text-sm font-semibold text-slate-900" title={title}>
                      {title}
                      {f.version ? (
                        <span className="ml-1 text-xs font-medium text-slate-500">
                          v{f.version}
                        </span>
                      ) : null}
                    </p>
                    {f.uploaded_by_name ? (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Uploaded by{' '}
                        {f.uploaded_by_role === 'owner'
                          ? 'Owner'
                          : f.uploaded_by_name}
                        {f.uploaded_by_role && f.uploaded_by_role !== 'owner'
                          ? ` (${f.uploaded_by_role})`
                          : ''}
                        {f.uploaded_at
                          ? ` · ${new Date(f.uploaded_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}`
                          : ''}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Tap the preview to open this file.
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-oa-view-ok
                        onClick={() => void openFile(f)}
                        className="h-8 rounded-lg"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        View
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-oa-view-ok
                        onClick={() => void downloadFile(f)}
                        className="h-8 rounded-lg"
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Download
                      </Button>
                      {!disabled && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          data-oa-mutate
                          onClick={() => removeFile(f, i)}
                          className="h-8 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <X className="mr-1.5 h-3.5 w-3.5" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
