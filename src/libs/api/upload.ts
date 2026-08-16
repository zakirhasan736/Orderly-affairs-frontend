import { secureFetch } from '@/libs/secureFetch';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export type UploadedFileResult = {
  url: string;
  public_id?: string;
  name?: string;
  original_filename?: string;
  type?: string;
  mime_type?: string;
  scan_status?: string;
  scan_sanitized?: boolean;
};

export async function uploadFile(file: File): Promise<UploadedFileResult> {
  const form = new FormData();
  form.append('file', file);

  const res = await secureFetch('/uploads', {
    method: 'POST',
    body: form,
  });

  let json: { detail?: unknown; [key: string]: unknown } | null = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const detail = json?.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail
              .map((item: { msg?: string }) => item?.msg)
              .filter(Boolean)
              .join(' ')
          : '';
    throw new Error(message || 'Upload failed');
  }
  if (!json) throw new Error('Upload failed');
  const url = asString(json.url);
  if (!url) throw new Error('Upload failed');
  return {
    url,
    public_id: asString(json.public_id),
    name: asString(json.name),
    original_filename: asString(json.original_filename),
    type: asString(json.type),
    mime_type: asString(json.mime_type),
    scan_status: asString(json.scan_status),
    scan_sanitized:
      typeof json.scan_sanitized === 'boolean'
        ? json.scan_sanitized
        : undefined,
  };
}

export async function deleteUpload(public_id: string) {
  await secureFetch('/uploads/delete', {
    method: 'POST',
    body: JSON.stringify({ public_id }),
  });
}

/** Fresh presigned S3 (or legacy Cloudinary) URL for a vault attachment. */
export async function getSignedUploadUrl(
  public_id: string,
  resourceType?: string,
): Promise<{ url: string; url_expires_in?: number }> {
  const res = await secureFetch('/uploads/signed-url', {
    method: 'POST',
    body: JSON.stringify({
      public_id,
      resource_type: resourceType,
    }),
  });
  if (!res.ok) throw new Error('Could not refresh file URL');
  return res.json();
}
