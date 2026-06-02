const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

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

export async function deleteMessageMedia(token: string, id: string) {
  const res = await fetch(`${API_BASE}/message/${id}/media`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadMessageMedia(token: string, file: File | Blob) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/message/media`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Media upload failed');
  }

  return res.json();
}

export async function deleteUploadedMessageMedia(
  token: string,
  publicId: string,
) {
  const res = await fetch(`${API_BASE}/message/media/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ public_id: publicId }),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
