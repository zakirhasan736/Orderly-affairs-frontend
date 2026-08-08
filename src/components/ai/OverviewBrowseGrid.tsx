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
import {
  listUnseenNewFills,
  NEW_FILLS_CHANGED,
  sectionHasUnseenFills,
} from '@/utils/newFillMarkers';
import { sectionHasSidebarNewAiData } from '@/utils/aiSidebarNewData';

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
  const [newFillTick, setNewFillTick] = useState(0);
  const detailsRef = useRef<HTMLDivElement>(null);
  const isSheet = variant === 'sheet';

  useEffect(() => {
    const bump = () => setNewFillTick(value => value + 1);
    window.addEventListener(NEW_FILLS_CHANGED, bump);
    window.addEventListener('orderly-ai-patch-stashed', bump);
    window.addEventListener('orderly-ai-section-reviewed', bump);
    return () => {
      window.removeEventListener(NEW_FILLS_CHANGED, bump);
      window.removeEventListener('orderly-ai-patch-stashed', bump);
      window.removeEventListener('orderly-ai-section-reviewed', bump);
    };
  }, []);

  const canSeeSection = (sectionId: string) =>
    allowedSectionIds === 'all' || allowedSectionIds.has(String(sectionId));

  const visibleCategories = useMemo(() => {
    return OVERVIEW_BROWSE_CATEGORIES.map(category => ({
      ...category,
      sectionIds: category.sectionIds.filter(canSeeSection),
    })).filter(category => category.sectionIds.length > 0);
  }, [allowedSectionIds]);

  const newFills = useMemo(() => {
    void newFillTick;
    return listUnseenNewFills();
  }, [newFillTick]);

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
    // Also treat unread AI fills / new-fill markers as attention.
    void newFillTick;
    VAULT_NAVIGATION.forEach(section => {
      if (!canSeeSection(section.id)) return;
      if (
        sectionHasUnseenFills(newFills, section.id) ||
        sectionHasSidebarNewAiData(section.id, pendingUploads)
      ) {
        map.add(section.id);
      }
    });
    return map;
  }, [pendingUploads, allowedSectionIds, newFillTick, newFills]);

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
    <ul className={cn('space-y-2', isSheet && 'max-h-[38dvh] overflow-y-auto')}>
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
                'group flex w-full items-center gap-3 rounded-xl border px-3.5 py-3.5 text-left transition',
                hasPending
                  ? 'border-amber-300 bg-amber-50 ring-1 ring-amber-200'
                  : isDone
                    ? 'border-emerald-100 bg-emerald-50/60 hover:bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-[#213D59]/25',
              )}
            >
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold',
                  hasPending
                    ? 'bg-amber-600 text-white'
                    : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#e7eef7] text-[#213D59]',
                )}
              >
                {getVaultSectionDisplayNumber(sectionId)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-[#1a2b3d]">
                  {title}
                </span>
                <span
                  className={cn(
                    'mt-0.5 block text-[13px]',
                    hasPending ? 'font-medium text-amber-900' : 'text-[#5a6b80]',
                  )}
                >
                  {hasPending
                    ? 'New information ready — tap to review'
                    : isDone
                      ? 'Completed'
                      : 'Tap to open this section'}
                </span>
              </span>
              {hasPending ? (
                <span className="shrink-0 rounded-full bg-amber-500 px-2.5 py-1 text-[12px] font-bold text-white">
                  New
                </span>
              ) : (
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#213D59]" />
              )}
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
        const newLabel =
          badge === 1
            ? '1 section with new data'
            : `${badge > 9 ? '9+' : badge} sections with new data`;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => openCategory(category)}
            aria-label={
              badge > 0
                ? `${category.label}. ${newLabel}. Tap to open.`
                : `${category.label}. Tap to open.`
            }
            className={cn(
              'relative flex min-h-[7rem] flex-col justify-between rounded-2xl border px-3.5 py-3.5 text-left transition active:scale-[0.98] sm:min-h-[7.5rem]',
              selected
                ? 'border-[#213D59] bg-[#213D59] text-white shadow-sm'
                : badge > 0
                  ? 'border-amber-300 bg-amber-50 text-[#1a2b3d] shadow-sm ring-1 ring-amber-200 hover:bg-amber-100/80'
                  : 'border-slate-200/90 bg-[#f7f8fa] text-[#1a2b3d] hover:border-[#213D59]/30 hover:bg-white',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <Icon
                className={cn(
                  'h-6 w-6 shrink-0',
                  selected
                    ? 'text-white/90'
                    : badge > 0
                      ? 'text-amber-800'
                      : 'text-[#213D59]',
                )}
              />
              {badge > 0 ? (
                <span
                  className={cn(
                    'inline-flex max-w-[7.5rem] items-center justify-center rounded-full px-2 py-1 text-center text-[11px] font-bold leading-tight sm:max-w-none sm:text-[12px]',
                    selected
                      ? 'bg-amber-300 text-amber-950'
                      : 'bg-amber-500 text-white',
                  )}
                >
                  {badge > 9 ? '9+' : badge} new
                </span>
              ) : null}
            </div>

            <div className="mt-3 space-y-1">
              <span className="block text-[15px] font-semibold leading-snug tracking-tight sm:text-[16px]">
                {category.label}
              </span>
              {badge > 0 ? (
                <span
                  className={cn(
                    'block text-[12px] font-medium leading-snug sm:text-[13px]',
                    selected ? 'text-amber-100' : 'text-amber-900',
                  )}
                >
                  {newLabel}
                </span>
              ) : (
                <span
                  className={cn(
                    'block text-[12px] leading-snug sm:text-[13px]',
                    selected ? 'text-white/75' : 'text-[#5a6b80]',
                  )}
                >
                  Tap to browse
                </span>
              )}
            </div>
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
          <h2 className="mt-0.5 text-[17px] font-semibold text-[#213D59]">
            Vault by category
          </h2>
          <p className="mt-1 text-[13.5px] leading-snug text-[#5a6b80]">
            Amber tiles say <span className="font-semibold text-amber-800">new</span>{' '}
            when documents were just filled — tap one to open those sections.
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
              <p className="text-[15px] font-semibold text-[#213D59]">
                Select a category above
              </p>
              <p className="mt-1 text-[13px] leading-snug text-[#5a6b80]">
                Then tap a section to open it. Amber means new documents are
                ready.
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
        <h2 className="mt-0.5 text-[17px] font-semibold text-[#213D59]">
          Vault by category
        </h2>
        <p className="mt-1 text-[13.5px] leading-snug text-[#5a6b80]">
          Look for amber tiles labeled{' '}
          <span className="font-semibold text-amber-800">new</span> — those have
          documents ready to review. Tap the category, then tap the section.
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
