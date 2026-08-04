import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

export async function getSection18() {
  return getVaultSection('/sections/section18-employment-business');
}

export async function saveSection18(payload: any) {
  return saveVaultSection('/sections/section18-employment-business', payload);
}

export async function deleteSection18() {
  const res = await secureFetch('/sections/section18-employment-business', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 18');
}
