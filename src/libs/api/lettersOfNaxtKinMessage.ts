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
  max_bytes: number;
};

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format?: string;
  bytes?: number;
};

async function readErrorMessage(res: Response, fallback: string) {
  return readSafeErrorMessage(res, fallback);
}

async function getMessageMediaUploadSignature(
  fileSize: number,
  resourceType: 'video' | 'image' = 'video',
): Promise<MessageMediaUploadSignature> {
  const res = await secureFetch(
    `/message/media/signature?file_size=${fileSize}&resource_type=${resourceType}`,
  );

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Could not prepare media upload'));
  }

  return res.json();
}

async function uploadMessageMediaToCloudinary(
  file: File | Blob,
  signature: MessageMediaUploadSignature,
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signature.api_key);
  formData.append('timestamp', String(signature.timestamp));
  formData.append('signature', signature.signature);
  formData.append('folder', signature.folder);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${signature.cloud_name}/${signature.resource_type}/upload`;
  const res = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Cloudinary upload failed'));
  }

  const result = (await res.json()) as CloudinaryUploadResult;

  return {
    url: result.secure_url,
    public_id: result.public_id,
    type: result.resource_type,
    format: result.format,
    size: result.bytes,
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

export async function uploadMessageMedia(file: File | Blob) {
  validateMessageMediaSize(file.size);

  const mime = file.type || '';
  const name = file instanceof File ? file.name : '';
  const resourceType =
    mime.startsWith('image/') ||
    /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(name)
      ? 'image'
      : mime.startsWith('audio/') || /\.(mp3|m4a|wav|aac|ogg)$/i.test(name)
        ? 'video' // Cloudinary stores audio under the video resource type
        : 'video';

  const signature = await getMessageMediaUploadSignature(file.size, resourceType);
  return uploadMessageMediaToCloudinary(file, signature);
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

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
