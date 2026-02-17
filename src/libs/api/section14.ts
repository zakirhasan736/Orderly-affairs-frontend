const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function saveSection14(token: string, payload: any) {
  const res = await fetch(
    `${API_BASE}/sections/section14-investment-accounts`,
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

export async function getSection14(token: string) {
  const res = await fetch(
    `${API_BASE}/sections/section14-investment-accounts`,
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

export async function deleteSection14(token: string) {
  const res = await fetch(
    `${API_BASE}/sections/section14-investment-accounts`,
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
