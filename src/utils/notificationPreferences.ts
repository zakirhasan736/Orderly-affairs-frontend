/**
 * Owner + device notification preferences.
 * Device permission is always per-browser; vault push policy syncs to the server
 * so family / NOK can be prompted after login when the owner sets push Active.
 */

export type PushDeliveryState = 'active' | 'paused' | 'off';

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
}): NotificationPreferences {
  const pushState =
    server.push_state === 'active' ||
    server.push_state === 'paused' ||
    server.push_state === 'off'
      ? server.push_state
      : getNotificationPreferences().pushState;

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
  });
}

export function toServerNotificationPrefsPatch(
  prefs: NotificationPreferences,
): {
  in_app_enabled: boolean;
  email_reminders_enabled: boolean;
  push_state: PushDeliveryState;
  push_for_collaborators: boolean;
} {
  return {
    in_app_enabled: prefs.inAppEnabled,
    email_reminders_enabled: prefs.emailRemindersEnabled,
    push_state: prefs.pushState,
    push_for_collaborators: prefs.pushForCollaborators,
  };
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

