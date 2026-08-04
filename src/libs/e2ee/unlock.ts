import {
  unlockOrSetupE2ee,
  lockE2ee,
  isE2eeUnlocked,
  rewrapDekForNewPassword,
} from '@/libs/e2ee/crypto';
import {
  fetchE2eeStatus,
  postE2eeSetup,
  postE2eeRewrap,
  migrateLegacySectionsToE2ee,
} from '@/libs/e2ee/vaultApi';

/** Unlock or create vault DEK after owner/NOK password authentication. */
export async function unlockVaultWithPassword(password: string): Promise<void> {
  if (!password) return;
  try {
    const { created } = await unlockOrSetupE2ee(
      password,
      fetchE2eeStatus,
      postE2eeSetup,
    );
    if (isE2eeUnlocked()) {
      // Migrate legacy server-AES rows to client E2EE in the background.
      void migrateLegacySectionsToE2ee()
        .then(result => {
          if (result.migrated > 0 && typeof window !== 'undefined') {
            console.info(
              `E2EE migrated ${result.migrated} section(s)` +
                (created ? ' (new vault key)' : ''),
            );
          }
        })
        .catch(() => undefined);
    }
  } catch (err) {
    // Wrong password unwrap or server off — leave locked; sections fall back to legacy.
    console.warn('E2EE unlock skipped:', err);
    if (!isE2eeUnlocked()) lockE2ee();
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

export { lockE2ee, isE2eeUnlocked };
