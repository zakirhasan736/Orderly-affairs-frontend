// src/services/aiAutofill.ts

import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getOwnerToken() {
  const token = Cookies.get('auth_token');

  if (!token) {
    throw new Error('You are not logged in. Please log in again.');
  }

  return token;
}

export async function autofillSectionFromDocument(payload: {
  section: string;
  file_id: string;
  subsection?: string | null;
}) {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');
  }

  const token = getOwnerToken();

  console.log('AI autofill token exists:', Boolean(token));

  const res = await fetch(`${API_BASE_URL}/ai/autofill-section`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      section: payload.section,
      file_id: payload.file_id,
      subsection: payload.subsection || null,
    }),
  });

  let json: any = null;

  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    console.error('AI autofill failed:', res.status, json);

    if (res.status === 401) {
      throw new Error('Login expired or token invalid. Please log in again.');
    }

    throw new Error(json?.detail || 'AI autofill failed');
  }

  return json as {
    success: boolean;
    section: string;
    scope: 'section' | 'subsection';
    subsection: string | null;
    result: any;
  };
}
