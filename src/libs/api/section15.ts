import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

export async function getSection15() {
  return getVaultSection('/sections/section15-health-information');
}

export async function saveSection15(payload: any) {
  return saveVaultSection('/sections/section15-health-information', payload);
}

export async function deleteSection15() {
  const res = await secureFetch('/sections/section15-health-information', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 15');
}
