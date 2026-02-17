const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function saveSection9(token: string, payload: any) {
  const res = await fetch(`${API_BASE}/sections/section9-charitable-giving`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Failed to save Section 9');
  return res.json();
}

export async function getSection9(token: string) {
  const res = await fetch(`${API_BASE}/sections/section9-charitable-giving`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to load Section 9');
  return res.json();
}
