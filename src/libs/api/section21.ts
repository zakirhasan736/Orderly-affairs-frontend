import { secureFetch } from '@/libs/secureFetch';

export async function getSection21() {
  const res = await secureFetch('/sections/section21-estate-planning-final-wishes');
  if (!res.ok) throw new Error('Failed to load Section 21');
  return res.json();
}

export async function saveSection21(payload: any) {
  const res = await secureFetch('/sections/section21-estate-planning-final-wishes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save Section 21');
  return res.json();
}

export async function deleteSection21() {
  const res = await secureFetch('/sections/section21-estate-planning-final-wishes', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 21');
}
