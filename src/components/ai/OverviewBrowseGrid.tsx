'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  ChevronRight,
  ContactRound,
  HeartPulse,
  Home,
  KeyRound,
  Landmark,
  Scale,
  Umbrella,
  Users,
  UsersRound,
} from 'lucide-react';
import { cn } from '@common/ui/utils';
import {
  getVaultSectionDisplayNumber,
  VAULT_NAVIGATION,
} from '@/utils/vaultNavigation';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import {
  OVERVIEW_BROWSE_CATEGORIES,
  type OverviewBrowseCategory,
} from '@/utils/overviewBrowseCategories';

const ICONS: Record<
  OverviewBrowseCategory['icon'],
  React.ComponentType<{ className?: string }>
> = {
  family: Users,
  finance: Landmark,
  property: Home,
  passwords: KeyRound,
  insurance: Umbrella,
  health: HeartPulse,
  legal: Scale,
  work: Building2,
  identity: ContactRound,
  community: UsersRound,
};

type OverviewBrowseGridProps = {
  onNavigateToSection: (sectionId: string) => void;
  completedSectionIds?: string[];
  className?: string;
  /** Family ACL: hide vault sections the collaborator cannot open. */
  allowedSectionIds?: 'all' | Set<string>;
  /**
   * `sheet` — mobile bottom-sheet: categories scroll on top; selected
   * category sections dock in a fixed bottom panel (no hunt-to-scroll).
   * `default` — overview card layout.
   */
  variant?: 'default' | 'sheet';
};

export function OverviewBrowseGrid({
  onNavigateToSection,
  completedSectionIds = [],
  className,
  allowedSectionIds = 'all',
  variant = 'default',
}: OverviewBrowseGridProps) {
  const routing = useOptionalAiDocumentRouting();
  const pendingUploads = routing?.pendingUploads ?? [];
  const [activeId, setActiveId] = useState<string | null>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const isSheet = variant === 'sheet';

  const canSeeSection = (sectionId: string) =>
    allowedSectionIds === 'all' || allowedSectionIds.has(String(sectionId));

  const visibleCategories = useMemo(() => {
    return OVERVIEW_BROWSE_CATEGORIES.map(category => ({
      ...category,
      sectionIds: category.sectionIds.filter(canSeeSection),
    })).filter(category => category.sectionIds.length > 0);
  }, [allowedSectionIds]);

  const pendingBySection = useMemo(() => {
    const map = new Set<string>();
    pendingUploads.forEach(upload => {
      if (
        (upload.highlightUpload || upload.targetSectionId) &&
        canSeeSection(upload.targetSectionId)
      ) {
        map.add(upload.targetSectionId);
      }
    });
    return map;
  }, [pendingUploads, allowedSectionIds]);

  const completedSet = useMemo(
    () => new Set(completedSectionIds.map(String).filter(canSeeSection)),
    [completedSectionIds, allowedSectionIds],
  );

  const sectionTitle = useMemo(() => {
    const map = new Map<string, string>();
    VAULT_NAVIGATION.forEach(section => {
      map.set(section.id, section.title);
    });
    return map;
  }, []);

  const active =
    visibleCategories.find(item => item.id === activeId) || null;

  const attentionCount = (category: OverviewBrowseCategory) =>
    category.sectionIds.filter(id => pendingBySection.has(id)).length;

  const openCategory = (category: OverviewBrowseCategory) => {
    if (category.sectionIds.length === 1) {
      onNavigateToSection(category.sectionIds[0]);
      return;
    }
    setActiveId(prev => (prev === category.id ? null : category.id));
  };

  // Clear selection if the active category disappeared under ACL.
  useEffect(() => {
    if (activeId && !visibleCategories.some(c => c.id === activeId)) {
      setActiveId(null);
    }
  }, [activeId, visibleCategories]);

  // Default (overview) layout: scroll the expanded list into view.
  useEffect(() => {
    if (isSheet || !activeId || !detailsRef.current) return;
    const el = detailsRef.current;
    window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [activeId, isSheet]);

  // Sheet layout: keep the docked panel scrolled into the sheet viewport.
  useEffect(() => {
    if (!isSheet || !activeId || !detailsRef.current) return;
    const el = detailsRef.current;
    window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [activeId, isSheet]);

  const sectionList = active ? (
    <ul className={cn('space-y-1.5', isSheet && 'max-h-[38dvh] overflow-y-auto')}>
      {active.sectionIds.map(sectionId => {
        const title = sectionTitle.get(sectionId) || `Section ${sectionId}`;
        const hasPending = pendingBySection.has(sectionId);
        const isDone = completedSet.has(sectionId);

        return (
          <li key={sectionId}>
            <button
              type="button"
              onClick={() => onNavigateToSection(sectionId)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                hasPending
                  ? 'border-sky-200 bg-sky-50'
                  : isDone
                    ? 'border-emerald-100 bg-emerald-50/60 hover:bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-[#213D59]/25',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold',
                  hasPending
                    ? 'bg-sky-600 text-white'
                    : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#e7eef7] text-[#213D59]',
                )}
              >
                {getVaultSectionDisplayNumber(sectionId)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-[#1a2b3d]">
                  {title}
                </span>
                <span className="block text-[11px] text-[#5a6b80]">
                  {hasPending
                    ? 'Ready to review'
                    : isDone
                      ? 'Completed'
                      : 'Open section'}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#213D59]" />
            </button>
          </li>
        );
      })}
    </ul>
  ) : null;

  const categoryGrid = (
    <div
      className={cn(
        'grid grid-cols-2 gap-2.5 p-3 sm:gap-3 sm:p-4',
        isSheet ? 'grid-cols-2' : 'md:grid-cols-3 lg:grid-cols-5',
      )}
    >
      {visibleCategories.map(category => {
        const Icon = ICONS[category.icon];
        const badge = attentionCount(category);
        const selected = activeId === category.id;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => openCategory(category)}
            className={cn(
              'relative flex min-h-[5.75rem] flex-col justify-between rounded-2xl border px-3.5 py-3 text-left transition active:scale-[0.98] sm:min-h-[6.75rem] sm:py-3.5',
              selected
                ? 'border-[#213D59] bg-[#213D59] text-white shadow-sm'
                : 'border-slate-200/90 bg-[#f7f8fa] text-[#1a2b3d] hover:border-[#213D59]/30 hover:bg-white',
            )}
          >
            {badge > 0 ? (
              <span
                className={cn(
                  'absolute right-2.5 top-2.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold',
                  selected
                    ? 'bg-white/20 text-white'
                    : 'bg-[#2B5A8C] text-white',
                )}
              >
                {badge > 9 ? '9+' : badge}
              </span>
            ) : null}
            <Icon
              className={cn(
                'h-5 w-5',
                selected ? 'text-white/90' : 'text-[#213D59]',
              )}
            />
            <span className="mt-3 text-[14px] font-semibold tracking-tight">
              {category.label}
            </span>
          </button>
        );
      })}
    </div>
  );

  if (isSheet) {
    return (
      <section
        data-overview-browse
        data-browse-variant="sheet"
        className={cn(
          'flex h-full min-h-0 flex-col overflow-hidden bg-white',
          className,
        )}
      >
        <div className="shrink-0 border-b border-slate-100 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Browse
          </p>
          <h2 className="mt-0.5 text-[15px] font-semibold text-[#213D59]">
            Vault by category
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[#5a6b80]">
            Tap a category to see its sections below.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {categoryGrid}
        </div>

        <div
          ref={detailsRef}
          className={cn(
            'shrink-0 border-t border-slate-200 bg-white',
            'shadow-[0_-10px_28px_rgba(15,23,42,0.08)]',
            'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
          )}
        >
          {active ? (
            <div className="px-3 pb-2 pt-3 sm:px-4">
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7785]">
                  {active.label} · {active.sectionIds.length} sections
                </p>
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className="text-[11px] font-medium text-[#2B5A8C]"
                >
                  Clear
                </button>
              </div>
              {sectionList}
            </div>
          ) : (
            <div className="px-4 py-4 text-center">
              <p className="text-[13px] font-medium text-[#213D59]">
                Select a category
              </p>
              <p className="mt-0.5 text-[12px] text-[#5a6b80]">
                Sections for that group will show here.
              </p>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      data-overview-browse
      data-tour="tour-vault-by-category"
      className={cn(
        'overview-vault-by-category overflow-hidden rounded-2xl border border-[#213D59]/12 bg-white shadow-sm',
        className,
      )}
    >
      <div className="border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Browse
        </p>
        <h2 className="mt-0.5 text-[15px] font-semibold text-[#213D59]">
          Vault by category
        </h2>
        <p className="mt-0.5 text-[12.5px] text-[#5a6b80]">
          Short groups — same sections as the sidebar.
        </p>
      </div>

      {categoryGrid}

      {active ? (
        <div
          ref={detailsRef}
          className="scroll-mt-3 border-t border-slate-100 px-3 pb-3.5 pt-1 sm:px-4 sm:pb-4"
        >
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-[#6b7785]">
            {active.label}
          </p>
          {sectionList}
        </div>
      ) : null}
    </section>
  );
}
