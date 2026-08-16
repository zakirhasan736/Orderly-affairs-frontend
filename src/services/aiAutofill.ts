// src/services/aiAutofill.ts

import { secureFetch } from '@/libs/secureFetch';
import {
  AiDocumentMismatchError,
  AiDocumentUnavailableError,
  isAiDocumentMismatchDetail,
} from '@/utils/aiDocumentRouting';
import {
  AI_GENERIC_FAIL_USER_MESSAGE,
  AI_WAITING_USER_MESSAGE,
  toAiUserFacingMessage,
} from '@/utils/aiUserFacingError';

type AutofillPayload = {
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
};

export type AutofillRequestOptions = {
  /** Called when the server is still working (retryable wait). Keep spinner. */
  onWaiting?: () => void;
  waitAttempts?: number;
};

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function postAutofillOnce(payload: AutofillPayload) {
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

  return { res, json };
}

export async function autofillSectionFromDocument(
  payload: AutofillPayload,
  options?: AutofillRequestOptions,
) {
  const waitAttempts = Math.max(1, options?.waitAttempts ?? 3);
  let lastWaitError: Error | null = null;

  for (let attempt = 0; attempt < waitAttempts; attempt++) {
    const { res, json } = await postAutofillOnce(payload);

    if (res.ok) {
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
        document_kind?: string;
        document_topic?: string;
        fill_section_keys?: string[];
        skip_section_keys?: string[];
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
        replaced_file_ids?: string[];
        replaced?: boolean;
      };
    }

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
      lastWaitError = new Error(AI_WAITING_USER_MESSAGE);
      if (attempt + 1 < waitAttempts) {
        options?.onWaiting?.();
        await sleep(1200 * 2 ** attempt + Math.random() * 400);
        continue;
      }
      throw new Error(AI_GENERIC_FAIL_USER_MESSAGE);
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

  throw lastWaitError || new Error(AI_GENERIC_FAIL_USER_MESSAGE);
}
