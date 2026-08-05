'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@common/ui/button';
import { getSafeErrorMessage } from '@/utils/safeErrorMessage';
import {
  decryptKitSections,
  kitHasLockedE2eeSections,
} from '@/libs/e2ee/vaultApi';

type VaultGate = 'checking' | 'ready' | 'needs_unlock' | 'needs_owner_wrap';

/**
 * Decrypt NOK kit sections; surface unlock UI when E2EE ciphertext is locked.
 */
export function useNokKitDecrypt(kitRaw: unknown) {
  const [kit, setKit] = useState<any>(null);
  const [vaultGate, setVaultGate] = useState<VaultGate>('checking');
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockBusy, setUnlockBusy] = useState(false);

  const decryptRaw = useCallback(async (raw: any) => {
    const { tryRestoreSessionDek, isE2eeUnlocked } = await import(
      '@/libs/e2ee/unlock'
    );
    await tryRestoreSessionDek();
    const { fetchE2eeStatus, kitHasLockedE2eeSections, decryptKitSections } =
      await import('@/libs/e2ee/vaultApi');
    const status = await fetchE2eeStatus().catch(() => null);

    // Server AES mode: kit already has plaintext `data` for v2 rows.
    if (!status?.enabled) {
      try {
        if (isE2eeUnlocked() && kitHasLockedE2eeSections(raw)) {
          const decoded = await decryptKitSections(raw);
          return { kit: decoded, gate: 'ready' as const };
        }
      } catch {
        /* fall through */
      }
      if (kitHasLockedE2eeSections(raw)) {
        return {
          kit: raw,
          gate: isE2eeUnlocked() ? ('ready' as const) : ('needs_unlock' as const),
        };
      }
      return { kit: raw, gate: 'ready' as const };
    }

    if (!isE2eeUnlocked()) {
      if (status?.enabled && status?.configured) {
        return { kit: raw, gate: 'needs_unlock' as const };
      }
      if (status?.enabled && !status?.configured) {
        return { kit: raw, gate: 'needs_owner_wrap' as const };
      }
    }
    try {
      const decoded = await decryptKitSections(raw);
      if (kitHasLockedE2eeSections(decoded) && !isE2eeUnlocked()) {
        return { kit: decoded, gate: 'needs_unlock' as const };
      }
      return { kit: decoded, gate: 'ready' as const };
    } catch (err) {
      if (err instanceof Error && err.message === 'VAULT_LOCKED') {
        return { kit: raw, gate: 'needs_unlock' as const };
      }
      throw err;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!kitRaw) {
        setKit(null);
        setVaultGate('checking');
        return;
      }
      setVaultGate('checking');
      try {
        const result = await decryptRaw(kitRaw);
        if (cancelled) return;
        setKit(result.kit);
        setVaultGate(result.gate);
      } catch {
        if (!cancelled) {
          setKit(kitRaw);
          setVaultGate('needs_unlock');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kitRaw, decryptRaw]);

  const handleUnlock = useCallback(async () => {
    const pw = unlockPassword.trim();
    if (!pw) {
      toast.error('Enter your Next-of-Kin login password to unlock sections');
      return;
    }
    setUnlockBusy(true);
    try {
      const { unlockVaultWithPassword, isE2eeUnlocked } = await import(
        '@/libs/e2ee/unlock'
      );
      await unlockVaultWithPassword(pw);
      if (!isE2eeUnlocked()) {
        toast.error(
          'Could not unlock. Ask the owner to edit your access and re-save your password while their vault is unlocked.',
        );
        setVaultGate('needs_owner_wrap');
        return;
      }
      if (kitRaw) {
        const decoded = await decryptKitSections(kitRaw as any);
        setKit(decoded);
      }
      setUnlockPassword('');
      setVaultGate('ready');
      toast.success('Vault unlocked — loading your access sections');
    } catch (err) {
      toast.error(getSafeErrorMessage(err, 'Could not unlock the vault'));
    } finally {
      setUnlockBusy(false);
    }
  }, [unlockPassword, kitRaw]);

  return {
    kit,
    vaultGate,
    unlockPassword,
    setUnlockPassword,
    unlockBusy,
    handleUnlock,
  };
}

export function NokVaultUnlockBanner({
  vaultGate,
  unlockPassword,
  setUnlockPassword,
  unlockBusy,
  onUnlock,
}: {
  vaultGate: VaultGate;
  unlockPassword: string;
  setUnlockPassword: (value: string) => void;
  unlockBusy: boolean;
  onUnlock: () => void;
}) {
  if (vaultGate !== 'needs_unlock' && vaultGate !== 'needs_owner_wrap') {
    return null;
  }

  return (
    <div className="mx-auto mb-4 max-w-[1480px] rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
      <p className="font-semibold">Encrypted sections are locked</p>
      <p className="mt-1 text-amber-900/80">
        {vaultGate === 'needs_owner_wrap'
          ? 'The owner has not shared the vault encryption key with your account yet. Ask them to open Access / Family settings, edit your invite, enter your password, and save while their vault is unlocked.'
          : 'Enter the same password you used to sign in to view the sections the owner shared with you.'}
      </p>
      {vaultGate === 'needs_unlock' && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="password"
            autoComplete="current-password"
            value={unlockPassword}
            onChange={e => setUnlockPassword(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onUnlock();
              }
            }}
            placeholder="Your login password"
            className="h-10 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-amber-400 sm:max-w-xs"
          />
          <Button
            type="button"
            className="rounded-xl"
            disabled={unlockBusy}
            onClick={onUnlock}
          >
            {unlockBusy ? 'Unlocking…' : 'Unlock vault'}
          </Button>
        </div>
      )}
    </div>
  );
}
