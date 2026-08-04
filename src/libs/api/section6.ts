import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

export async function getSection6() {
  return getVaultSection('/sections/section6-main-residence');
}

export async function saveSection6(payload: any) {
  return saveVaultSection('/sections/section6-main-residence', payload);
}

export async function deleteSection6() {
  const res = await secureFetch('/sections/section6-main-residence', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 6');
}
