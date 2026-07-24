'use client';

import React, { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@common/ui/utils';
import { VAULT_NAVIGATION } from '@/utils/vaultNavigation';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';

const SHORTCUT_GROUPS: Array<{
  id: string;
  label: string;
  hint: string;
  sectionIds: string[];
}> = [
  {
    id: 'loved-ones',
    label: 'Loved ones',
    hint: 'Access, letters, messages, family',
    sectionIds: ['2', '3', '4', '17', '21'],
  },
  {
    id: 'money',
    label: 'Money & property',
    hint: 'Home, banks, insurance, assets',
    sectionIds: ['5', '6', '7', '12', '14', '16', '19'],
  },
  {
    id: 'docs',
    label: 'Documents & identity',
    hint: 'Vital info, passwords, legal',
    sectionIds: ['1', '13', '15', '18', '20'],
  },
  {
    id: 'life',
    label: 'Life & community',
    hint: 'Memberships, giving, education',
    sectionIds: ['8', '9', '10', '11'],
  },
];

type OverviewSectionShortcutsProps = {
  onNavigateToSection: (sectionId: string) => void;
  completedSectionIds?: string[];
};

export function OverviewSectionShortcuts({
  onNavigateToSection,
  completedSectionIds = [],
}: OverviewSectionShortcutsProps) {
  const routing = useOptionalAiDocumentRouting();
  const pendingUploads = routing?.pendingUploads ?? [];
  const [activeGroup, setActiveGroup] = useState(SHORTCUT_GROUPS[0].id);

  const pendingBySection = useMemo(() => {
    const map = new Set<string>();
    pendingUploads.forEach(upload => {
      if (upload.highlightUpload) map.add(upload.targetSectionId);
    });
    return map;
  }, [pendingUploads]);

  const completedSet = useMemo(
    () => new Set(completedSectionIds),
    [completedSectionIds],
  );

  const sectionTitle = useMemo(() => {
    const map = new Map<string, string>();
    VAULT_NAVIGATION.forEach(section => {
      map.set(section.id, section.title);
    });
    return map;
  }, []);

  const group =
    SHORTCUT_GROUPS.find(item => item.id === activeGroup) || SHORTCUT_GROUPS[0];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Vault sections
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[#10213f]">
              Jump to any section
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Same destinations as the left sidebar — one click.
          </p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {SHORTCUT_GROUPS.map(item => {
            const pendingCount = item.sectionIds.filter(id =>
              pendingBySection.has(id),
            ).length;
            const active = activeGroup === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveGroup(item.id)}
                className={cn(
                  'rounded-xl border px-3.5 py-3 text-left transition',
                  active
                    ? 'border-[#10213f] bg-[#10213f] text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300 hover:bg-white',
                )}
              >
                <span className="block text-sm font-semibold">{item.label}</span>
                <span
                  className={cn(
                    'mt-0.5 block text-xs',
                    active ? 'text-white/70' : 'text-slate-500',
                  )}
                >
                  {pendingCount > 0
                    ? `${pendingCount} ready to review`
                    : item.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3">
        {group.sectionIds.map(sectionId => {
          const title = sectionTitle.get(sectionId) || `Section ${sectionId}`;
          const hasPending = pendingBySection.has(sectionId);
          const isDone = completedSet.has(sectionId);

          return (
            <button
              key={sectionId}
              type="button"
              onClick={() => onNavigateToSection(sectionId)}
              className={cn(
                'group flex min-h-[72px] items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition',
                hasPending
                  ? 'border-sky-300 bg-sky-50 ring-1 ring-sky-200'
                  : isDone
                    ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-[#10213f]/25 hover:bg-slate-50',
              )}
            >
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                  hasPending
                    ? 'bg-sky-600 text-white'
                    : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#10213f] text-white',
                )}
              >
                {sectionId}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {title}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {hasPending
                    ? 'AI ready — tap to review'
                    : isDone
                      ? 'Completed'
                      : 'Open section'}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#10213f]" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
