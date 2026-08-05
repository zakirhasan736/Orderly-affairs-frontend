import { validateMessageMediaSize } from '@/utils/mediaUpload';
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

async function readErrorMessage(res: Response, fallback: string) {
  return readSafeErrorMessage(res, fallback);
}

async function uploadMessageMediaViaApi(
  file: File | Blob,
): Promise<MessageMediaUploadResult> {
  const formData = new FormData();
  const uploadFile =
    file instanceof File
      ? file
      : new File([file], `message-media-${Date.now()}`, {
          type: file.type || 'application/octet-stream',
        });
  formData.append('file', uploadFile);

  let res: Response;
  try {
    res = await secureFetch('/message/media', {
      method: 'POST',
      headers: {},
      body: formData,
    });
  } catch {
    throw new Error(
      'Could not upload media. Check your connection and try again.',
    );
  }

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, 'Could not save media. Please try again.'),
    );
  }

  const result = (await res.json()) as MessageMediaUploadResult;
  return {
    url: result.url,
    public_id: result.public_id || result.s3_key,
    s3_key: result.s3_key,
    s3_bucket: result.s3_bucket,
    storage: result.storage || (result.s3_key ? 's3' : 'cloudinary'),
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

export async function uploadMessageMedia(
  file: File | Blob,
): Promise<MessageMediaUploadResult> {
  validateMessageMediaSize(file.size);

  if (!file.size) {
    throw new Error(
      'That file is empty. Please pick another video, audio, or photo.',
    );
  }

  // All new message media goes through the API → S3 path.
  return uploadMessageMediaViaApi(file);
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
