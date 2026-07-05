import { secureFetch } from '@/libs/secureFetch';

export async function getSection15() {
  const res = await secureFetch('/sections/section15-health-information');
  if (!res.ok) throw new Error('Failed to load Section 15');
  return res.json();
}

export async function saveSection15(payload: any) {
  const res = await secureFetch('/sections/section15-health-information', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save Section 15');
  return res.json();
}

export async function deleteSection15() {
  const res = await secureFetch('/sections/section15-health-information', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 15');
}
