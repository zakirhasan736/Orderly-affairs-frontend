/**
 * Owner + device notification preferences.
 * Device permission is always per-browser; vault push policy syncs to the server
 * so family / NOK can be prompted after login when the owner sets push Active.
 */

export type PushDeliveryState = 'active' | 'paused' | 'off';

export type SpecialDayKind = 'birthday' | 'anniversary' | 'custom';

export type SpecialDayPref = {
  kind: SpecialDayKind;
  month: number;
  day: number;
  label: string;
  enabled: boolean;
  source?: string;
};

export type NotificationPreferences = {
  /** In-app header bell / toast notices */
  inAppEnabled: boolean;
  /** Email expiry / renewal reminders */
  emailRemindersEnabled: boolean;
  /** Browser / device push when away from the dashboard */
  pushState: PushDeliveryState;
  /**
   * When push is Active, invite family collaborators and immediate-access NOK
   * to enable push on their own devices (they still must grant browser permission).
   */
  pushForCollaborators: boolean;
  /**
   * People who should get a notice when a vault section is updated.
   * null = every eligible immediate-access NOK and family collaborator.
   */
  sectionUpdateRecipientIds: string[] | null;
  /** Per-section overrides. Missing key uses sectionUpdateRecipientIds. */
  sectionUpdateRecipientsBySection: Record<string, string[]>;
  specialDaysEnabled: boolean;
  specialDays: SpecialDayPref[];
  /** Last known Notification.permission on this device */
  pushPermission: NotificationPermission | 'unsupported';
  updatedAt: number;
};

export type VaultPushPolicy = {
  state: PushDeliveryState;
  collaborators_enabled: boolean;
};

const STORAGE_KEY = 'oa_notification_preferences_v1';
export const NOTIFICATION_PREFS_CHANGED = 'orderly-notification-prefs-changed';

const COLLAB_PROMPT_KEY = 'oa_collab_push_prompt_v1';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  inAppEnabled: true,
  emailRemindersEnabled: true,
  pushState: 'off',
  pushForCollaborators: true,
  sectionUpdateRecipientIds: null,
  sectionUpdateRecipientsBySection: {},
  specialDaysEnabled: true,
  specialDays: [],
  pushPermission: 'default',
  updatedAt: 0,
};

function readRaw(): NotificationPreferences {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...parsed,
      pushState:
        parsed.pushState === 'active' ||
        parsed.pushState === 'paused' ||
        parsed.pushState === 'off'
          ? parsed.pushState
          : 'off',
      pushForCollaborators:
        typeof parsed.pushForCollaborators === 'boolean'
          ? parsed.pushForCollaborators
          : true,
      sectionUpdateRecipientIds: Array.isArray(parsed.sectionUpdateRecipientIds)
        ? parsed.sectionUpdateRecipientIds.map(String)
        : parsed.sectionUpdateRecipientIds === null
          ? null
          : DEFAULT_NOTIFICATION_PREFERENCES.sectionUpdateRecipientIds,
      sectionUpdateRecipientsBySection:
        parsed.sectionUpdateRecipientsBySection &&
        typeof parsed.sectionUpdateRecipientsBySection === 'object'
          ? Object.fromEntries(
              Object.entries(parsed.sectionUpdateRecipientsBySection).map(
                ([key, value]) => [
                  String(key),
                  Array.isArray(value) ? value.map(String) : [],
                ],
              ),
            )
          : {},
      specialDaysEnabled:
        typeof parsed.specialDaysEnabled === 'boolean'
          ? parsed.specialDaysEnabled
          : true,
      specialDays: Array.isArray(parsed.specialDays)
        ? parsed.specialDays.filter(
            (item): item is SpecialDayPref =>
              Boolean(item) &&
              typeof item === 'object' &&
              Number(item.month) >= 1 &&
              Number(item.day) >= 1,
          )
        : [],
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

function writeRaw(prefs: NotificationPreferences) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(
      new CustomEvent(NOTIFICATION_PREFS_CHANGED, { detail: prefs }),
    );
  } catch {
    /* ignore quota */
  }
}

export function getNotificationPreferences(): NotificationPreferences {
  const prefs = readRaw();
  if (typeof window !== 'undefined' && !('Notification' in window)) {
    return { ...prefs, pushPermission: 'unsupported' };
  }
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return { ...prefs, pushPermission: Notification.permission };
  }
  return prefs;
}

export function setNotificationPreferences(
  patch: Partial<NotificationPreferences>,
): NotificationPreferences {
  const next: NotificationPreferences = {
    ...getNotificationPreferences(),
    ...patch,
    updatedAt: Date.now(),
  };
  writeRaw(next);
  return next;
}

export function isPushDeliveryActive(
  prefs: NotificationPreferences = getNotificationPreferences(),
): boolean {
  if (prefs.pushState !== 'active') return false;
  if (prefs.pushPermission === 'unsupported') return false;
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission === 'granted';
  }
  return prefs.pushPermission === 'granted';
}

export function applyServerNotificationPrefs(server: {
  in_app_enabled?: boolean;
  email_reminders_enabled?: boolean;
  push_state?: string;
  push_for_collaborators?: boolean;
  section_update_recipient_ids?: string[] | null;
  section_update_recipients_by_section?: Record<string, string[] | null> | null;
  special_days_enabled?: boolean;
  special_days?: Array<{
    kind?: string;
    month?: number;
    day?: number;
    label?: string;
    enabled?: boolean;
    source?: string;
  }>;
}): NotificationPreferences {
  const pushState =
    server.push_state === 'active' ||
    server.push_state === 'paused' ||
    server.push_state === 'off'
      ? server.push_state
      : getNotificationPreferences().pushState;

  const bySection = server.section_update_recipients_by_section;
  const mappedBySection =
    bySection && typeof bySection === 'object'
      ? Object.fromEntries(
          Object.entries(bySection)
            .filter(([, value]) => Array.isArray(value))
            .map(([key, value]) => [String(key), (value as string[]).map(String)]),
        )
      : getNotificationPreferences().sectionUpdateRecipientsBySection;

  return setNotificationPreferences({
    inAppEnabled:
      typeof server.in_app_enabled === 'boolean'
        ? server.in_app_enabled
        : getNotificationPreferences().inAppEnabled,
    emailRemindersEnabled:
      typeof server.email_reminders_enabled === 'boolean'
        ? server.email_reminders_enabled
        : getNotificationPreferences().emailRemindersEnabled,
    pushState,
    pushForCollaborators:
      typeof server.push_for_collaborators === 'boolean'
        ? server.push_for_collaborators
        : getNotificationPreferences().pushForCollaborators,
    sectionUpdateRecipientIds: Array.isArray(server.section_update_recipient_ids)
      ? server.section_update_recipient_ids.map(String)
      : server.section_update_recipient_ids === null
        ? null
        : getNotificationPreferences().sectionUpdateRecipientIds,
    sectionUpdateRecipientsBySection: mappedBySection,
    specialDaysEnabled:
      typeof server.special_days_enabled === 'boolean'
        ? server.special_days_enabled
        : getNotificationPreferences().specialDaysEnabled,
    specialDays: Array.isArray(server.special_days)
      ? server.special_days.map(item => ({
          kind:
            item.kind === 'birthday' || item.kind === 'anniversary'
              ? item.kind
              : 'custom',
          month: Number(item.month),
          day: Number(item.day),
          label: String(item.label || 'Special day'),
          enabled: item.enabled !== false,
          source: item.source,
        }))
      : getNotificationPreferences().specialDays,
  });
}

export function toServerNotificationPrefsPatch(
  prefs: NotificationPreferences,
): {
  in_app_enabled: boolean;
  email_reminders_enabled: boolean;
  push_state: PushDeliveryState;
  push_for_collaborators: boolean;
  section_update_recipient_ids: string[] | null;
  section_update_recipients_by_section: Record<string, string[]>;
  special_days_enabled: boolean;
  special_days: SpecialDayPref[];
} {
  return {
    in_app_enabled: prefs.inAppEnabled,
    email_reminders_enabled: prefs.emailRemindersEnabled,
    push_state: prefs.pushState,
    push_for_collaborators: prefs.pushForCollaborators,
    section_update_recipient_ids: prefs.sectionUpdateRecipientIds,
    section_update_recipients_by_section: prefs.sectionUpdateRecipientsBySection,
    special_days_enabled: prefs.specialDaysEnabled,
    special_days: prefs.specialDays,
  };
}

export function resolveSectionUpdateRecipientIds(
  prefs: NotificationPreferences,
  sectionId?: string | null,
): string[] | null {
  if (sectionId) {
    const override = prefs.sectionUpdateRecipientsBySection?.[String(sectionId)];
    if (Array.isArray(override)) return override;
  }
  return prefs.sectionUpdateRecipientIds;
}

export function parseMonthDayFromDate(
  raw: string | null | undefined,
): { month: number; day: number } | null {
  const text = String(raw || '').trim();
  if (!text) return null;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { month, day };
    }
  }
  const parsed = Date.parse(text);
  if (!Number.isFinite(parsed)) return null;
  const date = new Date(parsed);
  if (Number.isNaN(date.getTime())) return null;
  return { month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

type CollabPromptStore = Record<string, { dismissedAt?: number; enabledAt?: number }>;

function readCollabPromptStore(): CollabPromptStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(COLLAB_PROMPT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeCollabPromptStore(store: CollabPromptStore) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(COLLAB_PROMPT_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function collabPushPromptKey(ownerId: string, email: string) {
  return `${ownerId}::${email.toLowerCase()}`;
}

export function wasCollabPushPromptDismissed(ownerId: string, email: string) {
  const entry = readCollabPromptStore()[collabPushPromptKey(ownerId, email)];
  return Boolean(entry?.dismissedAt || entry?.enabledAt);
}

/** True only when the user dismissed without enabling (do not hide after enable). */
export function wasCollabPushPromptDismissedOnly(ownerId: string, email: string) {
  const entry = readCollabPromptStore()[collabPushPromptKey(ownerId, email)];
  return Boolean(entry?.dismissedAt) && !entry?.enabledAt;
}

export function markCollabPushPromptDismissed(ownerId: string, email: string) {
  const store = readCollabPromptStore();
  const key = collabPushPromptKey(ownerId, email);
  store[key] = { ...store[key], dismissedAt: Date.now() };
  writeCollabPromptStore(store);
}

export function markCollabPushPromptEnabled(ownerId: string, email: string) {
  const store = readCollabPromptStore();
  const key = collabPushPromptKey(ownerId, email);
  store[key] = { ...store[key], enabledAt: Date.now() };
  writeCollabPromptStore(store);
}

/** Activate push on this device for a collaborator (family / NOK). */
export function activateCollaboratorDevicePush() {
  return setNotificationPreferences({ pushState: 'active' });
}

