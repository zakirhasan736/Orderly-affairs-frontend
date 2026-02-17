const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function saveSection15(token: string, payload: any) {
  const res = await fetch(`${API_BASE}/sections/section15-health-information`, {
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

export async function getSection15(token: string) {
  const res = await fetch(`${API_BASE}/sections/section15-health-information`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteSection15(token: string) {
  const res = await fetch(`${API_BASE}/sections/section15-health-information`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
