/**
 * Unified dashboard notification items for the header bell dropdown.
 */

import {
  collectOverviewExpiryAlerts,
  OVERVIEW_REMINDER_HORIZON_DAYS,
  type OverviewExpiryAlert,
} from '@/utils/overviewExpiryAlerts';

export type DashboardNoticeCategory =
  | 'reminder'
  | 'message'
  | 'notice'
  | 'billing'
  | 'event';

export type DashboardNotice = {
  id: string;
  category: DashboardNoticeCategory;
  title: string;
  body: string;
  tone: 'critical' | 'warn' | 'info';
  sectionId?: string;
  at: number;
};

const READ_KEY = 'oa_dashboard_notice_read_v1';
const TOASTED_KEY = 'oa_dashboard_notice_toasted_v1';
const DISMISSED_KEY = 'oa_dashboard_notice_dismissed_v1';

function readIdSet(storageKey: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter(item => typeof item === 'string'));
  } catch {
    return new Set();
  }
}

function writeIdSet(storageKey: string, ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify([...ids]));
  } catch {
    /* ignore quota */
  }
}

function emitNoticesChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('orderly-notices-read-changed'));
  }
}

export function getReadNoticeIds(): Set<string> {
  return readIdSet(READ_KEY);
}

export function getDismissedNoticeIds(): Set<string> {
  return readIdSet(DISMISSED_KEY);
}

export function isNoticeRead(id: string): boolean {
  return getReadNoticeIds().has(id);
}

export function markNoticeRead(id: string) {
  const next = getReadNoticeIds();
  next.add(id);
  writeIdSet(READ_KEY, next);
  emitNoticesChanged();
}

export function markNoticeUnread(id: string) {
  const next = getReadNoticeIds();
  next.delete(id);
  writeIdSet(READ_KEY, next);
  emitNoticesChanged();
}

export function markAllNoticesRead(ids: string[]) {
  const next = getReadNoticeIds();
  ids.forEach(id => next.add(id));
  writeIdSet(READ_KEY, next);
  emitNoticesChanged();
}

export function dismissNotice(id: string) {
  const next = getDismissedNoticeIds();
  next.add(id);
  writeIdSet(DISMISSED_KEY, next);
  // Dismissed counts as read for the badge.
  markNoticeRead(id);
}

export function filterVisibleNotices(
  notices: DashboardNotice[],
  max = 10,
): DashboardNotice[] {
  const dismissed = getDismissedNoticeIds();
  return notices.filter(notice => !dismissed.has(notice.id)).slice(0, max);
}

export function getToastedNoticeIds(): Set<string> {
  return readIdSet(TOASTED_KEY);
}

export function markNoticeToasted(id: string) {
  const next = getToastedNoticeIds();
  next.add(id);
  writeIdSet(TOASTED_KEY, next);
}

function daysBetween(iso?: string | null): number | null {
  if (!iso) return null;
  const end = Date.parse(iso);
  if (!Number.isFinite(end)) return null;
  const ms = end - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function buildExpiryNotices(
  formData: Record<string, unknown> | null | undefined,
): DashboardNotice[] {
  const alerts = collectOverviewExpiryAlerts(formData, {
    limit: 40,
    withinDays: OVERVIEW_REMINDER_HORIZON_DAYS,
  });
  return alerts.map((alert: OverviewExpiryAlert) => ({
    id: `expiry-${alert.id}`,
    category: 'reminder' as const,
    title: alert.label || 'Expiry reminder',
    body: alert.text,
    tone:
      alert.tone === 'critical'
        ? 'critical'
        : alert.tone === 'ok' || alert.tone === 'info'
          ? 'info'
          : 'warn',
    sectionId: alert.sectionId,
    at: Date.parse(alert.expiryIso) || Date.now(),
  }));
}

export function buildBillingNotices(billing: {
  is_trial?: boolean;
  trial_end?: string | null;
  status?: string | null;
  has_payment_method?: boolean;
  lock_message?: string | null;
} | null | undefined): DashboardNotice[] {
  if (!billing) return [];
  const items: DashboardNotice[] = [];
  const daysLeft = daysBetween(billing.trial_end);

  if (billing.is_trial && daysLeft != null) {
    if (daysLeft < 0) {
      items.push({
        id: 'billing-trial-ended',
        category: 'billing',
        title: 'Trial ended',
        body: 'Your free trial has ended. Add billing to keep vault access.',
        tone: 'critical',
        sectionId: 'vault-settings',
        at: Date.now(),
      });
    } else if (daysLeft <= 9) {
      items.push({
        id: 'billing-trial-ending',
        category: 'billing',
        title: 'Trial ending soon',
        body:
          daysLeft === 0
            ? 'Your free trial ends today — add a card to avoid a pause'
            : `Your trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — add a card to avoid a pause`,
        tone: daysLeft <= 3 ? 'critical' : 'warn',
        sectionId: 'vault-settings',
        at: Date.now(),
      });
    }
  }

  if (
    billing.status === 'paused' ||
    billing.status === 'past_due' ||
    billing.status === 'canceled' ||
    billing.status === 'unpaid'
  ) {
    items.push({
      id: `billing-status-${billing.status}`,
      category: 'billing',
      title: 'Billing attention needed',
      body:
        billing.lock_message ||
        `Your subscription is ${billing.status.replace('_', ' ')}. Review billing in Vault Settings.`,
      tone: 'critical',
      sectionId: 'vault-settings',
      at: Date.now(),
    });
  }

  if (
    billing.is_trial &&
    !billing.has_payment_method &&
    daysLeft != null &&
    daysLeft <= 5 &&
    daysLeft >= 0
  ) {
    items.push({
      id: 'billing-add-card',
      category: 'billing',
      title: 'Add a payment method',
      body: 'No card on file yet. Add one before the trial ends to avoid interruption.',
      tone: 'warn',
      sectionId: 'vault-settings',
      at: Date.now() - 1,
    });
  }

  return items;
}

export function buildMessageNotices(
  pendingCount: number,
): DashboardNotice[] {
  if (pendingCount <= 0) return [];
  return [
    {
      // Stable id — count belongs in the body only, or mark-as-read never sticks.
      id: 'messages-pending',
      category: 'message',
      title: 'Personal messages',
      body: `${pendingCount} draft message${pendingCount === 1 ? '' : 's'} waiting in Messages.`,
      tone: 'info',
      sectionId: '4',
      at: Date.now(),
    },
  ];
}

export function buildEventNotices(opts: {
  pendingNokName?: string | null;
  supportUnread?: number;
}): DashboardNotice[] {
  const items: DashboardNotice[] = [];
  if (opts.pendingNokName) {
    items.push({
      id: 'event-nok-access',
      category: 'event',
      title: 'Access request',
      body: `${opts.pendingNokName} is waiting for you to approve their role`,
      tone: 'warn',
      sectionId: '2',
      at: Date.now(),
    });
  }
  if (opts.supportUnread && opts.supportUnread > 0) {
    items.push({
      // Stable id — unread count belongs in the body only.
      id: 'event-support',
      category: 'notice',
      title: 'Support reply',
      body: `You have ${opts.supportUnread} new live support message${opts.supportUnread === 1 ? '' : 's'}.`,
      tone: 'info',
      at: Date.now(),
    });
  }
  return items;
}

export function mergeDashboardNotices(
  lists: DashboardNotice[][],
): DashboardNotice[] {
  const seen = new Set<string>();
  const merged: DashboardNotice[] = [];
  for (const list of lists) {
    for (const item of list) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged.sort((a, b) => {
    const toneRank = { critical: 0, warn: 1, info: 2 } as const;
    const tr = toneRank[a.tone] - toneRank[b.tone];
    if (tr !== 0) return tr;
    return b.at - a.at;
  });
}
