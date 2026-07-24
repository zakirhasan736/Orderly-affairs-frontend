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

export type AIDocumentUploadResponse = {
  success: boolean;
  file_id: string;
  mime_type: string;
  expires_at: string;
};

export async function uploadAIDocument(
  file: File,
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
