import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

export async function getSection20() {
  return getVaultSection('/sections/section20-legal-documents-records');
}

export async function saveSection20(payload: any) {
  return saveVaultSection('/sections/section20-legal-documents-records', payload);
}

export async function deleteSection20() {
  const res = await secureFetch('/sections/section20-legal-documents-records', {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 20');
}
