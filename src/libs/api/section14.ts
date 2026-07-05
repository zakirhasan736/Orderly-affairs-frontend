import { secureFetch } from '@/libs/secureFetch';

export async function getSection14() {
  const res = await secureFetch('/sections/section14-investment-accounts');
  if (!res.ok) throw new Error('Failed to load Section 14');
  return res.json();
}

export async function saveSection14(payload: any) {
  const res = await secureFetch('/sections/section14-investment-accounts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save Section 14');
  return res.json();
}

export async function deleteSection14() {
  const res = await secureFetch('/sections/section14-investment-accounts', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 14');
}
