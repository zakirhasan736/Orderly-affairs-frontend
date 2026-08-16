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
export const OPEN_AI_REVIEW_FILL = 'orderly-open-ai-review-fill';

export type VaultDocumentAction = {
  action: 'review' | 'preview';
  fileId?: string;
  sectionId?: string;
  fileName?: string;
  mimeType?: string;
};

export type OpenAiReviewFillDetail = {
  fileId?: string;
  sectionId?: string;
  fileName?: string;
  mimeType?: string;
  from?: 'overview' | 'section';
};

/** Reopen the Review & fill popup the user deferred with Review later. */
export function openAiReviewFill(detail: OpenAiReviewFillDetail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(OPEN_AI_REVIEW_FILL, { detail }),
  );
}

let pendingVaultDocumentAction: VaultDocumentAction | null = null;

/** Open Vault Activity on Docs and focus one document's Review or View. */
export function requestVaultDocumentAction(detail: VaultDocumentAction) {
  pendingVaultDocumentAction = detail;
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(OPEN_VAULT_ACTIVITY_TAB_EVENT, {
      detail: { tab: 'docs' as const, ...detail },
    }),
  );
}

export function consumePendingVaultDocumentAction(): VaultDocumentAction | null {
  const next = pendingVaultDocumentAction;
  pendingVaultDocumentAction = null;
  return next;
}
