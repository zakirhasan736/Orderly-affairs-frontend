'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, FileStack, FileText, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/ui/dialog';
import { cn } from '@common/ui/utils';
import {
  formatUploadHistoryDay,
  formatUploadHistoryTime,
  formatUploadHistoryWhen,
  listAiUploadHistory,
  removeAiUploadHistoryItem,
  type AiUploadHistoryItem,
} from '@/utils/aiUploadHistory';
import { clearAiUploadMeta } from '@/utils/aiDocumentUploadUi';
import { deleteAIDocument } from '@/services/aiDocumentUpload';
import type { DashboardAiJob } from '@/hooks/useDashboardAiBatchRunner';
import { toast } from 'sonner';

function statusTone(status: string) {
  if (status === 'done') return 'text-emerald-700 bg-emerald-50';
  if (status === 'error') return 'text-rose-700 bg-rose-50';
  if (status === 'queued') return 'text-amber-700 bg-amber-50';
  return 'text-sky-700 bg-sky-50';
}

function statusLabel(status: string) {
  if (status === 'done') return 'Filled';
  if (status === 'error') return 'Failed';
  if (status === 'queued') return 'Waiting';
  return 'Reading';
}

function mergeHistoryWithJobs(
  history: AiUploadHistoryItem[],
  jobs: DashboardAiJob[],
): AiUploadHistoryItem[] {
  const byId = new Map(jobs.map(job => [job.id, job]));
  const merged = history.map(item => {
    const live = byId.get(item.id);
    if (!live) return item;

    const liveSection = live.targetSectionId
      ? String(live.targetSectionId)
      : undefined;
    const sectionIds = Array.from(
      new Set([
        ...(item.sectionIds || []),
        ...(item.sectionId ? [String(item.sectionId)] : []),
        ...(liveSection ? [liveSection] : []),
      ]),
    );
    const sectionId =
      item.sectionId && item.sectionId !== 'overview'
        ? item.sectionId
        : liveSection || item.sectionId;

    return {
      ...item,
      status: live.status,
      progress:
        live.status === 'done' || live.status === 'error'
          ? 100
          : Math.max(0, Math.min(99, live.progress || 0)),
      targetSectionLabel: live.targetSectionLabel || item.targetSectionLabel,
      sectionId,
      sectionIds,
      fileId: live.file_id || item.fileId,
      error: live.error,
      createdAt: item.createdAt,
      updatedAt: live.updatedAt || item.updatedAt,
    };
  });

  const historyIds = new Set(merged.map(item => item.id));
  const extras: AiUploadHistoryItem[] = [];
  for (const job of jobs) {
    if (historyIds.has(job.id)) continue;
    // Skip if history already has this same file+section under another id.
    const already = merged.some(
      item =>
        item.fileName.trim().toLowerCase() === job.fileName.trim().toLowerCase() &&
        (!job.targetSectionId ||
          String(item.sectionId || '') === String(job.targetSectionId) ||
          (item.sectionIds || []).some(
            id => String(id) === String(job.targetSectionId),
          )),
    );
    if (already) continue;

    extras.push({
      id: job.id,
      fileName: job.fileName,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      fileId: job.file_id,
      sectionId: job.targetSectionId || 'overview',
      sectionIds: job.targetSectionId
        ? [String(job.targetSectionId)]
        : ['overview'],
      targetSectionLabel: job.targetSectionLabel,
      error: job.error,
      source: 'overview',
    });
  }

  // Final UI pass: one card per file name + section.
  const combined = [...extras, ...merged];
  const seen = new Set<string>();
  const deduped: AiUploadHistoryItem[] = [];
  for (const item of combined) {
    const sectionKey =
      item.sectionId && item.sectionId !== 'overview'
        ? item.sectionId
        : (item.sectionIds || []).find(id => id !== 'overview') || 'pending';
    const key = `${item.fileName.trim().toLowerCase()}::${sectionKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }
  return deduped;
}

type AiUploadHistoryPopupProps = {
  className?: string;
  /** Live overview batch jobs (optional — merges progress into history). */
  jobs?: DashboardAiJob[];
  /** Absolute placement inside a relative parent (bottom-right). */
  absolute?: boolean;
  /** When set, only show footprints for this section id. */
  sectionId?: string | null;
  /** Overview card vs section upload card. */
  source?: 'overview' | 'section';
  /**
   * overview dashboard: stack button + dialog (as before).
   * sections: inline bottom-right panel.
   */
  variant?: 'dialog' | 'inline';
  /** Remove a live overview batch job from memory. */
  onDismissJob?: (jobId: string) => void;
};

function useUploadHistoryItems(args: {
  jobs: DashboardAiJob[];
  sectionId?: string | null;
  source?: 'overview' | 'section';
}) {
  const { jobs, sectionId, source } = args;
  const [history, setHistory] = useState<AiUploadHistoryItem[]>([]);

  const refreshHistory = useCallback(() => {
    setHistory(
      listAiUploadHistory({
        sectionId: sectionId || undefined,
        source: sectionId ? undefined : source,
      }),
    );
  }, [sectionId, source]);

  useEffect(() => {
    refreshHistory();
    const onHistory = () => refreshHistory();
    window.addEventListener('orderly-ai-upload-history', onHistory);
    return () =>
      window.removeEventListener('orderly-ai-upload-history', onHistory);
  }, [refreshHistory]);

  const items = useMemo(() => {
    const merged = mergeHistoryWithJobs(history, jobs);
    if (!sectionId) return merged;
    const want = String(sectionId);
    return merged.filter(item => {
      if (String(item.sectionId || '') === want) return true;
      return (item.sectionIds || []).some(id => String(id) === want);
    });
  }, [history, jobs, sectionId]);

  return { items, refreshHistory };
}

function ProgressBar({
  status,
  progress,
  isLive,
}: {
  status: string;
  progress: number;
  isLive: boolean;
}) {
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500',
          status === 'done'
            ? 'bg-emerald-500'
            : status === 'error'
              ? 'bg-rose-400'
              : status === 'queued'
                ? 'bg-amber-400'
                : 'bg-sky-500',
          isLive && 'animate-pulse',
        )}
        style={{
          width: `${Math.max(status === 'queued' ? 8 : 0, progress)}%`,
        }}
      />
    </div>
  );
}

/**
 * Overview: FileStack button + dialog list (localStorage footprints).
 * Sections: inline bottom-right panel for that section only.
 * New uploads append — older files are never replaced.
 */
export function AiUploadHistoryPopup({
  className,
  jobs = [],
  absolute = true,
  sectionId = null,
  source,
  variant = 'dialog',
  onDismissJob,
}: AiUploadHistoryPopupProps) {
  const { items, refreshHistory } = useUploadHistoryItems({
    jobs,
    sectionId,
    source,
  });
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const count = items.length;

  const handleDelete = useCallback(
    async (item: AiUploadHistoryItem) => {
      if (deletingId) return;
      setDeletingId(item.id);
      try {
        const live = jobs.find(job => job.id === item.id);
        const fileId = item.fileId || live?.file_id || '';

        removeAiUploadHistoryItem({ id: item.id, fileId });
        onDismissJob?.(item.id);
        if (fileId) {
          clearAiUploadMeta(fileId);
          await deleteAIDocument(fileId);
        }
        refreshHistory();
        toast.success('Upload removed');
      } catch {
        toast.error('Could not delete upload');
        refreshHistory();
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, jobs, onDismissJob, refreshHistory],
  );

  if (variant === 'inline') {
    if (count === 0) return null;

    return (
      <div
        className={cn(
          absolute
            ? 'absolute bottom-3 right-3 z-20 w-[min(100%-1.5rem,17.5rem)]'
            : 'relative w-full max-w-sm',
          className,
        )}
        onClick={event => event.stopPropagation()}
        onKeyDown={event => event.stopPropagation()}
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setExpanded(value => !value)}
            className="flex w-full items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 text-left"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#10213f]">
                Uploaded documents
              </p>
              <p className="text-[10px] text-slate-500">
                {count} file{count === 1 ? '' : 's'} · same file updates in place
              </p>
            </div>
            {expanded ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            ) : (
              <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
            )}
          </button>

          {expanded ? (
            <div className="max-h-56 space-y-2 overflow-y-auto p-2 sm:max-h-64">
              {items.map(item => {
                const progress =
                  item.status === 'done' || item.status === 'error'
                    ? 100
                    : Math.max(0, Math.min(99, item.progress || 0));
                const isLive =
                  item.status !== 'done' &&
                  item.status !== 'error' &&
                  item.status !== 'queued';

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-2"
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-[11px] font-semibold text-slate-900"
                          title={item.fileName}
                        >
                          {item.fileName}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                          <span
                            className={cn(
                              'rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                              statusTone(item.status),
                            )}
                          >
                            {statusLabel(item.status)}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600">
                            {progress}%
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={deletingId === item.id}
                        onClick={() => void handleDelete(item)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        aria-label={`Delete ${item.fileName}`}
                        title="Delete upload"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {item.targetSectionLabel ? (
                      <p className="mt-1 truncate text-[10px] text-slate-500">
                        {item.targetSectionLabel}
                      </p>
                    ) : null}

                    {item.error ? (
                      <p className="mt-1 line-clamp-2 text-[10px] text-rose-600">
                        {item.error}
                      </p>
                    ) : null}

                    <div className="mt-1.5 space-y-0.5 text-[9px] leading-snug text-slate-500">
                      <p>
                        <span className="font-medium text-slate-600">
                          Uploaded
                        </span>{' '}
                        {formatUploadHistoryDay(item.createdAt)}
                        {' · '}
                        {formatUploadHistoryTime(item.createdAt)}
                      </p>
                      <p>
                        <span className="font-medium text-slate-600">
                          Updated
                        </span>{' '}
                        {formatUploadHistoryDay(item.updatedAt)}
                        {' · '}
                        {formatUploadHistoryTime(item.updatedAt)}
                      </p>
                    </div>

                    <ProgressBar
                      status={item.status}
                      progress={progress}
                      isLive={isLive}
                    />
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // Overview dashboard — stack button + dialog (previous UX).
  return (
    <>
      <button
        type="button"
        title="View uploaded documents"
        aria-label="View uploaded documents"
        onClick={event => {
          event.stopPropagation();
          refreshHistory();
          setOpen(true);
        }}
        className={cn(
          absolute ? 'absolute bottom-3 right-3 z-10' : 'relative',
          'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#10213f] shadow-sm transition hover:border-[#10213f]/30 hover:bg-slate-50',
          count > 0 && 'ring-1 ring-[#10213f]/10',
          className,
        )}
      >
        <FileStack className="h-5 w-5" />
        {count > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#10213f] px-1 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[min(96vw,56rem)] max-w-[56rem] overflow-hidden p-4 sm:p-6">
          <DialogHeader className="pr-8 text-left">
            <DialogTitle className="text-[#10213f]">
              Uploaded documents
            </DialogTitle>
            <DialogDescription>
              Latest upload per document and section. Re-uploading the same
              file updates that card instead of adding duplicates.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[min(68vh,36rem)] overflow-y-auto pr-1">
            {items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No documents uploaded yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3">
                {items.map(item => {
                  const progress =
                    item.status === 'done' || item.status === 'error'
                      ? 100
                      : Math.max(0, Math.min(99, item.progress || 0));
                  const isLive =
                    item.status !== 'done' &&
                    item.status !== 'error' &&
                    item.status !== 'queued';

                  return (
                    <div
                      key={item.id}
                      className="flex min-h-[9.5rem] flex-col rounded-xl border border-slate-200 bg-white p-2.5 sm:min-h-[10.5rem] sm:p-3"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 sm:h-9 sm:w-9">
                          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-[12px] font-semibold leading-snug text-slate-900 sm:text-sm"
                            title={item.fileName}
                          >
                            {item.fileName}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            <span
                              className={cn(
                                'rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide sm:text-[10px]',
                                statusTone(item.status),
                              )}
                            >
                              {statusLabel(item.status)}
                            </span>
                            {isLive || item.status === 'queued' ? (
                              <span className="text-[10px] font-semibold text-sky-700 sm:text-[11px]">
                                {progress}%
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={event => {
                            event.stopPropagation();
                            void handleDelete(item);
                          }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                          aria-label={`Delete ${item.fileName}`}
                          title="Delete upload"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {item.targetSectionLabel ? (
                        <p
                          className="mt-2 truncate text-[10px] text-slate-500 sm:text-xs"
                          title={item.targetSectionLabel}
                        >
                          {item.targetSectionLabel}
                        </p>
                      ) : (
                        <div className="mt-2 h-3.5 sm:h-4" />
                      )}

                      {item.error ? (
                        <p
                          className="mt-1 line-clamp-2 text-[10px] text-rose-600 sm:text-xs"
                          title={item.error}
                        >
                          {item.error}
                        </p>
                      ) : null}

                      <div className="mt-auto space-y-0.5 pt-2 text-[9px] leading-snug text-slate-500 sm:text-[11px]">
                        <p>
                          Uploaded{' '}
                          <span className="font-medium text-slate-700">
                            {formatUploadHistoryWhen(item.createdAt)}
                          </span>
                        </p>
                        <p>
                          Updated{' '}
                          <span className="font-medium text-slate-700">
                            {formatUploadHistoryWhen(item.updatedAt)}
                          </span>
                        </p>
                      </div>

                      <ProgressBar
                        status={item.status}
                        progress={progress}
                        isLive={isLive}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
