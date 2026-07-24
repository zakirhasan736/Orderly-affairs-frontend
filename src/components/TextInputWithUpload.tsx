
import React, { useRef } from 'react';
import { Button } from '@common/ui/button';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import { Upload, X } from 'lucide-react';
import { uploadFile } from '@/libs/api/upload';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export function TextInputWithUpload({
  label,
  value = {},
  onChange,
  helperText,
  placeholder,
}: any) {
  const fileRef = useRef<HTMLInputElement>(null);

  // AI often returns a plain string; form state expects { text, files }.
  const normalizedValue =
    typeof value === 'string' || typeof value === 'number'
      ? { text: String(value), files: [], _deleted_files: [] }
      : value && typeof value === 'object'
        ? value
        : { text: '', files: [], _deleted_files: [] };

  const files = normalizedValue.files || [];
  const deleted = normalizedValue._deleted_files || [];

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...normalizedValue,
      text: e.target.value,
      files: normalizedValue.files || [],
      _deleted_files: normalizedValue._deleted_files || [],
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
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }

    const uploaded = await uploadFile(file);

    onChange({
      ...normalizedValue,
      files: [
        {
          ...uploaded,
          version: 1,
          scan_status: 'pending',
        },
      ],
      _deleted_files:
        files.length && files[0].public_id ? [files[0].public_id] : [],
    });
  }

  function removeFile(file: any, index: number) {
    onChange({
      ...normalizedValue,
      files: files.filter((_: any, i: number) => i !== index),
      _deleted_files: file.public_id ? [...deleted, file.public_id] : deleted,
    });
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
        className="w-full"
      />
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-1" /> Upload
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/*,application/pdf"
        onChange={e => e.target.files && handleUpload(e.target.files[0])}
      />

      {files.map((f: any, i: number) => (
        <div
          key={f.public_id}
          className="flex justify-between items-center bg-muted p-2 rounded text-xs"
        >
          <a href={f.url} target="_blank" className="underline">
            {f.name}
            {f.version && <span className="ml-1">v{f.version}</span>}
          </a>

          <button type="button" onClick={() => removeFile(f, i)}>
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
