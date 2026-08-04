import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

export async function getSection5() {
  return getVaultSection('/sections/section5-vehicles');
}

export async function saveSection5(payload: any) {
  return saveVaultSection('/sections/section5-vehicles', payload);
}

export async function deleteSection5() {
  const res = await secureFetch('/sections/section5-vehicles', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 5');
}
