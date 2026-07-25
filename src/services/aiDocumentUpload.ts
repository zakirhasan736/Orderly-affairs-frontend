// src/services/aiDocumentUpload.ts

import { secureFetch } from '@/libs/secureFetch';

const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
];

const MAX_UPLOAD_SIZE = 15 * 1024 * 1024;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export type AIDocumentUploadResponse = {
  success: boolean;
  file_id: string;
  mime_type: string;
  expires_at: string;
  name?: string;
  original_filename?: string;
  size_bytes?: number;
  preview_url?: string;
  updated_at?: string;
  replaced?: boolean;
  replaced_file_ids?: string[];
};

export type OwnerAiDocument = {
  file_id: string;
  name: string;
  original_filename?: string;
  mime_type?: string;
  size_bytes?: number;
  status?: string;
  created_at?: string | null;
  updated_at?: string | null;
  expires_at?: string | null;
  preview_url?: string;
  source?: string;
  section?: string;
};

export async function uploadAIDocument(
  file: File,
  options?: { section?: string | number | null },
): Promise<AIDocumentUploadResponse> {
  if (!file) {
    throw new Error('Please select a file.');
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Upload PDF, TXT, PNG, JPG, JPEG, or WEBP only.');
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error('File too large. Max 15MB.');
  }

  const formData = new FormData();
  formData.append('file', file);
  const section =
    options?.section != null && String(options.section).trim()
      ? String(options.section).trim()
      : '';
  if (section) {
    formData.append('section', section);
  }

  const res = await secureFetch('/ai/upload-document', {
    method: 'POST',
    headers: {},
    body: formData,
  });

  let json: any = null;

  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Login expired or token invalid. Please log in again.');
    }

    throw new Error(json?.detail || 'Document upload failed');
  }

  return json;
}

export async function listOwnerAiDocuments(): Promise<OwnerAiDocument[]> {
  try {
    const res = await secureFetch('/ai/documents');
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.documents) ? json.documents : [];
  } catch {
    return [];
  }
}

/** Cookie-authenticated preview URL for image / text / PDF inline view. */
export function getAiDocumentPreviewUrl(fileId: string) {
  if (!fileId) return '';
  const path = `/ai/document/${encodeURIComponent(fileId)}/preview`;
  return API_BASE ? `${API_BASE}${path}` : path;
}

/**
 * Fetch preview bytes with credentials (for blob: URLs in <img>/<iframe>/text).
 */
export async function fetchAiDocumentPreviewBlob(fileId: string): Promise<{
  blob: Blob;
  mimeType: string;
  fileName?: string;
}> {
  const res = await secureFetch(
    `/ai/document/${encodeURIComponent(fileId)}/preview`,
    { method: 'GET', headers: {} },
  );

  if (!res.ok) {
    if (res.status === 410) {
      throw new Error('This document has expired. Please upload it again.');
    }
    if (res.status === 404) {
      throw new Error('Document not found. It may have been deleted.');
    }
    throw new Error('Could not open document preview.');
  }

  const blob = await res.blob();
  const mimeType =
    res.headers.get('content-type') || blob.type || 'application/octet-stream';
  const disposition = res.headers.get('content-disposition') || '';
  const match = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(disposition);
  const fileName = match?.[1] ? decodeURIComponent(match[1].replace(/"/g, '')) : undefined;

  return { blob, mimeType, fileName };
}

export async function deleteAIDocument(fileId: string): Promise<boolean> {
  if (!fileId) return false;

  try {
    const res = await secureFetch(`/ai/document/${encodeURIComponent(fileId)}`, {
      method: 'DELETE',
    });
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}
