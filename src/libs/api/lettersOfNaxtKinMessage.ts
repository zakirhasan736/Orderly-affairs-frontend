import {
  validateMessageMediaSize,
  blobToMediaFile,
  blobToPhotoFile,
  prepareMessageMediaFile,
} from '@/utils/mediaUpload';
import { secureFetch } from '@/libs/secureFetch';
import { readSafeErrorMessage } from '@/utils/sanitizeApiError';

export type MessageMediaUploadResult = {
  url: string;
  public_id?: string;
  s3_key?: string;
  s3_bucket?: string;
  storage?: string;
  type: string;
  format?: string;
  size?: number;
  access_mode?: string;
  mime_type?: string;
  folder_uuid?: string;
};

export type MessageMediaKind = 'video' | 'audio' | 'image';

async function readErrorMessage(res: Response, fallback: string) {
  // Prefer actionable backend detail for storage failures (even in production).
  try {
    const payload = await res.clone().json();
    const detail = payload?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail.trim();
    }
    if (typeof payload?.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }
  } catch {
    /* fall through */
  }
  return readSafeErrorMessage(res, fallback);
}

function normalizeUploadFile(
  file: File | Blob,
  kind: MessageMediaKind = 'video',
): File {
  if (file instanceof File) {
    if (kind === 'image' || file.type.startsWith('image/')) {
      return prepareMessageMediaFile(file, 'video');
    }
    return prepareMessageMediaFile(file, kind === 'audio' ? 'audio' : 'video');
  }
  if (kind === 'image') {
    return blobToPhotoFile(file);
  }
  return blobToMediaFile(file, kind === 'audio' ? 'audio' : 'video');
}

async function uploadMessageMediaViaApi(
  file: File | Blob,
  kind: MessageMediaKind = 'video',
): Promise<MessageMediaUploadResult> {
  const uploadFile = normalizeUploadFile(file, kind);
  const formData = new FormData();
  formData.append('file', uploadFile);
  formData.append(
    'kind',
    uploadFile.type.startsWith('image/') ? 'image' : kind === 'audio' ? 'audio' : 'video',
  );

  let res: Response;
  try {
    // Do not set Content-Type — the browser must add the multipart boundary.
    res = await secureFetch('/message/media', {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error(
      'Could not upload media. Check your connection and try again.',
    );
  }

  if (!res.ok) {
    // Nginx often returns HTML 413 before the API — make that obvious.
    if (res.status === 413) {
      const text = await res.clone().text().catch(() => '');
      if (/request entity too large|413/i.test(text) || !text.trim().startsWith('{')) {
        throw new Error(
          'Recording is too large for the server upload limit. Ask support to raise nginx client_max_body_size to at least 160m, or record a shorter clip.',
        );
      }
    }
    const detail = await readErrorMessage(
      res,
      'Could not save media. Please try again.',
    );
    if (res.status === 413 || res.status === 507) {
      throw new Error(detail);
    }
    if (res.status === 503) {
      throw new Error(
        detail ||
          'Media storage is not configured. Ask support to enable S3 for messages.',
      );
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        detail ||
          'Your session could not upload media. Please sign in again and retry.',
      );
    }
    throw new Error(detail);
  }

  const result = (await res.json()) as MessageMediaUploadResult;
  const s3Key = result.s3_key || result.public_id;
  if (!s3Key || !result.url) {
    throw new Error(
      'Media uploaded but S3 did not return a playback URL. Please try again.',
    );
  }
  return {
    url: result.url,
    public_id: result.public_id || s3Key,
    s3_key: s3Key,
    s3_bucket: result.s3_bucket,
    storage: result.storage || (s3Key ? 's3' : 'cloudinary'),
    type: result.type,
    format: result.format,
    size: result.size,
    mime_type: result.mime_type,
    folder_uuid: result.folder_uuid,
    access_mode: result.access_mode || 'private',
  };
}

async function getMessageMediaSignedUrl(
  publicId?: string,
  resourceType?: string,
  opts?: { s3_key?: string; storage?: string; s3_bucket?: string },
): Promise<string | null> {
  try {
    const res = await secureFetch('/message/media/signed-url', {
      method: 'POST',
      body: JSON.stringify({
        public_id: publicId,
        s3_key: opts?.s3_key,
        storage: opts?.storage,
        s3_bucket: opts?.s3_bucket,
        resource_type: resourceType,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string };
    return data.url || null;
  } catch {
    return null;
  }
}

export async function createMessage(payload: any) {
  const res = await secureFetch('/message', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getMessages() {
  const res = await secureFetch('/message');
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateMessage(id: string, payload: any) {
  const res = await secureFetch(`/message/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteMessage(id: string) {
  const res = await secureFetch(`/message/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function clearAllMessages() {
  const res = await secureFetch('/message', { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteMessageMedia(id: string) {
  const res = await secureFetch(`/message/${id}/media`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * Upload recorded or picked message media (audio / video / photo).
 * Always goes through POST /message/media → S3.
 */
export async function uploadMessageMedia(
  file: File | Blob,
  kind: MessageMediaKind = 'video',
): Promise<MessageMediaUploadResult> {
  validateMessageMediaSize(file.size);

  if (!file.size) {
    throw new Error(
      'That file is empty. Please pick another video, audio, or photo.',
    );
  }

  return uploadMessageMediaViaApi(file, kind);
}

export async function deleteUploadedMessageMedia(
  publicId?: string,
  resourceType?: string,
  opts?: { s3_key?: string; storage?: string },
) {
  const res = await secureFetch('/message/media/delete', {
    method: 'POST',
    body: JSON.stringify({
      public_id: publicId,
      s3_key: opts?.s3_key,
      storage: opts?.storage,
      resource_type: resourceType,
    }),
  });

  if (!res.ok) {
    throw new Error(
      await readSafeErrorMessage(res, 'Could not delete media. Please try again.'),
    );
  }
  return res.json();
}

/** Refresh a signed / presigned playback URL for message media. */
export async function refreshMessageMediaUrl(
  publicId?: string,
  resourceType?: string,
  opts?: { s3_key?: string; storage?: string; s3_bucket?: string },
): Promise<string | null> {
  return getMessageMediaSignedUrl(publicId, resourceType, opts);
}
