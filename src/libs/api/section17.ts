import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

export async function getSection17() {
  return getVaultSection('/sections/section17-family-treasured-connections');
}

export async function saveSection17(payload: any) {
  return saveVaultSection('/sections/section17-family-treasured-connections', payload);
}

export async function deleteSection17() {
  const res = await secureFetch('/sections/section17-family-treasured-connections', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 17');
}
