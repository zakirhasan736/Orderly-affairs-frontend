/**
 * Web Push + in-tab Notification helpers.
 *
 * Offline delivery requires:
 * - VAPID keys on the API (public for subscribe; private from AWS secrets for send)
 * - public/sw.js service worker
 * - PushSubscription stored via POST /auth/push-subscribe
 * - Browser permission (from a user gesture the first time)
 */

import {
  getNotificationPreferences,
  isPushDeliveryActive,
  setNotificationPreferences,
  type PushDeliveryState,
  type VaultPushPolicy,
} from '@/utils/notificationPreferences';

const PUSHED_NOTICE_KEY = 'oa_browser_push_notice_ids_v1';
const SW_PATH = '/sw.js';

function readPushedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(PUSHED_NOTICE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter(item => typeof item === 'string').slice(-80));
  } catch {
    return new Set();
  }
}

function writePushedIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      PUSHED_NOTICE_KEY,
      JSON.stringify([...ids].slice(-80)),
    );
  } catch {
    /* ignore */
  }
}

export function browserNotificationsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

async function resolveVapidPublicKey(): Promise<string | null> {
  // Prefer live server key (AWS / SSM) so frontend env is optional.
  try {
    const { store } = await import('@/store/store');
    const { authApi } = await import('@/services/authApi');
    const result = await store.dispatch(
      authApi.endpoints.getVapidPublicKey.initiate(undefined, {
        forceRefetch: true,
      }),
    );
    if ('data' in result && result.data?.publicKey) {
      return String(result.data.publicKey).trim() || null;
    }
  } catch {
    /* fall through to build-time env */
  }

  const fromEnv = String(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  ).trim();
  return fromEnv || null;
}

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (existing) {
    await navigator.serviceWorker.ready;
    return existing;
  }
  const registration = await navigator.serviceWorker.register(SW_PATH, {
    scope: '/',
  });
  await navigator.serviceWorker.ready;
  return registration;
}

async function postSubscriptionToServer(
  subscription: PushSubscription,
): Promise<void> {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Invalid push subscription from browser');
  }

  const { store } = await import('@/store/store');
  const { authApi } = await import('@/services/authApi');
  await store
    .dispatch(
      authApi.endpoints.pushSubscribe.initiate({
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
        user_agent:
          typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      }),
    )
    .unwrap();
}

export async function getBrowserPushSubscription(): Promise<PushSubscription | null> {
  if (!browserNotificationsSupported()) return null;
  try {
    const registration = await ensureServiceWorker();
    return (await registration.pushManager.getSubscription()) || null;
  } catch {
    return null;
  }
}

export async function hasBrowserPushSubscription(): Promise<boolean> {
  return Boolean(await getBrowserPushSubscription());
}

async function subscribeAndStore(
  vapidKey: string,
): Promise<PushSubscription> {
  const registration = await ensureServiceWorker();
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
    } catch (err) {
      // Stale subscription from a previous VAPID key — clear and retry once.
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe().catch(() => undefined);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            vapidKey,
          ) as BufferSource,
        });
      } else {
        throw err;
      }
    }
  }

  await postSubscriptionToServer(subscription);
  return subscription;
}

/**
 * Subscribe + store when Notification.permission is already `granted`
 * (no new permission prompt). Used to repair missing tokens after reload.
 */
export async function ensureBrowserPushSubscription(): Promise<{
  ok: boolean;
  permission: NotificationPermission | 'unsupported';
  message?: string;
}> {
  if (!browserNotificationsSupported()) {
    return {
      ok: false,
      permission: 'unsupported',
      message:
        'This browser does not support Web Push (needs Notification + Service Worker + PushManager).',
    };
  }

  if (Notification.permission !== 'granted') {
    return {
      ok: false,
      permission: Notification.permission,
      message: 'Notification permission is not granted yet.',
    };
  }

  const vapidKey = await resolveVapidPublicKey();
  if (!vapidKey) {
    return {
      ok: false,
      permission: 'granted',
      message:
        'VAPID public key missing on the server. Confirm VAPID_PUBLIC_KEY is loaded from AWS secrets.',
    };
  }

  try {
    await subscribeAndStore(vapidKey);
    setNotificationPreferences({
      pushState: 'active',
      pushPermission: 'granted',
    });
    return { ok: true, permission: 'granted' };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Could not subscribe to Web Push';
    return { ok: false, permission: Notification.permission, message };
  }
}

/**
 * Must be called from a click / tap handler so the browser shows the
 * Allow Notifications system dialog (when permission is still default).
 */
export async function enableBrowserPush(): Promise<{
  ok: boolean;
  permission: NotificationPermission | 'unsupported';
  message?: string;
}> {
  if (!browserNotificationsSupported()) {
    setNotificationPreferences({
      pushState: 'off',
      pushPermission: 'unsupported',
    });
    return {
      ok: false,
      permission: 'unsupported',
      message:
        'This browser does not support Web Push (needs Notification + Service Worker + PushManager).',
    };
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    setNotificationPreferences({
      pushState: 'off',
      pushPermission: permission,
    });
    return {
      ok: false,
      permission,
      message:
        permission === 'denied'
          ? 'Notifications are blocked. Enable them in your browser settings for this site, then tap Active again.'
          : 'Permission was not granted — tap Allow when the browser asks.',
    };
  }

  const result = await ensureBrowserPushSubscription();
  if (!result.ok) {
    setNotificationPreferences({
      pushState: 'off',
      pushPermission: Notification.permission,
    });
  }
  return result;
}

export async function setPushDeliveryState(state: PushDeliveryState) {
  if (state === 'active') {
    return enableBrowserPush();
  }

  if (state === 'off' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe().catch(() => undefined);
        try {
          const { store } = await import('@/store/store');
          const { authApi } = await import('@/services/authApi');
          await store
            .dispatch(
              authApi.endpoints.pushUnsubscribe.initiate({ endpoint }),
            )
            .unwrap();
        } catch {
          /* ignore server cleanup failures */
        }
      }
    } catch {
      /* ignore */
    }
  }

  setNotificationPreferences({ pushState: state });
  return Promise.resolve({
    ok: true as const,
    permission: getNotificationPreferences().pushPermission,
  });
}

/**
 * Keep family / NOK local delivery in sync with the owner's vault push policy.
 * When the owner pauses or turns off collaborator push, stop in-tab alerts.
 */
export function syncCollaboratorPushFromVaultPolicy(
  policy: VaultPushPolicy | null | undefined,
) {
  if (!policy) return;
  if (policy.collaborators_enabled) return;
  const current = getNotificationPreferences().pushState;
  if (current === 'active') {
    setNotificationPreferences({ pushState: 'paused' });
  }
}

export function showBrowserReminderNotification(args: {
  id: string;
  title: string;
  body: string;
  tag?: string;
}): boolean {
  if (!isPushDeliveryActive()) return false;
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const pushed = readPushedIds();
  if (pushed.has(args.id)) return false;

  try {
    const notification = new Notification(args.title || 'Orderly Affairs', {
      body: args.body,
      tag: args.tag || args.id,
      silent: false,
    });
    notification.onclick = () => {
      window.focus();
      window.dispatchEvent(
        new CustomEvent('orderly-open-from-push-notice', {
          detail: { noticeId: args.id },
        }),
      );
      notification.close();
    };
    pushed.add(args.id);
    writePushedIds(pushed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Fire local device notifications when the viewer is away from home.
 * Server Web Push covers closed-app delivery via the expiry scheduler.
 */
export function maybePushReminderNotices(
  notices: Array<{
    id: string;
    title: string;
    body: string;
    tone: 'critical' | 'warn' | 'info';
    category?: string;
    sectionId?: string;
  }>,
  opts?: {
    activeSection?: string | null;
    allowedSectionIds?: string[] | 'all' | null;
    homeSectionId?: string;
  },
) {
  if (!isPushDeliveryActive()) return;

  const home = opts?.homeSectionId ?? 'dashboard';
  const awayFromHome =
    typeof document !== 'undefined' &&
    (document.hidden ||
      opts?.activeSection !== home ||
      !document.hasFocus());

  if (!awayFromHome) return;

  const allowed = opts?.allowedSectionIds;
  notices
    .filter(notice => {
      if (
        !(notice.tone === 'critical' || notice.tone === 'warn') ||
        !(
          notice.category === 'reminder' ||
          notice.category === 'billing' ||
          notice.category === 'event'
        )
      ) {
        return false;
      }
      if (allowed == null || allowed === 'all') return true;
      if (!notice.sectionId) return true;
      return allowed.includes(notice.sectionId);
    })
    .slice(0, 3)
    .forEach(notice => {
      showBrowserReminderNotification({
        id: `push-${notice.id}`,
        title: notice.title,
        body: notice.body,
        tag: notice.id,
      });
    });
}
