import { secureFetch } from '@/libs/secureFetch';

export async function getSection6() {
  const res = await secureFetch('/sections/section6-main-residence');
  if (!res.ok) throw new Error('Failed to load Section 6');
  return res.json();
}

export async function saveSection6(payload: any) {
  const res = await secureFetch('/sections/section6-main-residence', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save Section 6');
  return res.json();
}

export async function deleteSection6() {
  const res = await secureFetch('/sections/section6-main-residence', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 6');
}
