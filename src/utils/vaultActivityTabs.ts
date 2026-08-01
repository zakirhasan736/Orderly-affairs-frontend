/**
 * Shared tab ids for the header vault activity dialog.
 * Legacy aliases (inbox/files/reminders) still resolve for older callers.
 */
export type VaultActivityTab = 'alerts' | 'docs' | 'dues';

export type VaultActivityTabInput =
  | VaultActivityTab
  | 'inbox'
  | 'files'
  | 'reminders';

export function normalizeVaultActivityTab(
  tab?: VaultActivityTabInput | null,
): VaultActivityTab {
  if (tab === 'docs' || tab === 'files') return 'docs';
  if (tab === 'dues' || tab === 'reminders') return 'dues';
  return 'alerts';
}

export const OPEN_VAULT_ACTIVITY_TAB_EVENT = 'orderly-open-ai-inbox-tab';
