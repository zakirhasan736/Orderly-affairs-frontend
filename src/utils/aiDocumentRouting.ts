import {
  getAiUploadMeta,
  mergeAiUploadMeta,
  type UploadedAIFile,
} from '@/utils/aiDocumentUploadUi';

export type AiExtractedFieldPreview = {
  field_path: string;
  field_label: string;
  value: string;
};

export type AiNavigateIntent = 'autofill' | 'review' | null;

export type AiAdditionalSection = {
  section_key: string;
  section_id: string;
  section_label: string;
  subsection?: string;
  data_summary: string;
  confidence?: string;
  extracted_fields?: AiExtractedFieldPreview[];
};

export type AiSectionPreview = {
  section_key: string;
  section_id?: string;
  section_label: string;
  status: 'filled' | 'pending';
  data_summary?: string;
  extracted_fields?: AiExtractedFieldPreview[];
};

export type AiDocumentMismatchDetail = {
  code: 'section_mismatch';
  mismatch_type?: 'wrong_section' | 'companion_section_first';
  message: string;
  requested_section: string;
  suggested_section: string;
  suggested_section_id?: string;
  suggested_section_label?: string;
  suggested_subsection?: string;
  document_summary?: string;
  extracted_fields?: AiExtractedFieldPreview[];
  additional_sections?: AiAdditionalSection[];
  section_previews?: AiSectionPreview[];
  file_id: string;
  mime_type?: string;
};

export type AiPendingUpload = {
  file_id: string;
  mime_type: string;
  expires_at?: string;
  file_name?: string;
  uploaded_at?: number;
  targetSectionId: string;
  targetSectionKey: string;
  targetSubsection?: string;
  uploadScope: string;
  documentSummary?: string;
  extractedFields?: AiExtractedFieldPreview[];
  navigateIntent?: AiNavigateIntent;
  uploadedFromSectionId?: string;
  highlightUpload: boolean;
  createdAt: number;
};

export type AiAutofillSuccessMeta = {
  file_id: string;
  mime_type: string;
  currentSectionId: string;
  uploadScope: string;
  additional_sections?: AiAdditionalSection[];
  section_previews?: AiSectionPreview[];
  document_summary?: string;
  document_deleted?: boolean;
  /** When true, queue other-section popup until releaseAdditionalSectionsDialog() */
  deferAdditionalDialog?: boolean;
};

export const AI_PENDING_UPLOADS_STORAGE_KEY = 'orderly_ai_pending_uploads';
export const AI_PENDING_UPLOAD_STORAGE_KEY = 'orderly_ai_pending_upload';
export const AI_FILLED_SECTIONS_STORAGE_KEY = 'orderly_ai_filled_sections_by_file';

export type FilledSectionsByFile = Record<string, string[]>;

export class AiDocumentMismatchError extends Error {
  readonly handled = true;

  constructor(public readonly detail: AiDocumentMismatchDetail) {
    super(detail.message || 'This document does not match the current section.');
    this.name = 'AiDocumentMismatchError';
  }
}

export class AiDocumentUnavailableError extends Error {
  readonly handled = true;

  constructor(message = 'Uploaded document expired or is no longer available.') {
    super(message);
    this.name = 'AiDocumentUnavailableError';
  }
}

export function isAiDocumentMismatchDetail(
  value: unknown,
): value is AiDocumentMismatchDetail {
  if (!value || typeof value !== 'object') return false;
  const detail = value as Partial<AiDocumentMismatchDetail>;
  return detail.code === 'section_mismatch' && Boolean(detail.file_id);
}

function isValidPendingUpload(value: unknown): value is AiPendingUpload {
  if (!value || typeof value !== 'object') return false;
  const upload = value as Partial<AiPendingUpload>;
  return Boolean(upload.file_id && upload.targetSectionId);
}

export function readPendingUploadsFromStorage(): AiPendingUpload[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = sessionStorage.getItem(AI_PENDING_UPLOADS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(isValidPendingUpload);
      }
    }

    const legacyRaw = sessionStorage.getItem(AI_PENDING_UPLOAD_STORAGE_KEY);
    if (!legacyRaw) return [];

    const legacy = JSON.parse(legacyRaw);
    return isValidPendingUpload(legacy) ? [legacy] : [];
  } catch {
    return [];
  }
}

export function writePendingUploadsToStorage(uploads: AiPendingUpload[]) {
  if (typeof window === 'undefined') return;

  if (!uploads.length) {
    sessionStorage.removeItem(AI_PENDING_UPLOADS_STORAGE_KEY);
    sessionStorage.removeItem(AI_PENDING_UPLOAD_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(
    AI_PENDING_UPLOADS_STORAGE_KEY,
    JSON.stringify(uploads),
  );
  sessionStorage.removeItem(AI_PENDING_UPLOAD_STORAGE_KEY);
}

export function readFilledSectionsFromStorage(): FilledSectionsByFile {
  if (typeof window === 'undefined') return {};

  try {
    const raw = sessionStorage.getItem(AI_FILLED_SECTIONS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as FilledSectionsByFile;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeFilledSectionsToStorage(map: FilledSectionsByFile) {
  if (typeof window === 'undefined') return;

  if (!Object.keys(map).length) {
    sessionStorage.removeItem(AI_FILLED_SECTIONS_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(AI_FILLED_SECTIONS_STORAGE_KEY, JSON.stringify(map));
}

export function markSectionFilledForFile(
  map: FilledSectionsByFile,
  fileId: string,
  sectionId: string,
): FilledSectionsByFile {
  const existing = new Set(map[fileId] || []);
  existing.add(sectionId);
  return {
    ...map,
    [fileId]: [...existing],
  };
}

export function isSectionFilledForFile(
  map: FilledSectionsByFile,
  fileId: string,
  sectionId: string,
) {
  return (map[fileId] || []).includes(sectionId);
}

export function clearFilledSectionsForFile(
  map: FilledSectionsByFile,
  fileId: string,
): FilledSectionsByFile {
  if (!map[fileId]) return map;
  const next = { ...map };
  delete next[fileId];
  return next;
}

export function purgePendingUploadsForFile(
  uploads: AiPendingUpload[],
  fileId: string,
) {
  return uploads.filter(upload => upload.file_id !== fileId);
}

export function pendingUploadToAiFile(upload: AiPendingUpload): UploadedAIFile {
  const storedMeta = getAiUploadMeta(upload.file_id);

  return mergeAiUploadMeta({
    file_id: upload.file_id,
    mime_type: upload.mime_type,
    expires_at: upload.expires_at,
    file_name: upload.file_name || storedMeta?.file_name,
    uploaded_at:
      upload.uploaded_at || storedMeta?.uploaded_at || upload.createdAt,
  });
}

export function pendingUploadKey(sectionId: string, scope = 'full') {
  return `${sectionId}:${scope}`;
}

export function isPendingUploadActive(upload: AiPendingUpload) {
  return upload.highlightUpload;
}

/**
 * True when this section was already filled for the same upload
 * (or marked autofill-done), so routing popups should not keep it.
 */
export function isAiPendingUploadConsumed(
  upload: Pick<AiPendingUpload, 'file_id' | 'targetSectionId'>,
  filledSectionsByFile: FilledSectionsByFile,
  isSectionAutofillDone?: (sectionId: string, fileId?: string) => boolean,
): boolean {
  if (
    isSectionFilledForFile(
      filledSectionsByFile,
      upload.file_id,
      upload.targetSectionId,
    )
  ) {
    return true;
  }

  if (!isSectionAutofillDone) return false;
  return isSectionAutofillDone(upload.targetSectionId, upload.file_id);
}

/**
 * Keep at most one highlighted card per file — the next unfilled section.
 * Other pending rows stay quiet until that one is cleared.
 */
export function promoteSingleHighlightPerFile(
  uploads: AiPendingUpload[],
  filledSectionsByFile: FilledSectionsByFile,
  isSectionAutofillDone?: (sectionId: string, fileId?: string) => boolean,
): AiPendingUpload[] {
  const active = uploads.filter(
    upload =>
      !isAiPendingUploadConsumed(
        upload,
        filledSectionsByFile,
        isSectionAutofillDone,
      ),
  );

  const highlightOwnerByFile = new Map<string, string>();
  for (const upload of active) {
    if (highlightOwnerByFile.has(upload.file_id)) continue;
    highlightOwnerByFile.set(upload.file_id, upload.targetSectionId);
  }

  return uploads
    .filter(upload =>
      active.some(
        item =>
          item.file_id === upload.file_id &&
          item.targetSectionId === upload.targetSectionId &&
          item.uploadScope === upload.uploadScope,
      ),
    )
    .map(upload => {
      const owner = highlightOwnerByFile.get(upload.file_id);
      const shouldHighlight = owner === upload.targetSectionId;
      if (upload.highlightUpload === shouldHighlight) return upload;
      return {
        ...upload,
        highlightUpload: shouldHighlight,
        // Keep navigateIntent on quiet partner rows so sidebar "New data"
        // (and overview pins) still mark every matching section.
      };
    });
}
