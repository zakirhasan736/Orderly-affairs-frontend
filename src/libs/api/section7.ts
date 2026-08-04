import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

export async function getSection7() {
  return getVaultSection('/sections/section7-insurance-policies');
}

export async function saveSection7(payload: any) {
  return saveVaultSection('/sections/section7-insurance-policies', payload);
}

export async function deleteSection7() {
  const res = await secureFetch('/sections/section7-insurance-policies', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 7');
}
