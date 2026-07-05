import { secureFetch } from '@/libs/secureFetch';

export async function getSection10() {
  const res = await secureFetch('/sections/section10-education-accomplishments');
  if (!res.ok) throw new Error('Failed to load Section 10');
  return res.json();
}

export async function saveSection10(payload: any) {
  const res = await secureFetch('/sections/section10-education-accomplishments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save Section 10');
  return res.json();
}

export async function deleteSection10() {
  const res = await secureFetch('/sections/section10-education-accomplishments', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 10');
}
