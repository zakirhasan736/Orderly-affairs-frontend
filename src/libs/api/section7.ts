const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function saveSection7(token: string, payload: any) {
  const res = await fetch(`${API_BASE}/sections/section7-insurance-policies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Failed to save Section 7');
  return res.json();
}

export async function getSection7(token: string) {
  const res = await fetch(`${API_BASE}/sections/section7-insurance-policies`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to load Section 7');
  return res.json();
}
