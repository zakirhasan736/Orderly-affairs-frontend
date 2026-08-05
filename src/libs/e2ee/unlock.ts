import {
  unlockOrSetupE2ee,
  lockE2ee,
  isE2eeUnlocked,
  rewrapDekForNewPassword,
  setE2eeAutoLockHandler,
  tryRestoreSessionDek,
} from '@/libs/e2ee/crypto';
import {
  fetchE2eeStatus,
  postE2eeSetup,
  postE2eeRewrap,
  migrateLegacySectionsToE2ee,
} from '@/libs/e2ee/vaultApi';

export type VaultUnlockResult = {
  unlocked: boolean;
  created: boolean;
  migrated: number;
  failed: number;
  legacy_remaining: number;
  migration_complete: boolean;
};

/** Unlock or create vault DEK after owner/NOK password authentication. */
export async function unlockVaultWithPassword(
  password: string,
): Promise<VaultUnlockResult> {
  const empty: VaultUnlockResult = {
    unlocked: false,
    created: false,
    migrated: 0,
    failed: 0,
    legacy_remaining: -1,
    migration_complete: false,
  };
  if (!password) return empty;

  try {
    // Prefer an already-unlocked / same-tab restored DEK when possible.
    if (!isE2eeUnlocked()) {
      await tryRestoreSessionDek();
    }

    const { created } = await unlockOrSetupE2ee(
      password,
      fetchE2eeStatus,
      postE2eeSetup,
    );
    if (!isE2eeUnlocked()) {
      return { ...empty, created };
    }

    let migrated = 0;
    let failed = 0;
    let legacy_remaining = -1;
    let migration_complete = false;

    // Only the owner migrates legacy rows — family/NOK share the same DEK wrap.
    const status = await fetchE2eeStatus().catch(() => null);
    if (status?.role === 'owner') {
      // Loops internally until migration_complete (or no progress).
      const result = await migrateLegacySectionsToE2ee();
      migrated = result.migrated;
      failed = result.failed;
      legacy_remaining = result.legacy_remaining;
      migration_complete = result.migration_complete;
      if (typeof window !== 'undefined' && (migrated > 0 || migration_complete)) {
        console.info(
          migration_complete
            ? `E2EE migration complete (${migrated} upgraded this session)`
            : `E2EE migrated ${migrated}; ${result.legacy_remaining} still legacy after ${result.passes} pass(es)`,
        );
      }
    }

    return {
      unlocked: true,
      created,
      migrated,
      failed,
      legacy_remaining,
      migration_complete,
    };
  } catch (err) {
    console.warn('E2EE unlock skipped:', err);
    if (!isE2eeUnlocked()) lockE2ee();
    throw err;
  }
}

/** After a password change while the vault is unlocked, re-wrap the same DEK. */
export async function rewrapVaultForNewPassword(
  newPassword: string,
): Promise<void> {
  if (!newPassword || !isE2eeUnlocked()) return;
  const wrap = await rewrapDekForNewPassword(newPassword);
  await postE2eeRewrap(wrap);
}

export {
  lockE2ee,
  isE2eeUnlocked,
  setE2eeAutoLockHandler,
  migrateLegacySectionsToE2ee,
  tryRestoreSessionDek,
};
