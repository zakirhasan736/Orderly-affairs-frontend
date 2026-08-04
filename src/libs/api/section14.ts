import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

export async function getSection14() {
  return getVaultSection('/sections/section14-investment-accounts');
}

export async function saveSection14(payload: any) {
  return saveVaultSection('/sections/section14-investment-accounts', payload);
}

export async function deleteSection14() {
  const res = await secureFetch('/sections/section14-investment-accounts', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 14');
}
