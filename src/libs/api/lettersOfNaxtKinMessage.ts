import { validateMessageMediaSize } from '@/utils/mediaUpload';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

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
  try {
    const payload = await res.json();
    return payload?.error?.message || payload?.detail || payload?.message || fallback;
  } catch {
    const text = await res.text();
    return text || fallback;
  }
}

async function getMessageMediaUploadSignature(
  token: string,
  fileSize: number,
  resourceType: 'video' | 'image' = 'video',
): Promise<MessageMediaUploadSignature> {
  const res = await fetch(
    `${API_BASE}/message/media/signature?file_size=${fileSize}&resource_type=${resourceType}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
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
    throw new Error(
      await readErrorMessage(res, 'Cloudinary upload failed'),
    );
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

/* ---------------- CREATE ---------------- */
export async function createMessage(token: string, payload: any) {
  const res = await fetch(`${API_BASE}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ---------------- GET ---------------- */
export async function getMessages(token: string) {
  const res = await fetch(`${API_BASE}/message`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ---------------- UPDATE ---------------- */
export async function updateMessage(token: string, id: string, payload: any) {
  const res = await fetch(`${API_BASE}/message/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ---------------- DELETE ---------------- */
export async function deleteMessage(token: string, id: string) {
  const res = await fetch(`${API_BASE}/message/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function clearAllMessages(token: string) {
  const res = await fetch(`${API_BASE}/message`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteMessageMedia(token: string, id: string) {
  const res = await fetch(`${API_BASE}/message/${id}/media`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadMessageMedia(token: string, file: File | Blob) {
  validateMessageMediaSize(file.size);

  const resourceType =
    file.type?.startsWith('image/') ||
    (file instanceof File &&
      /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name))
      ? 'image'
      : 'video';

  const signature = await getMessageMediaUploadSignature(
    token,
    file.size,
    resourceType,
  );
  return uploadMessageMediaToCloudinary(file, signature);
}

export async function deleteUploadedMessageMedia(
  token: string,
  publicId: string,
  resourceType?: string,
) {
  const res = await fetch(`${API_BASE}/message/media/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      public_id: publicId,
      resource_type: resourceType,
    }),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
