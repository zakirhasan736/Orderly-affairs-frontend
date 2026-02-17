const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function saveSection8(token: string, payload: any) {
  const res = await fetch(
    `${API_BASE}/sections/section8-community-membership`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) throw new Error('Failed to save Section 8');
  return res.json();
}

export async function getSection8(token: string) {
  const res = await fetch(
    `${API_BASE}/sections/section8-community-membership`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!res.ok) throw new Error('Failed to load Section 8');
  return res.json();
}
