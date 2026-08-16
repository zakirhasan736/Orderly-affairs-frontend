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
import {
  sectionHasSidebarNewAiData,
  subsectionHasSidebarNewAiData,
} from '@/utils/aiSidebarNewData';
import {
  listUnseenNewFills,
  NEW_FILLS_CHANGED,
  sectionHasUnseenFills,
  subsectionHasUnseenFills,
} from '@/utils/newFillMarkers';
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
import {
  formatVaultSectionTitle,
  formatVaultSubsectionTitle,
} from '@/utils/vaultNavigation';
import { BRAND_LOGO } from '@/constants/brand';
import { ProgressBar, ProgressRing, SidebarNavItem } from '@/components/vault-ui';

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

function SidebarNewPip({ label = 'New data' }: { label?: string }) {
  return (
    <span
      className="relative flex h-2.5 w-2.5 shrink-0"
      title={label}
      aria-label={label}
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-300 ring-2 ring-[#213D59]" />
    </span>
  );
}

function SectionProgressMark({
  percent,
  complete,
}: {
  percent: number;
  complete: boolean;
  selected: boolean;
}) {
  if (complete) {
    return (
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-white/10">
        <CheckCircle className="h-4 w-4 text-[#1F9D6B]" />
      </span>
    );
  }

  if (percent <= 0) {
    return (
      <span
        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-white/10"
        title="Not started"
      >
        <Circle className="h-3.5 w-3.5 opacity-70" />
      </span>
    );
  }

  return (
    <ProgressRing value={percent} size="topbar" surface="navy" />
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
    const origin = event.target as HTMLElement | null;
    if (origin?.closest('button, [data-oa-nav-delete]')) {
      event.preventDefault();
      return;
    }

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
      onClick={event => {
        const target = event.target as HTMLElement | null;
        if (target?.closest('button, [data-oa-nav-delete]')) return;
        if (didDragRef.current) return;
        onNavigate();
      }}
      onKeyDown={event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const target = event.target as HTMLElement | null;
        if (
          target?.closest(
            'button, input, textarea, select, [contenteditable="true"]',
          )
        ) {
          return;
        }
        event.preventDefault();
        if (!didDragRef.current) onNavigate();
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
            draggable={false}
            title={deleteLabel || 'Remove'}
            aria-label={deleteLabel || 'Remove'}
            data-oa-nav-delete
            data-oa-mutate
            data-tour="tour-topic-delete"
            onPointerDown={event => {
              event.stopPropagation();
            }}
            onMouseDown={event => {
              event.stopPropagation();
            }}
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              onDelete();
            }}
            className={cn(
              'absolute inset-0 z-10 flex touch-auto items-center justify-center rounded-md',
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
    window.addEventListener(NEW_FILLS_CHANGED, bump);
    return () => {
      window.removeEventListener('orderly-ai-patch-stashed', bump);
      window.removeEventListener('orderly-ai-section-reviewed', bump);
      window.removeEventListener('orderly-ai-autofill-done', bump);
      window.removeEventListener(NEW_FILLS_CHANGED, bump);
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

          <div className="mt-6">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-white/45">
              Vault Navigation
            </p>
            <div className="mt-3 mb-1.5 flex items-center justify-between text-[13px] font-medium text-white/80">
              <span className="tabular-nums">
                {completedSectionsCount} of {totalSectionsCount} completed
              </span>
            </div>
            <ProgressBar value={progress} size="sidebar" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
          <div className="space-y-2">
            {(
              (() => {
                const instructionSections = sections.filter(
                  section => section.id === '0',
                );
                const vaultSections = sections.filter(
                  section => section.id !== '0',
                );
                const unseen = listUnseenNewFills();
                const hasNew = (sectionId: string) =>
                  sectionHasUnseenFills(unseen, sectionId) ||
                  sectionHasSidebarNewAiData(
                    sectionId,
                    aiRouting?.getPendingUploadsForSection(sectionId) ?? [],
                  );
                // Pin sections with new AI fills just under Dashboard so they
                // are not buried in the long vault list.
                const withNew = vaultSections.filter(section =>
                  hasNew(section.id),
                );
                const withoutNew = vaultSections.filter(
                  section => !hasNew(section.id),
                );
                void aiBadgeTick;
                const items: Array<
                  | { kind: 'section'; section: (typeof sections)[number] }
                  | { kind: 'dashboard' }
                  | { kind: 'new-header' }
                > = [
                  ...instructionSections.map(section => ({
                    kind: 'section' as const,
                    section,
                  })),
                  { kind: 'dashboard' as const },
                ];
                if (withNew.length > 0) {
                  items.push({ kind: 'new-header' as const });
                  withNew.forEach(section => {
                    items.push({ kind: 'section' as const, section });
                  });
                }
                withoutNew.forEach(section => {
                  items.push({ kind: 'section' as const, section });
                });
                return items;
              })()
            ).map(navItem => {
              if (navItem.kind === 'new-header') {
                return (
                  <div key="new-fills-header" className="px-3.5 pb-1 pt-3" data-tour="tour-new-data-hub">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">
                      New data
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug text-amber-100/85">
                      Matched sections stay up here until you finish review
                    </p>
                  </div>
                );
              }

              if (navItem.kind === 'dashboard') {
                return (
                  <SidebarNavItem
                    key="owner-dashboard"
                    className="owner-dashboard-item"
                    onClick={goToDashboard}
                    active={activeSection === 'dashboard'}
                    icon={
                      <span
                        className={cn(
                          'flex h-[34px] w-[34px] items-center justify-center rounded-full',
                          activeSection === 'dashboard'
                            ? 'bg-white/20'
                            : 'bg-white/10',
                        )}
                      >
                        <Home className="h-3.5 w-3.5" />
                      </span>
                    }
                    label="Dashboard"
                  />
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
              const unseenFills = listUnseenNewFills();
              const hasAiReady =
                sectionHasSidebarNewAiData(section.id, pendingAiUploads) ||
                sectionHasUnseenFills(unseenFills, section.id);

              return (
                <div key={`main-section-${section.id}`} className="space-y-1">
                  <button
                    type="button"
                    data-cy={`vault-nav-${section.id}`}
                    onClick={() => goToSection(section.id)}
                    className={cn(
                      `section-${section.id}-nav relative flex w-full items-center gap-3 rounded-full py-2.5 text-left transition`,
                      hasAiReady ? 'pl-4 pr-3' : 'px-3',
                      isSelected
                        ? 'bg-[#2B5A8C] text-white shadow-lg shadow-black/25'
                        : 'text-white/80 hover:bg-white/10 hover:text-white',
                      disabledSections[section.id] && 'opacity-55',
                    )}
                  >
                    {hasAiReady ? (
                      <span
                        className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-amber-300"
                        aria-hidden
                      />
                    ) : null}
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
                        {formatVaultSectionTitle(section)}
                      </span>
                      {disabledSections[section.id] && (
                        <span className="text-[10px] font-semibold text-white/45">
                          Not Applicable
                        </span>
                      )}
                      {hasAiReady && (
                        <span className="mt-1 inline-flex items-center rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
                          New data
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
                        const subsectionHasNew =
                          subsectionHasUnseenFills(
                            unseenFills,
                            section.id,
                            subsection.id,
                          ) ||
                          subsectionHasSidebarNewAiData(
                            section.id,
                            subsection.id,
                            pendingAiUploads,
                          );

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
                                'relative px-1 py-0.5 text-sm',
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
                              {subsectionHasNew ? (
                                <SidebarNewPip label="New data in this area" />
                              ) : (
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
                              )}
                              <span className="min-w-0 flex-1 truncate">
                                {(obituarySubsections.has(subsection.id) ||
                                  hasDoveTag(section.id, subsection.id)) && (
                                  <span className="mr-1">🕊️</span>
                                )}
                                {formatVaultSubsectionTitle(
                                  section.id,
                                  subsection,
                                )}
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
                                          ? `${formatVaultSubsectionTitle(section.id, subsection)} · Item ${itemIndex + 1}`
                                          : formatVaultSubsectionTitle(
                                              section.id,
                                              subsection,
                                            ),
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
