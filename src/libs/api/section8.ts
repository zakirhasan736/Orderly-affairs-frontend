import { secureFetch } from '@/libs/secureFetch';

export async function getSection8() {
  const res = await secureFetch('/sections/section8-community-membership');
  if (!res.ok) throw new Error('Failed to load Section 8');
  return res.json();
}

export async function saveSection8(payload: any) {
  const res = await secureFetch('/sections/section8-community-membership', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save Section 8');
  return res.json();
}

export async function deleteSection8() {
  const res = await secureFetch('/sections/section8-community-membership', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 8');
}
