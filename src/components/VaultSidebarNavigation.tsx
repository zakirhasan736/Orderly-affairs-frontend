'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import {
  CheckCircle,
  ChevronRight,
  Circle,
  GripVertical,
  Home,
  X,
} from 'lucide-react';
import { Progress } from '@/components/common/ui/progress';
import { cn } from '@common/ui/utils';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import {
  getDynamicTopicsForSubsection,
  subsectionHasDynamicTopics,
} from '@/utils/dynamicVaultTopics';
import type { VaultSection } from '@/utils/vaultNavigation';

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
        'flex touch-none select-none items-center gap-1 rounded-xl transition',
        'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-45',
        isDropOver &&
          'bg-blue-50/90 ring-2 ring-blue-300 ring-offset-1 ring-offset-white',
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none flex h-8 w-5 shrink-0 items-center justify-center text-slate-300"
      >
        <GripVertical className="h-4 w-4" />
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
}: VaultSidebarNavigationProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const activeDragRef = useRef<DragPayload | null>(null);
  const aiRouting = useOptionalAiDocumentRouting();

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
        'sidebar-navigation fixed inset-y-0 left-0 z-[70] w-[88vw] max-w-[330px] transform border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:w-72 lg:max-w-none lg:translate-x-0 lg:shadow-none',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-100 px-4 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Image
                src="/images/brand-logo.png"
                alt="Orderly Affairs"
                width={44}
                height={44}
                className="h-10 w-10 object-contain"
              />
              <div className="min-w-0">
                <h2 className="truncate text-[14px] font-semibold text-[#10213f]">
                  Vault Navigation
                </h2>
                <p className="text-[11px] font-medium text-slate-400">
                  {completedSectionsCount} of {totalSectionsCount} completed
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCloseSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 lg:hidden"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
              <Progress value={progress} className="h-full w-full" />
            </div>
            <span className="text-xs font-semibold text-[#10213f]">
              {progress}%
            </span>
          </div>

          <p className="mt-3 text-[10px] leading-4 text-slate-400">
            Drag any subsection or item row to a new position to reorder.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <button
            type="button"
            onClick={goToDashboard}
            className={cn(
              'owner-dashboard-item mb-3 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition',
              activeSection === 'dashboard'
                ? 'bg-[#10213f] text-white shadow-lg shadow-slate-900/10'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100',
            )}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                <Home className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold">Dashboard Overview</span>
            </span>
            <ChevronRight className="h-4 w-4 opacity-60" />
          </button>

          <div className="space-y-2">
            {sections.map(section => {
              const isSelected =
                activeSection === section.id && !activeSubsection;
              const isExpanded =
                activeSection === section.id && !disabledSections[section.id];
              const isComplete = getSectionCompletionStatus(section.id);
              const pendingAiUploads =
                aiRouting?.getPendingUploadsForSection(section.id) ?? [];
              const hasAiReady = pendingAiUploads.some(
                upload => upload.highlightUpload,
              );

              return (
                <div key={`main-section-${section.id}`} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => goToSection(section.id)}
                    className={cn(
                      `section-${section.id}-nav flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition`,
                      isSelected
                        ? 'bg-[#10213f] text-white shadow-lg shadow-slate-900/10'
                        : 'text-slate-700 hover:bg-slate-50',
                      disabledSections[section.id] && 'opacity-55',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                        isSelected ? 'bg-white/15' : 'bg-slate-100',
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {(obituarySections.has(section.id) ||
                          hasDoveTag(section.id)) && (
                          <span className="mr-1">🕊️</span>
                        )}
                        {section.id}. {section.title}
                      </span>
                      {disabledSections[section.id] && (
                        <span className="text-[10px] font-semibold text-slate-400">
                          Not Applicable
                        </span>
                      )}
                      {hasAiReady && (
                        <span className="mt-1 inline-flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
                          </span>
                          <span className="text-[10px] font-semibold text-blue-600">
                            New data
                          </span>
                        </span>
                      )}
                    </span>
                  </button>

                  {section.subsections && isExpanded && (
                    <div className="ml-4 space-y-1 border-l border-slate-100 pl-3">
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
                                  ? 'bg-slate-100 font-semibold text-[#10213f]'
                                  : activeSubsection === subsection.id
                                    ? 'font-semibold text-[#10213f]'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
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
                                      className={cn(
                                        'px-1 py-0.5 text-xs',
                                        activeTopicId === topic.id
                                          ? 'bg-blue-50 font-semibold text-[#10213f]'
                                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
                                      )}
                                    >
                                      <span className="h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
                                      <span className="min-w-0 flex-1 truncate">
                                        {topic.label}
                                      </span>
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
      </div>
    </aside>
  );
}
