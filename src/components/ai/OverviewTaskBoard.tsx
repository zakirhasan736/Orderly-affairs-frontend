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
import type { SectionProgress } from '@/utils/sectionCompletion';

type ProgressSlice = Pick<
  SectionProgress,
  | 'percent'
  | 'complete'
  | 'started'
  | 'itemCount'
  | 'completeItemCount'
  | 'status'
>;

type CardVisualState =
  | { kind: 'waiting'; label: string; progress: number; isNew?: boolean; itemCount?: number }
  | { kind: 'active'; label: string; progress: number; isNew?: boolean; itemCount?: number }
  | { kind: 'done'; label: string; progress: number; isNew?: boolean; itemCount?: number }
  | { kind: 'start'; label: string; progress: number; isNew?: boolean; itemCount?: number }
  | { kind: 'partial'; label: string; progress: number; isNew?: boolean; itemCount?: number };

type OverviewTaskBoardProps = {
  jobs: DashboardAiJob[];
  completedSectionIds?: string[];
  /** Started / incomplete / complete by section — labels are Empty / Incomplete / Complete + item counts. */
  sectionProgressById?: Record<string, ProgressSlice>;
  lastUpdatedBySection?: Record<string, string>;
  onNavigateToSection: (sectionId: string) => void;
  /** Family ACL: only show task cards for granted vault sections. */
  allowedSectionIds?: 'all' | Set<string>;
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

function fillStateFromProgress(
  fill: ProgressSlice | undefined,
  opts?: { isNew?: boolean },
): CardVisualState {
  const complete = Boolean(fill?.complete || fill?.status === 'complete');
  const started =
    Boolean(fill?.started) ||
    fill?.status === 'incomplete' ||
    (fill?.itemCount ?? 0) > 0;
  const itemCount = fill?.itemCount ?? 0;

  if (complete) {
    return {
      kind: 'done',
      label: itemCount > 0 ? String(itemCount) : 'Done',
      progress: 100,
      isNew: opts?.isNew,
      itemCount,
    };
  }
  if (!started) {
    return { kind: 'start', label: '', progress: 0, itemCount: 0 };
  }
  return {
    kind: 'partial',
    label: 'Incomplete',
    progress: 40,
    isNew: opts?.isNew,
    itemCount,
  };
}

function resolveCardState(
  card: OverviewTaskCard,
  jobs: DashboardAiJob[],
  pendingReady: Set<string>,
  sectionProgressById: Record<string, ProgressSlice>,
): CardVisualState {
  const fill = sectionProgressById[card.sectionId];
  const fillPercent = fill?.percent ?? 0;
  const job = pickJobForSection(jobs, card.sectionId);
  const isNew =
    pendingReady.has(card.sectionId) ||
    (Boolean(job?.status === 'done') &&
      (Boolean(fill?.started) || fillPercent > 0));

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

    if (job.status === 'queued') {
      return { kind: 'waiting', label: 'Waiting', progress: 8 };
    }
    if (job.status === 'error') {
      return {
        kind: 'partial',
        label: 'Retry',
        progress: Math.max(12, Math.min(fillPercent || 20, 99)),
      };
    }
    if (job.status === 'needs_section_choice') {
      return {
        kind: 'partial',
        label: 'Assign',
        progress: 80,
        isNew: true,
      };
    }

    // Finished AI job: still reflect real section fill (empty → Start, not Done)
    if (job.status === 'done') {
      return fillStateFromProgress(fill, {
        isNew: Boolean(fill?.started) || fillPercent > 0,
      });
    }

    if (
      job.targetSectionId === card.sectionId &&
      job.activeFillSectionId &&
      job.activeFillSectionId !== card.sectionId
    ) {
      return fillStateFromProgress(fill, {
        isNew: Boolean(fill?.started) || fillPercent > 0,
      });
    }

    return {
      kind: 'active',
      label: `${Math.max(5, Math.min(99, job.progress || 5))}%`,
      progress: Math.max(5, Math.min(99, job.progress || 5)),
    };
  }

  if (pendingReady.has(card.sectionId) && (Boolean(fill?.started) || fillPercent > 0)) {
    return fillStateFromProgress(fill, { isNew: true });
  }

  return fillStateFromProgress(fill, { isNew });
}

function TagIcon({ tag }: { tag: OverviewTaskTag }) {
  const className = 'h-5 w-5';
  if (tag === 'HEART') return <Heart className={className} />;
  if (tag === 'MONEY') return <Landmark className={className} />;
  if (tag === 'DOCS') return <FileText className={className} />;
  return <Users className={className} />;
}

function ProgressLine({ state }: { state: CardVisualState }) {
  if (state.kind === 'active' || state.kind === 'waiting') {
    const barClass =
      state.kind === 'active' ? 'bg-[#2B5A8C]' : 'bg-[#b98a3e]';
    return (
      <div className="mt-auto flex items-center gap-2.5 pt-4">
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[rgba(33, 61, 89,0.06)]">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              barClass,
              state.kind === 'active' && 'animate-pulse',
            )}
            style={{ width: `${Math.max(0, Math.min(100, state.progress))}%` }}
          />
        </div>
        <span
          className={cn(
            'shrink-0 text-[11px] font-semibold tabular-nums',
            state.kind === 'waiting' ? 'text-[#b98a3e]' : 'text-[#2E7FAD]',
          )}
        >
          {state.label}
        </span>
      </div>
    );
  }

  const count = state.itemCount ?? 0;
  return (
    <div className="mt-auto flex items-center justify-between gap-2 pt-4">
      <span
        className={cn(
          'text-[13px] font-bold tabular-nums',
          count > 0 ? 'text-[#213D59]' : 'text-[rgba(33, 61, 89,0.35)]',
        )}
      >
        {count > 0 ? count : '—'}
      </span>
      {state.kind === 'partial' ? (
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#C23A3A]">
          Incomplete
        </span>
      ) : state.kind === 'done' ? (
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#1F9D6B]">
          Complete
        </span>
      ) : (
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[rgba(33, 61, 89,0.4)]">
          Empty
        </span>
      )}
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
          ? 'border-[rgba(43, 90, 140,0.35)] ring-1 ring-[rgba(43, 90, 140,0.12)]'
          : state.kind === 'waiting'
            ? 'border-[rgba(185,138,62,0.45)] ring-1 ring-[rgba(185,138,62,0.12)]'
            : state.kind === 'partial'
              ? 'border-[rgba(194,58,58,0.35)]'
              : state.isNew
                ? 'border-[rgba(43, 90, 140,0.4)]'
                : state.kind === 'done'
                  ? 'border-[rgba(43, 90, 140,0.2)]'
                  : 'border-[rgba(33, 61, 89,0.1)]',
      )}
      data-overview-task={card.sectionId}
      data-overview-task-state={state.kind}
    >
      {state.isNew ? (
        <span className="absolute right-3 top-3 rounded-md bg-[#2B5A8C] px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
          New data
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
      <h3 className="mt-3 line-clamp-2 text-[14px] font-semibold leading-snug text-[#213D59]">
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
          ? 'border-[rgba(43, 90, 140,0.35)] ring-1 ring-[rgba(43, 90, 140,0.12)]'
          : state.kind === 'waiting'
            ? 'border-[rgba(185,138,62,0.45)] ring-1 ring-[rgba(185,138,62,0.12)]'
            : state.kind === 'partial'
              ? 'border-[rgba(194,58,58,0.35)]'
              : state.isNew
                ? 'border-[rgba(43, 90, 140,0.4)] ring-1 ring-[rgba(43, 90, 140,0.12)]'
                : state.kind === 'done'
                  ? 'border-[rgba(43, 90, 140,0.2)]'
                  : 'border-[rgba(33, 61, 89,0.1)]',
      )}
      data-overview-task={card.sectionId}
      data-overview-task-state={state.kind}
      data-overview-task-new={state.isNew ? 'true' : undefined}
    >
      {state.isNew && (
        <span className="absolute right-3 top-3 inline-flex items-center rounded-md bg-[#2B5A8C] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
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
      <h3 className="mt-3 text-base font-semibold text-[#213D59]">
        {card.title}
      </h3>
      <p
        className={cn(
          'mt-1 line-clamp-2 text-sm leading-5',
          state.kind === 'partial'
            ? 'font-medium text-[#C23A3A]'
            : 'text-[rgba(33, 61, 89,0.58)]',
        )}
      >
        {state.kind === 'active'
          ? 'Reading your document and filling this section…'
          : state.kind === 'waiting'
            ? 'Needs you — queued while another file finishes.'
            : state.isNew
              ? 'Filled automatically — tap only if you want to review.'
              : state.kind === 'partial'
                ? 'Incomplete — tap to continue.'
                : state.kind === 'done'
                  ? 'This section is complete.'
                  : card.description}
      </p>
      {lastUpdatedLabel ? (
        <p className="mt-2 text-xs font-medium text-[rgba(33, 61, 89,0.45)]">
          {lastUpdatedLabel}
        </p>
      ) : null}
      <ProgressLine state={state} />
    </button>
  );
}

export function OverviewTaskBoard({
  jobs,
  sectionProgressById = {},
  lastUpdatedBySection = {},
  onNavigateToSection,
  allowedSectionIds = 'all',
}: OverviewTaskBoardProps) {
  const routing = useOptionalAiDocumentRouting();

  const pendingReady = useMemo(() => {
    const set = new Set<string>();
    (routing?.pendingUploads || []).forEach(upload => {
      if (
        upload.highlightUpload &&
        (allowedSectionIds === 'all' ||
          allowedSectionIds.has(String(upload.targetSectionId)))
      ) {
        set.add(upload.targetSectionId);
      }
    });
    return set;
  }, [routing?.pendingUploads, allowedSectionIds]);

  const allCards = useMemo(
    () =>
      OVERVIEW_TASK_GROUPS.flatMap(group => group.cards).filter(
        card =>
          allowedSectionIds === 'all' ||
          allowedSectionIds.has(String(card.sectionId)),
      ),
    [allowedSectionIds],
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
    resolveCardState(card, jobs, pendingReady, sectionProgressById);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Mobile: horizontal continue slider */}
      <section className="md:hidden">
        <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
          <div>
            <h2 className="text-base font-semibold text-[#213D59]">
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
            <h2 className="mb-3 text-lg font-semibold text-[#213D59]">
              {group.title}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {group.cards.map(card => {
                const state = cardState(card);
                const showUpdated =
                  state.progress > 0 &&
                  Boolean(lastUpdatedBySection[card.sectionId]);
                return (
                  <GridTaskCard
                    key={card.id}
                    card={card}
                    state={state}
                    lastUpdatedLabel={
                      showUpdated
                        ? formatSectionLastUpdated(
                            lastUpdatedBySection[card.sectionId],
                          )
                        : undefined
                    }
                    onOpen={() => openCard(card)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
