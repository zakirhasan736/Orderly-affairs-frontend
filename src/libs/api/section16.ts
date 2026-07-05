import { secureFetch } from '@/libs/secureFetch';

export async function getSection16() {
  const res = await secureFetch('/sections/section16-credit-cards-debt');
  if (!res.ok) throw new Error('Failed to load Section 16');
  return res.json();
}

export async function saveSection16(payload: any) {
  const res = await secureFetch('/sections/section16-credit-cards-debt', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save Section 16');
  return res.json();
}

export async function deleteSection16() {
  const res = await secureFetch('/sections/section16-credit-cards-debt', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 16');
}
