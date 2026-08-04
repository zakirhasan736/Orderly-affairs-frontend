import { secureFetch } from '@/libs/secureFetch';
import {
  decryptJson,
  encryptJson,
  isE2eeUnlocked,
  type E2eeStatus,
} from '@/libs/e2ee/crypto';

/** Map legacy /sections/... path to E2EE gateway slug */
export function sectionPathToSlug(path: string): string | null {
  const m = path.match(/\/sections\/([^/?#]+)/);
  return m ? m[1] : null;
}

export async function fetchE2eeStatus(): Promise<E2eeStatus> {
  const res = await secureFetch('/auth/e2ee/status');
  if (!res.ok) return { enabled: false };
  return res.json();
}

export async function postE2eeSetup(body: {
  salt_b64: string;
  wrapped_dek_b64: string;
  kdf: string;
  kdf_iterations: number;
  wrap_alg: string;
}) {
  const res = await secureFetch('/auth/e2ee/setup', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || 'E2EE setup failed');
  }
  return res.json();
}

export async function postE2eeRewrap(body: {
  salt_b64: string;
  wrapped_dek_b64: string;
  kdf: string;
  kdf_iterations: number;
  wrap_alg: string;
}) {
  const res = await secureFetch('/auth/e2ee/rewrap', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || 'E2EE rewrap failed');
  }
  return res.json();
}

export async function fetchE2eeMigrationStatus(): Promise<{
  enabled: boolean;
  legacy_v2: number;
  e2ee_v3: number;
  migration_complete?: boolean;
}> {
  const res = await secureFetch('/auth/e2ee/migration-status');
  if (!res.ok) return { enabled: false, legacy_v2: 0, e2ee_v3: 0 };
  return res.json();
}

/** All vault section API path segments used by the E2EE gateway. */
export const VAULT_SECTION_PATHS = [
  '/sections/section1-vital-information',
  '/sections/section5-vehicles',
  '/sections/section6-main-residence',
  '/sections/section7-insurance-policies',
  '/sections/section8-community-membership',
  '/sections/section9-charitable-giving',
  '/sections/section10-education-accomplishments',
  '/sections/section11-military-service',
  '/sections/section12-banking-financial-accounts',
  '/sections/section13-passwords-online-accounts',
  '/sections/section14-investment-accounts',
  '/sections/section15-health-information',
  '/sections/section16-credit-cards-debt',
  '/sections/section17-family-treasured-connections',
  '/sections/section18-employment-business',
  '/sections/section19-assets-valuables',
  '/sections/section20-legal-document-records',
  '/sections/section21-estate-planning-finalwishes',
] as const;

/**
 * Re-save legacy (v2) sections as client E2EE (v3). Safe no-op when unlocked and already v3.
 */
export async function migrateLegacySectionsToE2ee(): Promise<{
  migrated: number;
  skipped: number;
  failed: number;
}> {
  if (!isE2eeUnlocked()) return { migrated: 0, skipped: 0, failed: 0 };
  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  for (const path of VAULT_SECTION_PATHS) {
    try {
      const json = await getVaultSection(path);
      if (!json || (typeof json === 'object' && !Object.keys(json).length)) {
        skipped += 1;
        continue;
      }
      if (json.e2ee || json.encryption_version === 3) {
        skipped += 1;
        continue;
      }
      const payload = json.data !== undefined ? json.data : json;
      if (
        payload == null ||
        (typeof payload === 'object' && !Object.keys(payload as object).length)
      ) {
        skipped += 1;
        continue;
      }
      await saveVaultSection(path, payload);
      migrated += 1;
    } catch {
      failed += 1;
    }
  }
  return { migrated, skipped, failed };
}

export async function postE2eeNokWrap(body: {
  nok_user_id: string;
  salt_b64: string;
  wrapped_dek_b64: string;
  kdf: string;
  kdf_iterations: number;
  wrap_alg: string;
}) {
  const res = await secureFetch('/auth/e2ee/nok-wrap', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || 'NOK E2EE wrap failed');
  }
  return res.json();
}

/**
 * Load a vault section: decrypt client-side when E2EE unlocked / server returns ciphertext.
 */
export async function getVaultSection(legacyPath: string): Promise<any> {
  const slug = sectionPathToSlug(legacyPath);
  const useE2ee = isE2eeUnlocked() && slug;
  const url = useE2ee ? `/e2ee/vault/${slug}` : legacyPath;
  const res = await secureFetch(url);
  if (!res.ok) throw new Error(`Failed to load section (${res.status})`);
  const json = await res.json();
  if (!json || (typeof json === 'object' && !Object.keys(json).length)) {
    return {};
  }
  if (json.e2ee && json.ciphertext) {
    const data = await decryptJson(json.ciphertext);
    return { section_key: json.section_key, data, e2ee: true, encryption_version: 3 };
  }
  return json;
}

/**
 * Save vault section: encrypt client-side when unlocked.
 */
export async function saveVaultSection(
  legacyPath: string,
  payload: unknown,
): Promise<any> {
  const slug = sectionPathToSlug(legacyPath);
  if (isE2eeUnlocked() && slug) {
    const ciphertext = await encryptJson(payload);
    const res = await secureFetch(`/e2ee/vault/${slug}`, {
      method: 'POST',
      body: JSON.stringify({ e2ee: true, ciphertext }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || 'E2EE save failed');
    }
    return res.json();
  }
  const res = await secureFetch(legacyPath, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save section');
  return res.json();
}

/** Decrypt kit.sections[] entries that are E2EE ciphertext. */
export async function decryptKitSections<T extends { sections?: any[] }>(
  kit: T,
): Promise<T> {
  if (!kit?.sections?.length || !isE2eeUnlocked()) return kit;
  const sections = await Promise.all(
    kit.sections.map(async (s: any) => {
      if (s?.e2ee && s?.ciphertext) {
        const data = await decryptJson(s.ciphertext);
        return { ...s, data, e2ee: true };
      }
      return s;
    }),
  );
  return { ...kit, sections };
}
