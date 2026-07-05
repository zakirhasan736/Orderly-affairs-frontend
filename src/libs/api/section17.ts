import { secureFetch } from '@/libs/secureFetch';

export async function getSection17() {
  const res = await secureFetch('/sections/section17-family-treasured-connections');
  if (!res.ok) throw new Error('Failed to load Section 17');
  return res.json();
}

export async function saveSection17(payload: any) {
  const res = await secureFetch('/sections/section17-family-treasured-connections', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save Section 17');
  return res.json();
}

export async function deleteSection17() {
  const res = await secureFetch('/sections/section17-family-treasured-connections', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 17');
}
