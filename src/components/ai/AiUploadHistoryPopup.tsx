'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Eye, Loader2, Sparkles, Trash2 } from 'lucide-react';
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
  formatUploadRelativeDays,
  formatUploadRelativeShort,
  listAiUploadHistory,
  removeAiUploadHistoryItem,
  type AiUploadHistoryItem,
} from '@/utils/aiUploadHistory';
import { clearAiUploadMeta } from '@/utils/aiDocumentUploadUi';
import { deleteAIDocument } from '@/services/aiDocumentUpload';
import type { DashboardAiJob } from '@/hooks/useDashboardAiBatchRunner';
import { toast } from 'sonner';
import { AiDocumentPreviewDialog } from '@/components/ai/AiDocumentPreviewDialog';
import { AiUploadHistoryThumb } from '@/components/ai/AiUploadHistoryThumb';

/** Timeouts / blips / AI backlog — still treat as in progress in the UI. */
function looksLikeTransientIssue(error?: string | null) {
  const msg = String(error || '').toLowerCase();
  if (!msg) return false;
  return /timeout|timed out|took too long|network|temporarily|try again|aborted|fetch failed|gateway|502|503|504|busy|quota|finishing other|high demand|wait about a minute|second pass/.test(
    msg,
  );
}

/**
 * What the user should see — prefer Processing over a harsh Failed when
 * the job is still running or only hit a soft timeout.
 */
function displayStatus(item: {
  status: string;
  error?: string | null;
}): 'done' | 'processing' | 'queued' | 'attention' {
  if (item.status === 'done') return 'done';
  if (item.status === 'queued') return 'queued';
  if (item.status === 'error') {
    return looksLikeTransientIssue(item.error) ? 'processing' : 'attention';
  }
  return 'processing';
}

function statusTone(status: ReturnType<typeof displayStatus>) {
  if (status === 'done') return 'text-emerald-800 bg-emerald-50 ring-emerald-100';
  if (status === 'attention') return 'text-amber-800 bg-amber-50 ring-amber-100';
  if (status === 'queued') return 'text-slate-700 bg-slate-100 ring-slate-200';
  return 'text-sky-800 bg-sky-50 ring-sky-100';
}

function statusLabel(status: ReturnType<typeof displayStatus>) {
  if (status === 'done') return 'Complete';
  if (status === 'attention') return 'Needs attention';
  if (status === 'queued') return 'In queue';
  return 'Processing';
}

function statusFootnote(status: ReturnType<typeof displayStatus>) {
  if (status === 'done') return 'Complete';
  if (status === 'attention') return 'Needs attention';
  if (status === 'queued') return 'In queue';
  return 'Processing';
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
  status: ReturnType<typeof displayStatus>;
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
            : status === 'attention'
              ? 'bg-amber-400'
              : status === 'queued'
                ? 'bg-slate-400'
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
 * Overview: Eye button + dialog list (localStorage footprints).
 * Sections: Eye button bottom-right for that section's attachments.
 * Re-uploading the same topic replaces the previous card and refreshes timestamps.
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    fileId: string;
    fileName: string;
  } | null>(null);
  const count = items.length;
  const processingCount = useMemo(
    () =>
      items.filter(item => {
        const status = displayStatus(item);
        return status === 'processing' || status === 'queued';
      }).length,
    [items],
  );

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

  const openPreview = useCallback((item: AiUploadHistoryItem) => {
    const live = jobs.find(job => job.id === item.id);
    const fileId = item.fileId || live?.file_id || '';
    if (!fileId) {
      toast.error('Preview is not available for this upload yet.');
      return;
    }
    setPreview({ fileId, fileName: item.fileName });
  }, [jobs]);

  const handlePreviewMissing = useCallback(
    (fileId: string) => {
      removeAiUploadHistoryItem({ fileId });
      refreshHistory();
      setPreview(null);
      toast.error('Document no longer on the server. Upload it again to preview.');
    },
    [refreshHistory],
  );

  const previewDialog = (
    <AiDocumentPreviewDialog
      open={Boolean(preview)}
      onOpenChange={open => {
        if (!open) setPreview(null);
      }}
      fileId={preview?.fileId}
      fileName={preview?.fileName}
      onNotFound={handlePreviewMissing}
    />
  );

  if (variant === 'inline') {
    return (
      <>
      <div
        className={cn(
          absolute ? 'absolute bottom-3 right-3 z-20' : 'relative',
          className,
        )}
        onClick={event => event.stopPropagation()}
        onKeyDown={event => event.stopPropagation()}
      >
        <button
          type="button"
          title={
            count > 0
              ? 'View section document attachments'
              : 'No attachments yet — upload a document first'
          }
          aria-label="View section document attachments"
          aria-expanded={open}
          onClick={() => {
            refreshHistory();
            setOpen(value => !value);
          }}
          className={cn(
            'relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#213D59] shadow-sm transition hover:border-[#213D59]/35 hover:bg-slate-50',
            count > 0 && 'ring-1 ring-[#213D59]/10',
            open && 'border-[#213D59]/40 bg-[#e7eef7]',
          )}
        >
          <Eye className="h-5 w-5" />
          {count > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#213D59] px-1 text-[10px] font-bold text-white">
              {count > 99 ? '99+' : count}
            </span>
          ) : null}
        </button>

        {open ? (
          <div className="absolute bottom-12 right-0 w-[min(calc(100vw-2rem),17.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[#213D59]">
                  Section attachments
                </p>
                <p className="text-[10px] text-slate-500">
                  {count === 0
                    ? 'No files yet'
                    : `${count} document${count === 1 ? '' : 's'} · tap Eye to preview`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                aria-label="Close attachments"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-56 space-y-2 overflow-y-auto p-2 sm:max-h-64">
              {items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-[11px] text-slate-500">
                  Upload a document in this section to attach and preview it
                  here.
                </p>
              ) : null}
              {items.map(item => {
                const uiStatus = displayStatus(item);
                const progress =
                  uiStatus === 'done' || uiStatus === 'attention'
                    ? 100
                    : Math.max(0, Math.min(99, item.progress || 0));
                const isLive =
                  uiStatus === 'processing' || uiStatus === 'queued';

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-2"
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => openPreview(item)}
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#2B5A8C] shadow-sm transition hover:bg-emerald-50"
                        title="View document"
                        aria-label={`View ${item.fileName}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openPreview(item)}
                        className="min-w-0 flex-1 text-left"
                        title="Click to view document"
                      >
                        <p
                          className="truncate text-[11px] font-semibold text-slate-900"
                          title={item.fileName}
                        >
                          {item.fileName}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold tracking-wide ring-1 ring-inset',
                              statusTone(uiStatus),
                            )}
                          >
                            {uiStatus === 'processing' ? (
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            ) : null}
                            {statusLabel(uiStatus)}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600">
                            {progress}%
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-[#2B5A8C]">
                            <Eye className="h-2.5 w-2.5" />
                            View
                          </span>
                        </div>
                      </button>
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

                    {uiStatus === 'attention' && item.error ? (
                      <p className="mt-1 line-clamp-2 text-[10px] text-amber-700">
                        {item.error}
                      </p>
                    ) : null}

                    <div className="mt-1.5 space-y-0.5 text-[9px] leading-snug text-slate-500">
                      <p className="font-semibold text-[#2B5A8C]">
                        {formatUploadRelativeDays(item.updatedAt)}
                      </p>
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
                      status={uiStatus}
                      progress={progress}
                      isLive={isLive}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      {previewDialog}
      </>
    );
  }

  // Overview dashboard — eye button + dialog.
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
          'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#213D59] shadow-sm transition hover:border-[#213D59]/30 hover:bg-slate-50',
          count > 0 && 'ring-1 ring-[#213D59]/10',
          className,
        )}
      >
        <Eye className="h-5 w-5" />
        {count > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#213D59] px-1 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[min(96vw,56rem)] max-w-[56rem] overflow-hidden border-0 bg-[#f3f5f7] p-0 sm:rounded-3xl">
          <DialogHeader className="space-y-1 border-b border-black/5 bg-white px-5 pb-4 pt-5 pr-12 text-left sm:px-6 sm:pt-6">
            <DialogTitle className="text-xl font-semibold tracking-tight text-[#213D59]">
              Uploaded documents
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#5a6b80]">
              Tap a card to preview. Re-uploading the same topic replaces the
              previous file.
            </DialogDescription>
          </DialogHeader>

          {processingCount > 0 ? (
            <div className="mx-4 mt-4 flex gap-3 rounded-2xl border border-[#213D59]/12 bg-gradient-to-br from-[#eef3f9] to-white px-4 py-3.5 shadow-sm sm:mx-5">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#213D59] text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-[13px] font-semibold text-[#213D59]">
                  AI is reading your uploads
                </p>
                <p className="text-[12.5px] leading-relaxed text-[#5a6b80]">
                  Your documents are being read and processed by our AI. This
                  can take a few minutes — feel free to keep browsing. Status
                  will update to Complete when each section is filled.
                </p>
                <p className="inline-flex items-center gap-1.5 pt-0.5 text-[11px] font-medium text-sky-800">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {processingCount === 1
                    ? '1 document processing'
                    : `${processingCount} documents processing`}
                </p>
              </div>
            </div>
          ) : null}

          <div className="max-h-[min(70vh,38rem)] overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
            {items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#213D59]/15 bg-white px-4 py-12 text-center text-sm text-[#5a6b80]">
                No documents uploaded yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
                {items.map(item => {
                  const uiStatus = displayStatus(item);
                  const progress =
                    uiStatus === 'done' || uiStatus === 'attention'
                      ? 100
                      : Math.max(0, Math.min(99, item.progress || 0));
                  const isLive =
                    uiStatus === 'processing' || uiStatus === 'queued';
                  const category =
                    item.targetSectionLabel ||
                    (item.sectionId && item.sectionId !== 'overview'
                      ? `Section ${item.sectionId}`
                      : 'Overview');
                  const relative = formatUploadRelativeShort(
                    item.updatedAt || item.createdAt,
                  );

                  return (
                    <div
                      key={item.id}
                      className="group relative flex flex-col overflow-hidden rounded-2xl bg-[#e8ebef] p-2 shadow-sm transition hover:bg-[#e2e6eb] sm:rounded-[1.35rem] sm:p-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => openPreview(item)}
                        className="relative block w-full text-left"
                        title={`Preview ${item.fileName}`}
                      >
                        <AiUploadHistoryThumb
                          fileId={item.fileId}
                          fileName={item.fileName}
                        />

                        {isLive ? (
                          <div className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-black/55 to-transparent px-2 pb-2 pt-7">
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {statusLabel(uiStatus)}
                                {` · ${progress}%`}
                              </span>
                            </div>
                            <div className="h-1 overflow-hidden rounded-full bg-white/30">
                              <div
                                className="h-full rounded-full bg-white transition-all"
                                style={{ width: `${Math.max(8, progress)}%` }}
                              />
                            </div>
                          </div>
                        ) : null}

                        {uiStatus === 'attention' ? (
                          <div className="absolute inset-x-1.5 bottom-1.5 rounded-lg bg-amber-600/90 px-2 py-1 text-[10px] font-semibold text-white">
                            Needs attention
                          </div>
                        ) : null}

                        {uiStatus === 'done' ? (
                          <div className="absolute left-2 top-2 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm">
                            Complete
                          </div>
                        ) : null}
                      </button>

                      <button
                        type="button"
                        disabled={deletingId === item.id}
                        onClick={event => {
                          event.stopPropagation();
                          void handleDelete(item);
                        }}
                        className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white opacity-100 shadow-sm backdrop-blur-sm transition hover:bg-rose-600 sm:h-8 sm:w-8 sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-50"
                        aria-label={`Delete ${item.fileName}`}
                        title="Delete upload"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openPreview(item)}
                        className="mt-2 space-y-0.5 px-0.5 text-left"
                        title={item.fileName}
                      >
                        <p className="text-[10px] font-medium text-[#6b7785] sm:text-[11px]">
                          {relative || 'Just now'}
                        </p>
                        <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-[#1a2b3d] sm:text-[13px]">
                          {item.fileName}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset',
                              statusTone(uiStatus),
                            )}
                          >
                            {uiStatus === 'processing' ? (
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            ) : null}
                            {statusFootnote(uiStatus)}
                          </span>
                          <span
                            className="truncate text-[10px] text-[#6b7785] sm:text-[11px]"
                            title={category}
                          >
                            {category}
                          </span>
                        </div>
                      </button>

                      {uiStatus === 'attention' && item.error ? (
                        <p
                          className="mt-1 line-clamp-2 px-0.5 text-[10px] text-amber-700"
                          title={item.error}
                        >
                          {item.error}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {previewDialog}
    </>
  );
}
