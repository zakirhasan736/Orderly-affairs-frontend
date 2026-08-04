import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

export async function getSection19() {
  return getVaultSection('/sections/section19-assets-valuables');
}

export async function saveSection19(payload: any) {
  return saveVaultSection('/sections/section19-assets-valuables', payload);
}

export async function deleteSection19() {
  const res = await secureFetch('/sections/section19-assets-valuables', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 19');
}
