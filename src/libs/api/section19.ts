const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

/* ---------------- SAVE ---------------- */

export async function saveSection19(token: string, payload: any) {
  const res = await fetch(`${API_BASE}/sections/section19-assets-valuables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

/* ---------------- GET ---------------- */

export async function getSection19(token: string) {
  const res = await fetch(`${API_BASE}/sections/section19-assets-valuables`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

/* ---------------- DELETE ---------------- */

export async function deleteSection19(token: string) {
  const res = await fetch(`${API_BASE}/sections/section19-assets-valuables`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}
