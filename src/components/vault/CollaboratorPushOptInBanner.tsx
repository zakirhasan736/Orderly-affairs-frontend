'use client';

import React, { useEffect, useState } from 'react';
import { BellRing, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@common/ui/utils';
import {
  browserNotificationsSupported,
  enableBrowserPush,
} from '@/utils/browserPushNotifications';
import {
  markCollabPushPromptDismissed,
  markCollabPushPromptEnabled,
  wasCollabPushPromptDismissed,
} from '@/utils/notificationPreferences';

type Props = {
  ownerId?: string | null;
  email?: string | null;
  /** From session / nextkin-access vault_push.collaborators_enabled */
  collaboratorsEnabled: boolean;
  className?: string;
  audienceLabel?: string;
};

/**
 * Soft prompt for family / NOK after the owner turns vault push Active.
 * Clicking Allow push triggers the browser permission dialog (user gesture),
 * then registers Web Push (VAPID + service worker) for this device.
 */
export function CollaboratorPushOptInBanner({
  ownerId,
  email,
  collaboratorsEnabled,
  className,
  audienceLabel = 'this vault',
}: Props) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!collaboratorsEnabled || !ownerId || !email) {
      setVisible(false);
      return;
    }
    if (!browserNotificationsSupported()) {
      setVisible(false);
      return;
    }
    if (Notification.permission === 'granted') {
      setVisible(false);
      return;
    }
    if (Notification.permission === 'denied') {
      setVisible(false);
      return;
    }
    if (wasCollabPushPromptDismissed(ownerId, email)) {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, [collaboratorsEnabled, ownerId, email]);

  if (!visible) return null;

  const enable = async () => {
    setBusy(true);
    try {
      const result = await enableBrowserPush();
      if (!result.ok) {
        toast.error(result.message || 'Could not enable push notifications');
        return;
      }
      if (ownerId && email) {
        markCollabPushPromptEnabled(ownerId, email);
      }
      toast.success('Device push notifications are on for your access');
      setVisible(false);
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    if (ownerId && email) {
      markCollabPushPromptDismissed(ownerId, email);
    }
    setVisible(false);
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-sky-200 bg-[linear-gradient(120deg,#eff6ff_0%,#ffffff_55%,#f0fdf4_100%)] px-4 py-3.5 shadow-sm sm:px-5',
        className,
      )}
      role="region"
      aria-label="Enable push notifications"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2.5 top-2.5 rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-600"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#213D59] text-white shadow-sm">
          <BellRing className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-[#213D59]">
            Turn on device alerts for {audienceLabel}?
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-slate-600 sm:text-[13px]">
            The owner enabled push for this vault. Tap Allow push — your browser
            will ask for notification permission, then we register this device
            with Web Push so reminders for areas you can access can arrive even
            when the app is closed.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void enable()}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#213D59] px-4 text-[12px] font-bold uppercase tracking-wide text-white transition hover:bg-[#1a3149] disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <BellRing className="h-3.5 w-3.5" />
          )}
          Allow push
        </button>
      </div>
    </div>
  );
}
