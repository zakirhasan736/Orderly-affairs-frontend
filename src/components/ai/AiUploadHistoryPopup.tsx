'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useOptionalDashboardAiBatch } from '@/contexts/DashboardAiBatchContext';
import {
  resolveUploadDisplayTitle,
  uploadedFileKindLabel,
} from '@/utils/aiUploadDisplayTitle';
import { AI_SECTION_REGISTRY } from '@/utils/aiSectionRegistry';
import {
  ChevronDown,
  Eye,
  Files,
  FolderInput,
  Loader2,
  Sparkles,
  Trash2,
} from 'lucide-react';
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
  hydrateAiUploadHistoryFromServer,
  listAiUploadHistory,
  removeAiUploadHistoryItem,
  collapseDuplicates,
  type AiUploadHistoryItem,
} from '@/utils/aiUploadHistory';
import { clearAiUploadMeta } from '@/utils/aiDocumentUploadUi';
import {
  deleteAIDocument,
} from '@/services/aiDocumentUpload';
import { useListOwnerAiDocumentsQuery } from '@/services/aiDocumentsApi';
import type { DashboardAiJob } from '@/hooks/useDashboardAiBatchRunner';
import { toast } from 'sonner';
import { AiDocumentPreviewDialog } from '@/components/ai/AiDocumentPreviewDialog';
import { useFamilyAcl } from '@/contexts/FamilyAclContext';
import { AiUploadHistoryThumb } from '@/components/ai/AiUploadHistoryThumb';
import { openVaultUploadDrawer } from '@/components/vault-prototype/VaultUploadDrawer';

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
  progress?: number;
  updatedAt?: string;
  createdAt?: string;
  fileId?: string;
  sectionId?: string;
  targetSectionLabel?: string;
}): 'done' | 'processing' | 'queued' | 'attention' {
  const status = String(item.status || '').toLowerCase();
  if (
    status === 'done' ||
    status === 'ready' ||
    status === 'complete' ||
    status === 'completed' ||
    status === 'filled'
  ) {
    return 'done';
  }
  if (status === 'queued') return 'queued';
  if (status === 'needs_section_choice') return 'attention';
  if (status === 'error') {
    return looksLikeTransientIssue(item.error) ? 'processing' : 'attention';
  }

  // Stale "processing" footprints after a refresh / closed tab: if the file
  // already has a section stamp and sat for a while, treat as complete.
  const stamp = Date.parse(item.updatedAt || item.createdAt || '');
  const ageMs = Number.isFinite(stamp) ? Date.now() - stamp : 0;
  const looksFinished =
    (typeof item.progress === 'number' && item.progress >= 100) ||
    Boolean(item.fileId && (item.sectionId || item.targetSectionLabel));
  if (looksFinished && ageMs > 2 * 60 * 1000) {
    return 'done';
  }
  if (ageMs > 60 * 60 * 1000) {
    // Hours-old processing with no live job overlay → show Complete.
    return 'done';
  }
  return 'processing';
}

function statusTone(status: ReturnType<typeof displayStatus>) {
  if (status === 'done') return 'text-emerald-800 bg-emerald-50 ring-emerald-100';
  if (status === 'attention') return 'text-amber-800 bg-amber-50 ring-amber-100';
  if (status === 'queued') return 'text-slate-700 bg-slate-100 ring-slate-200';
  return 'text-sky-800 bg-sky-50 ring-sky-100';
}

function statusLabel(
  status: ReturnType<typeof displayStatus>,
  rawStatus?: string,
) {
  if (rawStatus === 'needs_section_choice') return 'Choose section';
  if (status === 'done') return 'Complete';
  if (status === 'attention') return 'Needs attention';
  if (status === 'queued') return 'In queue';
  return 'Processing';
}

function statusFootnote(
  status: ReturnType<typeof displayStatus>,
  rawStatus?: string,
) {
  if (rawStatus === 'needs_section_choice') return 'Choose section';
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
      documentSummary: live.documentSummary || item.documentSummary,
      displayTitle: resolveUploadDisplayTitle({
        displayTitle: item.displayTitle,
        documentSummary: live.documentSummary || item.documentSummary,
        fileName: live.fileName || item.fileName,
        mimeType: live.mime_type || item.mimeType,
        sectionId,
        targetSectionLabel:
          live.targetSectionLabel || item.targetSectionLabel,
        fileId: live.file_id || item.fileId,
      }),
      sectionId,
      sectionIds,
      fileId: live.file_id || item.fileId,
      mimeType: live.mime_type || item.mimeType,
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
      mimeType: job.mime_type,
      sectionId: job.targetSectionId || 'overview',
      sectionIds: job.targetSectionId
        ? [String(job.targetSectionId)]
        : ['overview'],
      targetSectionLabel: job.targetSectionLabel,
      documentSummary: job.documentSummary,
      displayTitle: resolveUploadDisplayTitle({
        documentSummary: job.documentSummary,
        fileName: job.fileName,
        mimeType: job.mime_type,
        sectionId: job.targetSectionId,
        targetSectionLabel: job.targetSectionLabel,
        fileId: job.file_id,
      }),
      error: job.error,
      source: 'overview',
    });
  }

  // Final UI pass: one card per file name + section (prefer Complete over Processing).
  const combined = [...extras, ...merged];
  const byKey = new Map<string, AiUploadHistoryItem>();
  const rank = (item: AiUploadHistoryItem) => {
    const s = displayStatus(item);
    if (s === 'done') return 3;
    if (s === 'attention') return 2;
    if (s === 'processing') return 1;
    return 0;
  };
  for (const item of combined) {
    const sectionKey =
      item.sectionId && item.sectionId !== 'overview'
        ? item.sectionId
        : (item.sectionIds || []).find(id => id !== 'overview') || 'pending';
    const key = `${item.fileName.trim().toLowerCase()}::${sectionKey}`;
    const prev = byKey.get(key);
    if (!prev || rank(item) >= rank(prev)) {
      byKey.set(key, {
        ...item,
        status: displayStatus(item) === 'done' ? 'done' : item.status,
        progress:
          displayStatus(item) === 'done'
            ? 100
            : item.progress,
      });
    }
  }
  return collapseDuplicates(Array.from(byKey.values()));
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
  /** Smaller chip for dense section upload bars. */
  dense?: boolean;
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

  // RTK Query caches GET /ai/documents — reopen popup / poll won't spam the API.
  const { data: serverDocs, refetch } = useListOwnerAiDocumentsQuery(undefined, {
    pollingInterval: 45_000,
    refetchOnMountOrArgChange: 15,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (!serverDocs) return;
    hydrateAiUploadHistoryFromServer(serverDocs);
    refreshHistory();
  }, [serverDocs, refreshHistory]);

  useEffect(() => {
    refreshHistory();
    const onHistory = () => refreshHistory();
    window.addEventListener('orderly-ai-upload-history', onHistory);
    return () => {
      window.removeEventListener('orderly-ai-upload-history', onHistory);
    };
  }, [refreshHistory]);

  const syncFromServer = useCallback(async () => {
    try {
      await refetch();
    } catch {
      // keep in-memory list
    } finally {
      refreshHistory();
    }
  }, [refetch, refreshHistory]);

  const items = useMemo(() => {
    const merged = mergeHistoryWithJobs(history, jobs);
    if (!sectionId) return merged;
    const want = String(sectionId);
    return merged.filter(item => {
      if (String(item.sectionId || '') === want) return true;
      return (item.sectionIds || []).some(id => String(id) === want);
    });
  }, [history, jobs, sectionId]);

  return { items, refreshHistory, syncFromServer };
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
 * Overview: labeled attachments button + dialog list (localStorage footprints).
 * Sections: labeled chip bottom-right for that section's attachments.
 * Re-uploading the same topic replaces the previous card and refreshes timestamps.
 */
export function AiUploadHistoryPopup({
  className,
  jobs = [],
  absolute = true,
  sectionId = null,
  source,
  variant = 'dialog',
  dense = false,
  onDismissJob,
}: AiUploadHistoryPopupProps) {
  const { canWrite } = useFamilyAcl();
  const { items, refreshHistory, syncFromServer } = useUploadHistoryItems({
    jobs,
    sectionId,
    source,
  });
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reassigningId, setReassigningId] = useState<string | null>(null);
  const [changeSectionFor, setChangeSectionFor] =
    useState<AiUploadHistoryItem | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const batch = useOptionalDashboardAiBatch();
  const [preview, setPreview] = useState<{
    fileId: string;
    fileName: string;
    mimeType?: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const inlineRootRef = useRef<HTMLDivElement>(null);
  const inlinePanelRef = useRef<HTMLDivElement>(null);
  const [inlinePanelPos, setInlinePanelPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
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

        onDismissJob?.(item.id);
        if (fileId) {
          clearAiUploadMeta(fileId);
          const ok = await deleteAIDocument(fileId);
          if (!ok) throw new Error('delete failed');
        }
        removeAiUploadHistoryItem({ id: item.id, fileId });
        await syncFromServer();
        toast.success('Document deleted');
      } catch {
        toast.error('Could not delete document');
        await syncFromServer();
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, jobs, onDismissJob, syncFromServer],
  );

  const handleChangeSection = useCallback(async () => {
    if (
      !changeSectionFor ||
      !selectedSectionId ||
      !batch?.reassignDocumentSection
    ) {
      return;
    }
    if (selectedSectionId === changeSectionFor.sectionId) {
      setChangeSectionFor(null);
      return;
    }
    const fileId = changeSectionFor.fileId;
    if (!fileId) {
      toast.error('This document is not ready to move yet.');
      return;
    }
    setReassigningId(changeSectionFor.id);
    try {
      await batch.reassignDocumentSection({
        fileId,
        fileName: changeSectionFor.fileName,
        mimeType: changeSectionFor.mimeType,
        sectionId: selectedSectionId,
        documentSummary: changeSectionFor.documentSummary,
        historyId: changeSectionFor.id,
        previousSectionId: changeSectionFor.sectionId,
      });
      refreshHistory();
      toast.success('Document moved to the new section');
      setChangeSectionFor(null);
    } catch (error: any) {
      toast.error(error?.message || 'Could not change section');
    } finally {
      setReassigningId(null);
    }
  }, [batch, changeSectionFor, refreshHistory, selectedSectionId]);

  const openPreview = useCallback((item: AiUploadHistoryItem) => {
    const live = jobs.find(job => job.id === item.id);
    const fileId = item.fileId || live?.file_id || '';
    if (!fileId) {
      toast.error('Preview is not available for this upload yet.');
      return;
    }
    setPreview({
      fileId,
      fileName: resolveUploadDisplayTitle({
        ...item,
        fileId,
        mimeType: item.mimeType || live?.mime_type,
      }),
      mimeType: item.mimeType || live?.mime_type || undefined,
    });
  }, [jobs]);

  const handlePreviewMissing = useCallback(
    (fileId: string) => {
      removeAiUploadHistoryItem({ fileId });
      void syncFromServer();
      setPreview(null);
      toast.error('That upload record was removed. Upload the file again to preview.');
    },
    [syncFromServer],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Portal the section document list so parent overflow-hidden drop zones
  // (decorative blur wrappers) cannot clip the cards.
  useEffect(() => {
    if (!open || variant !== 'inline') {
      setInlinePanelPos(null);
      return;
    }

    const PANEL_WIDTH = Math.min(
      typeof window !== 'undefined' ? window.innerWidth - 16 : 296,
      296,
    );
    const EST_HEIGHT = 320;

    const updatePos = () => {
      const rect = inlineRootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const left = Math.min(
        Math.max(8, rect.right - PANEL_WIDTH),
        window.innerWidth - PANEL_WIDTH - 8,
      );
      const spaceAbove = rect.top - 8;
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      if (spaceAbove >= Math.min(EST_HEIGHT, spaceBelow) && spaceAbove >= 120) {
        setInlinePanelPos({
          bottom: window.innerHeight - rect.top + 8,
          left,
          width: PANEL_WIDTH,
        });
      } else {
        setInlinePanelPos({
          top: rect.bottom + 8,
          left,
          width: PANEL_WIDTH,
        });
      }
    };

    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);

    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (inlineRootRef.current?.contains(target)) return;
      if (inlinePanelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, variant]);

  const previewDialog = (
    <AiDocumentPreviewDialog
      open={Boolean(preview)}
      onOpenChange={open => {
        if (!open) setPreview(null);
      }}
      fileId={preview?.fileId}
      fileName={preview?.fileName}
      mimeType={preview?.mimeType}
      onNotFound={handlePreviewMissing}
    />
  );

  const changeSectionDialog = (
    <Dialog
      open={Boolean(changeSectionFor)}
      onOpenChange={next => {
        if (!next) setChangeSectionFor(null);
      }}
    >
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="space-y-1 border-b border-black/5 px-5 py-4 text-left">
          <DialogTitle className="text-lg font-semibold text-[#213D59]">
            Change section
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#5a6b80]">
            {changeSectionFor
              ? `Move “${resolveUploadDisplayTitle(changeSectionFor)}” if AI put it in the wrong place.`
              : 'Choose where this document should live.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 px-5 py-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#6b7785]">
            Vault section
            <select
              className="mt-1.5 w-full rounded-xl border border-[#213D59]/15 bg-white px-3 py-2.5 text-sm text-[#1a2b3d] outline-none focus:border-[#2B5A8C]"
              value={selectedSectionId}
              onChange={event => setSelectedSectionId(event.target.value)}
            >
              <option value="">Select a section…</option>
              {AI_SECTION_REGISTRY.map(section => (
                <option key={section.id} value={section.id}>
                  {section.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="rounded-xl px-3 py-2 text-sm font-medium text-[#5a6b80] hover:bg-slate-50"
              onClick={() => setChangeSectionFor(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedSectionId || Boolean(reassigningId)}
              onClick={() => void handleChangeSection()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#213D59] px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {reassigningId ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FolderInput className="h-3.5 w-3.5" />
              )}
              Move & fill
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (variant === 'inline') {
    const previewItems = items.slice(0, 3);
    const titleText =
      count === 0
        ? 'Documents'
        : count === 1
          ? '1 document'
          : `${count > 99 ? '99+' : count} documents`;
    const subtitleText =
      count === 0
        ? 'None attached yet'
        : processingCount > 0
          ? `${processingCount} processing · tap to open`
          : 'Tap to open & preview';

    return (
      <>
      <div
        ref={inlineRootRef}
        className={cn(
          absolute ? 'absolute bottom-3 right-3 z-20' : 'relative',
          className,
        )}
        onClick={event => event.stopPropagation()}
        onKeyDown={event => event.stopPropagation()}
      >
        <button
          type="button"
          data-oa-view-ok
          title={
            count > 0
              ? 'Open documents attached to this section'
              : 'No documents attached yet — upload a file first'
          }
          aria-label={
            count > 0
              ? `View section documents, ${count} file${count === 1 ? '' : 's'}`
              : 'No section documents yet'
          }
          aria-expanded={open}
          onClick={() => {
            refreshHistory();
            openVaultUploadDrawer(sectionId || undefined);
          }}
          className={cn(
            'inline-flex items-center text-left shadow-md transition',
            dense
              ? 'max-w-[min(100%,14rem)] gap-1.5 rounded-lg border px-2 py-1'
              : 'max-w-[min(100%,18rem)] gap-2.5 rounded-2xl border px-2.5 py-2',
            count > 0
              ? 'border-[#213D59]/30 bg-white text-[#213D59] ring-1 ring-[#213D59]/10 hover:border-[#213D59]/50 hover:bg-[#f4f7fb]'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
            open && 'ring-2 ring-[#213D59]/30 ring-offset-1',
          )}
        >
          {count > 0 ? (
            <span
              className={cn(
                'relative flex shrink-0 items-center',
                dense ? 'h-7 w-8' : 'h-10 w-[3.25rem]',
              )}
            >
              {previewItems.map((item, index) => (
                <span
                  key={item.id}
                  className={cn(
                    'absolute top-0 overflow-hidden border-2 border-white bg-slate-100 shadow-sm',
                    dense ? 'h-7 w-7 rounded-md' : 'h-10 w-10 rounded-lg',
                  )}
                  style={{
                    left: `${index * (dense ? 7 : 10)}px`,
                    zIndex: previewItems.length - index,
                  }}
                >
                  <AiUploadHistoryThumb
                    fileId={item.fileId}
                    fileName={item.fileName}
                    mimeType={item.mimeType}
                    className="h-full w-full rounded-none border-0"
                  />
                </span>
              ))}
            </span>
          ) : (
            <span
              className={cn(
                'flex shrink-0 items-center justify-center bg-slate-100 text-[#213D59]',
                dense ? 'h-7 w-7 rounded-md' : 'h-10 w-10 rounded-xl',
              )}
            >
              <Files className={dense ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden />
            </span>
          )}
          <span className="min-w-0 pr-0.5">
            <span
              className={cn(
                'block truncate font-semibold leading-tight text-[#213D59]',
                dense ? 'text-[11px]' : 'text-[12px]',
              )}
            >
              {titleText}
            </span>
            {!dense ? (
              <span className="block truncate text-[10px] font-medium leading-tight text-slate-500">
                {subtitleText}
              </span>
            ) : null}
          </span>
          {count > 0 ? (
            <span
              className={cn(
                'ml-auto inline-flex shrink-0 items-center justify-center rounded-full bg-[#213D59] font-bold text-white',
                dense
                  ? 'h-5 min-w-5 px-1 text-[10px]'
                  : 'h-7 min-w-7 px-1.5 text-[11px]',
              )}
            >
              {count > 99 ? '99+' : count}
            </span>
          ) : null}
        </button>

      </div>

      {mounted && open && inlinePanelPos
        ? createPortal(
            <div
              ref={inlinePanelRef}
              role="dialog"
              aria-label="Section documents"
              className="fixed z-[80] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur-sm"
              style={{
                top: inlinePanelPos.top,
                bottom: inlinePanelPos.bottom,
                left: inlinePanelPos.left,
                width: inlinePanelPos.width,
                maxHeight: 'min(20rem, calc(100dvh - 1rem))',
              }}
              onClick={event => event.stopPropagation()}
              onKeyDown={event => event.stopPropagation()}
            >
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#213D59]">
                    Section documents
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {count === 0
                      ? 'No files yet'
                      : `${count} file${count === 1 ? '' : 's'} · tap a preview to open`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                  aria-label="Close documents"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
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
                  const title = resolveUploadDisplayTitle({
                    ...item,
                    mimeType: item.mimeType,
                  });
                  const kind = uploadedFileKindLabel({
                    fileName: item.fileName,
                    mimeType: item.mimeType,
                  });

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 px-2 py-2"
                    >
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          data-oa-view-ok
                          onClick={() => openPreview(item)}
                          className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                          title="View document"
                          aria-label={`View ${title}`}
                        >
                          <AiUploadHistoryThumb
                            fileId={item.fileId}
                            fileName={item.fileName}
                            mimeType={item.mimeType}
                            className="h-full w-full rounded-none border-0"
                          />
                        </button>
                        <button
                          type="button"
                          data-oa-view-ok
                          onClick={() => openPreview(item)}
                          className="min-w-0 flex-1 text-left"
                          title="Click to view document"
                        >
                          <p
                            className="truncate text-[11px] font-semibold text-slate-900"
                            title={title}
                          >
                            {title}
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
                              {statusLabel(uiStatus, item.status)}
                            </span>
                            <span className="rounded bg-white px-1 py-0.5 text-[9px] font-semibold text-[#213D59] ring-1 ring-inset ring-[#213D59]/15">
                              {kind}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-600">
                              {progress}%
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-[#2E7FAD]">
                              <Eye className="h-2.5 w-2.5" />
                              View
                            </span>
                          </div>
                        </button>
                        {canWrite && (
                          <button
                            type="button"
                            data-oa-mutate
                            disabled={deletingId === item.id}
                            onClick={() => void handleDelete(item)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                            aria-label={`Delete ${item.fileName}`}
                            title="Delete upload"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
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
                        <p className="font-semibold text-[#2E7FAD]">
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
            </div>,
            document.body,
          )
        : null}
      {previewDialog}
      {changeSectionDialog}
      </>
    );
  }

  // Overview dashboard — labeled documents button + dialog.
  return (
    <>
      <button
        type="button"
        title="View uploaded documents"
        aria-label={
          count > 0
            ? `View uploaded documents, ${count} file${count === 1 ? '' : 's'}`
            : 'View uploaded documents'
        }
        onClick={event => {
          event.stopPropagation();
          refreshHistory();
          openVaultUploadDrawer(sectionId || undefined);
        }}
        className={cn(
          absolute ? 'absolute bottom-3 right-3 z-10' : 'relative',
          'inline-flex max-w-[min(100%,18rem)] items-center gap-2.5 rounded-2xl border px-2.5 py-2 text-left shadow-md transition',
          count > 0
            ? 'border-[#213D59]/30 bg-white text-[#213D59] ring-1 ring-[#213D59]/10 hover:border-[#213D59]/50 hover:bg-[#f4f7fb]'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
          className,
        )}
      >
        {count > 0 ? (
          <span className="relative flex h-10 w-[3.25rem] shrink-0 items-center">
            {items.slice(0, 3).map((item, index) => (
              <span
                key={item.id}
                className="absolute top-0 h-10 w-10 overflow-hidden rounded-lg border-2 border-white bg-slate-100 shadow-sm"
                style={{
                  left: `${index * 10}px`,
                  zIndex: Math.min(3, items.length) - index,
                }}
              >
                <AiUploadHistoryThumb
                  fileId={item.fileId}
                  fileName={item.fileName}
                  mimeType={item.mimeType}
                  className="h-full w-full rounded-none border-0"
                />
              </span>
            ))}
          </span>
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#213D59]">
            <Files className="h-4 w-4" aria-hidden />
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-[12px] font-semibold leading-tight text-[#213D59]">
            {count === 0
              ? 'Documents'
              : count === 1
                ? '1 document'
                : `${count > 99 ? '99+' : count} documents`}
          </span>
          <span className="block truncate text-[10px] font-medium leading-tight text-slate-500">
            {count === 0
              ? 'None uploaded yet'
              : processingCount > 0
                ? `${processingCount} processing · tap to open`
                : 'Tap to open & preview'}
          </span>
        </span>
        {count > 0 ? (
          <span className="ml-auto inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-[#213D59] px-1.5 text-[11px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            'flex w-[min(96vw,56rem)] max-w-[56rem] flex-col gap-0 overflow-hidden border-0 bg-[#f3f5f7] p-0 shadow-2xl',
            // Desktop: centered card
            'sm:max-h-[min(90vh,52rem)] sm:rounded-3xl',
            // Mobile: bottom sheet so the list is not clipped by nav / safe area
            'max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:max-h-[min(88dvh,calc(100dvh-env(safe-area-inset-bottom)))] max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-[1.5rem] max-sm:rounded-b-none max-sm:pb-[env(safe-area-inset-bottom)]',
          )}
        >
          <DialogHeader className="shrink-0 space-y-1 border-b border-black/5 bg-white px-5 pb-4 pt-5 pr-12 text-left sm:px-6 sm:pt-6">
            <DialogTitle className="text-xl font-semibold tracking-tight text-[#213D59]">
              Uploaded documents
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#5a6b80]">
              Each card is named after the file you uploaded (PDF, photo, or
              scan). The matched vault section is listed underneath.
            </DialogDescription>
          </DialogHeader>

          {processingCount > 0 ? (
            <div className="mx-4 mt-4 flex shrink-0 gap-3 rounded-2xl border border-[#213D59]/12 bg-gradient-to-br from-[#eef3f9] to-white px-4 py-3.5 shadow-sm sm:mx-5">
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

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
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
                  const title = resolveUploadDisplayTitle({
                    ...item,
                    mimeType: item.mimeType,
                  });
                  const kind = uploadedFileKindLabel({
                    fileName: item.fileName,
                    mimeType: item.mimeType,
                  });

                  return (
                    <div
                      key={item.id}
                      className="group relative flex flex-col overflow-hidden rounded-2xl bg-[#e8ebef] p-2 shadow-sm transition hover:bg-[#e2e6eb] sm:rounded-[1.35rem] sm:p-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => openPreview(item)}
                        className="relative block w-full text-left"
                        title={`Preview ${title}`}
                      >
                        <AiUploadHistoryThumb
                          fileId={item.fileId}
                          fileName={item.fileName}
                          mimeType={item.mimeType}
                        />

                        {isLive ? (
                          <div className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-black/55 to-transparent px-2 pb-2 pt-7">
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {statusLabel(uiStatus, item.status)}
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
                            {item.status === 'needs_section_choice'
                              ? 'Choose section'
                              : 'Needs attention'}
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
                        aria-label={`Delete ${title}`}
                        title="Delete upload"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openPreview(item)}
                        className="mt-2 space-y-0.5 px-0.5 text-left"
                        title={title}
                      >
                        <p className="text-[10px] font-medium text-[#6b7785] sm:text-[11px]">
                          {relative || 'Just now'}
                        </p>
                        <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-[#1a2b3d] sm:text-[13px]">
                          {title}
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
                            {statusFootnote(uiStatus, item.status)}
                          </span>
                          <span className="inline-flex items-center rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-[#213D59] ring-1 ring-inset ring-[#213D59]/15">
                            {kind}
                          </span>
                          <span
                            className="truncate text-[10px] text-[#6b7785] sm:text-[11px]"
                            title={category}
                          >
                            {category}
                          </span>
                        </div>
                      </button>

                      {canWrite &&
                      item.fileId &&
                      (uiStatus === 'done' ||
                        uiStatus === 'attention' ||
                        item.status === 'needs_section_choice') ? (
                        <button
                          type="button"
                          disabled={reassigningId === item.id}
                          onClick={event => {
                            event.stopPropagation();
                            setSelectedSectionId(
                              item.sectionId && item.sectionId !== 'overview'
                                ? item.sectionId
                                : '',
                            );
                            setChangeSectionFor(item);
                          }}
                          className="mt-1.5 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-[#213D59]/15 bg-white/80 px-2 py-1.5 text-[10px] font-semibold text-[#2E7FAD] transition hover:bg-white disabled:opacity-50"
                        >
                          {reassigningId === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <FolderInput className="h-3 w-3" />
                          )}
                          Change section
                        </button>
                      ) : null}

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
      {changeSectionDialog}
    </>
  );
}
