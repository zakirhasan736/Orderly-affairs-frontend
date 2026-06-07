const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function saveSection5(token: string, payload: any) {
  const res = await fetch(`${API_BASE}/sections/section5-vehicles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let detail = 'Failed to save Section 5';
    try {
      const payload = await res.json();
      detail = payload?.detail ? JSON.stringify(payload.detail) : detail;
    } catch {
      const text = await res.text();
      if (text) detail = text;
    }
    throw new Error(detail);
  }
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
