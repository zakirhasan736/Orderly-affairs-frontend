import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

export async function getSection10() {
  return getVaultSection('/sections/section10-education-accomplishments');
}

export async function saveSection10(payload: any) {
  return saveVaultSection('/sections/section10-education-accomplishments', payload);
}

export async function deleteSection10() {
  const res = await secureFetch('/sections/section10-education-accomplishments', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 10');
}
