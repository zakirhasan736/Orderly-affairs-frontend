'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchE2eeMigrationStatus,
  migrateLegacySectionsToE2ee,
} from '@/libs/e2ee/vaultApi';
import { isE2eeUnlocked } from '@/libs/e2ee/crypto';

type Props = {
  /** Only owners migrate; hide for family/NOK. */
  enabled?: boolean;
  /** Auto-run migrate when unlocked and legacy remains. */
  autoMigrate?: boolean;
};

/**
 * Shows remaining server-AES (v2) sections and migrates until complete.
 * AES-256-GCM is fine either way — this moves key custody to the browser (v3).
 */
export function E2eeMigrationBanner({
  enabled = true,
  autoMigrate = true,
}: Props) {
  const [legacy, setLegacy] = useState<number | null>(null);
  const [v3, setV3] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [autoTried, setAutoTried] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const status = await fetchE2eeMigrationStatus().catch(() => null);
    if (!status?.enabled) {
      setLegacy(null);
      return;
    }
    setLegacy(status.legacy_v2);
    setV3(status.e2ee_v3);
    setComplete(Boolean(status.migration_complete));
  }, [enabled]);

  const runMigrate = useCallback(async () => {
    if (!isE2eeUnlocked()) {
      setMessage('Unlock your vault (sign in with password) to finish migration.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = await migrateLegacySectionsToE2ee();
      setLegacy(result.legacy_remaining);
      setComplete(result.migration_complete);
      if (result.migration_complete) {
        setMessage(
          `Migration complete — all vault sections are end-to-end encrypted (v3). Passes: ${result.passes}.`,
        );
      } else if (result.failed > 0 && result.migrated === 0) {
        setMessage(
          `Could not migrate remaining sections (${result.legacy_remaining}). Unlock vault and retry.`,
        );
      } else {
        setMessage(
          `Migrated ${result.migrated} in ${result.passes} pass(es). ${result.legacy_remaining} still on server key.`,
        );
      }
      await refresh();
    } catch {
      setMessage('Migration failed. Sign in again to unlock, then retry.');
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled || !autoMigrate || busy || autoTried) return;
    if (!isE2eeUnlocked()) return;
    if (legacy == null || legacy <= 0) return;
    setAutoTried(true);
    void runMigrate();
  }, [enabled, autoMigrate, legacy, busy, autoTried, runMigrate]);

  if (!enabled) return null;

  if (complete || legacy === 0) {
    if (!message) return null;
    return (
      <div
        role="status"
        className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
      >
        {message}
      </div>
    );
  }

  if (legacy == null || legacy <= 0) return null;

  return (
    <div
      role="status"
      className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <div className="min-w-[220px] flex-1">
        <strong>Vault encryption upgrade in progress</strong>
        <div className="mt-1 text-amber-900/85">
          {legacy} section{legacy === 1 ? '' : 's'} still use the server key
          (v2). {v3} already use end-to-end encryption (v3). Same AES-256-GCM —
          different who holds the key.
        </div>
        {message ? <div className="mt-2 text-xs">{message}</div> : null}
      </div>
      <button
        type="button"
        onClick={() => void runMigrate()}
        disabled={busy}
        className="rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-medium text-stone-50 disabled:cursor-wait disabled:opacity-70"
      >
        {busy ? 'Migrating until complete…' : 'Finish migration'}
      </button>
    </div>
  );
}
