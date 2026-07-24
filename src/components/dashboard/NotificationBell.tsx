'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlarmClock,
  Bell,
  CreditCard,
  Mail,
  MailOpen,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@common/ui/utils';
import { useIsMobile } from '@/components/MobileBottomSheet';
import {
  dismissNotice,
  filterVisibleNotices,
  getReadNoticeIds,
  getToastedNoticeIds,
  markAllNoticesRead,
  markNoticeRead,
  markNoticeToasted,
  markNoticeUnread,
  type DashboardNotice,
} from '@/utils/dashboardNotifications';

const PREVIEW_COUNT = 4;
const MAX_COUNT = 10;

function categoryIcon(category: DashboardNotice['category']) {
  switch (category) {
    case 'billing':
      return <CreditCard className="h-3.5 w-3.5" />;
    case 'message':
      return <MessageSquare className="h-3.5 w-3.5" />;
    case 'reminder':
      return <AlarmClock className="h-3.5 w-3.5" />;
    case 'event':
      return <ShieldAlert className="h-3.5 w-3.5" />;
    default:
      return <Sparkles className="h-3.5 w-3.5" />;
  }
}

function categoryLabel(category: DashboardNotice['category']) {
  switch (category) {
    case 'billing':
      return 'Billing';
    case 'message':
      return 'Messages';
    case 'reminder':
      return 'Reminder';
    case 'event':
      return 'Event';
    default:
      return 'Notice';
  }
}

type NotificationBellProps = {
  notices: DashboardNotice[];
  onSelect: (notice: DashboardNotice) => void;
  className?: string;
  buttonClassName?: string;
  align?: 'left' | 'right';
};

export function NotificationBell({
  notices,
  onSelect,
  className,
  buttonClassName,
  align = 'right',
}: NotificationBellProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [seeAll, setSeeAll] = useState(false);
  const [storageTick, setStorageTick] = useState(0);
  const [toastReady, setToastReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [desktopPos, setDesktopPos] = useState<{ top: number; left?: number; right?: number }>({
    top: 72,
    right: 16,
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || isMobile) return;
    const updatePos = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (align === 'right') {
        setDesktopPos({
          top: rect.bottom + 8,
          right: Math.max(8, window.innerWidth - rect.right),
        });
      } else {
        setDesktopPos({
          top: rect.bottom + 8,
          left: Math.max(8, rect.left),
        });
      }
    };
    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [open, isMobile, align]);

  useEffect(() => {
    const refresh = () => setStorageTick(n => n + 1);
    window.addEventListener('orderly-notices-read-changed', refresh);
    return () =>
      window.removeEventListener('orderly-notices-read-changed', refresh);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setToastReady(true), 900);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!open) setSeeAll(false);
  }, [open]);

  const visibleNotices = useMemo(() => {
    void storageTick;
    return filterVisibleNotices(notices, MAX_COUNT);
  }, [notices, storageTick]);

  const readIds = useMemo(() => {
    void storageTick;
    return getReadNoticeIds();
  }, [storageTick]);

  const unreadCount = useMemo(
    () => visibleNotices.filter(notice => !readIds.has(notice.id)).length,
    [visibleNotices, readIds],
  );

  const shownNotices = useMemo(
    () =>
      seeAll
        ? visibleNotices
        : visibleNotices.slice(0, PREVIEW_COUNT),
    [seeAll, visibleNotices],
  );

  const canSeeAll = visibleNotices.length > PREVIEW_COUNT;
  const badge = unreadCount > 9 ? '9+' : String(unreadCount);

  useEffect(() => {
    if (!toastReady) return;

    if (!bootstrappedRef.current) {
      notices.forEach(notice => markNoticeToasted(notice.id));
      bootstrappedRef.current = true;
      return;
    }

    const toasted = getToastedNoticeIds();
    notices.forEach(notice => {
      if (toasted.has(notice.id)) return;
      markNoticeToasted(notice.id);
      toast.message(notice.title, {
        description: notice.body,
        duration: 4500,
      });
    });
  }, [notices, toastReady]);

  useEffect(() => {
    if (!open) return;

    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    // Use click (not mousedown) so action buttons can complete their click.
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    if (isMobile) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
      if (isMobile) {
        document.body.style.overflow = prevOverflow;
      }
    };
  }, [open, isMobile]);

  const close = () => setOpen(false);

  const stopAction = (event: React.SyntheticEvent) => {
    // Do NOT preventDefault on mousedown — that cancels the following click
    // in many browsers and makes Mark as read / Delete appear dead.
    event.stopPropagation();
  };

  const runNoticeAction = (
    event: React.SyntheticEvent,
    action: () => void,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    action();
  };

  const header = (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-[#10213f] sm:text-sm">
          Alerts
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-slate-500">
          Reminders, messages, billing & notices
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {unreadCount > 0 ? (
          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600">
            {unreadCount}
          </span>
        ) : null}
        {visibleNotices.length > 0 ? (
          <button
            type="button"
            onMouseDown={stopAction}
            onClick={event => {
              runNoticeAction(event, () =>
                markAllNoticesRead(visibleNotices.map(n => n.id)),
              );
            }}
            className="rounded-full px-2 py-1 text-[10px] font-semibold text-sky-700 hover:bg-sky-50"
          >
            Mark all read
          </button>
        ) : null}
        {isMobile ? (
          <button
            type="button"
            onMouseDown={stopAction}
            onClick={event => {
              runNoticeAction(event, close);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600"
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );

  const list = (
    <div
      className={cn(
        'min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]',
        isMobile
          ? 'max-h-none [-webkit-overflow-scrolling:touch]'
          : seeAll
            ? 'max-h-[min(52vh,380px)]'
            : 'max-h-none',
      )}
    >
      {visibleNotices.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-slate-500">
          You’re all caught up. New reminders and notices will show here.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {shownNotices.map(notice => {
            const unread = !readIds.has(notice.id);
            return (
              <li
                key={notice.id}
                className={cn(
                  'px-3 py-2.5',
                  unread ? 'bg-sky-50/40' : 'bg-white',
                )}
              >
                <button
                  type="button"
                  onMouseDown={stopAction}
                  onClick={event => {
                    runNoticeAction(event, () => {
                      markNoticeRead(notice.id);
                      close();
                      onSelect(notice);
                    });
                  }}
                  className="flex w-full items-start gap-3 rounded-xl px-1 py-1 text-left transition active:bg-slate-50 hover:bg-slate-50"
                >
                  <span
                    className={cn(
                      'relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      notice.tone === 'critical'
                        ? 'bg-rose-50 text-rose-600'
                        : notice.tone === 'warn'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-sky-50 text-sky-600',
                    )}
                  >
                    {categoryIcon(notice.category)}
                    {unread ? (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-sky-500 ring-2 ring-white" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'text-[13px]',
                          unread
                            ? 'font-bold text-[#10213f]'
                            : 'font-semibold text-slate-700',
                        )}
                      >
                        {notice.title}
                      </span>
                      <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                        {categoryLabel(notice.category)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-slate-500">
                      {notice.body}
                    </span>
                  </span>
                </button>
                <div className="mt-1.5 flex flex-wrap justify-end gap-1 px-1">
                  {unread ? (
                    <button
                      type="button"
                      onMouseDown={stopAction}
                      onClick={event => {
                        runNoticeAction(event, () => markNoticeRead(notice.id));
                      }}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-[#10213f]"
                    >
                      <MailOpen className="h-3 w-3" />
                      Mark as read
                    </button>
                  ) : (
                    <button
                      type="button"
                      onMouseDown={stopAction}
                      onClick={event => {
                        runNoticeAction(event, () =>
                          markNoticeUnread(notice.id),
                        );
                      }}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-[#10213f]"
                    >
                      <Mail className="h-3 w-3" />
                      Mark as unread
                    </button>
                  )}
                  <button
                    type="button"
                    onMouseDown={stopAction}
                    onClick={event => {
                      runNoticeAction(event, () => dismissNotice(notice.id));
                    }}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  const footer =
    canSeeAll && visibleNotices.length > 0 ? (
      <div className="shrink-0 border-t border-slate-100 px-3 py-2.5">
        <button
          type="button"
          onMouseDown={stopAction}
          onClick={event => {
            runNoticeAction(event, () => setSeeAll(prev => !prev));
          }}
          className="w-full rounded-xl bg-slate-50 px-3 py-2 text-center text-[12px] font-semibold text-[#10213f] transition hover:bg-slate-100"
        >
          {seeAll
            ? 'Show less'
            : `See all (${Math.min(visibleNotices.length, MAX_COUNT)})`}
        </button>
      </div>
    ) : null;

  const panelBody = (
    <>
      {header}
      {list}
      {footer}
    </>
  );

  const mobilePanel =
    open && isMobile && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center px-4"
            role="presentation"
          >
            <button
              type="button"
              className="absolute inset-0 bg-[#10213f]/45 backdrop-blur-[2px]"
              aria-label="Dismiss notifications"
              onClick={close}
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-label="Notifications"
              aria-modal="true"
              className="relative z-[1] flex w-full max-w-[420px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl"
              style={{ height: '70dvh', maxHeight: '70vh' }}
              onClick={stopAction}
            >
              <div className="flex justify-center pt-3 pb-0" aria-hidden>
                <div className="h-1.5 w-12 rounded-full bg-slate-200" />
              </div>
              {panelBody}
            </div>
          </div>,
          document.body,
        )
      : null;

  const desktopPanel =
    open && !isMobile && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[120]"
            role="presentation"
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default bg-transparent"
              aria-label="Dismiss notifications"
              onClick={close}
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-label="Notifications"
              className="absolute z-[1] flex w-[min(92vw,360px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
              style={{
                top: desktopPos.top,
                ...(desktopPos.right != null
                  ? { right: desktopPos.right }
                  : { left: desktopPos.left }),
              }}
              onClick={stopAction}
              onMouseDown={stopAction}
            >
              {panelBody}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={event => {
          event.stopPropagation();
          setOpen(prev => !prev);
        }}
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-full text-[#10213f] transition active:scale-95',
          open ? 'bg-slate-100' : 'hover:bg-slate-50',
          buttonClassName,
        )}
        aria-label={
          unreadCount
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications'
        }
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {badge}
          </span>
        ) : null}
      </button>

      {desktopPanel}
      {mobilePanel}
    </div>
  );
}
