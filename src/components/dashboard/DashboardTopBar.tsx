'use client';

import React from 'react';
import Image from 'next/image';
import { Menu, Play, User } from 'lucide-react';
import { VaultExportMenu } from '@/components/VaultExportMenu';
import type { VaultExportPayload } from '@/utils/vaultExport';
import { cn } from '@common/ui/utils';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import type { DashboardNotice } from '@/utils/dashboardNotifications';
import { BRAND_LOGO } from '@/constants/brand';

function HeaderProgressRing({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
      <div className="relative h-10 w-10 shrink-0">
        <svg className="h-10 w-10 -rotate-90" viewBox="0 0 44 44" aria-hidden>
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke="#e8e6e0"
            strokeWidth="3.5"
          />
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke="#2e7d6e"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#132b26]">
          {pct}%
        </span>
      </div>
      <div className="pr-1.5 leading-tight">
        <p className="text-[11px] font-semibold text-[#132b26]">
          {completed} of {total}
        </p>
        <p className="text-[10px] font-medium text-[rgba(19,43,38,0.55)]">completed</p>
      </div>
    </div>
  );
}

type DashboardTopBarProps = {
  currentSectionLabel: string;
  completedSectionsCount: number;
  totalSectionsCount: number;
  onRunTour: () => void;
  exportPayload: VaultExportPayload;
  currentUserEmail?: string | null;
  onAccountInfo: () => void;
  onLogout: () => void;
  notices?: DashboardNotice[];
  onNoticeSelect?: (notice: DashboardNotice) => void;
  className?: string;
};

export function DashboardTopBar({
  currentSectionLabel,
  completedSectionsCount,
  totalSectionsCount,
  onRunTour,
  exportPayload,
  currentUserEmail,
  onAccountInfo,
  onLogout,
  notices = [],
  onNoticeSelect,
  className,
}: DashboardTopBarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 hidden border-b border-[rgba(19,43,38,0.1)] bg-[var(--paper)] md:block',
        className,
      )}
    >
      <div className="flex h-[72px] items-center justify-between gap-4 px-5 xl:px-8">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[rgba(19,43,38,0.45)]">
            Current Area
          </p>
          <h1 className="mt-0.5 truncate text-[18px] font-semibold tracking-tight text-[#132b26]">
            {currentSectionLabel}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 xl:gap-3">
          <HeaderProgressRing
            completed={completedSectionsCount}
            total={totalSectionsCount}
          />

          <button
            type="button"
            onClick={onRunTour}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#132b26] px-4 text-[12px] font-semibold text-white transition hover:bg-[#2e7d6e] active:scale-[0.98]"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Run Tour
          </button>

          <VaultExportMenu
            payload={exportPayload}
            trigger={
              <button
                type="button"
                className="owners-states-export inline-flex h-10 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-[12px] font-semibold text-[#132b26] shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M12 3v12" strokeLinecap="round" />
                  <path
                    d="m8 11 4 4 4-4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M5 19h14" strokeLinecap="round" />
                </svg>
                Export
              </button>
            }
          />

          <NotificationBell
            notices={notices}
            onSelect={notice => onNoticeSelect?.(notice)}
            buttonClassName="h-10 w-10 border border-slate-200 bg-white shadow-sm"
          />

          <div className="owner-state-information group relative">
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-[#132b26] shadow-sm transition hover:ring-4 hover:ring-slate-100"
              aria-label="Account menu"
            >
              <User className="h-5 w-5" />
            </button>

            <div className="invisible absolute right-0 top-full z-[60] mt-3 translate-y-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <div className="min-w-[230px] rounded-3xl border border-slate-100 bg-white p-2 shadow-2xl">
                <div className="mb-1 border-b border-slate-100 px-4 py-3">
                  {currentUserEmail ? (
                    <p className="truncate text-[12px] font-semibold text-[#132b26]">
                      {currentUserEmail}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Premium Member
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onAccountInfo}
                  className="w-full rounded-2xl px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-600 transition hover:bg-slate-50 hover:text-[#132b26]"
                >
                  Account Info
                </button>

                <button
                  type="button"
                  onClick={onAccountInfo}
                  className="w-full rounded-2xl px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-600 transition hover:bg-slate-50 hover:text-[#132b26]"
                >
                  Security Keys
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full rounded-2xl px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-rose-500 transition hover:bg-rose-50"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

type MobileTopBarProps = {
  title: string;
  subtitle?: string;
  completedCount?: number;
  totalCount?: number;
  onMenuClick: () => void;
  onLogoClick: () => void;
  onAccountClick: () => void;
  showProgress?: boolean;
  notices?: DashboardNotice[];
  onNoticeSelect?: (notice: DashboardNotice) => void;
};

export function MobileTopBar({
  title,
  subtitle,
  completedCount = 0,
  totalCount = 0,
  onMenuClick,
  onLogoClick,
  onAccountClick,
  showProgress = false,
  notices = [],
  onNoticeSelect,
}: MobileTopBarProps) {
  const pct =
    totalCount > 0
      ? Math.min(100, Math.round((completedCount / totalCount) * 100))
      : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(19,43,38,0.1)] bg-[var(--paper)] md:hidden">
      <div className="flex h-14 items-center gap-1 px-2.5">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#132b26] active:bg-slate-100 active:scale-95"
          aria-label="Open sections menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onLogoClick}
          className="flex min-w-0 flex-1 items-center justify-start gap-2 px-1"
          aria-label="Orderly Affairs home"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-[#132b26]/10">
            <Image
              src={BRAND_LOGO}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              priority
            />
          </span>
          <span className="truncate text-[15px] font-semibold tracking-tight text-[#132b26]">
            Orderly Affairs
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          <NotificationBell
            notices={notices}
            onSelect={notice => onNoticeSelect?.(notice)}
          />
          <button
            type="button"
            onClick={onAccountClick}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#132b26] text-white shadow-sm active:scale-95"
            aria-label="Open account menu"
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showProgress ? (
        <div className="flex items-end justify-between gap-3 border-t border-[rgba(19,43,38,0.08)] bg-[var(--paper)] px-4 py-2.5">
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold leading-tight text-[#132b26]">
              {title}
            </h1>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              {completedCount} of {totalCount} sections completed
              {subtitle ? ` · ${subtitle}` : ''}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full bg-white px-2.5 py-1 text-[12px] font-bold text-[#132b26] ring-1 ring-slate-200 shadow-sm">
            {pct}%
          </span>
        </div>
      ) : null}
    </header>
  );
}
