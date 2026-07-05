import { secureFetch } from '@/libs/secureFetch';

export async function getSection12() {
  const res = await secureFetch('/sections/section12-banking-financial-accounts');
  if (!res.ok) throw new Error('Failed to load Section 12');
  return res.json();
}

export async function saveSection12(payload: any) {
  const res = await secureFetch('/sections/section12-banking-financial-accounts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save Section 12');
  return res.json();
}

export async function deleteSection12() {
  const res = await secureFetch('/sections/section12-banking-financial-accounts', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 12');
}
