import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

export async function getSection8() {
  return getVaultSection('/sections/section8-community-membership');
}

export async function saveSection8(payload: any) {
  return saveVaultSection('/sections/section8-community-membership', payload);
}

export async function deleteSection8() {
  const res = await secureFetch('/sections/section8-community-membership', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 8');
}
