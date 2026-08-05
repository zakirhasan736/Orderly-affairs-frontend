import { isE2eeUnlocked, wrapDekForNokPassword } from '@/libs/e2ee/crypto';
import { fetchE2eeStatus, postE2eeNokWrap } from '@/libs/e2ee/vaultApi';

export type ShareVaultDekResult =
  | { ok: true; shared: boolean }
  | { ok: false; reason: 'locked' | 'missing_password' | 'failed'; error?: string };

/**
 * Share the owner's vault DEK with a family/NOK collaborator so they can
 * decrypt granted E2EE sections after login.
 */
export async function shareVaultDekWithCollaborator(args: {
  collaboratorId: string;
  password: string;
  /** When true, fail if vault is locked instead of skipping. */
  requireUnlocked?: boolean;
}): Promise<ShareVaultDekResult> {
  const collaboratorId = String(args.collaboratorId || '').trim();
  const password = String(args.password || '').trim();
  if (!collaboratorId) {
    return { ok: false, reason: 'failed', error: 'Missing collaborator id' };
  }
  if (!password) {
    return { ok: false, reason: 'missing_password' };
  }

  const status = await fetchE2eeStatus().catch(() => null);
  if (!status?.enabled || !status?.configured) {
    // E2EE off / not set up — nothing to wrap.
    return { ok: true, shared: false };
  }

  if (!isE2eeUnlocked()) {
    if (args.requireUnlocked) {
      return { ok: false, reason: 'locked' };
    }
    return { ok: false, reason: 'locked' };
  }

  try {
    const wrap = await wrapDekForNokPassword(password);
    await postE2eeNokWrap({ nok_user_id: collaboratorId, ...wrap });
    return { ok: true, shared: true };
  } catch (error) {
    return {
      ok: false,
      reason: 'failed',
      error: error instanceof Error ? error.message : 'Vault key share failed',
    };
  }
}

export async function ownerVaultMustBeUnlockedForShare(): Promise<boolean> {
  const status = await fetchE2eeStatus().catch(() => null);
  return Boolean(status?.enabled && status?.configured && !isE2eeUnlocked());
}
