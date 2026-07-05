import { secureFetch } from '@/libs/secureFetch';

export async function getSection1() {
  const res = await secureFetch('/sections/section1-vital-information');
  if (!res.ok) throw new Error('Failed to load Section 1');
  return res.json();
}

export async function saveSection1(payload: any) {
  const res = await secureFetch('/sections/section1-vital-information', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save Section 1');
  return res.json();
}

export async function deleteSection1() {
  await secureFetch('/sections/section1-vital-information', {
    method: 'DELETE',
  });
}
