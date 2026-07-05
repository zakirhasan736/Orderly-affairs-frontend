import { secureFetch } from '@/libs/secureFetch';

export async function getSection20() {
  const res = await secureFetch('/sections/section20-legal-documents-records');
  if (!res.ok) throw new Error('Failed to load Section 20');
  return res.json();
}

export async function saveSection20(payload: any) {
  const res = await secureFetch('/sections/section20-legal-documents-records', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save Section 20');
  return res.json();
}

export async function deleteSection20() {
  const res = await secureFetch('/sections/section20-legal-documents-records', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 20');
}
