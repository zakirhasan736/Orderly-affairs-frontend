'use client';

import React, { useMemo, useState } from 'react';
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
import { VAULT_NAVIGATION } from '@/utils/vaultNavigation';
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
};

export function OverviewBrowseGrid({
  onNavigateToSection,
  completedSectionIds = [],
  className,
}: OverviewBrowseGridProps) {
  const routing = useOptionalAiDocumentRouting();
  const pendingUploads = routing?.pendingUploads ?? [];
  const [activeId, setActiveId] = useState<string | null>(null);

  const pendingBySection = useMemo(() => {
    const map = new Set<string>();
    pendingUploads.forEach(upload => {
      if (upload.highlightUpload || upload.targetSectionId) {
        map.add(upload.targetSectionId);
      }
    });
    return map;
  }, [pendingUploads]);

  const completedSet = useMemo(
    () => new Set(completedSectionIds.map(String)),
    [completedSectionIds],
  );

  const sectionTitle = useMemo(() => {
    const map = new Map<string, string>();
    VAULT_NAVIGATION.forEach(section => {
      map.set(section.id, section.title);
    });
    return map;
  }, []);

  const active =
    OVERVIEW_BROWSE_CATEGORIES.find(item => item.id === activeId) || null;

  const attentionCount = (category: OverviewBrowseCategory) =>
    category.sectionIds.filter(id => pendingBySection.has(id)).length;

  const openCategory = (category: OverviewBrowseCategory) => {
    if (category.sectionIds.length === 1) {
      onNavigateToSection(category.sectionIds[0]);
      return;
    }
    setActiveId(prev => (prev === category.id ? null : category.id));
  };

  return (
    <section
      data-overview-browse
      className={cn(
        'overflow-hidden rounded-2xl border border-[#213D59]/12 bg-white shadow-sm',
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

      <div className="grid grid-cols-2 gap-2.5 p-3 sm:gap-3 sm:p-4 md:grid-cols-3 lg:grid-cols-5">
        {OVERVIEW_BROWSE_CATEGORIES.map(category => {
          const Icon = ICONS[category.icon];
          const badge = attentionCount(category);
          const selected = activeId === category.id;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => openCategory(category)}
              className={cn(
                'relative flex min-h-[6.75rem] flex-col justify-between rounded-2xl border px-3.5 py-3.5 text-left transition',
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

      {active ? (
        <div className="border-t border-slate-100 px-3 pb-3.5 pt-1 sm:px-4 sm:pb-4">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-[#6b7785]">
            {active.label}
          </p>
          <ul className="space-y-1.5">
            {active.sectionIds.map(sectionId => {
              const title =
                sectionTitle.get(sectionId) || `Section ${sectionId}`;
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
                      {sectionId}
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
        </div>
      ) : null}
    </section>
  );
}
