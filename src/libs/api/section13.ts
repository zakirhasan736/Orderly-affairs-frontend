import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

export async function getSection13() {
  return getVaultSection('/sections/section13-passwords-online-accounts');
}

export async function saveSection13(payload: any) {
  return saveVaultSection('/sections/section13-passwords-online-accounts', payload);
}

export async function deleteSection13() {
  const res = await secureFetch('/sections/section13-passwords-online-accounts', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 13');
}
