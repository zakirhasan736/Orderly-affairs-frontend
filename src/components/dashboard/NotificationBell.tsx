'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@common/ui/utils';
import { useIsMobile } from '@/components/MobileBottomSheet';
import {
  filterVisibleNotices,
  getReadNoticeIds,
  getToastedNoticeIds,
  markAllNoticesRead,
  markNoticeRead,
  markNoticeToasted,
  type DashboardNotice,
} from '@/utils/dashboardNotifications';

const MAX_COUNT = 12;

function categoryLabel(
  notice: DashboardNotice,
): string {
  switch (notice.category) {
    case 'billing':
      return 'Billing';
    case 'message':
      return 'Messages';
    case 'reminder':
      if (notice.sectionId === '7') return 'Insurance Policies';
      if (notice.sectionId === '14') return 'Investment Accounts';
      if (notice.sectionId === '12') return 'Banking';
      if (notice.sectionId === '5') return 'Vehicles';
      return 'Reminder';
    case 'event':
      return notice.sectionId === '2' ? 'People & roles' : 'Security';
    default:
      return 'Notice';
  }
}

function formatRelativeTime(at: number): string {
  if (!Number.isFinite(at) || at <= 0) return 'Just now';
  const diffMs = Date.now() - at;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  try {
    return new Date(at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Earlier';
  }
}

function mobileActionLabel(notice: DashboardNotice): string | null {
  if (notice.sectionId === '2') return 'Review access request';
  if (notice.sectionId === 'vault-settings' || notice.category === 'billing') {
    return 'Review billing';
  }
  if (notice.category === 'reminder') return 'Open section';
  if (notice.category === 'message') return 'Open messages';
  return null;
}

type NotificationBellProps = {
  notices: DashboardNotice[];
  onSelect: (notice: DashboardNotice) => void;
  onOpenSettings?: () => void;
  /** Prefer opening the overview Review inbox instead of the local panel. */
  onOpenReviewInbox?: () => void;
  className?: string;
  buttonClassName?: string;
  align?: 'left' | 'right';
};

export function NotificationBell({
  notices,
  onSelect,
  onOpenSettings,
  onOpenReviewInbox,
  className,
  buttonClassName,
  align = 'right',
}: NotificationBellProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [storageTick, setStorageTick] = useState(0);
  const [toastReady, setToastReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [desktopPos, setDesktopPos] = useState<{
    top: number;
    left?: number;
    right?: number;
  }>({
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

  const needsYouCount = useMemo(
    () =>
      visibleNotices.filter(
        notice =>
          !readIds.has(notice.id) &&
          (notice.tone === 'warn' || notice.tone === 'critical'),
      ).length,
    [visibleNotices, readIds],
  );

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

  const openNotice = (notice: DashboardNotice) => {
    markNoticeRead(notice.id);
    close();
    onSelect(notice);
  };

  // Opening the tray counts as seeing the list — clear the badge so it
  // does not stick after the user has reviewed notifications.
  useEffect(() => {
    if (!open) return;
    const ids = visibleNotices.map(notice => notice.id);
    if (ids.length === 0) return;
    const unreadIds = ids.filter(id => !getReadNoticeIds().has(id));
    if (unreadIds.length === 0) return;
    markAllNoticesRead(ids);
  }, [open, visibleNotices]);

  const highlightId = useMemo(() => {
    const firstUrgent = visibleNotices.find(
      n =>
        !readIds.has(n.id) &&
        (n.tone === 'warn' || n.tone === 'critical'),
    );
    return firstUrgent?.id ?? null;
  }, [visibleNotices, readIds]);

  const subtitle =
    needsYouCount > 0
      ? `${needsYouCount} need you`
      : unreadCount > 0
        ? `${unreadCount} unread`
        : 'You’re all caught up';

  const markAllButton =
    visibleNotices.length > 0 ? (
      <button
        type="button"
        onMouseDown={stopAction}
        onClick={event => {
          runNoticeAction(event, () =>
            markAllNoticesRead(visibleNotices.map(n => n.id)),
          );
        }}
        className="shrink-0 text-[13.5px] font-medium text-[#2b5a8c] transition hover:underline"
      >
        Mark all read
      </button>
    ) : null;

  /* ---------- Desktop list (exact design tokens) ---------- */
  const desktopList = (
    <div className="max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain px-2 pb-2.5 pt-1.5">
      {visibleNotices.length === 0 ? (
        <p className="px-3 py-10 text-center text-sm text-[#5a6b80]">
          You’re all caught up. New reminders and notices will show here.
        </p>
      ) : (
        visibleNotices.map(notice => {
          const unread = !readIds.has(notice.id);
          const highlighted = notice.id === highlightId;
          return (
            <button
              key={notice.id}
              type="button"
              onMouseDown={stopAction}
              onClick={event => {
                runNoticeAction(event, () => openNotice(notice));
              }}
              className={cn(
                'flex w-full gap-3 px-3 py-[13px] text-left transition',
                highlighted
                  ? 'rounded-[11px] bg-[#fff3dd]'
                  : 'rounded-[11px] hover:bg-[#f5f8fc]',
              )}
            >
              <span
                className={cn(
                  'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                  unread ? 'bg-[#7a5a1c]' : 'bg-[#6c7e97]',
                )}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block text-[14.5px] leading-[1.45]',
                    unread ? 'text-[#213d59]' : 'text-[#33506e]',
                  )}
                >
                  {notice.body || notice.title}
                </span>
                <span className="mt-1 block text-[13px] text-[#5a6b80]">
                  {formatRelativeTime(notice.at)} · {categoryLabel(notice)}
                </span>
              </span>
            </button>
          );
        })
      )}
    </div>
  );

  const desktopPanelBody = (
    <>
      <div className="flex items-center justify-between border-b border-[#7688a1] px-5 py-[18px]">
        <div className="min-w-0">
          <h2 className="m-0 text-[17px] font-semibold text-[#213d59]">
            Notifications
          </h2>
          <p className="mt-[3px] text-[13px] text-[#5a6b80]">{subtitle}</p>
        </div>
        {markAllButton}
      </div>
      {desktopList}
      <div className="border-t border-[#7688a1] px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {onOpenReviewInbox ? (
            <button
              type="button"
              onMouseDown={stopAction}
              onClick={event => {
                runNoticeAction(event, () => {
                  close();
                  onOpenReviewInbox();
                });
              }}
              className="text-[13.5px] font-medium text-[#2b5a8c] no-underline transition hover:underline"
            >
              Open review inbox
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onMouseDown={stopAction}
            onClick={event => {
              runNoticeAction(event, () => {
                close();
                onOpenSettings?.();
              });
            }}
            className="text-[13.5px] font-medium text-[#2b5a8c] no-underline transition hover:underline"
          >
            Notification settings
          </button>
        </div>
      </div>
    </>
  );

  /* ---------- Mobile full-screen (exact design) ---------- */
  const mobileList = (
    <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-4 pb-3 pt-4 [-webkit-overflow-scrolling:touch]">
      {visibleNotices.length === 0 ? (
        <div className="rounded-[14px] border border-[#7688a1] bg-white px-4 py-10 text-center text-sm text-[#5a6b80]">
          You’re all caught up.
        </div>
      ) : (
        visibleNotices.map(notice => {
          const unread = !readIds.has(notice.id);
          const highlighted = notice.id === highlightId;
          const cta = highlighted ? mobileActionLabel(notice) : null;

          if (highlighted) {
            return (
              <div
                key={notice.id}
                className="rounded-[14px] border border-[#9a7326] bg-[#fff3dd] p-[15px]"
              >
                <p className="m-0 text-[14.5px] font-semibold leading-[1.45] text-[#7a5a1c]">
                  {notice.body || notice.title}
                </p>
                <p className="mt-[5px] text-[13px] text-[#6d4d15]">
                  {formatRelativeTime(notice.at)} · {categoryLabel(notice)}
                </p>
                {cta ? (
                  <button
                    type="button"
                    onMouseDown={stopAction}
                    onClick={event => {
                      runNoticeAction(event, () => openNotice(notice));
                    }}
                    className="mt-3 h-[42px] w-full rounded-[21px] border-0 bg-[#213d59] text-[13.5px] font-medium text-white"
                  >
                    {cta}
                  </button>
                ) : (
                  <button
                    type="button"
                    onMouseDown={stopAction}
                    onClick={event => {
                      runNoticeAction(event, () => openNotice(notice));
                    }}
                    className="mt-3 h-[42px] w-full rounded-[21px] border-0 bg-[#213d59] text-[13.5px] font-medium text-white"
                  >
                    Open
                  </button>
                )}
              </div>
            );
          }

          return (
            <button
              key={notice.id}
              type="button"
              onMouseDown={stopAction}
              onClick={event => {
                runNoticeAction(event, () => openNotice(notice));
              }}
              className={cn(
                'rounded-[14px] border border-[#7688a1] bg-white p-[15px] text-left',
                !unread && 'opacity-75',
              )}
            >
              <p className="m-0 text-[14.5px] leading-[1.45] text-[#213d59]">
                {notice.body || notice.title}
              </p>
              <p className="mt-[5px] text-[13px] text-[#5a6b80]">
                {formatRelativeTime(notice.at)} · {categoryLabel(notice)}
              </p>
            </button>
          );
        })
      )}
    </div>
  );

  const mobilePanelBody = (
    <>
      <header className="flex shrink-0 items-center gap-3 border-b border-[#7688a1] bg-white px-4 pb-3.5 pt-2">
        <button
          type="button"
          onMouseDown={stopAction}
          onClick={event => {
            runNoticeAction(event, close);
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[#7688a1] text-[#33506e]"
          aria-label="Back"
        >
          <ChevronLeft className="h-[15px] w-[15px]" strokeWidth={2} />
        </button>
        <span className="flex-1 text-[17px] font-semibold text-[#213d59]">
          Notifications
        </span>
        {markAllButton}
      </header>
      {mobileList}
      <div className="shrink-0 border-t border-[#7688a1] bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {onOpenReviewInbox ? (
            <button
              type="button"
              onMouseDown={stopAction}
              onClick={event => {
                runNoticeAction(event, () => {
                  close();
                  onOpenReviewInbox();
                });
              }}
              className="text-[13.5px] font-medium text-[#2b5a8c] no-underline transition hover:underline"
            >
              Open review inbox
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onMouseDown={stopAction}
            onClick={event => {
              runNoticeAction(event, () => {
                close();
                onOpenSettings?.();
              });
            }}
            className="text-[13.5px] font-medium text-[#2b5a8c] no-underline transition hover:underline"
          >
            Notification settings
          </button>
        </div>
      </div>
    </>
  );

  const mobilePanel =
    open && isMobile && mounted
      ? createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Notifications"
            aria-modal="true"
            className="fixed inset-0 z-[120] flex flex-col overflow-hidden bg-[#f5f8fc] text-[#213d59]"
            onClick={stopAction}
          >
            {mobilePanelBody}
          </div>,
          document.body,
        )
      : null;

  const desktopPanel =
    open && !isMobile && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[120]" role="presentation">
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
              className="absolute z-[1] w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-[#7688a1] bg-white"
              style={{
                top: desktopPos.top,
                ...(desktopPos.right != null
                  ? { right: desktopPos.right }
                  : { left: desktopPos.left }),
                boxShadow: '0 18px 44px rgba(19,43,38,.1)',
              }}
              onClick={stopAction}
              onMouseDown={stopAction}
            >
              {desktopPanelBody}
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
          'relative flex h-10 w-10 items-center justify-center rounded-full text-[#213D59] transition active:scale-95',
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
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#7a5a1c] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {badge}
          </span>
        ) : null}
      </button>

      {desktopPanel}
      {mobilePanel}
    </div>
  );
}
