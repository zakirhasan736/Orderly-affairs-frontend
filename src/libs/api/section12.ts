const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function saveSection12(token: string, payload: any) {
  const res = await fetch(
    `${API_BASE}/sections/section12-banking-financial-accounts`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) throw new Error('Failed to save Section 12');
  return res.json();
}

export async function getSection12(token: string) {
  const res = await fetch(
    `${API_BASE}/sections/section12-banking-financial-accounts`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!res.ok) throw new Error('Failed to load Section 12');
  return res.json();
}
