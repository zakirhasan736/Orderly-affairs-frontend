import { secureFetch } from '@/libs/secureFetch';

export async function getSection5() {
  const res = await secureFetch('/sections/section5-vehicles');
  if (!res.ok) throw new Error('Failed to load Section 5');
  return res.json();
}

export async function saveSection5(payload: any) {
  const res = await secureFetch('/sections/section5-vehicles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save Section 5');
  return res.json();
}

export async function deleteSection5() {
  const res = await secureFetch('/sections/section5-vehicles', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 5');
}
