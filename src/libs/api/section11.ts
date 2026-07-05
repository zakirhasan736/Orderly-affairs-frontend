import { secureFetch } from '@/libs/secureFetch';

export async function getSection11() {
  const res = await secureFetch('/sections/section11-military-service');
  if (!res.ok) throw new Error('Failed to load Section 11');
  return res.json();
}

export async function saveSection11(payload: any) {
  const res = await secureFetch('/sections/section11-military-service', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save Section 11');
  return res.json();
}

export async function deleteSection11() {
  const res = await secureFetch('/sections/section11-military-service', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 11');
}
