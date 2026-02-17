const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function uploadFile(token: string, file: File) {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE}/uploads`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export async function deleteUpload(token: string, public_id: string) {
  await fetch(`${API_BASE}/uploads/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ public_id }),
  });
}
