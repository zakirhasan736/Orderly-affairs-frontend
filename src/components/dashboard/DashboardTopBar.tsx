'use client';

import React from 'react';
import Image from 'next/image';
import { Menu, Upload, User } from 'lucide-react';
import { VaultExportMenu } from '@/components/VaultExportMenu';
import type { VaultExportPayload } from '@/utils/vaultExport';
import { cn } from '@common/ui/utils';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { UploadedDocumentsButton } from '@/components/vault/UploadedDocumentsButton';
import { useUploadedDocuments } from '@/hooks/useUploadedDocuments';
import type { DashboardNotice } from '@/utils/dashboardNotifications';
import { BRAND_LOGO } from '@/constants/brand';
import { GlobalSearch, ProgressRing, type GlobalSearchResult } from '@/components/vault-ui';
import { VAULT_SCHEMA } from '@/vault-prototype';
import { openVaultSubsection } from '@/vault-prototype/navigate';

function buildVaultSearchResults(): GlobalSearchResult[] {
  const rows: GlobalSearchResult[] = [
    { id: 'dashboard', title: 'Dashboard', subtitle: 'Overview' },
    {
      id: 'vault-settings',
      title: 'Vault Settings',
      subtitle: 'Account, subscription, access',
    },
  ];
  for (const section of VAULT_SCHEMA) {
    rows.push({
      id: section.apiId,
      title: section.name,
      subtitle: section.collection,
      sectionId: section.apiId,
    });
    for (const sub of section.subs) {
      rows.push({
        id: `${section.apiId}::${sub.id}`,
        title: sub.name,
        subtitle: section.name,
        sectionId: section.apiId,
        subId: sub.id,
      });
      for (const field of sub.fields) {
        rows.push({
          id: `${section.apiId}::${sub.id}::${field.k}`,
          title: field.k,
          subtitle: `${section.name} · ${sub.name}`,
          sectionId: section.apiId,
          subId: sub.id,
        });
      }
    }
  }
  return rows;
}

function HeaderProgressRing({
  completed,
  total,
  progressPercent,
}: {
  completed: number;
  total: number;
  /** Field-fill vault % (updates on fill and delete). */
  progressPercent?: number;
}) {
  const pct =
    typeof progressPercent === 'number' && Number.isFinite(progressPercent)
      ? Math.min(100, Math.max(0, Math.round(progressPercent)))
      : total > 0
        ? Math.min(100, Math.round((completed / total) * 100))
        : 0;

  return (
    <div
      data-tour="tour-progress-explain"
      className="flex items-center gap-2.5 rounded-full border border-[#E4EAF0] bg-white py-1.5 pl-1.5 pr-3.5"
    >
      <ProgressRing value={pct} size="topbar" />
      <div className="leading-tight">
        <p className="text-[12.5px] font-bold text-[#213D59]">
          {completed} of {total}
        </p>
        <p className="text-[12px] font-semibold text-[#7A8794]">sections done</p>
      </div>
    </div>
  );
}

type DashboardTopBarProps = {
  currentSectionLabel: string;
  completedSectionsCount: number;
  totalSectionsCount: number;
  /** Field-fill vault % — recalculates when data is added or removed. */
  progressPercent?: number;
  onRunTour: () => void;
  onUpload?: () => void;
  exportPayload: VaultExportPayload;
  currentUserEmail?: string | null;
  onAccountInfo: () => void;
  onLogout: () => void;
  notices?: DashboardNotice[];
  onNoticeSelect?: (notice: DashboardNotice) => void;
  onOpenReviewInbox?: () => void;
  onOpenNotificationSettings?: () => void;
  onNavigateToSection?: (sectionId: string) => void;
  className?: string;
};

export function DashboardTopBar({
  currentSectionLabel,
  completedSectionsCount,
  totalSectionsCount,
  progressPercent,
  onRunTour,
  onUpload,
  exportPayload,
  currentUserEmail,
  onAccountInfo,
  onLogout,
  notices = [],
  onNoticeSelect,
  onOpenReviewInbox,
  onOpenNotificationSettings,
  onNavigateToSection,
  className,
}: DashboardTopBarProps) {
  const searchResults = React.useMemo(() => buildVaultSearchResults(), []);
  const { count: uploadedCount } = useUploadedDocuments();

  const handleSearchSelect = (result: GlobalSearchResult) => {
    const sectionId = result.sectionId || result.id;
    onNavigateToSection?.(sectionId);
    if (result.subId) {
      window.setTimeout(() => {
        openVaultSubsection(sectionId, result.subId!);
      }, 40);
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 hidden border-b border-[#E4EAF0] bg-white/92 backdrop-blur-[10px] md:block',
        className,
      )}
    >
      <div className="grid h-[70px] grid-cols-[minmax(0,1fr)_minmax(0,520px)_minmax(0,1fr)] items-center gap-4 px-[26px]">
        <div className="min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#7A8794]">
            Current area
          </p>
          <h1 className="truncate text-[18px] font-bold tracking-[-0.02em] text-[#213D59]">
            {currentSectionLabel}
          </h1>
        </div>

        <div className="min-w-0">
          {onNavigateToSection ? (
            <GlobalSearch
              results={searchResults}
              onSelect={handleSearchSelect}
              placeholder="Search your Vault"
            />
          ) : null}
        </div>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-2.5">
          <HeaderProgressRing
            completed={completedSectionsCount}
            total={totalSectionsCount}
            progressPercent={progressPercent}
          />

          {uploadedCount > 0 ? (
            <UploadedDocumentsButton className="shadow-sm" />
          ) : (
            <button
              type="button"
              onClick={onUpload || onOpenReviewInbox}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#E4EAF0] bg-white px-[18px] text-[14px] font-semibold text-[#213D59] hover:border-[#619FCE] hover:bg-[#EAF6FD]"
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
          )}

          <NotificationBell
            notices={notices}
            onSelect={notice => onNoticeSelect?.(notice)}
            onOpenSettings={onOpenNotificationSettings || onAccountInfo}
            onOpenReviewInbox={onOpenReviewInbox}
            buttonClassName="h-[38px] w-[38px] rounded-full border border-[#E4EAF0] bg-white"
          />

          <div className="owner-state-information group relative">
            <button
              type="button"
              className="flex h-[38px] w-[38px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#213D59] text-white"
              aria-label="Account menu"
            >
              <User className="h-4 w-4" />
            </button>

            <div className="invisible absolute right-0 top-full z-[60] mt-3 translate-y-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <div className="min-w-[230px] rounded-3xl border border-slate-100 bg-white p-2 shadow-2xl">
                <div className="mb-1 border-b border-slate-100 px-4 py-3">
                  {currentUserEmail ? (
                    <p className="truncate text-[12px] font-semibold text-[#213D59]">
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
                  className="w-full rounded-2xl px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-600 transition hover:bg-slate-50 hover:text-[#213D59]"
                >
                  Account Info
                </button>
                <button
                  type="button"
                  onClick={onRunTour}
                  className="w-full rounded-2xl px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-600 transition hover:bg-slate-50 hover:text-[#213D59]"
                >
                  Run Tour
                </button>
                <VaultExportMenu
                  payload={exportPayload}
                  trigger={
                    <button
                      type="button"
                      className="w-full rounded-2xl px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-600 transition hover:bg-slate-50 hover:text-[#213D59]"
                    >
                      Export
                    </button>
                  }
                />

                <button
                  type="button"
                  onClick={onAccountInfo}
                  className="w-full rounded-2xl px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-600 transition hover:bg-slate-50 hover:text-[#213D59]"
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
  /** Field-fill vault % (preferred over completed/total ratio). */
  progressPercent?: number;
  onMenuClick: () => void;
  onLogoClick: () => void;
  onAccountClick: () => void;
  showProgress?: boolean;
  notices?: DashboardNotice[];
  onNoticeSelect?: (notice: DashboardNotice) => void;
  onOpenReviewInbox?: () => void;
  onOpenNotificationSettings?: () => void;
  onNavigateToSection?: (sectionId: string) => void;
};

export function MobileTopBar({
  title,
  subtitle,
  completedCount = 0,
  totalCount = 0,
  progressPercent,
  onMenuClick,
  onLogoClick,
  onAccountClick,
  showProgress = false,
  notices = [],
  onNoticeSelect,
  onOpenReviewInbox,
  onOpenNotificationSettings,
  onNavigateToSection,
}: MobileTopBarProps) {
  const pct =
    typeof progressPercent === 'number' && Number.isFinite(progressPercent)
      ? Math.min(100, Math.max(0, Math.round(progressPercent)))
      : totalCount > 0
        ? Math.min(100, Math.round((completedCount / totalCount) * 100))
        : 0;
  const { count: uploadedCount } = useUploadedDocuments();

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(33, 61, 89,0.1)] bg-[var(--paper)] md:hidden">
      <div className="flex h-14 items-center gap-1 px-2.5">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#213D59] active:bg-slate-100 active:scale-95"
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
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-[#213D59]/10">
            <Image
              src={BRAND_LOGO}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              priority
            />
          </span>
          <span className="truncate text-[15px] font-semibold tracking-tight text-[#213D59]">
            Orderly Affairs
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          {uploadedCount > 0 ? (
            <UploadedDocumentsButton dense className="mr-1 shadow-sm" />
          ) : null}
          <NotificationBell
            notices={notices}
            onSelect={notice => onNoticeSelect?.(notice)}
            onOpenSettings={onOpenNotificationSettings || onAccountClick}
            onOpenReviewInbox={onOpenReviewInbox}
          />
          <button
            type="button"
            onClick={onAccountClick}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#213D59] text-white shadow-sm active:scale-95"
            aria-label="Open account menu"
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      </div>

      {onNavigateToSection ? (
        <div className="border-t border-[#E4EAF0] px-3 py-2">
          <GlobalSearch
            results={buildVaultSearchResults()}
            onSelect={result => {
              const sectionId = result.sectionId || result.id;
              onNavigateToSection(sectionId);
              if (result.subId) {
                window.setTimeout(() => {
                  openVaultSubsection(sectionId, result.subId!);
                }, 40);
              }
            }}
            placeholder="Search your Vault"
          />
        </div>
      ) : null}

      {showProgress ? (
        <div
          data-tour="tour-progress-explain"
          className="flex items-end justify-between gap-3 border-t border-[rgba(33, 61, 89,0.08)] bg-[var(--paper)] px-4 py-2.5"
        >
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold leading-tight text-[#213D59]">
              {title}
            </h1>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              {completedCount} of {totalCount} sections completed
              {subtitle ? ` · ${subtitle}` : ''}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full bg-white px-2.5 py-1 text-[12px] font-bold text-[#213D59] ring-1 ring-slate-200 shadow-sm">
            {pct}%
          </span>
        </div>
      ) : null}
    </header>
  );
}
