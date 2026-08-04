import { secureFetch } from '@/libs/secureFetch';
import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';

export async function getSection1() {
  return getVaultSection('/sections/section1-vital-information');
}

export async function saveSection1(payload: any) {
  return saveVaultSection('/sections/section1-vital-information', payload);
}

export async function deleteSection1() {
  await secureFetch('/sections/section1-vital-information', {
    method: 'DELETE',
  });
}
