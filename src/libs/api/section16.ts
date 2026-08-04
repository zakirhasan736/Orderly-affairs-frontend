import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

export async function getSection16() {
  return getVaultSection('/sections/section16-credit-cards-debt');
}

export async function saveSection16(payload: any) {
  return saveVaultSection('/sections/section16-credit-cards-debt', payload);
}

export async function deleteSection16() {
  const res = await secureFetch('/sections/section16-credit-cards-debt', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 16');
}
