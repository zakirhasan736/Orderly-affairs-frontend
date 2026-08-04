import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

export async function getSection11() {
  return getVaultSection('/sections/section11-military-service');
}

export async function saveSection11(payload: any) {
  return saveVaultSection('/sections/section11-military-service', payload);
}

export async function deleteSection11() {
  const res = await secureFetch('/sections/section11-military-service', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 11');
}
