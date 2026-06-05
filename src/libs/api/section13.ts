// src/api/section13.ts

import { sanitizeSectionPayload } from '@/utils/sectionUploadFields';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const UPLOAD_KEYS = ['account_documents'] as const;

export async function saveSection13(token: string, payload: any) {
  const res = await fetch(
    `${API_BASE}/sections/section13-passwords-online-accounts`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(
        sanitizeSectionPayload(payload, '13A', UPLOAD_KEYS),
      ),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to save Section 13: ${text}`);
  }

  return res.json();
}

export async function getSection13(token: string) {
  const res = await fetch(
    `${API_BASE}/sections/section13-passwords-online-accounts`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to load Section 13: ${text}`);
  }

  return res.json();
}

export async function deleteSection13(token: string) {
  const res = await fetch(
    `${API_BASE}/sections/section13-passwords-online-accounts`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to delete Section 13: ${text}`);
  }

  return res.json();
}
