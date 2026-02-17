const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

/* ---------------- SAVE ---------------- */

export async function saveSection18(token: string, payload: any) {
  const res = await fetch(
    `${API_BASE}/sections/section18-employment-business`,
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

export async function getSection18(token: string) {
  const res = await fetch(
    `${API_BASE}/sections/section18-employment-business`,
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

export async function deleteSection18(token: string) {
  const res = await fetch(
    `${API_BASE}/sections/section18-employment-business`,
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
