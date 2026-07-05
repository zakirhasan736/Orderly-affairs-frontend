import { secureFetch } from '@/libs/secureFetch';

export async function getSection9() {
  const res = await secureFetch('/sections/section9-charitable-giving');
  if (!res.ok) throw new Error('Failed to load Section 9');
  return res.json();
}

export async function saveSection9(payload: any) {
  const res = await secureFetch('/sections/section9-charitable-giving', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save Section 9');
  return res.json();
}

export async function deleteSection9() {
  const res = await secureFetch('/sections/section9-charitable-giving', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 9');
}
