const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function saveSection6(token: string, payload: any) {
  const res = await fetch(`${API_BASE}/sections/section6-main-residence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Failed to save Section 6');
  return res.json();
}

export async function getSection6(token: string) {
  const res = await fetch(`${API_BASE}/sections/section6-main-residence`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to load Section 6');
  return res.json();
}
