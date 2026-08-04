import { secureFetch } from '@/libs/secureFetch';

export async function uploadFile(file: File) {
  const form = new FormData();
  form.append('file', file);

  const res = await secureFetch('/uploads', {
    method: 'POST',
    body: form,
  });

  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export async function deleteUpload(public_id: string) {
  await secureFetch('/uploads/delete', {
    method: 'POST',
    body: JSON.stringify({ public_id }),
  });
}

/** Fresh signed Cloudinary URL for an authenticated vault attachment. */
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
