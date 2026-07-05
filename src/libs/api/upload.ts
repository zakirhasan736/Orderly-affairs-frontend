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
