// src/services/aiDocumentUpload.ts

import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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

function getOwnerToken() {
  const token = Cookies.get('auth_token');

  if (!token) {
    throw new Error('You are not logged in. Please log in again.');
  }

  return token;
}

export async function uploadAIDocument(
  file: File,
): Promise<AIDocumentUploadResponse> {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');
  }

  if (!file) {
    throw new Error('Please select a file.');
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Upload PDF, TXT, PNG, JPG, JPEG, or WEBP only.');
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error('File too large. Max 15MB.');
  }

  const token = getOwnerToken();

  console.log('AI upload token exists:', Boolean(token));

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/ai/upload-document`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  let json: any = null;

  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    console.error('AI upload failed:', res.status, json);

    if (res.status === 401) {
      throw new Error('Login expired or token invalid. Please log in again.');
    }

    throw new Error(json?.detail || 'Document upload failed');
  }

  return json;
}
