'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import {
  CheckCircle,
  Circle,
  GripVertical,
  Headphones,
  Home,
  X,
} from 'lucide-react';
import { cn } from '@common/ui/utils';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import { isAiAutofillDoneForSection } from '@/utils/aiAutofillDoneSections';
import { useOptionalHelpAssistant } from '@/components/help/HelpAssistantContext';
import {
  getDynamicTopicsForSubsection,
  subsectionHasDynamicTopics,
} from '@/utils/dynamicVaultTopics';
import type { VaultSection } from '@/utils/vaultNavigation';
import { BRAND_LOGO } from '@/constants/brand';

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
          'bg-[#2e7d6e]/25 ring-2 ring-[#2e7d6e] ring-offset-1 ring-offset-[#132b26]',
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none flex h-8 w-5 shrink-0 items-center justify-center text-white/25"
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
  onOpenHelp,
}: VaultSidebarNavigationProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const activeDragRef = useRef<DragPayload | null>(null);
  const aiRouting = useOptionalAiDocumentRouting();
  const help = useOptionalHelpAssistant();

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
        'sidebar-navigation fixed inset-y-0 left-0 z-[70] w-[88vw] max-w-[330px] transform border-r border-black/20 bg-[#132b26] text-white shadow-2xl transition-transform duration-300 ease-out md:sticky md:top-0 md:z-20 md:h-screen md:w-[272px] md:max-w-none md:translate-x-0 md:shadow-none',
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
                className="h-full rounded-full bg-[#2e7d6e] transition-all"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
          <button
            type="button"
            onClick={goToDashboard}
            className={cn(
              'owner-dashboard-item mb-2 flex w-full items-center gap-3 rounded-full px-3.5 py-2.5 text-left transition',
              activeSection === 'dashboard'
                ? 'bg-[#2e7d6e] text-white shadow-lg shadow-black/25'
                : 'text-white/85 hover:bg-white/10 hover:text-white',
            )}
          >
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full',
                activeSection === 'dashboard' ? 'bg-white/20' : 'bg-white/10',
              )}
            >
              <Home className="h-3.5 w-3.5" />
            </span>
            <span className="text-[13px] font-semibold">Dashboard</span>
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
                upload =>
                  upload.highlightUpload &&
                  !isAiAutofillDoneForSection(section.id),
              );

              return (
                <div key={`main-section-${section.id}`} className="space-y-1">
                  <button
                    type="button"
                    data-cy={`vault-nav-${section.id}`}
                    onClick={() => goToSection(section.id)}
                    className={cn(
                      `section-${section.id}-nav flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-left transition`,
                      isSelected
                        ? 'bg-[#2e7d6e] text-white shadow-lg shadow-black/25'
                        : 'text-white/80 hover:bg-white/10 hover:text-white',
                      disabledSections[section.id] && 'opacity-55',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                        isSelected ? 'bg-white/20' : 'bg-white/10',
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-300" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 opacity-70" />
                      )}
                    </span>

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
                                          ? 'bg-[#2e7d6e]/40 font-semibold text-white'
                                          : 'text-white/50 hover:bg-white/10 hover:text-white/85',
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

        <div className="border-t border-white/10 p-4">
          <p className="text-[12px] leading-snug text-white/70">
            Need help? Our support team is here to guide you.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                help?.openHelp({ mode: 'chat' });
                onOpenHelp?.();
                window.dispatchEvent(
                  new CustomEvent('orderly-open-help', {
                    detail: { mode: 'chat' },
                  }),
                );
                onCloseSidebar();
              }}
              className="inline-flex h-10 w-auto items-center justify-center gap-2 rounded-xl border border-white/20 bg-[#2e7d6e] px-4 text-[12px] font-semibold text-white transition hover:bg-[#26685c]"
            >
              <Headphones className="h-3.5 w-3.5" />
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
