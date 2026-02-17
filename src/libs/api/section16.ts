const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

/* -------------------------------------------------------
   SAVE SECTION 16
   Payload shape:
   {
     "16A": [ {...credit card}, ... ],
     "16B": [ {...debt}, ... ]
   }
------------------------------------------------------- */

export async function saveSection16(token: string, payload: any) {
  const res = await fetch(`${API_BASE}/sections/section16-credit-cards-debt`, {
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

/* -------------------------------------------------------
   GET SECTION 16
------------------------------------------------------- */

export async function getSection16(token: string) {
  const res = await fetch(`${API_BASE}/sections/section16-credit-cards-debt`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

/* -------------------------------------------------------
   DELETE SECTION 16
------------------------------------------------------- */

export async function deleteSection16(token: string) {
  const res = await fetch(`${API_BASE}/sections/section16-credit-cards-debt`, {
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
