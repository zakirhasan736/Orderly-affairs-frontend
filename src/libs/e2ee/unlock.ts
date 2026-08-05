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
  migrateE2eeSectionsToServerAes,
} from '@/libs/e2ee/vaultApi';

export type VaultUnlockResult = {
  unlocked: boolean;
  created: boolean;
  migrated: number;
  failed: number;
  legacy_remaining: number;
  migration_complete: boolean;
  converted_to_server_aes?: number;
};

/** Unlock after owner/NOK password auth. Converts leftover v3 → server AES. */
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
    converted_to_server_aes: 0,
  };
  if (!password) return empty;

  try {
    if (!isE2eeUnlocked()) {
      await tryRestoreSessionDek();
    }

    const statusBefore = await fetchE2eeStatus().catch(() => null);
    const { created } = await unlockOrSetupE2ee(
      password,
      fetchE2eeStatus,
      postE2eeSetup,
    );

    let migrated = 0;
    let failed = 0;
    let legacy_remaining = -1;
    let migration_complete = false;
    let converted_to_server_aes = 0;

    if (isE2eeUnlocked()) {
      // Preferred product mode: server AES-256-GCM for family/NOK sharing.
      // Convert any leftover client-E2EE rows while DEK is briefly available.
      const convert = await migrateE2eeSectionsToServerAes();
      converted_to_server_aes = convert.migrated;
      failed += convert.failed;

      // Only push v2→v3 when client E2EE write mode is explicitly on.
      if (statusBefore?.enabled && statusBefore.client_write !== false) {
        const status = await fetchE2eeStatus().catch(() => null);
        if (status?.role === 'owner') {
          const result = await migrateLegacySectionsToE2ee();
          migrated = result.migrated;
          failed += result.failed;
          legacy_remaining = result.legacy_remaining;
          migration_complete = result.migration_complete;
        }
      } else {
        migration_complete = convert.remaining_v3 === 0;
        legacy_remaining = 0;
        // Shared-access mode: DEK no longer needed after conversion.
        lockE2ee();
      }
    }

    return {
      unlocked: isE2eeUnlocked() || converted_to_server_aes > 0 || !statusBefore?.enabled,
      created,
      migrated,
      failed,
      legacy_remaining,
      migration_complete,
      converted_to_server_aes,
    };
  } catch (err) {
    console.warn('Vault unlock skipped:', err);
    if (!isE2eeUnlocked()) lockE2ee();
    throw err;
  }
}

/** After a password change while the vault is unlocked, re-wrap the same DEK. */
export async function rewrapVaultForNewPassword(
  newPassword: string,
): Promise<void> {
  if (!newPassword || !isE2eeUnlocked()) return;
  const status = await fetchE2eeStatus().catch(() => null);
  if (!status?.enabled || status.client_write === false) return;
  const wrap = await rewrapDekForNewPassword(newPassword);
  await postE2eeRewrap(wrap);
}

export {
  lockE2ee,
  isE2eeUnlocked,
  setE2eeAutoLockHandler,
  migrateLegacySectionsToE2ee,
  migrateE2eeSectionsToServerAes,
  tryRestoreSessionDek,
};
