'use client';

import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { cn } from '@common/ui/utils';
import {
  resolveVaultPrivacyMode,
  upsertVaultPrivacyRule,
  VAULT_PRIVACY_CHANGED,
} from '@/utils/vaultPrivacyPolicy';
import { saveVaultPrivacy, fetchVaultPrivacy } from '@/libs/api/vaultPrivacy';
import { getCachedVaultPrivacy } from '@/utils/vaultPrivacyPolicy';

type Props = {
  sectionId: string;
  subsectionId?: string | null;
  className?: string;
  /** Single-line checkbox + label. Description stays on the title tooltip. */
  compact?: boolean;
};

/**
 * Per-subsection: save on the server (NOK can receive if granted) or keep on this device.
 */
export function VaultPrivacySaveToggle({
  sectionId,
  subsectionId,
  className,
  compact = false,
}: Props) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick(value => value + 1);
    window.addEventListener(VAULT_PRIVACY_CHANGED, bump);
    return () => window.removeEventListener(VAULT_PRIVACY_CHANGED, bump);
  }, []);

  if (!sectionId) return null;

  const mode = resolveVaultPrivacyMode({
    sectionId,
    subsectionId,
  });
  const saveOnServer = mode === 'server';

  const onToggle = async (checked: boolean) => {
    upsertVaultPrivacyRule({
      sectionId,
      subsectionId: subsectionId || null,
      mode: checked ? 'server' : 'device_only',
      shareWithNok: checked,
    });
    try {
      await saveVaultPrivacy(getCachedVaultPrivacy());
    } catch {
      await fetchVaultPrivacy().catch(() => null);
    }
  };

  const hint = saveOnServer
    ? 'Next of Kin can see this if you granted the section. Uncheck to keep it on this device only.'
    : 'Stored on this device only: not uploaded, and never shown in the Next of Kin view.';

  return (
    <label
      title={hint}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-full border bg-white',
        saveOnServer ? 'border-[#E4EAF0]' : 'border-[#B4761A]/35 bg-[#FDF4E4]',
        compact ? 'px-2 py-1' : 'items-start rounded-xl px-3 py-2',
        className,
      )}
    >
      <input
        type="checkbox"
        className="h-4 w-4 shrink-0 rounded border-[#E4EAF0] text-[#213D59] focus:ring-[#213D59]"
        checked={saveOnServer}
        onChange={event => void onToggle(event.target.checked)}
      />
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-[12px] font-semibold leading-none text-[#213D59]">
          <Shield className="h-3.5 w-3.5 shrink-0" />
          Save on the server
        </span>
        {compact ? null : (
          <span className="mt-0.5 block text-[11px] leading-snug text-[#6A7481]">
            {hint}
          </span>
        )}
      </span>
    </label>
  );
}
