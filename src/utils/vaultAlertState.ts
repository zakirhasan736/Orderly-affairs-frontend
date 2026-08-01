/**
 * Client-side read / unread / dismiss state for vault activity items
 * that are not already covered by dashboardNotifications (notices).
 *
 * - Due-date reminders (expiry alerts)
 * - Uploaded vault documents (files tab)
 */

const REMINDER_READ_KEY = 'oa_vault_reminder_read_v1';
const REMINDER_DISMISSED_KEY = 'oa_vault_reminder_dismissed_v1';
const FILE_READ_KEY = 'oa_vault_file_read_v1';
const FILE_DISMISSED_KEY = 'oa_vault_file_dismissed_v1';
const AI_REVIEW_READ_KEY = 'oa_vault_ai_review_read_v1';

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

function emitAlertStateChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('orderly-vault-alerts-changed'));
  }
}

function markId(storageKey: string, id: string) {
  if (!id) return;
  const next = readIdSet(storageKey);
  next.add(id);
  writeIdSet(storageKey, next);
  emitAlertStateChanged();
}

function unmarkId(storageKey: string, id: string) {
  if (!id) return;
  const next = readIdSet(storageKey);
  next.delete(id);
  writeIdSet(storageKey, next);
  emitAlertStateChanged();
}

function markMany(storageKey: string, ids: string[]) {
  const next = readIdSet(storageKey);
  ids.forEach(id => {
    if (id) next.add(id);
  });
  writeIdSet(storageKey, next);
  emitAlertStateChanged();
}

/* ── Due-date reminders ───────────────────────────────────────── */

export function isReminderRead(id: string): boolean {
  return readIdSet(REMINDER_READ_KEY).has(id);
}

export function markReminderRead(id: string) {
  markId(REMINDER_READ_KEY, id);
}

export function markReminderUnread(id: string) {
  unmarkId(REMINDER_READ_KEY, id);
}

export function markAllRemindersRead(ids: string[]) {
  markMany(REMINDER_READ_KEY, ids);
}

export function isReminderDismissed(id: string): boolean {
  return readIdSet(REMINDER_DISMISSED_KEY).has(id);
}

export function dismissReminder(id: string) {
  markId(REMINDER_DISMISSED_KEY, id);
  markId(REMINDER_READ_KEY, id);
}

export function restoreReminder(id: string) {
  unmarkId(REMINDER_DISMISSED_KEY, id);
}

export function filterVisibleReminders<T extends { id: string }>(
  items: T[],
): T[] {
  const dismissed = readIdSet(REMINDER_DISMISSED_KEY);
  return items.filter(item => !dismissed.has(item.id));
}

/* ── Vault documents (uploads) ────────────────────────────────── */

export function fileAlertKey(item: {
  fileId?: string | null;
  id?: string | null;
}): string {
  const fileId = String(item.fileId || '').trim();
  if (fileId) return `file:${fileId}`;
  return `id:${String(item.id || '').trim()}`;
}

export function isFileRead(key: string): boolean {
  return readIdSet(FILE_READ_KEY).has(key);
}

export function markFileRead(key: string) {
  markId(FILE_READ_KEY, key);
}

export function markFileUnread(key: string) {
  unmarkId(FILE_READ_KEY, key);
}

export function markAllFilesRead(keys: string[]) {
  markMany(FILE_READ_KEY, keys);
}

export function isFileDismissed(key: string): boolean {
  return readIdSet(FILE_DISMISSED_KEY).has(key);
}

export function dismissFile(key: string) {
  markId(FILE_DISMISSED_KEY, key);
  markId(FILE_READ_KEY, key);
}

export function filterVisibleFiles<T extends { fileId?: string; id: string }>(
  items: T[],
): T[] {
  const dismissed = readIdSet(FILE_DISMISSED_KEY);
  return items.filter(item => !dismissed.has(fileAlertKey(item)));
}

/* ── AI review items (seen without Accept) ────────────────────── */

export function aiReviewKey(sectionId: string, fileId?: string | null): string {
  return `${sectionId}:${fileId || 'any'}`;
}

export function isAiReviewRead(sectionId: string, fileId?: string | null): boolean {
  return readIdSet(AI_REVIEW_READ_KEY).has(aiReviewKey(sectionId, fileId));
}

export function markAiReviewRead(sectionId: string, fileId?: string | null) {
  markId(AI_REVIEW_READ_KEY, aiReviewKey(sectionId, fileId));
}

export function markAiReviewUnread(sectionId: string, fileId?: string | null) {
  unmarkId(AI_REVIEW_READ_KEY, aiReviewKey(sectionId, fileId));
}

export function markAllAiReviewsRead(
  items: { sectionId: string; fileId?: string | null }[],
) {
  markMany(
    AI_REVIEW_READ_KEY,
    items.map(item => aiReviewKey(item.sectionId, item.fileId)),
  );
}
