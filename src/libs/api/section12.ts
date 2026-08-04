import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

export async function getSection12() {
  return getVaultSection('/sections/section12-banking-financial-accounts');
}

export async function saveSection12(payload: any) {
  return saveVaultSection('/sections/section12-banking-financial-accounts', payload);
}

export async function deleteSection12() {
  const res = await secureFetch('/sections/section12-banking-financial-accounts', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 12');
}
