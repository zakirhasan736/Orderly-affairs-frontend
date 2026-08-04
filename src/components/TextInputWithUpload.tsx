
import React, { useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@common/ui/button';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import { Upload, X } from 'lucide-react';
import { getSignedUploadUrl, uploadFile } from '@/libs/api/upload';

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
  version?: number;
  scan_status?: string;
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

export function TextInputWithUpload({
  label,
  value = {},
  onChange,
  helperText,
  placeholder,
  disabled = false,
}: any) {
  const fileRef = useRef<HTMLInputElement>(null);

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
      alert(error);
      return;
    }

    const uploaded = await uploadFile(file);
    const previousPublicId = files[0]?.public_id;

    onChange({
      ...normalizedValue,
      files: [
        {
          ...uploaded,
          version: 1,
          scan_status: 'pending',
        },
      ],
      _deleted_files: previousPublicId ? [previousPublicId] : [],
    });
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
    // Legacy rows without public_id: do not open raw URLs (may be long-lived public).
    toast.error('This file needs re-upload for secure viewing.');
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}

      <Input
        value={normalizedValue?.text || ''}
        onChange={handleTextChange}
        placeholder={placeholder}
        readOnly={disabled}
        className={`w-full${disabled ? ' cursor-default bg-slate-50' : ''}`}
      />
      <div className="flex gap-2">
        {!disabled && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-oa-mutate
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-1" /> Upload
        </Button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        disabled={disabled}
        accept="image/*,application/pdf"
        onChange={e => e.target.files && handleUpload(e.target.files[0])}
      />

      {files.map((f, i) => (
        <div
          key={f.public_id || `${f.name || 'file'}-${i}`}
          className="flex justify-between items-start gap-2 bg-muted p-2 rounded text-xs"
        >
          <div className="min-w-0">
            <button
              type="button"
              data-oa-view-ok
              className="underline text-left"
              onClick={() => void openFile(f)}
            >
              {f.name}
              {f.version && <span className="ml-1">v{f.version}</span>}
            </button>
            {f.uploaded_by_name && (
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
            )}
          </div>

          {!disabled && (
          <button type="button" data-oa-mutate onClick={() => removeFile(f, i)}>
            <X className="h-3 w-3" />
          </button>
          )}
        </div>
      ))}
    </div>
  );
}
