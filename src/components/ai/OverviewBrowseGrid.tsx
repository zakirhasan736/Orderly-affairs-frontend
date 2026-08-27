'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
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
import { CategoryTile, SectionTile } from '@/components/vault-ui';
import { VAULT_NAVIGATION } from '@/utils/vaultNavigation';
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
import type { SectionProgress } from '@/utils/sectionCompletion';

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
  sectionProgressById?: Record<string, Pick<SectionProgress, 'percent' | 'complete' | 'started' | 'itemCount' | 'status'>>;
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
  sectionProgressById = {},
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

  const categoryProgress = (category: OverviewBrowseCategory) => {
    let itemCount = 0;
    let completeSections = 0;
    let incompleteSections = 0;
    for (const sectionId of category.sectionIds) {
      const progress = sectionProgressById[sectionId];
      itemCount += progress?.itemCount ?? 0;
      const isDone = Boolean(progress?.complete) || completedSet.has(sectionId);
      if (isDone) {
        completeSections += 1;
        continue;
      }
      const started =
        Boolean(progress?.started) ||
        (progress?.itemCount ?? 0) > 0 ||
        progress?.status === 'incomplete';
      if (started) incompleteSections += 1;
    }
    return {
      itemCount,
      complete:
        category.sectionIds.length > 0 &&
        completeSections === category.sectionIds.length,
      incomplete: incompleteSections > 0,
    };
  };

  const sectionStatus = (
    sectionId: string,
    hasPending: boolean,
  ): 'notStarted' | 'inProgress' | 'complete' => {
    const progress = sectionProgressById[sectionId];
    const isDone = Boolean(progress?.complete) || completedSet.has(sectionId);
    if (isDone) return 'complete';
    const started =
      hasPending ||
      Boolean(progress?.started) ||
      progress?.status === 'incomplete' ||
      (progress?.itemCount ?? 0) > 0;
    if (started) return 'inProgress';
    return 'notStarted';
  };

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

        return (
          <li key={sectionId}>
            <SectionTile
              title={title}
              status={sectionStatus(sectionId, hasPending)}
              itemCount={sectionProgressById[sectionId]?.itemCount}
              onClick={() => onNavigateToSection(sectionId)}
            />
          </li>
        );
      })}
    </ul>
  ) : null;

  const categoryGrid = (
    <div
      className={cn(
        'grid grid-cols-2 gap-2.5 p-3 sm:gap-3 sm:p-4',
        isSheet ? 'grid-cols-2' : 'md:grid-cols-4 xl:grid-cols-8',
      )}
    >
      {visibleCategories.map(category => {
        const Icon = ICONS[category.icon];
        const badge = attentionCount(category);
        const selected = activeId === category.id;
        const { itemCount, complete, incomplete } = categoryProgress(category);
        const newLabel =
          badge === 1
            ? '1 section with new data'
            : `${badge > 9 ? '9+' : badge} sections with new data`;

        return (
          <CategoryTile
            key={category.id}
            title={category.label}
            subtitle={
              badge > 0
                ? newLabel
                : 'Tap to browse'
            }
            hasNew={badge > 0}
            selected={selected}
            itemCount={itemCount}
            complete={complete}
            incomplete={incomplete}
            onClick={() => openCategory(category)}
            aria-label={
              [
                category.label,
                itemCount > 0 ? `${itemCount} records` : 'Empty',
                complete ? 'Complete' : incomplete ? 'Incomplete' : null,
                badge > 0 ? newLabel : null,
                'Tap to open',
              ]
                .filter(Boolean)
                .join('. ') + '.'
            }
            icon={
              <Icon
                className={cn(
                  'h-6 w-6 shrink-0',
                  selected
                    ? 'text-white/90'
                    : badge > 0
                      ? 'text-[#B4761A]'
                      : 'text-[#213D59]',
                )}
              />
            }
          />
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
            when documents were just filled. Numbers are records started, not a
            percent. A checkmark is complete; Incomplete means required fields
            are still open.
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
                  className="text-[11px] font-medium text-[#2E7FAD]"
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
        'overview-vault-by-category overflow-hidden rounded-[22px] border border-[#E4EAF0] bg-white shadow-[0_1px_2px_rgba(33,61,89,.06)]',
        className,
      )}
    >
      <div className="px-6 pt-[22px]">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#619FCE]">
          Browse
        </p>
        <h2 className="mt-1.5 text-[19px] font-bold tracking-[-0.02em] text-[#213D59]">
          Your Vault by category
        </h2>
        <p className="mt-1 text-[13.5px] text-[#7A8794]">
          Amber tiles have documents waiting for your review. The number is
          how many records you have started — not a percent. A checkmark means
          complete; Incomplete means required fields are still open.
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
