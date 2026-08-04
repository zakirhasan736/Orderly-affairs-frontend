import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

export async function getSection21() {
  return getVaultSection('/sections/section21-estate-planning-final-wishes');
}

export async function saveSection21(payload: any) {
  return saveVaultSection('/sections/section21-estate-planning-final-wishes', payload);
}

export async function deleteSection21() {
  const res = await secureFetch('/sections/section21-estate-planning-final-wishes', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 21');
}
