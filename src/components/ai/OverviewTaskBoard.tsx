'use client';

import React, { useMemo } from 'react';
import {
  FileText,
  Heart,
  Landmark,
  Users,
} from 'lucide-react';
import { cn } from '@common/ui/utils';
import {
  OVERVIEW_TAG_STYLES,
  OVERVIEW_TASK_GROUPS,
  type OverviewTaskCard,
  type OverviewTaskTag,
} from '@/utils/overviewTaskGroups';
import type { DashboardAiJob } from '@/hooks/useDashboardAiBatchRunner';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import { formatSectionLastUpdated } from '@/utils/sectionLastUpdated';

type CardVisualState =
  | { kind: 'waiting'; label: string; progress: number; isNew?: boolean }
  | { kind: 'active'; label: string; progress: number; isNew?: boolean }
  | { kind: 'done'; label: string; progress: number; isNew?: boolean }
  | { kind: 'start'; label: string; progress: number; isNew?: boolean }
  | { kind: 'partial'; label: string; progress: number; isNew?: boolean };

type OverviewTaskBoardProps = {
  jobs: DashboardAiJob[];
  completedSectionIds?: string[];
  lastUpdatedBySection?: Record<string, string>;
  onNavigateToSection: (sectionId: string) => void;
};

function pickJobForSection(jobs: DashboardAiJob[], sectionId: string) {
  const matches = jobs.filter(
    job =>
      job.targetSectionId === sectionId ||
      job.activeFillSectionId === sectionId,
  );
  if (!matches.length) return null;

  const rank = (status: DashboardAiJob['status']) => {
    if (status === 'done') return 4;
    if (status === 'error') return 3;
    if (status === 'queued') return 1;
    return 2;
  };

  return [...matches].sort((a, b) => {
    const aActive =
      a.activeFillSectionId === sectionId && a.status !== 'done' ? 1 : 0;
    const bActive =
      b.activeFillSectionId === sectionId && b.status !== 'done' ? 1 : 0;
    if (bActive !== aActive) return bActive - aActive;
    return rank(b.status) - rank(a.status);
  })[0];
}

function resolveCardState(
  card: OverviewTaskCard,
  jobs: DashboardAiJob[],
  completedSet: Set<string>,
  pendingReady: Set<string>,
  recentlyUpdated: Set<string>,
): CardVisualState {
  const job = pickJobForSection(jobs, card.sectionId);
  const isNew =
    pendingReady.has(card.sectionId) || recentlyUpdated.has(card.sectionId);

  if (job) {
    const isActivelyFillingThis =
      job.activeFillSectionId === card.sectionId &&
      job.status !== 'done' &&
      job.status !== 'error';

    if (isActivelyFillingThis) {
      return {
        kind: 'active',
        label: `${Math.max(5, Math.min(99, job.progress || 5))}%`,
        progress: Math.max(5, Math.min(99, job.progress || 5)),
      };
    }

    if (
      job.targetSectionId === card.sectionId &&
      job.activeFillSectionId &&
      job.activeFillSectionId !== card.sectionId &&
      job.status !== 'error'
    ) {
      return {
        kind: 'done',
        label: 'Filled',
        progress: 100,
        isNew: true,
      };
    }

    if (job.status === 'done') {
      return {
        kind: 'done',
        label: isNew ? 'Filled' : 'Done',
        progress: 100,
        isNew,
      };
    }
    if (job.status === 'queued') {
      return { kind: 'waiting', label: 'Waiting', progress: 8 };
    }
    if (job.status === 'error') {
      return {
        kind: 'partial',
        label: 'Retry',
        progress: Math.max(12, job.progress || 20),
      };
    }
    return {
      kind: 'active',
      label: `${Math.max(5, Math.min(99, job.progress || 5))}%`,
      progress: Math.max(5, Math.min(99, job.progress || 5)),
    };
  }

  if (pendingReady.has(card.sectionId)) {
    return { kind: 'done', label: 'Filled', progress: 100, isNew: true };
  }

  if (recentlyUpdated.has(card.sectionId)) {
    return { kind: 'done', label: 'Filled', progress: 100, isNew: true };
  }

  if (completedSet.has(card.sectionId)) {
    return { kind: 'done', label: 'Done', progress: 100 };
  }

  return { kind: 'start', label: 'Start', progress: 0 };
}

function TagIcon({ tag }: { tag: OverviewTaskTag }) {
  const className = 'h-5 w-5';
  if (tag === 'HEART') return <Heart className={className} />;
  if (tag === 'MONEY') return <Landmark className={className} />;
  if (tag === 'DOCS') return <FileText className={className} />;
  return <Users className={className} />;
}

function ProgressLine({ state }: { state: CardVisualState }) {
  const barClass =
    state.kind === 'done'
      ? 'bg-[#2e7d6e]'
      : state.kind === 'active'
        ? 'bg-[#2e7d6e]'
        : state.kind === 'waiting'
          ? 'bg-[#b98a3e]'
          : state.kind === 'partial'
            ? 'bg-[#b98a3e]'
            : 'bg-[rgba(19,43,38,0.12)]';

  return (
    <div className="mt-auto flex items-center gap-2.5 pt-4">
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[rgba(19,43,38,0.06)]">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            barClass,
            state.kind === 'active' && 'animate-pulse',
          )}
          style={{ width: `${state.progress}%` }}
        />
      </div>
      <span
        className={cn(
          'shrink-0 text-[11px] font-semibold',
          state.kind === 'done' || state.isNew
            ? 'text-[#2e7d6e]'
            : state.kind === 'active'
              ? 'text-[#2e7d6e]'
              : state.kind === 'waiting'
                ? 'text-[#b98a3e]'
                : 'text-[rgba(19,43,38,0.45)]',
        )}
      >
        {state.label}
      </span>
    </div>
  );
}

function SliderTaskCard({
  card,
  state,
  onOpen,
}: {
  card: OverviewTaskCard;
  state: CardVisualState;
  onOpen: () => void;
}) {
  const tag = OVERVIEW_TAG_STYLES[card.tag];
  const iconWrap =
    card.tag === 'HEART'
      ? 'bg-rose-50 text-rose-500'
      : card.tag === 'MONEY'
        ? 'bg-emerald-50 text-emerald-600'
        : card.tag === 'DOCS'
          ? 'bg-sky-50 text-sky-600'
          : 'bg-violet-50 text-violet-600';

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'relative flex h-[210px] w-[168px] shrink-0 snap-start flex-col rounded-[20px] border bg-[var(--surface)] p-4 text-left transition active:scale-[0.98]',
        state.kind === 'active'
          ? 'border-[rgba(46,125,110,0.35)] ring-1 ring-[rgba(46,125,110,0.12)]'
          : state.kind === 'waiting'
            ? 'border-[rgba(185,138,62,0.45)] ring-1 ring-[rgba(185,138,62,0.12)]'
            : state.isNew
              ? 'border-[rgba(46,125,110,0.4)]'
              : state.kind === 'done'
                ? 'border-[rgba(46,125,110,0.2)]'
                : 'border-[rgba(19,43,38,0.1)]',
      )}
      data-overview-task={card.sectionId}
      data-overview-task-state={state.kind}
    >
      {state.isNew ? (
        <span className="absolute right-3 top-3 rounded-md bg-[#2e7d6e] px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
          New
        </span>
      ) : null}
      <span
        className={cn(
          'inline-flex w-fit rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]',
          tag.badge,
        )}
      >
        {tag.label}
      </span>
      <div
        className={cn(
          'mt-5 flex h-12 w-12 items-center justify-center rounded-full',
          iconWrap,
        )}
      >
        <TagIcon tag={card.tag} />
      </div>
      <h3 className="mt-3 line-clamp-2 text-[14px] font-semibold leading-snug text-[#132b26]">
        {card.title}
      </h3>
      <ProgressLine state={state} />
    </button>
  );
}

function GridTaskCard({
  card,
  state,
  lastUpdatedLabel,
  onOpen,
}: {
  card: OverviewTaskCard;
  state: CardVisualState;
  lastUpdatedLabel?: string;
  onOpen: () => void;
}) {
  const tag = OVERVIEW_TAG_STYLES[card.tag];

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'relative rounded-2xl border bg-[var(--surface)] p-4 text-left transition hover:-translate-y-0.5 oa-float-sm sm:p-5',
        state.kind === 'active'
          ? 'border-[rgba(46,125,110,0.35)] ring-1 ring-[rgba(46,125,110,0.12)]'
          : state.kind === 'waiting'
            ? 'border-[rgba(185,138,62,0.45)] ring-1 ring-[rgba(185,138,62,0.12)]'
            : state.isNew
              ? 'border-[rgba(46,125,110,0.4)] ring-1 ring-[rgba(46,125,110,0.12)]'
              : state.kind === 'done'
                ? 'border-[rgba(46,125,110,0.2)]'
                : 'border-[rgba(19,43,38,0.1)]',
      )}
      data-overview-task={card.sectionId}
      data-overview-task-state={state.kind}
      data-overview-task-new={state.isNew ? 'true' : undefined}
    >
      {state.isNew && (
        <span className="absolute right-3 top-3 inline-flex items-center rounded-md bg-[#2e7d6e] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Filled
        </span>
      )}
      <span
        className={cn(
          'inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]',
          tag.badge,
        )}
      >
        {tag.label}
      </span>
      <h3 className="mt-3 text-base font-semibold text-[#132b26]">
        {card.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm leading-5 text-[rgba(19,43,38,0.58)]">
        {state.kind === 'active'
          ? 'Reading your document and filling this section…'
          : state.kind === 'waiting'
            ? 'Needs you — queued while another file finishes.'
            : state.isNew
              ? 'Filled automatically — tap only if you want to review.'
              : card.description}
      </p>
      {lastUpdatedLabel ? (
        <p className="mt-2 text-xs font-medium text-[rgba(19,43,38,0.45)]">
          {lastUpdatedLabel}
        </p>
      ) : null}
      <ProgressLine state={state} />
    </button>
  );
}

export function OverviewTaskBoard({
  jobs,
  completedSectionIds = [],
  lastUpdatedBySection = {},
  onNavigateToSection,
}: OverviewTaskBoardProps) {
  const routing = useOptionalAiDocumentRouting();

  const completedSet = useMemo(
    () => new Set(completedSectionIds),
    [completedSectionIds],
  );

  const pendingReady = useMemo(() => {
    const set = new Set<string>();
    (routing?.pendingUploads || []).forEach(upload => {
      if (upload.highlightUpload) set.add(upload.targetSectionId);
    });
    return set;
  }, [routing?.pendingUploads]);

  const recentlyUpdated = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach(job => {
      if (job.status === 'done' && job.targetSectionId) {
        set.add(job.targetSectionId);
      }
    });
    return set;
  }, [jobs]);

  const allCards = useMemo(
    () => OVERVIEW_TASK_GROUPS.flatMap(group => group.cards),
    [],
  );

  const openCard = (card: OverviewTaskCard) => {
    const job = pickJobForSection(jobs, card.sectionId);
    if (job?.targetSectionId && routing) {
      const pending =
        routing.getPendingUploadsForSection(card.sectionId).find(
          item => item.file_id === job.file_id && item.highlightUpload,
        ) || routing.getPendingUploadsForSection(card.sectionId)[0];

      if (pending) {
        routing.navigateToPendingSection(pending, 'autofill');
        return;
      }
    }

    if (pendingReady.has(card.sectionId) && routing) {
      const pending = routing.getPendingUploadsForSection(card.sectionId)[0];
      if (pending) {
        routing.navigateToPendingSection(pending, 'autofill');
        return;
      }
    }

    onNavigateToSection(card.sectionId);
  };

  const cardState = (card: OverviewTaskCard) =>
    resolveCardState(
      card,
      jobs,
      completedSet,
      pendingReady,
      recentlyUpdated,
    );

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Mobile: horizontal continue slider */}
      <section className="md:hidden">
        <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
          <div>
            <h2 className="text-base font-semibold text-[#132b26]">
              Continue where you left off
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Swipe cards · tap to open or review AI fills
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToSection('1')}
            className="text-xs font-semibold text-sky-600"
          >
            View all
          </button>
        </div>
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {allCards.map(card => (
            <SliderTaskCard
              key={`slider-${card.id}`}
              card={card}
              state={cardState(card)}
              onOpen={() => openCard(card)}
            />
          ))}
        </div>
      </section>

      {/* Desktop / tablet: grouped grids */}
      <div className="hidden space-y-8 md:block">
        {OVERVIEW_TASK_GROUPS.map(group => (
          <section key={group.id}>
            <h2 className="mb-3 text-lg font-semibold text-[#132b26]">
              {group.title}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {group.cards.map(card => (
                <GridTaskCard
                  key={card.id}
                  card={card}
                  state={cardState(card)}
                  lastUpdatedLabel={formatSectionLastUpdated(
                    lastUpdatedBySection[card.sectionId],
                  )}
                  onOpen={() => openCard(card)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
