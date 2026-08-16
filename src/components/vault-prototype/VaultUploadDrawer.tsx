'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@common/ui/utils';
import { VaultDetailDrawer } from '@/components/vault-prototype/VaultDetailDrawer';
import { useDashboardAiBatch } from '@/contexts/DashboardAiBatchContext';
import { useFamilyAcl } from '@/contexts/FamilyAclContext';
import type {
  DashboardAiJob,
  DashboardAiJobStatus,
} from '@/hooks/useDashboardAiBatchRunner';
import {
  AI_DOCUMENT_ACCEPT,
  clearAiUploadMeta,
} from '@/utils/aiDocumentUploadUi';
import {
  listDashboardAiPatches,
  peekDashboardAiPatch,
} from '@/utils/aiDashboardPatchCache';
import { AI_SECTION_REGISTRY, getAiSectionLabel } from '@/utils/aiSectionRegistry';
import { isAiSectionReviewed } from '@/utils/aiSectionReviewState';
import {
  formatUploadRelativeShort,
  hydrateAiUploadHistoryFromServer,
  itemMatchesSection,
  listAiUploadHistory,
  mapServerDocumentsToHistory,
  removeAiUploadHistoryItem,
  toVaultSectionId,
  type AiUploadHistoryItem,
} from '@/utils/aiUploadHistory';
import { openAiReviewFill } from '@/utils/vaultActivityTabs';
import { schemaByApiId } from '@/vault-prototype';
import { useListOwnerAiDocumentsQuery } from '@/services/aiDocumentsApi';
import { deleteAIDocument } from '@/services/aiDocumentUpload';
import { AiUploadHistoryThumb } from '@/components/ai/AiUploadHistoryThumb';
import { AiDocumentPreviewDialog } from '@/components/ai/AiDocumentPreviewDialog';
import { getVaultSectionDisplayNumber } from '@/utils/vaultNavigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/ui/dialog';

export const OPEN_VAULT_UPLOAD_DRAWER = 'orderly-open-upload-drawer';
export const CLOSE_VAULT_UPLOAD_DRAWER = 'orderly-close-upload-drawer';

export function openVaultUploadDrawer(sectionId?: string) {
  window.dispatchEvent(
    new CustomEvent(OPEN_VAULT_UPLOAD_DRAWER, {
      detail: { sectionId: sectionId || undefined },
    }),
  );
}

export function closeVaultUploadDrawer() {
  window.dispatchEvent(new CustomEvent(CLOSE_VAULT_UPLOAD_DRAWER));
}

const IN_PROGRESS: DashboardAiJobStatus[] = [
  'queued',
  'starting',
  'uploading',
  'reading',
  'almost',
  'routing',
  'filling',
];

type DrawerDoc = {
  key: string;
  historyId: string;
  fileName: string;
  fileId?: string;
  mimeType?: string;
  sectionId?: string;
  sectionIds?: string[];
  sectionLabel: string;
  progress?: number;
  message: string;
  kind: 'progress' | 'review' | 'filed';
  createdAt?: string;
  documentSummary?: string;
};

function sectionTitle(sectionId?: string) {
  if (!sectionId) return '';
  const fromSchema = schemaByApiId(sectionId)?.name;
  if (fromSchema) return fromSchema;
  return getAiSectionLabel(sectionId);
}

function fileBadge(fileName: string, mimeType?: string) {
  const ext = fileName.split('.').pop()?.toUpperCase();
  if (ext && ext.length <= 4) return ext;
  if (mimeType?.includes('pdf')) return 'PDF';
  if (mimeType?.includes('png')) return 'PNG';
  if (mimeType?.includes('jpeg') || mimeType?.includes('jpg')) return 'JPG';
  if (mimeType?.includes('heic')) return 'HEIC';
  return 'FILE';
}

function matchesSection(
  sectionId: string,
  item: { sectionId?: string; sectionIds?: string[]; targetSectionId?: string },
) {
  const want = toVaultSectionId(sectionId) || String(sectionId);
  const ids = [
    item.sectionId,
    item.targetSectionId,
    ...(item.sectionIds || []),
  ];
  return ids.some(id => {
    if (!id) return false;
    return toVaultSectionId(id) === want || String(id) === want;
  });
}

function reviewed(sectionId?: string, fileId?: string) {
  if (!sectionId || sectionId === 'overview') return false;
  return isAiSectionReviewed(sectionId, fileId);
}

function fieldCount(sectionId?: string, fileId?: string) {
  if (!sectionId || sectionId === 'overview') return 0;
  const patch = peekDashboardAiPatch(sectionId, fileId);
  const n = patch?.detectedFields?.length || 0;
  if (n) return n;
  return listDashboardAiPatches().filter(
    entry =>
      entry.section_id === sectionId &&
      (!fileId || entry.file_id === fileId),
  ).length;
}

function jobToDoc(job: DashboardAiJob, kind: DrawerDoc['kind']): DrawerDoc {
  const sectionId = job.targetSectionId;
  const label = job.targetSectionLabel || sectionTitle(sectionId);
  const count = fieldCount(sectionId, job.file_id);
  let message = job.message || '';
  if (kind === 'progress') {
    const pct = Math.max(0, Math.min(99, job.progress || 0));
    message = pct
      ? `${job.message || 'Reading document'}, ${pct}%`
      : job.message || 'In queue';
  } else if (kind === 'review') {
    if (job.status === 'needs_section_choice') {
      message = 'Choose a section to file this';
    } else if (job.status === 'error') {
      message = job.error || job.message || 'Needs attention';
    } else if (label && count) {
      message = `Filed to ${label}, ${count} field${count === 1 ? '' : 's'} ready`;
    } else if (label) {
      message = `Filed to ${label}`;
    } else {
      message = 'Ready for your review';
    }
  }
  return {
    key: `job-${job.id}`,
    historyId: job.id,
    fileName: job.fileName,
    fileId: job.file_id,
    mimeType: job.mime_type,
    sectionId,
    sectionIds: job.targetSectionId ? [job.targetSectionId] : [],
    sectionLabel: label,
    progress: job.progress,
    message,
    kind,
    createdAt: job.updatedAt || job.createdAt,
    documentSummary: job.documentSummary,
  };
}

function historyToDoc(
  item: AiUploadHistoryItem,
  kind: DrawerDoc['kind'],
): DrawerDoc {
  const sectionId = toVaultSectionId(item.sectionId) || item.sectionId;
  const label = item.targetSectionLabel || sectionTitle(sectionId);
  const count = fieldCount(sectionId, item.fileId);
  let message = '';
  if (kind === 'progress') {
    const pct = Math.max(0, Math.min(99, item.progress || 0));
    message = pct ? `Reading document, ${pct}%` : 'In progress';
  } else if (kind === 'review') {
    if (label && count) {
      message = `Filed to ${label}, ${count} field${count === 1 ? '' : 's'} ready`;
    } else if (label) {
      message = `Filed to ${label}`;
    } else {
      message = 'Ready for your review';
    }
  } else {
    const when =
      formatUploadRelativeShort(item.updatedAt || item.createdAt) || 'recently';
    message = label ? `${label}, approved ${when}` : `Approved ${when}`;
  }
  return {
    key: `hist-${item.id}`,
    historyId: item.id,
    fileName: item.fileName,
    fileId: item.fileId,
    mimeType: item.mimeType,
    sectionId,
    sectionIds: item.sectionIds?.length
      ? item.sectionIds
      : sectionId
        ? [sectionId]
        : [],
    sectionLabel: label,
    progress: item.progress,
    message,
    kind,
    createdAt: item.updatedAt || item.createdAt,
    documentSummary: item.documentSummary,
  };
}

function DocRow({
  doc,
  canWrite,
  deleting,
  onPreview,
  onReview,
  onChangeSection,
  onDelete,
}: {
  doc: DrawerDoc;
  canWrite?: boolean;
  deleting?: boolean;
  onPreview?: (doc: DrawerDoc) => void;
  onReview?: (doc: DrawerDoc) => void;
  onChangeSection?: (doc: DrawerDoc) => void;
  onDelete?: (doc: DrawerDoc) => void;
}) {
  const reviewable = doc.kind === 'review';
  return (
    <div
      className={cn(
        'mb-2.5 rounded-[11px] border px-3 py-2',
        reviewable
          ? 'border-[#EBD9B4] bg-[#FDF4E4]'
          : 'border-[#E4EAF0] bg-white',
      )}
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          disabled={!doc.fileId}
          onClick={() => onPreview?.(doc)}
          className="h-[46px] w-[38px] shrink-0 overflow-hidden rounded-[6px] bg-[#F6F8FA] ring-1 ring-[#E4EAF0] disabled:cursor-default"
          aria-label={`Preview ${doc.fileName}`}
        >
          {doc.fileId ? (
            <AiUploadHistoryThumb
              fileId={doc.fileId}
              fileName={doc.fileName}
              mimeType={doc.mimeType}
              className="h-full w-full rounded-[6px] aspect-auto"
            />
          ) : (
            <div
              className={cn(
                'grid h-full w-full place-items-center text-[9.5px] font-bold',
                reviewable ? 'text-[#B4761A]' : 'text-[#C2442E]',
              )}
            >
              {fileBadge(doc.fileName, doc.mimeType)}
            </div>
          )}
        </button>
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => (doc.fileId ? onPreview?.(doc) : undefined)}
        >
          <p className="truncate text-[13.5px] font-semibold text-[#213D59]">
            {doc.fileName}
          </p>
          <p className="text-[11.5px] text-[#7A8794]">
            {doc.message}
            {doc.createdAt
              ? ` · ${formatUploadRelativeShort(doc.createdAt)}`
              : ''}
          </p>
          {doc.kind === 'progress' ? (
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E4EAF0]">
              <i
                className="block h-full rounded-full bg-gradient-to-r from-[#619FCE] to-[#3EB1E5] transition-[width] duration-500"
                style={{
                  width: `${Math.max(8, Math.min(100, doc.progress || 0))}%`,
                }}
              />
            </div>
          ) : null}
        </button>
      </div>
      {doc.kind !== 'progress' ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={!doc.fileId}
            onClick={() => onPreview?.(doc)}
            className="inline-flex h-8 items-center rounded-full border border-[#E4EAF0] bg-white px-2.5 text-[12px] font-semibold text-[#213D59] hover:bg-[#F6F8FA] disabled:opacity-40"
          >
            View
          </button>
          {reviewable || (doc.kind === 'filed' && doc.fileId) ? (
            <button
              type="button"
              onClick={() => onReview?.(doc)}
              className="inline-flex h-8 items-center rounded-full bg-[#3EB1E5] px-2.5 text-[12px] font-semibold text-[#16293C] hover:bg-[#7ACAF9]"
            >
              Review
            </button>
          ) : null}
          {canWrite ? (
            <button
              type="button"
              disabled={!doc.fileId}
              onClick={() => onChangeSection?.(doc)}
              className="inline-flex h-8 items-center rounded-full border border-[#E4EAF0] bg-white px-2.5 text-[12px] font-semibold text-[#2E7FAD] hover:bg-[#EAF6FD] disabled:opacity-40"
            >
              Change section
            </button>
          ) : null}
          {canWrite ? (
            <button
              type="button"
              disabled={deleting}
              onClick={() => onDelete?.(doc)}
              className="inline-flex h-8 items-center rounded-full px-2.5 text-[12px] font-semibold text-[#C2442E] hover:bg-[#FBEDEA] disabled:opacity-40"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function groupDocsBySection(docs: DrawerDoc[]) {
  const map = new Map<
    string,
    { id: string; label: string; docs: DrawerDoc[] }
  >();
  docs.forEach(doc => {
    const ids = (
      doc.sectionIds?.length
        ? doc.sectionIds
        : [doc.sectionId || 'unfiled']
    )
      .map(id => toVaultSectionId(id) || String(id || 'unfiled'))
      .filter(Boolean);
    const unique = [...new Set(ids.length ? ids : ['unfiled'])];
    unique.forEach(id => {
      if (!map.has(id)) {
        map.set(id, {
          id,
          label:
            id === 'unfiled' || id === 'overview'
              ? 'Needs a section'
              : sectionTitle(id) || doc.sectionLabel || 'Vault',
          docs: [],
        });
      }
      map.get(id)!.docs.push({
        ...doc,
        key: `${doc.key}-${id}`,
        sectionId: id === 'unfiled' || id === 'overview' ? undefined : id,
        sectionLabel: map.get(id)!.label,
      });
    });
  });
  return [...map.values()].sort((a, b) => {
    const aLast = a.id === 'unfiled' || a.id === 'overview';
    const bLast = b.id === 'unfiled' || b.id === 'overview';
    if (aLast && !bLast) return 1;
    if (bLast && !aLast) return -1;
    return (
      Number(getVaultSectionDisplayNumber(a.id)) -
      Number(getVaultSectionDisplayNumber(b.id))
    );
  });
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 mt-[22px] text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#7A8794] first:mt-0">
      {children}
    </p>
  );
}

function uploadDateBucket(iso?: string) {
  if (!iso) return { id: 'older', label: 'Earlier', order: 4 };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { id: 'older', label: 'Earlier', order: 4 };
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const days = Math.round((start.getTime() - dayStart.getTime()) / 86400000);
  if (days <= 0) return { id: 'today', label: 'Today', order: 0 };
  if (days === 1) return { id: 'yesterday', label: 'Yesterday', order: 1 };
  if (days < 7) return { id: 'week', label: 'This week', order: 2 };
  if (days < 30) return { id: 'month', label: 'This month', order: 3 };
  return { id: 'older', label: 'Earlier', order: 4 };
}

function groupDocsByDate(docs: DrawerDoc[]) {
  const map = new Map<
    string,
    { id: string; label: string; order: number; docs: DrawerDoc[] }
  >();
  docs.forEach(doc => {
    const bucket = uploadDateBucket(doc.createdAt);
    if (!map.has(bucket.id)) map.set(bucket.id, { ...bucket, docs: [] });
    map.get(bucket.id)!.docs.push(doc);
  });
  return [...map.values()]
    .sort((a, b) => a.order - b.order)
    .map(group => ({
      ...group,
      docs: [...group.docs].sort((a, b) =>
        String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
      ),
    }));
}

export function VaultUploadDrawer() {
  const [open, setOpen] = useState(false);
  const [sectionId, setSectionId] = useState<string | undefined>();
  const [historyTick, setHistoryTick] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<{
    fileId: string;
    fileName: string;
    mimeType?: string;
  } | null>(null);
  const [changeSectionFor, setChangeSectionFor] = useState<DrawerDoc | null>(
    null,
  );
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reassigning, setReassigning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const batch = useDashboardAiBatch();
  const { data: serverDocs, isSuccess } = useListOwnerAiDocumentsQuery(
    undefined,
    {
      pollingInterval: 45_000,
      refetchOnMountOrArgChange: 15,
      refetchOnFocus: true,
    },
  );

  useEffect(() => {
    if (!isSuccess || !serverDocs) return;
    hydrateAiUploadHistoryFromServer(serverDocs);
    setHistoryTick(value => value + 1);
  }, [isSuccess, serverDocs]);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ sectionId?: string }>).detail;
      const next = detail?.sectionId
        ? toVaultSectionId(detail.sectionId) || String(detail.sectionId).trim()
        : undefined;
      setSectionId(next || undefined);
      setOpen(true);
    };
    const onClose = () => setOpen(false);
    window.addEventListener(OPEN_VAULT_UPLOAD_DRAWER, onOpen);
    window.addEventListener(CLOSE_VAULT_UPLOAD_DRAWER, onClose);
    return () => {
      window.removeEventListener(OPEN_VAULT_UPLOAD_DRAWER, onOpen);
      window.removeEventListener(CLOSE_VAULT_UPLOAD_DRAWER, onClose);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setHistoryTick(value => value + 1);
    const onHistory = () => setHistoryTick(value => value + 1);
    window.addEventListener('orderly-ai-upload-history', onHistory);
    window.addEventListener('orderly-ai-section-reviewed', onHistory);
    window.addEventListener('orderly-ai-patch-stashed', onHistory);
    return () => {
      window.removeEventListener('orderly-ai-upload-history', onHistory);
      window.removeEventListener('orderly-ai-section-reviewed', onHistory);
      window.removeEventListener('orderly-ai-patch-stashed', onHistory);
    };
  }, [open]);

  const history = useMemo(() => {
    void historyTick;
    const fromServer = mapServerDocumentsToHistory(serverDocs || []);
    const scopedServer = sectionId
      ? fromServer.filter(item => itemMatchesSection(item, sectionId))
      : fromServer;
    if (scopedServer.length > 0) return scopedServer;
    return listAiUploadHistory(sectionId ? { sectionId } : undefined);
  }, [sectionId, historyTick, batch.jobs, serverDocs]);

  const scopedJobs = useMemo(() => {
    if (!sectionId) return batch.jobs;
    return batch.jobs.filter(job => {
      if (matchesSection(sectionId, job)) return true;
      const stamped = history.find(item => item.id === job.id);
      return stamped ? matchesSection(sectionId, stamped) : false;
    });
  }, [batch.jobs, history, sectionId]);

  const lists = useMemo(() => {
    const inProgress: DrawerDoc[] = [];
    const ready: DrawerDoc[] = [];
    const filed: DrawerDoc[] = [];
    const seenFiles = new Set<string>();
    const seenJobs = new Set<string>();

    const mark = (fileId?: string, jobId?: string) => {
      if (fileId) seenFiles.add(fileId);
      if (jobId) seenJobs.add(jobId);
    };

    scopedJobs.forEach(job => {
      seenJobs.add(job.id);
      if (job.file_id) seenFiles.add(job.file_id);
      if (IN_PROGRESS.includes(job.status)) {
        inProgress.push(jobToDoc(job, 'progress'));
        return;
      }
      if (
        job.status === 'done' ||
        job.status === 'needs_section_choice' ||
        job.status === 'error'
      ) {
        if (reviewed(job.targetSectionId, job.file_id)) {
          filed.push(jobToDoc(job, 'filed'));
        } else {
          ready.push(jobToDoc(job, 'review'));
        }
      }
    });

    history.forEach(item => {
      if (seenJobs.has(item.id)) return;
      if (item.fileId && seenFiles.has(item.fileId)) return;
      const status = String(item.status || '');
      if (IN_PROGRESS.includes(status as DashboardAiJobStatus)) {
        inProgress.push(historyToDoc(item, 'progress'));
        mark(item.fileId, item.id);
        return;
      }
      const sid = toVaultSectionId(item.sectionId) || item.sectionId;
      const pendingPatch =
        sid &&
        sid !== 'overview' &&
        listDashboardAiPatches().some(
          entry =>
            entry.section_id === sid &&
            (!item.fileId || entry.file_id === item.fileId) &&
            !entry.vault_persisted,
        );
      const needsReview =
        !reviewed(sid, item.fileId) &&
        (status === 'done' ||
          status === 'needs_section_choice' ||
          status === 'error' ||
          Boolean(pendingPatch));
      if (needsReview) {
        ready.push(historyToDoc(item, 'review'));
      } else {
        filed.push(historyToDoc(item, 'filed'));
      }
      mark(item.fileId, item.id);
    });

    return { inProgress, ready, filed };
  }, [history, scopedJobs]);

  const enqueue = useCallback(
    (files: FileList | File[] | null) => {
      if (!files || !files.length) return;
      batch.enqueueFiles(files, {
        sectionId,
        source: sectionId ? 'section' : 'overview',
      });
    },
    [batch, sectionId],
  );

  const openReview = useCallback(
    (doc: DrawerDoc) => {
      setOpen(false);
      openAiReviewFill({
        fileId: doc.fileId,
        sectionId: sectionId || doc.sectionId,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        from: sectionId ? 'section' : 'overview',
      });
    },
    [sectionId],
  );

  const openPreview = useCallback((doc: DrawerDoc) => {
    if (!doc.fileId) {
      toast.error('Preview is not available for this upload yet.');
      return;
    }
    setPreview({
      fileId: doc.fileId,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
    });
  }, []);

  const handleDelete = useCallback(
    async (doc: DrawerDoc) => {
      if (deletingId) return;
      setDeletingId(doc.key);
      try {
        batch.dismissJob?.(doc.historyId);
        if (doc.fileId) {
          clearAiUploadMeta(doc.fileId);
          const ok = await deleteAIDocument(doc.fileId);
          if (!ok) throw new Error('delete failed');
        }
        removeAiUploadHistoryItem({ id: doc.historyId, fileId: doc.fileId });
        setHistoryTick(value => value + 1);
        toast.success('Document deleted');
      } catch {
        toast.error('Could not delete document');
      } finally {
        setDeletingId(null);
      }
    },
    [batch, deletingId],
  );

  const handleChangeSection = useCallback(async () => {
    if (!changeSectionFor || !selectedSectionId) return;
    if (!batch.reassignDocumentSection) return;
    if (!changeSectionFor.fileId) {
      toast.error('This document is not ready to move yet.');
      return;
    }
    setReassigning(true);
    try {
      await batch.reassignDocumentSection({
        fileId: changeSectionFor.fileId,
        fileName: changeSectionFor.fileName,
        mimeType: changeSectionFor.mimeType,
        sectionId: selectedSectionId,
        documentSummary: changeSectionFor.documentSummary,
        historyId: changeSectionFor.historyId,
        previousSectionId: changeSectionFor.sectionId,
      });
      setHistoryTick(value => value + 1);
      toast.success('Document moved to the new section');
      setChangeSectionFor(null);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'Could not change section',
      );
    } finally {
      setReassigning(false);
    }
  }, [batch, changeSectionFor, selectedSectionId]);

  const { canWrite } = useFamilyAcl();
  const rowProps = {
    canWrite,
    onPreview: openPreview,
    onReview: openReview,
    onChangeSection: (doc: DrawerDoc) => {
      setSelectedSectionId(doc.sectionId || '');
      setChangeSectionFor(doc);
    },
    onDelete: handleDelete,
  };

  const scopedName = sectionId ? sectionTitle(sectionId) : '';

  return (
    <>
      <VaultDetailDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Upload documents"
        subtitle={
          scopedName
            ? `Documents for ${scopedName}. We read the file and file it for you.`
            : 'It reads the file and files it for you'
        }
        icon={<UploadCloud className="h-5 w-5" />}
        footer={
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#213D59] px-5 text-[14px] font-semibold text-white hover:bg-[#2C4B6B] sm:h-10 sm:min-h-10"
          >
            Choose files
          </button>
        }
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={AI_DOCUMENT_ACCEPT}
          multiple
          onChange={event => {
            enqueue(event.currentTarget.files);
            event.currentTarget.value = '';
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragEnter={event => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={event => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={event => {
            event.preventDefault();
            if (event.currentTarget.contains(event.relatedTarget as Node)) {
              return;
            }
            setDragging(false);
          }}
          onDrop={event => {
            event.preventDefault();
            setDragging(false);
            enqueue(event.dataTransfer.files);
          }}
          className={cn(
            'mb-5 flex w-full flex-wrap items-center gap-3 rounded-[16px] border-2 border-dashed px-4 py-4 text-left transition sm:gap-[18px] sm:px-6 sm:py-[22px]',
            dragging
              ? 'border-[#3EB1E5] bg-[#EAF6FD]'
              : 'border-[#E4EAF0] bg-[#F6F8FA] hover:border-[#3EB1E5] hover:bg-[#EAF6FD]',
          )}
        >
          <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[13px] border border-[#E4EAF0] bg-white text-[#619FCE]">
            <UploadCloud className="h-[21px] w-[21px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15.5px] font-bold text-[#213D59]">
              Drop files or browse
            </span>
            <span className="mt-0.5 block text-[13.5px] text-[#7A8794]">
              PDF, JPG, PNG, HEIC. Up to 15 MB each.
            </span>
          </span>
        </button>

        {lists.inProgress.length ? (
          <>
            <SectionLabel>In progress</SectionLabel>
            {lists.inProgress.map(doc => (
              <DocRow
                key={doc.key}
                doc={doc}
                deleting={deletingId === doc.key}
                {...rowProps}
              />
            ))}
          </>
        ) : null}

        {lists.ready.length ? (
          <>
            <SectionLabel>Ready for your review</SectionLabel>
            {lists.ready.map(doc => (
              <DocRow
                key={doc.key}
                doc={doc}
                deleting={deletingId === doc.key}
                {...rowProps}
              />
            ))}
          </>
        ) : null}

        {lists.filed.length ? (
          <>
            <SectionLabel>Recently filed</SectionLabel>
            {groupDocsByDate(lists.filed).map(day => (
              <div key={day.id} className="mb-1">
                <p className="mb-1.5 text-[12px] font-semibold text-[#213D59]">
                  {day.label}
                </p>
                {!sectionId
                  ? groupDocsBySection(day.docs).map(group => (
                      <div key={`${day.id}-${group.id}`} className="mb-1">
                        <p className="mb-1 text-[11.5px] text-[#7A8794]">
                          {group.label}
                        </p>
                        {group.docs.map(doc => (
                          <DocRow
                            key={doc.key}
                            doc={doc}
                            deleting={deletingId === doc.key}
                            {...rowProps}
                          />
                        ))}
                      </div>
                    ))
                  : day.docs.map(doc => (
                      <DocRow
                        key={doc.key}
                        doc={doc}
                        deleting={deletingId === doc.key}
                        {...rowProps}
                      />
                    ))}
              </div>
            ))}
          </>
        ) : null}

        {!lists.inProgress.length &&
        !lists.ready.length &&
        !lists.filed.length ? (
          <p className="text-[13.5px] leading-relaxed text-[#7A8794]">
            {scopedName
              ? `No documents in ${scopedName} yet. Drop a file here and we fill the matching fields.`
              : 'No documents yet. Drop a policy, statement, title, or ID and we file it for you.'}
          </p>
        ) : null}
      </VaultDetailDrawer>
      <AiDocumentPreviewDialog
        open={Boolean(preview)}
        onOpenChange={next => {
          if (!next) setPreview(null);
        }}
        fileId={preview?.fileId}
        fileName={preview?.fileName}
        mimeType={preview?.mimeType}
      />
      <Dialog
        open={Boolean(changeSectionFor)}
        onOpenChange={next => {
          if (!next) setChangeSectionFor(null);
        }}
      >
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:rounded-2xl">
          <DialogHeader className="space-y-1 border-b border-[#E4EAF0] px-5 py-4 text-left">
            <DialogTitle className="text-lg font-semibold text-[#213D59]">
              Change section
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#7A8794]">
              {changeSectionFor
                ? `Move “${changeSectionFor.fileName}” if it was filed in the wrong place.`
                : 'Choose where this document should live.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-5 py-4">
            <label className="block text-[12.5px] font-semibold text-[#6A7481]">
              Vault section
              <select
                className="mt-1.5 h-11 w-full rounded-[10px] border border-[#E4EAF0] bg-white px-3.5 text-[14.5px] text-[#213D59] outline-none focus:border-[#3EB1E5]"
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
                className="rounded-full px-3.5 py-2 text-[13px] font-semibold text-[#213D59] hover:bg-[#F6F8FA]"
                onClick={() => setChangeSectionFor(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedSectionId || reassigning}
                onClick={() => void handleChangeSection()}
                className="inline-flex items-center rounded-full bg-[#213D59] px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                {reassigning ? 'Moving…' : 'Move & fill'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
