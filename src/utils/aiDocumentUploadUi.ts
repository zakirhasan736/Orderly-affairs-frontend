export type UploadedAIFile = {
  file_id: string;
  mime_type: string;
  expires_at?: string;
  /** Original client filename when the owner uploaded the document */
  file_name?: string;
  /** Unix ms when the owner uploaded this document in the current session */
  uploaded_at?: number;
};

export type AiUploadMeta = {
  file_name?: string;
  uploaded_at?: number;
};

const AI_UPLOAD_META_STORAGE_KEY = 'orderly_ai_upload_meta';

export const AI_DOCUMENT_ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export const AI_DOCUMENT_MAX_SIZE = 15 * 1024 * 1024;

export const AI_DOCUMENT_ACCEPT =
  '.pdf,.txt,.png,.jpg,.jpeg,.webp,application/pdf,text/plain,image/png,image/jpeg,image/webp';

export const AI_DOCUMENT_TYPE_ERROR =
  'Upload PDF, TXT, PNG, JPG, JPEG, or WEBP only.';

export const AI_DOCUMENT_SIZE_ERROR = 'File too large. Max 15MB.';

export function getReadableAiDocumentType(mimeType?: string) {
  if (!mimeType) return 'Document';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'text/plain') return 'Text';
  if (mimeType.includes('image')) return 'Image';
  return mimeType;
}

export function validateAiDocumentFile(file: File) {
  if (!AI_DOCUMENT_ALLOWED_TYPES.includes(file.type as (typeof AI_DOCUMENT_ALLOWED_TYPES)[number])) {
    return AI_DOCUMENT_TYPE_ERROR;
  }

  if (file.size > AI_DOCUMENT_MAX_SIZE) {
    return AI_DOCUMENT_SIZE_ERROR;
  }

  return null;
}

export function buildUploadedAiFile(
  uploaded: {
    file_id: string;
    mime_type: string;
    expires_at?: string;
  },
  file?: File | null,
  extras?: AiUploadMeta,
): UploadedAIFile {
  const record: UploadedAIFile = {
    file_id: uploaded.file_id,
    mime_type: uploaded.mime_type,
    expires_at: uploaded.expires_at,
    file_name: extras?.file_name ?? file?.name,
    uploaded_at: extras?.uploaded_at ?? Date.now(),
  };

  rememberAiUploadMeta(record);
  return record;
}

export function formatAiUploadDate(uploadedAt?: number) {
  if (!uploadedAt || !Number.isFinite(uploadedAt)) return null;

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(uploadedAt));
  } catch {
    return new Date(uploadedAt).toLocaleString();
  }
}

function readUploadMetaMap(): Record<string, AiUploadMeta> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = sessionStorage.getItem(AI_UPLOAD_META_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, AiUploadMeta>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function rememberAiUploadMeta(file: UploadedAIFile) {
  if (typeof window === 'undefined' || !file.file_id) return;
  if (!file.file_name && !file.uploaded_at) return;

  try {
    const map = readUploadMetaMap();
    map[file.file_id] = {
      file_name: file.file_name,
      uploaded_at: file.uploaded_at,
    };
    sessionStorage.setItem(AI_UPLOAD_META_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage failures; UI still works for the current mount.
  }
}

export function getAiUploadMeta(fileId?: string | null): AiUploadMeta | null {
  if (!fileId || typeof window === 'undefined') return null;
  const map = readUploadMetaMap();
  return map[fileId] ?? null;
}

export function clearAiUploadMeta(fileId?: string | null) {
  if (!fileId || typeof window === 'undefined') return;
  try {
    const map = readUploadMetaMap();
    if (!(fileId in map)) return;
    delete map[fileId];
    sessionStorage.setItem(AI_UPLOAD_META_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function mergeAiUploadMeta(file: UploadedAIFile): UploadedAIFile {
  const meta = getAiUploadMeta(file.file_id);
  if (!meta) return file;

  return {
    ...file,
    file_name: file.file_name || meta.file_name,
    uploaded_at: file.uploaded_at || meta.uploaded_at,
  };
}
