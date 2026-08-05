// src/services/aiDocumentUpload.ts

import { secureFetch } from '@/libs/secureFetch';
import { resolveApiBaseUrl } from '@/libs/apiBase';
import { store } from '@/store/store';
import { aiDocumentsApi } from '@/services/aiDocumentsApi';
import { invalidateAiDocumentPreviewCache } from '@/utils/aiDocumentPreviewCache';

const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
];

const MAX_UPLOAD_SIZE = 15 * 1024 * 1024;

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
  /** Exact same file bytes as a prior upload with reusable AI cache. */
  unchanged?: boolean;
  extract_reuse?: boolean;
  content_hash?: string;
  reused_from_file_id?: string | null;
  needs_vision?: boolean;
  extract_method?: string;
  extract_quality?: number;
};

export type OwnerAiDocument = {
  file_id: string;
  name: string;
  original_filename?: string;
  mime_type?: string;
  size_bytes?: number;
  status?: string;
  filled?: boolean;
  consumed_sections?: string[];
  pending_sections?: string[];
  created_at?: string | null;
  updated_at?: string | null;
  expires_at?: string | null;
  preview_url?: string;
  source?: string;
  section?: string;
  storage?: string;
  public_id?: string;
  content_hash?: string;
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

  if (Array.isArray(json?.replaced_file_ids)) {
    for (const id of json.replaced_file_ids) {
      invalidateAiDocumentPreviewCache(String(id));
    }
  }
  invalidateOwnerAiDocumentsCache();

  return json;
}

/** Invalidate RTK document list after upload / delete / replace. */
export function invalidateOwnerAiDocumentsCache() {
  store.dispatch(aiDocumentsApi.util.invalidateTags(['AiDocuments']));
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
  const base = resolveApiBaseUrl();
  return base ? `${base}${path}` : path;
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
    let detail = '';
    try {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = (await res.json()) as { detail?: unknown; message?: unknown };
        if (typeof body.detail === 'string') detail = body.detail;
        else if (typeof body.message === 'string') detail = body.message;
      } else {
        detail = (await res.text()).trim().slice(0, 180);
      }
    } catch {
      // ignore parse errors — fall back to status text
    }

    if (res.status === 410) {
      throw new Error(
        detail ||
          'Document file is not available on this server. Re-upload the file to preview it.',
      );
    }
    if (res.status === 404) {
      throw new Error(detail || 'Document not found.');
    }
    if (res.status === 401) {
      throw new Error('Sign in again to preview this document.');
    }
    throw new Error(
      detail || `Could not open document preview (${res.status}).`,
    );
  }

  const blob = await res.blob();
  const headerMime = (res.headers.get('content-type') || '').split(';')[0].trim();
  const disposition = res.headers.get('content-disposition') || '';
  const match = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(disposition);
  const fileName = match?.[1]
    ? decodeURIComponent(match[1].replace(/"/g, ''))
    : undefined;

  // Prefer a concrete type — browsers often leave blob.type empty for octet-stream.
  const mimeType =
    headerMime && headerMime !== 'application/octet-stream'
      ? headerMime
      : blob.type && blob.type !== 'application/octet-stream'
        ? blob.type
        : headerMime || blob.type || 'application/octet-stream';

  return { blob, mimeType, fileName };
}

export async function deleteAIDocument(fileId: string): Promise<boolean> {
  if (!fileId) return false;

  try {
    const res = await secureFetch(`/ai/document/${encodeURIComponent(fileId)}`, {
      method: 'DELETE',
    });
    const ok = res.ok || res.status === 404;
    if (ok) {
      invalidateAiDocumentPreviewCache(fileId);
      invalidateOwnerAiDocumentsCache();
    }
    return ok;
  } catch {
    return false;
  }
}
