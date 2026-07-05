import { secureFetch } from '@/libs/secureFetch';

export async function getSection19() {
  const res = await secureFetch('/sections/section19-assets-valuables');
  if (!res.ok) throw new Error('Failed to load Section 19');
  return res.json();
}

export async function saveSection19(payload: any) {
  const res = await secureFetch('/sections/section19-assets-valuables', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save Section 19');
  return res.json();
}

export async function deleteSection19() {
  const res = await secureFetch('/sections/section19-assets-valuables', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 19');
}
