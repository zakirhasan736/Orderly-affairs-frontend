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

export type E2eeMigrationStatus = {
  enabled: boolean;
  legacy_v2: number;
  e2ee_v3: number;
  migration_complete?: boolean;
  legacy_section_ids?: string[];
  legacy_slugs?: string[];
};

export async function fetchE2eeMigrationStatus(): Promise<E2eeMigrationStatus> {
  const res = await secureFetch('/auth/e2ee/migration-status');
  if (!res.ok) return { enabled: false, legacy_v2: 0, e2ee_v3: 0 };
  return res.json();
}

/**
 * Canonical E2EE gateway slugs (must match backend VAULT_SECTIONS).
 * section20/21 aliases are also accepted by the API.
 */
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
  '/sections/section20-legal-documents-records', // FE/legacy alias
  '/sections/section21-estate-planning-finalwishes',
  '/sections/section21-estate-planning-final-wishes', // FE/legacy alias
] as const;

const MAX_MIGRATE_PASSES = 5;

/**
 * Re-save legacy (v2) sections as client E2EE (v3).
 * Loops until migration_complete (or max passes / no progress).
 */
export async function migrateLegacySectionsToE2ee(): Promise<{
  migrated: number;
  skipped: number;
  failed: number;
  legacy_remaining: number;
  migration_complete: boolean;
  passes: number;
}> {
  if (!isE2eeUnlocked()) {
    return {
      migrated: 0,
      skipped: 0,
      failed: 0,
      legacy_remaining: -1,
      migration_complete: false,
      passes: 0,
    };
  }

  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  let passes = 0;
  let legacy_remaining = -1;
  let migration_complete = false;

  const migrateOne = async (
    path: string,
  ): Promise<'migrated' | 'skipped' | 'failed'> => {
    try {
      const json = await getVaultSection(path);
      if (!json || (typeof json === 'object' && !Object.keys(json).length)) {
        return 'skipped';
      }
      if (json.e2ee || json.encryption_version === 3) {
        return 'skipped';
      }
      const payload = json.data !== undefined ? json.data : json;
      if (
        payload == null ||
        (typeof payload === 'object' && !Object.keys(payload as object).length)
      ) {
        return 'skipped';
      }
      await saveVaultSection(path, payload);
      return 'migrated';
    } catch {
      return 'failed';
    }
  };

  for (let pass = 0; pass < MAX_MIGRATE_PASSES; pass += 1) {
    passes = pass + 1;
    const status = await fetchE2eeMigrationStatus().catch(() => null);
    if (status?.migration_complete || (status && status.legacy_v2 === 0)) {
      legacy_remaining = 0;
      migration_complete = true;
      break;
    }

    const paths =
      status?.legacy_slugs && status.legacy_slugs.length > 0
        ? status.legacy_slugs.map(s => `/sections/${s}`)
        : [...VAULT_SECTION_PATHS];

    let passMigrated = 0;
    for (const path of paths) {
      let result = await migrateOne(path);
      if (result === 'failed') {
        await new Promise(r => setTimeout(r, 350));
        result = await migrateOne(path);
      }
      if (result === 'migrated') {
        migrated += 1;
        passMigrated += 1;
      } else if (result === 'skipped') skipped += 1;
      else failed += 1;
    }

    const after = await fetchE2eeMigrationStatus().catch(() => null);
    legacy_remaining = after?.legacy_v2 ?? legacy_remaining;
    migration_complete = Boolean(after?.migration_complete);

    if (migration_complete || passMigrated === 0) {
      break;
    }
  }

  return {
    migrated,
    skipped,
    failed,
    legacy_remaining,
    migration_complete,
    passes,
  };
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
    if (!isE2eeUnlocked()) {
      throw new Error(
        'Vault encryption is locked — sign in again to unlock shared sections',
      );
    }
    const decrypted = await decryptJson(json.ciphertext);
    const data =
      decrypted &&
      typeof decrypted === 'object' &&
      !Array.isArray(decrypted) &&
      'data' in (decrypted as Record<string, unknown>) &&
      (decrypted as Record<string, unknown>).data &&
      typeof (decrypted as Record<string, unknown>).data === 'object'
        ? (decrypted as { data: unknown }).data
        : decrypted;
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
