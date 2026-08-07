'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import {
  CheckCircle,
  Circle,
  GripVertical,
  Home,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@common/ui/utils';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import { isAiSectionReviewed } from '@/utils/aiSectionReviewState';
import { peekDashboardAiPatch } from '@/utils/aiDashboardPatchCache';
import {
  getDynamicTopicsForSubsection,
  subsectionHasDynamicTopics,
} from '@/utils/dynamicVaultTopics';
import {
  getSubsectionProgress,
  getTopicItemProgress,
} from '@/utils/sectionCompletion';
import { VaultProgressPercentMark } from '@/components/vault/VaultFillProgressChip';
import { useVaultFillGaps } from '@/components/vault/VaultFillGapsContext';
import type { VaultSection } from '@/utils/vaultNavigation';
import { BRAND_LOGO } from '@/constants/brand';

function parseTopicProgressRef(topicId: string): {
  itemIndex: number;
  groupId?: string;
} {
  const parts = String(topicId || '').split(':');
  if (parts.length >= 3) {
    return {
      groupId: parts[1],
      itemIndex: Number(parts[2]) || 0,
    };
  }
  if (parts.length === 2) {
    return { itemIndex: Number(parts[1]) || 0 };
  }
  return { itemIndex: 0 };
}

function SectionProgressMark({
  percent,
  complete,
  selected,
}: {
  percent: number;
  complete: boolean;
  selected: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const size = 28;
  const stroke = 2.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  if (complete) {
    return (
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          selected ? 'bg-white/20' : 'bg-white/10',
        )}
      >
        <CheckCircle className="h-3.5 w-3.5 text-emerald-300" />
      </span>
    );
  }

  if (clamped <= 0) {
    return (
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          selected ? 'bg-white/20' : 'bg-white/10',
        )}
        title="Not started"
      >
        <Circle className="h-3.5 w-3.5 opacity-70" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'relative flex h-7 w-7 shrink-0 items-center justify-center',
        selected ? 'opacity-100' : 'opacity-95',
      )}
      title={
        clamped < 100
          ? `Partially complete · ${clamped}%`
          : `${clamped}% complete`
      }
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#6ee7b7"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-semibold tabular-nums text-emerald-100">
        {clamped}
      </span>
    </span>
  );
}

type DragPayload =
  | { type: 'subsection'; sectionId: string; id: string }
  | { type: 'topic'; sectionId: string; subsectionId: string; id: string };

function encodeDragPayload(payload: DragPayload) {
  return JSON.stringify(payload);
}

function decodeDragPayload(raw: string): DragPayload | null {
  try {
    const parsed = JSON.parse(raw) as DragPayload;
    if (!parsed?.type || !parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function ReorderableNavItem({
  payload,
  label,
  isDragging,
  isDropOver,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDragLeave,
  onDrop,
  onNavigate,
  onDelete,
  deleteLabel,
  className,
  children,
}: {
  payload: DragPayload;
  label: string;
  isDragging: boolean;
  isDropOver: boolean;
  onDragStart: (payload: DragPayload) => void;
  onDragEnd: () => void;
  onDragEnter: (id: string) => void;
  onDragLeave: (id: string) => void;
  onDrop: (payload: DragPayload) => void;
  onNavigate: () => void;
  /** Shown on hover for user-added topics (+ Add items). */
  onDelete?: () => void;
  deleteLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const didDragRef = useRef(false);
  const enterCountRef = useRef(0);

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    didDragRef.current = true;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', encodeDragPayload(payload));

    const row = event.currentTarget;
    if (row) {
      event.dataTransfer.setDragImage(row, 24, row.offsetHeight / 2);
    }

    onDragStart(payload);
  };

  const handleDragEnd = () => {
    onDragEnd();
    window.setTimeout(() => {
      didDragRef.current = false;
    }, 0);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    enterCountRef.current += 1;
    onDragEnter(payload.id);
  };

  const handleDragLeave = () => {
    enterCountRef.current -= 1;
    if (enterCountRef.current <= 0) {
      enterCountRef.current = 0;
      onDragLeave(payload.id);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    enterCountRef.current = 0;
    onDrop(payload);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => {
        if (didDragRef.current) return;
        onNavigate();
      }}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (!didDragRef.current) onNavigate();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={label}
      title="Drag anywhere on this row to reorder, or click to open"
      className={cn(
        'group/navrow flex touch-none select-none items-center gap-1 rounded-xl transition',
        'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-45',
        isDropOver &&
          'bg-[#2B5A8C]/25 ring-2 ring-[#2B5A8C] ring-offset-1 ring-offset-[#213D59]',
        className,
      )}
    >
      <span className="relative flex h-8 w-5 shrink-0 items-center justify-center">
        <span
          aria-hidden
          className={cn(
            'pointer-events-none text-white/25 transition',
            onDelete && 'group-hover/navrow:opacity-0',
          )}
        >
          <GripVertical className="h-4 w-4" />
        </span>
        {onDelete ? (
          <button
            type="button"
            title={deleteLabel || 'Remove'}
            aria-label={deleteLabel || 'Remove'}
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              onDelete();
            }}
            onMouseDown={event => {
              event.preventDefault();
              event.stopPropagation();
            }}
            data-tour="tour-topic-delete"
            className={cn(
              'absolute inset-0 flex items-center justify-center rounded-md',
              'text-rose-200/90 opacity-0 transition',
              'hover:bg-rose-500/25 hover:text-rose-100',
              'group-hover/navrow:opacity-100 focus-visible:opacity-100',
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </span>

      <span className="pointer-events-none flex min-w-0 flex-1 items-center gap-2 px-1 py-1">
        {children}
      </span>
    </div>
  );
}

export interface VaultSidebarNavigationProps {
  sections: VaultSection[];
  activeSection: string | null;
  activeSubsection: string | null;
  activeTopicId: string | null;
  disabledSections: Record<string, boolean>;
  disabledSubsections: Record<string, boolean>;
  formData: Record<string, unknown>;
  progress: number;
  completedSectionsCount: number;
  totalSectionsCount: number;
  getSectionCompletionStatus: (sectionId: string) => boolean;
  /** Optional: field-fill progress for smart ring / percentage. */
  getSectionProgress?: (sectionId: string) => {
    percent: number;
    complete: boolean;
  };
  obituarySections: Set<string>;
  obituarySubsections: Set<string>;
  hasDoveTag: (sectionId: string, subsectionId?: string) => boolean;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
  goToDashboard: () => void;
  goToSection: (sectionId: string) => void;
  goToSubsection: (sectionId: string, subsectionId: string) => void;
  goToTopic: (
    sectionId: string,
    subsectionId: string,
    topicId: string,
  ) => void;
  onReorderSubsection: (
    sectionId: string,
    fromSubsectionId: string,
    toSubsectionId: string,
  ) => void;
  onReorderTopic: (
    sectionId: string,
    subsectionId: string,
    fromTopicId: string,
    toTopicId: string,
  ) => void;
  /** Remove a user-added topic/item (Pet #1, policy card, etc.). */
  onDeleteTopic?: (
    sectionId: string,
    subsectionId: string,
    topicId: string,
  ) => void;
  onOpenHelp?: () => void;
}

export function VaultSidebarNavigation({
  sections,
  activeSection,
  activeSubsection,
  activeTopicId,
  disabledSections,
  disabledSubsections,
  formData,
  progress,
  completedSectionsCount,
  totalSectionsCount,
  getSectionCompletionStatus,
  getSectionProgress,
  obituarySections,
  obituarySubsections,
  hasDoveTag,
  sidebarOpen,
  onCloseSidebar,
  goToDashboard,
  goToSection,
  goToSubsection,
  goToTopic,
  onReorderSubsection,
  onReorderTopic,
  onDeleteTopic,
  onOpenHelp,
}: VaultSidebarNavigationProps) {
  const fillGaps = useVaultFillGaps();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [aiBadgeTick, setAiBadgeTick] = useState(0);
  const activeDragRef = useRef<DragPayload | null>(null);
  const aiRouting = useOptionalAiDocumentRouting();

  React.useEffect(() => {
    const bump = () => setAiBadgeTick(value => value + 1);
    window.addEventListener('orderly-ai-patch-stashed', bump);
    window.addEventListener('orderly-ai-section-reviewed', bump);
    window.addEventListener('orderly-ai-autofill-done', bump);
    return () => {
      window.removeEventListener('orderly-ai-patch-stashed', bump);
      window.removeEventListener('orderly-ai-section-reviewed', bump);
      window.removeEventListener('orderly-ai-autofill-done', bump);
    };
  }, []);

  const handleDragStart = (payload: DragPayload) => {
    activeDragRef.current = payload;
    setDraggingId(payload.id);
  };

  const handleDragEnd = () => {
    activeDragRef.current = null;
    setDraggingId(null);
    setDropTargetId(null);
  };

  const handleDragEnter = (id: string) => {
    setDropTargetId(id);
  };

  const handleDragLeave = (id: string) => {
    setDropTargetId(current => (current === id ? null : current));
  };

  const handleDrop = (target: DragPayload) => {
    const source = activeDragRef.current;
    setDropTargetId(null);
    setDraggingId(null);
    activeDragRef.current = null;

    if (!source || source.id === target.id) return;

    if (source.type === 'subsection' && target.type === 'subsection') {
      if (source.sectionId !== target.sectionId) return;
      onReorderSubsection(target.sectionId, source.id, target.id);
      return;
    }

    if (source.type === 'topic' && target.type === 'topic') {
      if (
        source.sectionId !== target.sectionId ||
        source.subsectionId !== target.subsectionId
      ) {
        return;
      }
      onReorderTopic(
        target.sectionId,
        target.subsectionId,
        source.id,
        target.id,
      );
    }
  };

  return (
    <aside
      className={cn(
        'sidebar-navigation fixed inset-y-0 left-0 z-[70] w-[88vw] max-w-[330px] transform border-r border-black/20 bg-[#213D59] text-white shadow-2xl transition-transform duration-300 ease-out md:sticky md:top-0 md:z-20 md:h-screen md:w-[272px] md:max-w-none md:translate-x-0 md:shadow-none',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="flex h-full flex-col">
        <div className="px-5 pb-3 pt-6">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={goToDashboard}
              className="flex min-w-0 items-center gap-2.5 text-left"
              aria-label="Orderly Affairs home"
            >
              <Image
                src={BRAND_LOGO}
                alt="Orderly Affairs"
                width={40}
                height={40}
                className="h-9 w-9 rounded-lg bg-white object-contain p-0.5"
              />
              <span className="truncate text-[15px] font-semibold tracking-tight text-white">
                Orderly Affairs
              </span>
            </button>

            <button
              type="button"
              onClick={onCloseSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 md:hidden"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6" data-tour="tour-progress-explain">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
              Vault Navigation
            </p>
            <div className="mt-3 mb-1.5 flex items-center justify-between text-[12px] font-medium text-white/80">
              <span>
                {completedSectionsCount} of {totalSectionsCount} completed
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-[#2B5A8C] transition-all"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
          <div className="space-y-2">
            {(
              [
                ...sections
                  .filter(section => section.id === '0')
                  .map(section => ({
                    kind: 'section' as const,
                    section,
                  })),
                { kind: 'dashboard' as const },
                ...sections
                  .filter(section => section.id !== '0')
                  .map(section => ({
                    kind: 'section' as const,
                    section,
                  })),
              ] as const
            ).map(navItem => {
              if (navItem.kind === 'dashboard') {
                return (
                  <button
                    key="owner-dashboard"
                    type="button"
                    onClick={goToDashboard}
                    className={cn(
                      'owner-dashboard-item flex w-full items-center gap-3 rounded-full px-3.5 py-2.5 text-left transition',
                      activeSection === 'dashboard'
                        ? 'bg-[#2B5A8C] text-white shadow-lg shadow-black/25'
                        : 'text-white/85 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full',
                        activeSection === 'dashboard'
                          ? 'bg-white/20'
                          : 'bg-white/10',
                      )}
                    >
                      <Home className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[13px] font-semibold">Dashboard</span>
                  </button>
                );
              }

              const section = navItem.section;
              const isSelected =
                activeSection === section.id && !activeSubsection;
              const isExpanded =
                activeSection === section.id && !disabledSections[section.id];
              const isComplete = getSectionCompletionStatus(section.id);
              const sectionPct =
                getSectionProgress?.(section.id)?.percent ??
                (isComplete ? 100 : 0);
              const pendingAiUploads =
                aiRouting?.getPendingUploadsForSection(section.id) ?? [];
              void aiBadgeTick;
              const stash = peekDashboardAiPatch(section.id);
              const reviewed = isAiSectionReviewed(
                section.id,
                stash?.file_id,
              );
              // Only show when there is real fill data (stash) or a pending
              // upload still waiting — never from a failed / empty classify.
              const hasAiReady =
                !reviewed &&
                (Boolean(stash) ||
                  pendingAiUploads.some(
                    upload =>
                      upload.highlightUpload &&
                      Boolean(
                        upload.documentSummary ||
                          (upload.extractedFields &&
                            upload.extractedFields.length > 0),
                      ),
                  ));

              return (
                <div key={`main-section-${section.id}`} className="space-y-1">
                  <button
                    type="button"
                    data-cy={`vault-nav-${section.id}`}
                    onClick={() => goToSection(section.id)}
                    className={cn(
                      `section-${section.id}-nav flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-left transition`,
                      isSelected
                        ? 'bg-[#2B5A8C] text-white shadow-lg shadow-black/25'
                        : 'text-white/80 hover:bg-white/10 hover:text-white',
                      disabledSections[section.id] && 'opacity-55',
                    )}
                  >
                    <SectionProgressMark
                      percent={sectionPct}
                      complete={isComplete}
                      selected={isSelected}
                    />

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">
                        {(obituarySections.has(section.id) ||
                          hasDoveTag(section.id)) && (
                          <span className="mr-1">🕊️</span>
                        )}
                        {section.id}. {section.title}
                      </span>
                      {disabledSections[section.id] && (
                        <span className="text-[10px] font-semibold text-white/45">
                          Not Applicable
                        </span>
                      )}
                      {hasAiReady && (
                        <span className="mt-1 inline-flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-200">
                            New data
                          </span>
                        </span>
                      )}
                    </span>
                  </button>

                  {section.subsections && isExpanded && (
                    <div className="ml-4 space-y-1 border-l border-white/15 pl-3">
                      {section.subsections.map(subsection => {
                        const dynamicTopics = subsectionHasDynamicTopics(
                          section.id,
                          subsection.id,
                        )
                          ? getDynamicTopicsForSubsection(
                              section.id,
                              subsection.id,
                              formData[section.id] as
                                | Record<string, unknown>
                                | undefined,
                            )
                          : [];

                        const isSubsectionActive =
                          activeSubsection === subsection.id && !activeTopicId;

                        const subsectionProgress = getSubsectionProgress(
                          section.id,
                          subsection.id,
                          formData[section.id] as
                            | Record<string, unknown>
                            | undefined,
                        );

                        const subsectionPayload: DragPayload = {
                          type: 'subsection',
                          sectionId: section.id,
                          id: subsection.id,
                        };

                        return (
                          <div
                            key={`section-${section.id}-subsection-${subsection.id}`}
                            className="space-y-1"
                          >
                            <ReorderableNavItem
                              payload={subsectionPayload}
                              label={`Reorder ${subsection.title}`}
                              isDragging={draggingId === subsection.id}
                              isDropOver={dropTargetId === subsection.id}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                              onDragEnter={handleDragEnter}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              onNavigate={() =>
                                goToSubsection(section.id, subsection.id)
                              }
                              className={cn(
                                'px-1 py-0.5 text-sm',
                                isSubsectionActive ||
                                  (activeSubsection === subsection.id &&
                                    dynamicTopics.length === 0)
                                  ? 'bg-white/15 font-semibold text-white'
                                  : activeSubsection === subsection.id
                                    ? 'font-semibold text-white'
                                    : 'text-white/55 hover:bg-white/10 hover:text-white/90',
                                disabledSubsections[subsection.id] &&
                                  'opacity-50',
                              )}
                            >
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
                              <span className="min-w-0 flex-1 truncate">
                                {(obituarySubsections.has(subsection.id) ||
                                  hasDoveTag(section.id, subsection.id)) && (
                                  <span className="mr-1">🕊️</span>
                                )}
                                {subsection.id}. {subsection.title}
                              </span>
                              {subsectionProgress.total > 0 ? (
                                <VaultProgressPercentMark
                                  percent={subsectionProgress.percent}
                                  complete={subsectionProgress.complete}
                                />
                              ) : null}
                              {!subsectionProgress.complete &&
                              subsectionProgress.total > 0 &&
                              fillGaps ? (
                                <button
                                  type="button"
                                  title="Quick fill"
                                  aria-label={`Quick fill ${subsection.title}`}
                                  onClick={event => {
                                    event.stopPropagation();
                                    goToSubsection(section.id, subsection.id);
                                    const sectionData = formData[section.id] as
                                      | Record<string, unknown>
                                      | undefined;
                                    const bucket = sectionData?.[subsection.id];
                                    let itemIndex: number | undefined;
                                    if (Array.isArray(bucket)) {
                                      for (let i = 0; i < bucket.length; i += 1) {
                                        const p = getTopicItemProgress(
                                          section.id,
                                          subsection.id,
                                          i,
                                          sectionData,
                                        );
                                        if (!p.complete && p.total > 0) {
                                          itemIndex = i;
                                          break;
                                        }
                                      }
                                    }
                                    fillGaps.openFillGaps({
                                      sectionId: section.id,
                                      subsectionId: subsection.id,
                                      itemIndex,
                                      title:
                                        typeof itemIndex === 'number'
                                          ? `${subsection.id}. ${subsection.title} · Item ${itemIndex + 1}`
                                          : `${subsection.id}. ${subsection.title}`,
                                    });
                                  }}
                                  onMouseDown={event => event.stopPropagation()}
                                  data-tour="tour-fill-empty-action"
                                  className="pointer-events-auto rounded-md p-0.5 text-sky-200/90 transition hover:bg-white/15 hover:text-white"
                                >
                                  <Sparkles className="h-3 w-3" />
                                </button>
                              ) : null}
                            </ReorderableNavItem>

                            {dynamicTopics.length > 0 && (
                              <div className="ml-3 space-y-1 border-l border-slate-100 pl-3">
                                {dynamicTopics.map(topic => {
                                  const topicPayload: DragPayload = {
                                    type: 'topic',
                                    sectionId: section.id,
                                    subsectionId: subsection.id,
                                    id: topic.id,
                                  };
                                  const topicRef = parseTopicProgressRef(
                                    topic.id,
                                  );
                                  const topicProgress = getTopicItemProgress(
                                    section.id,
                                    subsection.id,
                                    topicRef.itemIndex,
                                    formData[section.id] as
                                      | Record<string, unknown>
                                      | undefined,
                                    topicRef.groupId,
                                  );

                                  return (
                                    <ReorderableNavItem
                                      key={`topic-${topic.id}`}
                                      payload={topicPayload}
                                      label={`Reorder ${topic.label}`}
                                      isDragging={draggingId === topic.id}
                                      isDropOver={dropTargetId === topic.id}
                                      onDragStart={handleDragStart}
                                      onDragEnd={handleDragEnd}
                                      onDragEnter={handleDragEnter}
                                      onDragLeave={handleDragLeave}
                                      onDrop={handleDrop}
                                      onNavigate={() =>
                                        goToTopic(
                                          section.id,
                                          subsection.id,
                                          topic.id,
                                        )
                                      }
                                      onDelete={
                                        onDeleteTopic
                                          ? () => {
                                              const ok = window.confirm(
                                                `Remove “${topic.label}”? This deletes this item from your vault.`,
                                              );
                                              if (!ok) return;
                                              onDeleteTopic(
                                                section.id,
                                                subsection.id,
                                                topic.id,
                                              );
                                            }
                                          : undefined
                                      }
                                      deleteLabel={`Remove ${topic.label}`}
                                      className={cn(
                                        'px-1 py-0.5 text-xs',
                                        activeTopicId === topic.id
                                          ? 'bg-[#2B5A8C]/40 font-semibold text-white'
                                          : 'text-white/50 hover:bg-white/10 hover:text-white/85',
                                      )}
                                    >
                                      <span className="h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
                                      <span className="min-w-0 flex-1 truncate">
                                        {topic.label}
                                      </span>
                                      {topicProgress.total > 0 ? (
                                        <VaultProgressPercentMark
                                          percent={topicProgress.percent}
                                          complete={topicProgress.complete}
                                        />
                                      ) : null}
                                      {!topicProgress.complete &&
                                      topicProgress.total > 0 &&
                                      fillGaps ? (
                                        <button
                                          type="button"
                                          title="Quick fill"
                                          aria-label={`Quick fill ${topic.label}`}
                                          onClick={event => {
                                            event.stopPropagation();
                                            goToTopic(
                                              section.id,
                                              subsection.id,
                                              topic.id,
                                            );
                                            fillGaps.openFillGaps({
                                              sectionId: section.id,
                                              subsectionId: subsection.id,
                                              itemIndex: topicRef.itemIndex,
                                              groupId: topicRef.groupId,
                                              title: topic.label,
                                            });
                                          }}
                                          onMouseDown={event =>
                                            event.stopPropagation()
                                          }
                                          data-tour="tour-fill-empty-action"
                                          className="pointer-events-auto rounded-md p-0.5 text-sky-200/90 transition hover:bg-white/15 hover:text-white"
                                        >
                                          <Sparkles className="h-3 w-3" />
                                        </button>
                                      ) : null}
                                    </ReorderableNavItem>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 border-t border-white/10 px-3 py-3">
          {onOpenHelp ? (
            <button
              type="button"
              data-tour="tour-contact-support"
              onClick={() => {
                onOpenHelp();
                onCloseSidebar();
              }}
              className="group flex w-full items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-left transition hover:border-white/25 hover:bg-white/15"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#7c3aed]/90 text-white shadow-sm ring-1 ring-white/20">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-semibold text-white">
                  Contact Support
                </span>
                <span className="block truncate text-[10px] text-white/55">
                  Ask AI · Email · Live agent
                </span>
              </span>
            </button>
          ) : (
            <p className="px-1 text-[11px] leading-snug text-white/45">
              Upload on Overview or any section · sparkle fills blanks
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
