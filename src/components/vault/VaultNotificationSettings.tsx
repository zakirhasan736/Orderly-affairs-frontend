'use client';

import React, { useEffect, useState } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  Loader2,
  Mail,
  MonitorSmartphone,
  Pause,
  Play,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@common/ui/utils';
import {
  applyServerNotificationPrefs,
  getNotificationPreferences,
  NOTIFICATION_PREFS_CHANGED,
  setNotificationPreferences,
  toServerNotificationPrefsPatch,
  type NotificationPreferences,
  type PushDeliveryState,
} from '@/utils/notificationPreferences';
import {
  browserNotificationsSupported,
  listenForPushSubscriptionChange,
  setPushDeliveryState,
} from '@/utils/browserPushNotifications';
import {
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} from '@/services/authApi';

function ToggleRow({
  title,
  description,
  enabled,
  onToggle,
  icon,
  disabled,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl border px-3.5 py-3.5 sm:items-center sm:px-4',
        enabled
          ? 'border-emerald-200/90 bg-[linear-gradient(90deg,#ffffff_0%,#ecfdf5_100%)]'
          : 'border-slate-200 bg-[#f5f8fc]',
      )}
    >
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
          enabled
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'bg-white text-[#213D59] ring-1 ring-slate-200',
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-[#213D59] sm:text-[15px]">
          {title}
        </p>
        <p className="mt-0.5 text-[12px] leading-snug text-slate-500 sm:text-[13px]">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={onToggle}
        className={cn(
          'relative h-8 w-[3.25rem] shrink-0 rounded-full transition',
          enabled ? 'bg-emerald-600' : 'bg-slate-300',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition',
            enabled && 'translate-x-[1.35rem]',
          )}
        />
      </button>
    </div>
  );
}

export function VaultNotificationSettings({
  className,
}: {
  className?: string;
}) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(() =>
    getNotificationPreferences(),
  );
  const [busy, setBusy] = useState(false);
  const supported = browserNotificationsSupported();
  const { data: serverPrefs, isFetching } = useGetNotificationPreferencesQuery();
  const [updatePrefs] = useUpdateNotificationPreferencesMutation();

  useEffect(() => {
    return listenForPushSubscriptionChange();
  }, []);

  useEffect(() => {
    const refresh = () => setPrefs(getNotificationPreferences());
    window.addEventListener(NOTIFICATION_PREFS_CHANGED, refresh);
    window.addEventListener('storage', refresh);
    refresh();
    return () => {
      window.removeEventListener(NOTIFICATION_PREFS_CHANGED, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  useEffect(() => {
    if (!serverPrefs) return;
    setPrefs(applyServerNotificationPrefs(serverPrefs));
  }, [serverPrefs]);

  const syncToServer = async (next: NotificationPreferences) => {
    try {
      await updatePrefs(toServerNotificationPrefsPatch(next)).unwrap();
    } catch {
      toast.error('Saved on this device — could not sync vault policy yet');
    }
  };

  const applyPushState = async (state: PushDeliveryState) => {
    setBusy(true);
    try {
      const result = await setPushDeliveryState(state);
      const next = getNotificationPreferences();
      setPrefs(next);
      if (!result.ok) {
        toast.error(result.message || 'Could not update push notifications');
        return;
      }
      await syncToServer(next);
      if (state === 'active') {
        toast.success(
          next.pushForCollaborators
            ? 'Push active — family & NOK with access will be asked on their devices'
            : 'Device push notifications are active on this device',
        );
      } else if (state === 'paused') {
        toast.message('Push notifications paused for this vault');
      } else {
        toast.message('Push notifications turned off for this vault');
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleLocalAndSync = async (
    patch: Partial<NotificationPreferences>,
  ) => {
    const next = setNotificationPreferences(patch);
    setPrefs(next);
    await syncToServer(next);
  };

  const pushLabel =
    prefs.pushState === 'active'
      ? 'Active'
      : prefs.pushState === 'paused'
        ? 'Paused'
        : 'Off';

  return (
    <section
      id="notification-settings"
      data-oa-notification-settings
      className={cn(
        'w-full scroll-mt-24 overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:rounded-[28px]',
        className,
      )}
    >
      <div className="relative overflow-hidden bg-[#1e3a5f] px-4 py-5 text-white sm:px-6 sm:py-6 md:px-8">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-sky-300/20 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
              Alerts
            </p>
            <h2 className="mt-1 text-[20px] font-bold tracking-tight sm:text-[22px]">
              Notification settings
            </h2>
            <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-white/75 sm:text-sm">
              Choose how reminders reach you — in the app, by email, or as a
              device popup. Each phone or computer still needs its own browser
              permission.
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white ring-1 ring-white/20">
            <BellRing className="h-3.5 w-3.5" />
            {isFetching ? '…' : pushLabel}
          </div>
        </div>
      </div>

      <div className="space-y-3 p-3 sm:space-y-4 sm:p-5 md:p-6">
        <ToggleRow
          title="In-app notices"
          description="Header bell badge, toasts, and the notification list while you use the vault."
          enabled={prefs.inAppEnabled}
          icon={<Bell className="h-5 w-5" />}
          onToggle={() =>
            void toggleLocalAndSync({ inAppEnabled: !prefs.inAppEnabled })
          }
        />

        <ToggleRow
          title="Email reminders"
          description="Expiry, renewal, and kit-review emails when a date is coming up."
          enabled={prefs.emailRemindersEnabled}
          icon={<Mail className="h-5 w-5" />}
          onToggle={() =>
            void toggleLocalAndSync({
              emailRemindersEnabled: !prefs.emailRemindersEnabled,
            })
          }
        />

        <div
          className={cn(
            'rounded-2xl border px-3.5 py-3.5 sm:px-4',
            prefs.pushState === 'active'
              ? 'border-sky-200 bg-[linear-gradient(90deg,#ffffff_0%,#eff6ff_100%)]'
              : 'border-slate-200 bg-[#f5f8fc]',
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                prefs.pushState === 'active'
                  ? 'bg-[#213D59] text-white shadow-sm'
                  : 'bg-white text-[#213D59] ring-1 ring-slate-200',
              )}
            >
              <MonitorSmartphone className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-[#213D59] sm:text-[15px]">
                Device push notifications
              </p>
              <p className="mt-0.5 text-[12px] leading-snug text-slate-500 sm:text-[13px]">
                Uses Web Push (VAPID + service worker) so reminders can reach
                this device even when the tab is closed. Tapping Active asks
                the browser for permission, then registers this device. Family
                and immediate-access next of kin are invited to allow push on{' '}
                <span className="font-medium text-slate-600">their</span>{' '}
                devices when they sign in.
              </p>
              {!supported ? (
                <p className="mt-2 text-[12px] font-medium text-amber-700">
                  This browser doesn’t support device notifications.
                </p>
              ) : prefs.pushPermission === 'denied' ? (
                <p className="mt-2 text-[12px] font-medium text-amber-700">
                  Blocked in browser settings — allow notifications for this
                  site, then tap Active.
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || !supported}
                  onClick={() => void applyPushState('active')}
                  className={cn(
                    'inline-flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-[12px] font-bold uppercase tracking-wide transition',
                    prefs.pushState === 'active'
                      ? 'bg-[#213D59] text-white'
                      : 'border border-slate-200 bg-white text-[#213D59] hover:bg-slate-50',
                    (busy || !supported) && 'opacity-60',
                  )}
                >
                  {busy && prefs.pushState !== 'active' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  Active
                </button>
                <button
                  type="button"
                  disabled={busy || !supported || prefs.pushState === 'off'}
                  onClick={() => void applyPushState('paused')}
                  className={cn(
                    'inline-flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-[12px] font-bold uppercase tracking-wide transition',
                    prefs.pushState === 'paused'
                      ? 'bg-amber-600 text-white'
                      : 'border border-slate-200 bg-white text-[#213D59] hover:bg-slate-50',
                    (busy || !supported || prefs.pushState === 'off') &&
                      'opacity-60',
                  )}
                >
                  <Pause className="h-3.5 w-3.5" />
                  Paused
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void applyPushState('off')}
                  className={cn(
                    'inline-flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-[12px] font-bold uppercase tracking-wide transition',
                    prefs.pushState === 'off'
                      ? 'bg-slate-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                    busy && 'opacity-60',
                  )}
                >
                  <BellOff className="h-3.5 w-3.5" />
                  Off
                </button>
              </div>
            </div>
          </div>
        </div>

        <ToggleRow
          title="Ask family & next of kin"
          description="When push is Active, prompt collaborators (and NOK with immediate access) on first login to allow notifications for the vault areas they can open."
          enabled={prefs.pushForCollaborators}
          disabled={prefs.pushState !== 'active'}
          icon={<Users className="h-5 w-5" />}
          onToggle={() =>
            void toggleLocalAndSync({
              pushForCollaborators: !prefs.pushForCollaborators,
            })
          }
        />

        <p className="px-1 text-[11px] leading-relaxed text-slate-400 sm:text-[12px]">
          Tip: keep push{' '}
          <span className="font-semibold text-slate-500">Active</span> so
          renewals can alert you — and so people you already gave dashboard
          access can opt in on their own phones after invite login.
        </p>
      </div>
    </section>
  );
}
