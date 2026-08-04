import { validateMessageMediaSize } from '@/utils/mediaUpload';
import { secureFetch } from '@/libs/secureFetch';
import { readSafeErrorMessage } from '@/utils/sanitizeApiError';

type MessageMediaUploadSignature = {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  folder: string;
  resource_type: string;
  type?: string;
  access_mode?: string;
  max_bytes: number;
};

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format?: string;
  bytes?: number;
};

export type MessageMediaUploadResult = {
  url: string;
  public_id: string;
  type: string;
  format?: string;
  size?: number;
  access_mode?: string;
};

async function readErrorMessage(res: Response, fallback: string) {
  return readSafeErrorMessage(res, fallback);
}

function resolveResourceType(file: File | Blob): 'video' | 'image' {
  const mime = file.type || '';
  const name = file instanceof File ? file.name : '';
  if (
    mime.startsWith('image/') ||
    /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(name)
  ) {
    return 'image';
  }
  // Cloudinary stores audio under the video resource type.
  return 'video';
}

async function getMessageMediaUploadSignature(
  fileSize: number,
  resourceType: 'video' | 'image' = 'video',
): Promise<MessageMediaUploadSignature> {
  let res: Response;
  try {
    res = await secureFetch(
      `/message/media/signature?file_size=${fileSize}&resource_type=${resourceType}`,
    );
  } catch {
    throw new Error(
      'Could not reach the server to prepare media upload. Check your connection and try again.',
    );
  }

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Could not prepare media upload'));
  }

  return res.json();
}

async function getMessageMediaSignedUrl(
  publicId: string,
  resourceType?: string,
): Promise<string | null> {
  try {
    const res = await secureFetch('/message/media/signed-url', {
      method: 'POST',
      body: JSON.stringify({
        public_id: publicId,
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
    public_id: result.public_id,
    type: result.type,
    format: result.format,
    size: result.size,
    access_mode: result.access_mode || 'authenticated',
  };
}

async function uploadMessageMediaToCloudinary(
  file: File | Blob,
  signature: MessageMediaUploadSignature,
): Promise<MessageMediaUploadResult> {
  if (!signature.cloud_name || !signature.api_key || !signature.signature) {
    throw new Error('Media upload is not configured. Please try again later.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signature.api_key);
  formData.append('timestamp', String(signature.timestamp));
  formData.append('signature', signature.signature);
  formData.append('folder', signature.folder);
  formData.append('type', signature.type || 'authenticated');
  formData.append('access_mode', signature.access_mode || 'authenticated');

  const uploadUrl = `https://api.cloudinary.com/v1_1/${signature.cloud_name}/${signature.resource_type}/upload`;

  let res: Response;
  try {
    res = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });
  } catch {
    // CSP / network / blocked api.cloudinary.com — fall back to API proxy.
    throw new Error('CLOUDINARY_DIRECT_BLOCKED');
  }

  if (!res.ok) {
    let detail = 'Could not save media. Please try again.';
    try {
      const payload = (await res.json()) as {
        error?: { message?: string };
        message?: string;
      };
      detail = payload?.error?.message || payload?.message || detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }

  const result = (await res.json()) as CloudinaryUploadResult;
  const signed = await getMessageMediaSignedUrl(
    result.public_id,
    result.resource_type,
  );
  if (!signed) {
    throw new Error(
      'Upload saved but secure preview URL could not be created. Please retry.',
    );
  }

  return {
    url: signed,
    public_id: result.public_id,
    type: result.resource_type,
    format: result.format,
    size: result.bytes,
    access_mode: 'authenticated',
  };
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

  const resourceType = resolveResourceType(file);

  try {
    const signature = await getMessageMediaUploadSignature(
      file.size,
      resourceType,
    );
    return await uploadMessageMediaToCloudinary(file, signature);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    // Direct Cloudinary blocked (CSP) or signature/network issues → API proxy.
    if (
      message === 'CLOUDINARY_DIRECT_BLOCKED' ||
      /failed to fetch|networkerror|load failed|csp/i.test(message)
    ) {
      return uploadMessageMediaViaApi(file);
    }
    // Prefer clear errors; still try proxy once for generic prepare failures.
    if (/prepare media upload|reach the server/i.test(message)) {
      try {
        return await uploadMessageMediaViaApi(file);
      } catch {
        throw error instanceof Error
          ? error
          : new Error('Could not upload media. Please try again.');
      }
    }
    throw error instanceof Error
      ? error
      : new Error('Could not upload media. Please try again.');
  }
}

export async function deleteUploadedMessageMedia(
  publicId: string,
  resourceType?: string,
) {
  const res = await secureFetch('/message/media/delete', {
    method: 'POST',
    body: JSON.stringify({
      public_id: publicId,
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

/** Refresh a signed playback URL for authenticated message media. */
export async function refreshMessageMediaUrl(
  publicId: string,
  resourceType?: string,
): Promise<string | null> {
  return getMessageMediaSignedUrl(publicId, resourceType);
}
