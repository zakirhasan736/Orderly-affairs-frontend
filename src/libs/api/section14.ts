import { sanitizeSectionPayload } from '@/utils/sectionUploadFields';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const UPLOAD_KEYS = [
  'account_number',
  'advisor_contact',
  'account_documents',
] as const;

export async function saveSection14(token: string, payload: any) {
  const res = await fetch(
    `${API_BASE}/sections/section14-investment-accounts`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(
        sanitizeSectionPayload(payload, '14A', UPLOAD_KEYS),
      ),
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
