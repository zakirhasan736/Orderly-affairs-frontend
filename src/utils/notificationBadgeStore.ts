/**
 * External store for the header notification badge.
 * LocalStorage + window events are not reactive props; useSyncExternalStore
 * is required so React (and the React Compiler) re-render when mark-as-read runs.
 */

const BADGE_EVENTS = [
  'orderly-notices-read-changed',
  'orderly-vault-alerts-changed',
  'orderly-ai-patch-stashed',
  'orderly-ai-section-reviewed',
  'orderly-ai-section-persisted',
  'storage',
] as const;

const SNAPSHOT_KEYS = [
  'oa_dashboard_notice_read_v1',
  'oa_dashboard_notice_dismissed_v1',
  'oa_vault_ai_review_read_v1',
  'orderly_dashboard_ai_patches',
] as const;

export function subscribeNotificationBadge(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => onStoreChange();
  for (const eventName of BADGE_EVENTS) {
    window.addEventListener(eventName, handler);
  }
  return () => {
    for (const eventName of BADGE_EVENTS) {
      window.removeEventListener(eventName, handler);
    }
  };
}

export function getNotificationBadgeSnapshot(): string {
  if (typeof window === 'undefined') return '';
  try {
    return SNAPSHOT_KEYS.map(key => window.localStorage.getItem(key) || '').join(
      '\u0001',
    );
  } catch {
    return '';
  }
}

export function getNotificationBadgeServerSnapshot(): string {
  return '';
}
