'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@common/ui/utils';
import { useLogout } from '@/libs/logoutHandler';

const DEFAULT_IDLE_MS = 14 * 60 * 1000; // owner: warn after 14 min idle
const WARN_SECONDS = 60;
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'touchstart',
  'scroll',
  'click',
  'wheel',
] as const;

function formatCountdown(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

/**
 * Idle session guard for authenticated vault areas.
 * After idle, shows a branded countdown; then auto-logout.
 *
 * NOK Full Kit tokens expire in 5 minutes — use a tighter idle window so the
 * UI signs out before the JWT dies mid-form.
 */
export function SessionTimeoutGuard({
  enabled = true,
  idleMs = DEFAULT_IDLE_MS,
  warnSeconds = WARN_SECONDS,
}: {
  enabled?: boolean;
  /** Milliseconds of idle time before the warning dialog. */
  idleMs?: number;
  /** Countdown seconds shown in the warning dialog. */
  warnSeconds?: number;
}) {
  const logout = useLogout();
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(warnSeconds);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningOpenRef = useRef(false);
  const loggingOutRef = useRef(false);
  const idleMsRef = useRef(idleMs);
  const warnSecondsRef = useRef(warnSeconds);

  useEffect(() => {
    idleMsRef.current = idleMs;
    warnSecondsRef.current = warnSeconds;
  }, [idleMs, warnSeconds]);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const doLogout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    clearIdleTimer();
    clearCountdown();
    setWarningOpen(false);
    warningOpenRef.current = false;
    try {
      await logout();
    } finally {
      loggingOutRef.current = false;
    }
  }, [clearCountdown, clearIdleTimer, logout]);

  const startWarning = useCallback(() => {
    if (warningOpenRef.current || loggingOutRef.current) return;
    warningOpenRef.current = true;
    setWarningOpen(true);
    const warn = warnSecondsRef.current;
    setSecondsLeft(warn);
    clearCountdown();
    countdownRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearCountdown();
          void doLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearCountdown, doLogout]);

  const armIdleTimer = useCallback(() => {
    if (!enabled || warningOpenRef.current) return;
    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      startWarning();
    }, idleMsRef.current);
  }, [clearIdleTimer, enabled, startWarning]);

  const staySignedIn = useCallback(() => {
    clearCountdown();
    warningOpenRef.current = false;
    setWarningOpen(false);
    setSecondsLeft(warnSecondsRef.current);
    armIdleTimer();
  }, [armIdleTimer, clearCountdown]);

  useEffect(() => {
    warningOpenRef.current = warningOpen;
  }, [warningOpen]);

  useEffect(() => {
    if (!enabled) {
      clearIdleTimer();
      clearCountdown();
      setWarningOpen(false);
      warningOpenRef.current = false;
      return;
    }

    armIdleTimer();

    let throttleUntil = 0;
    const onActivity = () => {
      if (warningOpenRef.current || loggingOutRef.current) return;
      const now = Date.now();
      if (now < throttleUntil) return;
      throttleUntil = now + 1000;
      armIdleTimer();
    };

    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, onActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', onActivity);

    return () => {
      clearIdleTimer();
      clearCountdown();
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, onActivity);
      });
      document.removeEventListener('visibilitychange', onActivity);
    };
  }, [armIdleTimer, clearCountdown, clearIdleTimer, enabled, idleMs, warnSeconds]);

  if (!warningOpen) return null;

  const warn = warnSecondsRef.current;
  const progressPct = Math.max(0, Math.min(100, (secondsLeft / warn) * 100));

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-[rgba(33,61,89,0.05)] p-4 sm:p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-timeout-title"
        className={cn(
          'w-full max-w-[min(100%,26rem)] rounded-2xl bg-white p-6',
          'shadow-[0_20px_50px_rgba(33, 61, 89,0.24)]',
        )}
      >
        <p className="m-0 font-mono text-[10px] font-medium tracking-[0.14em] uppercase text-[#a5b1ad]">
          Still there?
        </p>
        <h3
          id="session-timeout-title"
          className="mt-3 mb-0 text-[17px] font-semibold text-[#213D59]"
        >
          We&apos;ll sign you out in {warn} seconds
        </h3>
        <p className="mt-2.5 mb-0 text-[13.5px] leading-relaxed text-[#5c6b66]">
          For safety on shared computers. Everything you&apos;ve typed is
          already saved.
        </p>

        <div className="mt-[18px] h-1.5 overflow-hidden rounded-[3px] bg-[#f2f1ec]">
          <span
            className="block h-full rounded-[3px] bg-[#213D59] transition-[width] duration-1000 linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-2.5 mb-0 font-mono text-[20px] font-medium tabular-nums text-[#213D59]">
          {formatCountdown(secondsLeft)}
        </p>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => void doLogout()}
            className="h-[42px] flex-1 rounded-[21px] border border-[#e4e6e1] bg-white text-[13px] font-medium text-[#213D59] transition hover:bg-[#f5f8fc]"
          >
            Sign out now
          </button>
          <button
            type="button"
            onClick={staySignedIn}
            className="h-[42px] flex-1 rounded-[21px] border-0 bg-[#213D59] text-[13px] font-medium text-white transition hover:bg-[#2B5A8C]"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}
