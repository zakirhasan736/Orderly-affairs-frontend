const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function saveSection11(token: string, payload: any) {
  const res = await fetch(`${API_BASE}/sections/section11-military-service`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Failed to save Section 11');
  return res.json();
}

export async function getSection11(token: string) {
  const res = await fetch(`${API_BASE}/sections/section11-military-service`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to load Section 11');
  return res.json();
}
