export type UploadedAIFile = {
  file_id: string;
  mime_type: string;
  expires_at?: string;
};

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
