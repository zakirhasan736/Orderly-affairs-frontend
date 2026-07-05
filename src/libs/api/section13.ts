import { secureFetch } from '@/libs/secureFetch';

export async function getSection13() {
  const res = await secureFetch('/sections/section13-passwords-online-accounts');
  if (!res.ok) throw new Error('Failed to load Section 13');
  return res.json();
}

export async function saveSection13(payload: any) {
  const res = await secureFetch('/sections/section13-passwords-online-accounts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save Section 13');
  return res.json();
}

export async function deleteSection13() {
  const res = await secureFetch('/sections/section13-passwords-online-accounts', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 13');
}
