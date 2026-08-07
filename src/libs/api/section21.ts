import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

/**
 * Must match the FastAPI route currently deployed in production
 * (`section21-estate-planning-final-wishes`). Backend also accepts the
 * E2EE slug `…-finalwishes` once aliases are deployed.
 */
const SECTION21_PATH = '/sections/section21-estate-planning-final-wishes';

export async function getSection21() {
  return getVaultSection(SECTION21_PATH);
}

export async function saveSection21(payload: any) {
  return saveVaultSection(SECTION21_PATH, payload);
}

export async function deleteSection21() {
  const res = await secureFetch(SECTION21_PATH, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete Section 21');
}
