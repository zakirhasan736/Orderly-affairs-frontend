const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

/* ---------------- SAVE ---------------- */

export async function saveSection17(token: string, payload: any) {
  const res = await fetch(
    `${API_BASE}/sections/section17-family-treasured-connections`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

/* ---------------- GET ---------------- */

export async function getSection17(token: string) {
  const res = await fetch(
    `${API_BASE}/sections/section17-family-treasured-connections`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

/* ---------------- DELETE ---------------- */

export async function deleteSection17(token: string) {
  const res = await fetch(
    `${API_BASE}/sections/section17-family-treasured-connections`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}
