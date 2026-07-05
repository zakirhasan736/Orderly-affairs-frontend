import { secureFetch } from '@/libs/secureFetch';

export async function getSection18() {
  const res = await secureFetch('/sections/section18-employment-business');
  if (!res.ok) throw new Error('Failed to load Section 18');
  return res.json();
}

export async function saveSection18(payload: any) {
  const res = await secureFetch('/sections/section18-employment-business', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save Section 18');
  return res.json();
}

export async function deleteSection18() {
  const res = await secureFetch('/sections/section18-employment-business', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 18');
}
