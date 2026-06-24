// src/services/aiAutofill.ts

import Cookies from 'js-cookie';
import {
  AiDocumentMismatchError,
  AiDocumentUnavailableError,
  isAiDocumentMismatchDetail,
} from '@/utils/aiDocumentRouting';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getOwnerToken() {
  const token = Cookies.get('auth_token');

  if (!token) {
    throw new Error('You are not logged in. Please log in again.');
  }

  return token;
}

export async function autofillSectionFromDocument(payload: {
  section: string;
  file_id: string;
  subsection?: string | null;
  use_routed_cache?: boolean;
  field_catalog?: Array<{
    key: string;
    label: string;
    type: string;
    helperText?: string;
    placeholder?: string;
    options?: string[];
  }>;
}) {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');
  }

  const token = getOwnerToken();

  const res = await fetch(`${API_BASE_URL}/ai/autofill-section`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      section: payload.section,
      file_id: payload.file_id,
      subsection: payload.subsection || null,
      use_routed_cache: payload.use_routed_cache ?? false,
      field_catalog: payload.field_catalog || null,
    }),
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

    if (res.status === 409 && isAiDocumentMismatchDetail(json?.detail)) {
      throw new AiDocumentMismatchError(json.detail);
    }

    if (res.status === 409 && isAiDocumentMismatchDetail(json)) {
      throw new AiDocumentMismatchError(json);
    }

    if (res.status === 503) {
      const busyMessage =
        (typeof json?.detail === 'object' && json?.detail?.message) ||
        'AI is temporarily busy. Please wait a moment and try Auto-fill again.';
      throw new Error(busyMessage);
    }

    if (res.status === 404 || res.status === 410) {
      const unavailableMessage =
        typeof json?.detail === 'string'
          ? json.detail
          : 'Uploaded document expired or is no longer available. Please upload again.';
      throw new AiDocumentUnavailableError(unavailableMessage);
    }

    const detail =
      typeof json?.detail === 'string'
        ? json.detail
        : json?.detail?.message || json?.message;

    throw new Error(detail || 'AI autofill failed');
  }

    return json as {
    success: boolean;
    section: string;
    scope: 'section' | 'subsection';
    subsection: string | null;
    result: any;
    additional_sections?: import('@/utils/aiDocumentRouting').AiAdditionalSection[];
    section_previews?: import('@/utils/aiDocumentRouting').AiSectionPreview[];
    document_summary?: string;
    file_kept?: boolean;
    from_cache?: boolean;
    document_deleted?: boolean;
  };
}
