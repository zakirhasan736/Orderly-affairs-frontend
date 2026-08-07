import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

/**
 * Must match the FastAPI route currently deployed in production
 * (`section20-legal-documents-records`). Backend also accepts the
 * E2EE slug `section20-legal-document-records` once aliases are deployed.
 */
const SECTION20_PATH = '/sections/section20-legal-documents-records';

export async function getSection20() {
  return getVaultSection(SECTION20_PATH);
}

export async function saveSection20(payload: any) {
  return saveVaultSection(SECTION20_PATH, payload);
}

export async function deleteSection20() {
  const res = await secureFetch(SECTION20_PATH, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 20');
}
