// src/services/aiAutofill.ts

import { secureFetch } from '@/libs/secureFetch';
import {
  AiDocumentMismatchError,
  AiDocumentUnavailableError,
  isAiDocumentMismatchDetail,
} from '@/utils/aiDocumentRouting';
import {
  AI_BUSY_USER_MESSAGE,
  toAiUserFacingMessage,
} from '@/utils/aiUserFacingError';

export async function autofillSectionFromDocument(payload: {
  section: string;
  file_id: string;
  subsection?: string | null;
  use_routed_cache?: boolean;
  classify_only?: boolean;
  /** Client always writes vault ciphertext; server AES merge is skipped for E2EE. */
  defer_persist?: boolean;
  field_catalog?: Array<{
    key: string;
    label: string;
    type: string;
    helperText?: string;
    placeholder?: string;
    options?: string[];
  }>;
}) {
  const res = await secureFetch('/ai/autofill-section', {
    method: 'POST',
    body: JSON.stringify({
      section: payload.section,
      file_id: payload.file_id,
      subsection: payload.subsection || null,
      use_routed_cache: payload.use_routed_cache ?? false,
      classify_only: payload.classify_only ?? false,
      defer_persist: payload.defer_persist ?? true,
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
      throw new Error(
        'Your session expired. Please sign in again, then retry the upload.',
      );
    }

    if (res.status === 409 && isAiDocumentMismatchDetail(json?.detail)) {
      throw new AiDocumentMismatchError(json.detail);
    }

    if (res.status === 409 && isAiDocumentMismatchDetail(json)) {
      throw new AiDocumentMismatchError(json);
    }

    if (res.status === 503 || res.status === 429) {
      const serverMessage =
        (typeof json?.detail === 'object' && json?.detail?.message) ||
        (typeof json?.detail === 'string' ? json.detail : '') ||
        '';
      throw new Error(
        toAiUserFacingMessage(serverMessage || AI_BUSY_USER_MESSAGE),
      );
    }

    if (res.status === 404 || res.status === 410) {
      const unavailableMessage =
        typeof json?.detail === 'string'
          ? json.detail
          : json?.detail?.message ||
            'That upload expired or was removed. Please upload the document again.';
      throw new AiDocumentUnavailableError(
        toAiUserFacingMessage(unavailableMessage),
      );
    }

    const detail =
      typeof json?.detail === 'string'
        ? json.detail
        : json?.detail?.message || json?.message;

    throw new Error(toAiUserFacingMessage(detail));
  }

  return json as {
    success: boolean;
    classified_only?: boolean;
    section: string;
    best_section?: string;
    best_section_id?: string;
    best_section_label?: string;
    best_subsection?: string | null;
    matches_requested_section?: boolean;
    scope?: 'section' | 'subsection';
    subsection?: string | null;
    result?: any;
    additional_sections?: import('@/utils/aiDocumentRouting').AiAdditionalSection[];
    section_previews?: import('@/utils/aiDocumentRouting').AiSectionPreview[];
    document_summary?: string;
    file_kept?: boolean;
    from_cache?: boolean;
    extract_reuse?: boolean;
    document_deleted?: boolean;
    file_id?: string;
    mime_type?: string;
    read_source?: 'system' | 'gemini' | 'cache' | string;
    extract_method?: string | null;
    extract_meta?: Record<string, unknown>;
    detected_facts?: import('@/utils/aiSemanticFieldMatch').DetectedFact[];
    partner_results?: Record<string, unknown>;
  };
}
