const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getSection1(token: string) {
  const res = await fetch(`${API_BASE}/sections/section1-vital-information`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load Section 1');
  return res.json();
}

export async function saveSection1(token: string, payload: any) {
  const res = await fetch(`${API_BASE}/sections/section1-vital-information`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save Section 1');
  return res.json();
}

export async function deleteSection1(token: string) {
  await fetch(`${API_BASE}/sections/section1-vital-information`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
