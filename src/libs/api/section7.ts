import { secureFetch } from '@/libs/secureFetch';

export async function getSection7() {
  const res = await secureFetch('/sections/section7-insurance-policies');
  if (!res.ok) throw new Error('Failed to load Section 7');
  return res.json();
}

export async function saveSection7(payload: any) {
  const res = await secureFetch('/sections/section7-insurance-policies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save Section 7');
  return res.json();
}

export async function deleteSection7() {
  const res = await secureFetch('/sections/section7-insurance-policies', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 7');
}
