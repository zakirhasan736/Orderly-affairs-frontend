import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

export async function getSection9() {
  return getVaultSection('/sections/section9-charitable-giving');
}

export async function saveSection9(payload: any) {
  return saveVaultSection('/sections/section9-charitable-giving', payload);
}

export async function deleteSection9() {
  const res = await secureFetch('/sections/section9-charitable-giving', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 9');
}
