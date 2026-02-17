const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function saveSection5(token: string, payload: any) {
  const res = await fetch(`${API_BASE}/sections/section5-vehicles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Failed to save Section 5');
  return res.json();
}

export async function getSection5(token: string) {
  const res = await fetch(`${API_BASE}/sections/section5-vehicles`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Failed to load Section 5');
  return res.json();
}
