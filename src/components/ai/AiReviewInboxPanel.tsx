'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, FileText, Inbox, Loader2, Paperclip, Bell, Search, X } from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import { cn } from '@common/ui/utils';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import { useDashboardAiBatch } from '@/contexts/DashboardAiBatchContext';
import { AiUploadHistoryThumb } from '@/components/ai/AiUploadHistoryThumb';
import { AiDocumentPreviewDialog } from '@/components/ai/AiDocumentPreviewDialog';
import {
  listDashboardAiPatches,
  takeDashboardAiPatch,
  type StashedAiPatch,
} from '@/utils/aiDashboardPatchCache';
import {
  AI_SECTION_BY_ID,
  getAiSectionLabel,
} from '@/utils/aiSectionRegistry';
import {
  isAiSectionReviewed,
  markAiSectionReviewed,
} from '@/utils/aiSectionReviewState';
import {
  formatUploadRelativeShort,
  listAiUploadHistory,
  type AiUploadHistoryItem,
} from '@/utils/aiUploadHistory';
import { toast } from 'sonner';
import {
  AiInboxDocumentReviewDialog,
  type AiInboxReviewDocument,
} from '@/components/ai/AiInboxDocumentReviewDialog';
import { peekDashboardAiPatch, stashDashboardAiPatch } from '@/utils/aiDashboardPatchCache';
import type { DetectedAiFact } from '@/utils/aiDashboardPatchCache';
import {
  deleteAIDocument,
  listOwnerAiDocuments,
  type OwnerAiDocument,
} from '@/services/aiDocumentUpload';
import { removeAiUploadHistoryItem } from '@/utils/aiUploadHistory';
import { clearAiUploadMeta } from '@/utils/aiDocumentUploadUi';
import { buildAiUploadReviewSummary } from '@/utils/aiUploadReviewSummary';
import { applyEditedFactsToStash } from '@/utils/aiReviewAcceptSave';
import { persistAiResultToSectionBackground } from '@/services/aiBackgroundSectionPersist';
import { markAiSectionFilled } from '@/utils/aiSectionFillGuard';
import { markAiAutofillDoneForSection } from '@/utils/aiAutofillDoneSections';
import { ensureFreshSession } from '@/libs/secureFetch';
import { flattenDetectedFactsFromPatch } from '@/utils/aiSemanticFieldMatch';
import { unwrapAiAutofillPatch } from '@/utils/aiPatchNormalizer';
import type { OverviewExpiryAlert } from '@/utils/overviewExpiryAlerts';
import { OVERVIEW_BROWSE_CATEGORIES } from '@/utils/overviewBrowseCategories';

type InboxTab = 'inbox' | 'files' | 'reminders';

const OPEN_INBOX_TAB_EVENT = 'orderly-open-ai-inbox-tab';

function formatReminderDue(daysUntil: number): string {
  if (daysUntil < 0) {
    const n = Math.abs(daysUntil);
    return n === 1 ? '1 day overdue' : `${n} days overdue`;
  }
  if (daysUntil === 0) return 'Due today';
  if (daysUntil === 1) return 'Due tomorrow';
  return `Due in ${daysUntil} days`;
}

function reminderToneClasses(tone: OverviewExpiryAlert['tone']) {
  if (tone === 'critical') {
    return {
      badge: 'bg-rose-50 text-rose-800 ring-rose-100',
      icon: 'bg-rose-100 text-rose-700',
    };
  }
  if (tone === 'ok' || tone === 'info') {
    return {
      badge: 'bg-slate-100 text-slate-700 ring-slate-200',
      icon: 'bg-slate-100 text-[#5a6b80]',
    };
  }
  return {
    badge: 'bg-amber-50 text-amber-900 ring-amber-100',
    icon: 'bg-amber-100 text-amber-800',
  };
}

function browseCategoryLabel(sectionId?: string | null): string | null {
  if (!sectionId || sectionId === 'overview') return null;
  const want = String(sectionId);
  const category = OVERVIEW_BROWSE_CATEGORIES.find(item =>
    item.sectionIds.includes(want),
  );
  return category?.label || null;
}

function fileCategoryLine(item: AiUploadHistoryItem): string {
  const sectionId =
    item.sectionId && item.sectionId !== 'overview'
      ? item.sectionId
      : item.sectionIds?.find(id => id && id !== 'overview');
  const category = browseCategoryLabel(sectionId);
  const section =
    item.targetSectionLabel ||
    (sectionId ? getAiSectionLabel(sectionId) : '') ||
    'Uploaded';
  if (category && section && !section.toLowerCase().includes(category.toLowerCase())) {
    return `${category} · ${section}`;
  }
  return category || section;
}

function mergeInboxFiles(args: {
  history: AiUploadHistoryItem[];
  jobs: {
    id: string;
    file_id?: string;
    fileName?: string;
    file_name?: string;
    status: string;
    progress?: number;
    targetSectionId?: string;
    targetSectionLabel?: string;
    createdAt?: number | string;
    updatedAt?: string;
    error?: string;
  }[];
  serverDocs: OwnerAiDocument[];
}): AiUploadHistoryItem[] {
  const byKey = new Map<string, AiUploadHistoryItem>();

  const put = (item: AiUploadHistoryItem) => {
    const key = item.fileId
      ? `file:${item.fileId}`
      : `id:${item.id}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, item);
      return;
    }
    const prevTime = Date.parse(prev.updatedAt || prev.createdAt) || 0;
    const nextTime = Date.parse(item.updatedAt || item.createdAt) || 0;
    byKey.set(key, {
      ...prev,
      ...item,
      fileName: item.fileName || prev.fileName,
      fileId: item.fileId || prev.fileId,
      sectionId: item.sectionId || prev.sectionId,
      sectionIds: Array.from(
        new Set([...(prev.sectionIds || []), ...(item.sectionIds || [])]),
      ),
      targetSectionLabel:
        item.targetSectionLabel || prev.targetSectionLabel,
      createdAt:
        prevTime && nextTime
          ? new Date(Math.min(prevTime, nextTime)).toISOString()
          : item.createdAt || prev.createdAt,
      updatedAt:
        prevTime >= nextTime
          ? prev.updatedAt || item.updatedAt
          : item.updatedAt || prev.updatedAt,
      status:
        item.status === 'done' || prev.status === 'done'
          ? 'done'
          : item.status || prev.status,
    });
  };

  for (const item of args.history) put(item);

  for (const job of args.jobs) {
    put({
      id: job.id,
      fileName: job.fileName || job.file_name || 'Uploaded document',
      status: job.status === 'error' ? 'error' : job.status,
      progress: job.progress,
      createdAt: job.createdAt
        ? new Date(job.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: job.updatedAt || new Date().toISOString(),
      fileId: job.file_id,
      sectionId: job.targetSectionId,
      sectionIds: job.targetSectionId ? [String(job.targetSectionId)] : [],
      targetSectionLabel: job.targetSectionLabel,
      error: job.error,
      source: 'overview',
    });
  }

  for (const doc of args.serverDocs) {
    const fileId = String(doc.file_id || '').trim();
    if (!fileId) continue;
    const section =
      doc.section != null && String(doc.section).trim()
        ? String(doc.section).trim()
        : undefined;
    put({
      id: `server:${fileId}`,
      fileName:
        doc.original_filename || doc.name || 'Uploaded document',
      status: doc.status === 'ready' || !doc.status ? 'done' : String(doc.status),
      createdAt: doc.created_at || doc.updated_at || new Date().toISOString(),
      updatedAt: doc.updated_at || doc.created_at || new Date().toISOString(),
      fileId,
      sectionId: section,
      sectionIds: section ? [section] : [],
      targetSectionLabel: section ? getAiSectionLabel(section) : undefined,
      source: 'overview',
    });
  }

  return Array.from(byKey.values()).sort((a, b) => {
    const aTime = Date.parse(a.updatedAt || a.createdAt) || 0;
    const bTime = Date.parse(b.updatedAt || b.createdAt) || 0;
    return bTime - aTime;
  });
}

type InboxRow = {
  id: string;
  fileId?: string;
  fileName: string;
  sectionId: string;
  sectionLabel: string;
  subsectionLabel: string;
  createdAt: number;
  status: 'ready' | 'processing' | 'queued';
  progress?: number;
};

const BANNER_DISMISS_KEY = 'orderly_ai_review_inbox_banner_dismissed';

function shortSectionLabel(sectionId: string) {
  const full = getAiSectionLabel(sectionId);
  // Keep the line readable on mobile ("File to: Insurance • 7A").
  if (full.length <= 22) return full;
  const first = full.split(/[&•|,]/)[0]?.trim();
  return first && first.length <= 22 ? first : `${full.slice(0, 20)}…`;
}

function subsectionDisplay(sectionId: string, subsection?: string | null) {
  const code =
    subsection ||
    AI_SECTION_BY_ID[sectionId]?.defaultSubsection ||
    '';
  if (!code) return 'Details';
  // Prefer human labels for common codes.
  const map: Record<string, string> = {
    vital_info: 'Vital info',
    '5A': 'Current vehicles',
    '6A': 'Residence',
    '7A': 'Policies',
    '8A': 'Memberships',
    '9A': 'Giving',
    '10A': 'Education',
    '11A': 'Service',
    '12A': 'Bank accounts',
    '12B': 'Online banking',
    '13A': 'Accounts',
    '14A': 'Investments',
    '15A': 'Health',
    '15B': 'Providers',
    '16A': 'Cards',
    '16B': 'Debt',
    '17A': 'Family',
    '18A': 'Employment',
    '19A': 'Valuables',
    '19B': 'Property',
    '20A': 'Legal docs',
    '20B': 'Records',
    '20C': 'Other docs',
    '21A': 'Final wishes',
  };
  return map[code] || code;
}

function buildInboxRows(args: {
  patches: StashedAiPatch[];
  pending: {
    file_id: string;
    file_name?: string;
    targetSectionId: string;
    targetSubsection?: string;
    createdAt: number;
  }[];
  jobs: {
    id: string;
    file_id?: string;
    fileName: string;
    status: string;
    progress: number;
    targetSectionId?: string;
    targetSectionLabel?: string;
    targetSubsection?: string;
    createdAt: string;
    updatedAt: string;
  }[];
}): InboxRow[] {
  const rows: InboxRow[] = [];
  const seen = new Set<string>();

  const push = (row: InboxRow) => {
    const key = `${row.fileId || row.fileName}::${row.sectionId}`;
    if (seen.has(key)) return;
    if (isAiSectionReviewed(row.sectionId, row.fileId)) return;
    seen.add(key);
    rows.push(row);
  };

  for (const patch of args.patches) {
    push({
      id: `patch:${patch.file_id}:${patch.section_id}`,
      fileId: patch.file_id,
      fileName: patch.file_name || 'Uploaded document',
      sectionId: patch.section_id,
      sectionLabel: shortSectionLabel(patch.section_id),
      subsectionLabel: subsectionDisplay(patch.section_id, patch.subsection),
      createdAt: patch.createdAt,
      status: 'ready',
    });
  }

  for (const pending of args.pending) {
    push({
      id: `pending:${pending.file_id}:${pending.targetSectionId}`,
      fileId: pending.file_id,
      fileName: pending.file_name || 'Uploaded document',
      sectionId: pending.targetSectionId,
      sectionLabel: shortSectionLabel(pending.targetSectionId),
      subsectionLabel: subsectionDisplay(
        pending.targetSectionId,
        pending.targetSubsection,
      ),
      createdAt: pending.createdAt,
      status: 'ready',
    });
  }

  for (const job of args.jobs) {
    if (job.status === 'done' || job.status === 'error') continue;
    const sectionId = job.targetSectionId || 'overview';
    push({
      id: `job:${job.id}`,
      fileId: job.file_id,
      fileName: job.fileName,
      sectionId,
      sectionLabel:
        job.targetSectionLabel ||
        (sectionId === 'overview'
          ? 'Matching…'
          : shortSectionLabel(sectionId)),
      subsectionLabel:
        sectionId === 'overview'
          ? 'AI reading'
          : subsectionDisplay(sectionId, job.targetSubsection),
      createdAt: Date.parse(job.updatedAt || job.createdAt) || Date.now(),
      status: job.status === 'queued' ? 'queued' : 'processing',
      progress: job.progress,
    });
  }

  return rows.sort((a, b) => b.createdAt - a.createdAt);
}

function groupByDay(rows: InboxRow[]) {
  const groups: { label: string; items: InboxRow[] }[] = [];
  const byLabel = new Map<string, InboxRow[]>();

  for (const row of rows) {
    const label = dayGroupLabel(row.createdAt);
    const list = byLabel.get(label) || [];
    list.push(row);
    byLabel.set(label, list);
  }

  for (const [label, items] of byLabel) {
    groups.push({ label, items });
  }
  return groups;
}

function dayGroupLabel(ts: number) {
  const date = new Date(ts);
  const today = new Date();
  const startToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  const startYesterday = startToday - 86400000;
  if (ts >= startToday) return 'Today';
  if (ts >= startYesterday) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Competitor-style review inbox: uploaded files land here for review/approval
 * (Accept saves to vault). Reminders tab surfaces passport / license / policy
 * expiry dates extracted into the vault.
 */
export function AiReviewInboxPanel({
  onNavigateToSection,
  ownerName,
  ownerEmail,
  reminders = [],
  className,
}: {
  onNavigateToSection?: (sectionId: string) => void;
  ownerName?: string | null;
  ownerEmail?: string | null;
  /** Expiry / renewal reminders (passport, license, policies, etc.). */
  reminders?: OverviewExpiryAlert[];
  className?: string;
}) {
  const routing = useOptionalAiDocumentRouting();
  const batch = useDashboardAiBatch();
  const [tab, setTab] = useState<InboxTab>('inbox');
  const [stashTick, setStashTick] = useState(0);
  const [reviewTick, setReviewTick] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [reviewDoc, setReviewDoc] = useState<AiInboxReviewDocument | null>(
    null,
  );
  const [fileSearch, setFileSearch] = useState('');
  const [serverDocs, setServerDocs] = useState<OwnerAiDocument[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<{
    fileId: string;
    fileName: string;
  } | null>(null);

  useEffect(() => {
    try {
      setBannerDismissed(
        sessionStorage.getItem(BANNER_DISMISS_KEY) === '1',
      );
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const onStash = () => setStashTick(value => value + 1);
    const onReviewed = () => setReviewTick(value => value + 1);
    const onHistory = () => setStashTick(value => value + 1);
    const onOpenTab = (event: Event) => {
      const detail = (event as CustomEvent<{ tab?: InboxTab }>).detail;
      if (
        detail?.tab === 'inbox' ||
        detail?.tab === 'files' ||
        detail?.tab === 'reminders'
      ) {
        setTab(detail.tab);
      }
    };
    window.addEventListener('orderly-ai-patch-stashed', onStash);
    window.addEventListener('orderly-ai-section-reviewed', onReviewed);
    window.addEventListener('orderly-ai-section-persisted', onStash);
    window.addEventListener('orderly-ai-upload-history', onHistory);
    window.addEventListener(OPEN_INBOX_TAB_EVENT, onOpenTab);
    return () => {
      window.removeEventListener('orderly-ai-patch-stashed', onStash);
      window.removeEventListener('orderly-ai-section-reviewed', onReviewed);
      window.removeEventListener('orderly-ai-section-persisted', onStash);
      window.removeEventListener('orderly-ai-upload-history', onHistory);
      window.removeEventListener(OPEN_INBOX_TAB_EVENT, onOpenTab);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadServerDocs = async () => {
      setFilesLoading(true);
      try {
        const docs = await listOwnerAiDocuments();
        if (!cancelled) setServerDocs(docs);
      } finally {
        if (!cancelled) setFilesLoading(false);
      }
    };
    void loadServerDocs();
    return () => {
      cancelled = true;
    };
  }, [stashTick, batch.jobs.length]);

  const patches = useMemo(
    () => listDashboardAiPatches(),
    [stashTick, reviewTick],
  );

  const inboxRows = useMemo(
    () =>
      buildInboxRows({
        patches,
        pending: routing?.pendingUploads || [],
        jobs: batch.jobs,
      }),
    [patches, routing?.pendingUploads, batch.jobs, reviewTick],
  );

  const readyCount = inboxRows.filter(row => row.status === 'ready').length;
  const processingCount = inboxRows.filter(
    row => row.status === 'processing' || row.status === 'queued',
  ).length;

  const historyFiles = useMemo(() => {
    void stashTick;
    return mergeInboxFiles({
      history: listAiUploadHistory(),
      jobs: batch.jobs,
      serverDocs,
    });
  }, [stashTick, batch.jobs, serverDocs]);

  const filteredFiles = useMemo(() => {
    const query = fileSearch.trim().toLowerCase();
    if (!query) return historyFiles;
    return historyFiles.filter(item => {
      const hay = [
        item.fileName,
        item.targetSectionLabel,
        fileCategoryLine(item),
        item.sectionId,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(query);
    });
  }, [historyFiles, fileSearch]);

  const dismissBanner = () => {
    setBannerDismissed(true);
    try {
      sessionStorage.setItem(BANNER_DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  };

  const openReviewDetail = useCallback((row: InboxRow) => {
    if (row.status !== 'ready' || row.sectionId === 'overview') return;

    const patch = peekDashboardAiPatch(row.sectionId);
    const pending =
      routing?.getPendingUploadsForSection(row.sectionId)?.[0] ||
      routing?.pendingUploads?.find(
        item =>
          item.file_id === row.fileId &&
          item.targetSectionId === row.sectionId,
      );

    const factsFromPending = (pending?.extractedFields || []).map(field => ({
      label: field.field_label || field.field_path || 'Field',
      value: String(field.value ?? ''),
      field_key: field.field_path,
    }));

    const factsFromPatch =
      patch?.detectedFields && patch.detectedFields.length
        ? patch.detectedFields
        : flattenDetectedFactsFromPatch(
            unwrapAiAutofillPatch(patch?.result) || patch?.patch || {},
            patch?.section_key || AI_SECTION_BY_ID[row.sectionId]?.key,
          );

    const facts = (factsFromPatch.length ? factsFromPatch : factsFromPending).filter(
      fact => String(fact.label || '').trim(),
    );

    setReviewDoc({
      id: row.id,
      fileId: row.fileId || patch?.file_id || pending?.file_id,
      fileName:
        row.fileName ||
        patch?.file_name ||
        pending?.file_name ||
        'Uploaded document',
      sectionId: row.sectionId,
      sectionLabel: row.sectionLabel,
      subsectionLabel: row.subsectionLabel,
      summary: buildAiUploadReviewSummary({
        summary:
          patch?.document_summary ||
          pending?.documentSummary ||
          undefined,
        fileName:
          row.fileName ||
          patch?.file_name ||
          pending?.file_name ||
          'Uploaded document',
        sectionLabel: row.sectionLabel,
        facts,
      }),
      facts,
    });
  }, [routing]);

  const handleReview = useCallback(
    (row: InboxRow) => {
      openReviewDetail(row);
    },
    [openReviewDetail],
  );

  const handleApprove = useCallback(
    async (row: InboxRow, editedFacts?: DetectedAiFact[]) => {
      if (row.status !== 'ready' || !row.sectionId || row.sectionId === 'overview') {
        return;
      }
      setApprovingId(row.id);
      try {
        const stash = peekDashboardAiPatch(row.sectionId);
        if (stash) {
          const nextStash = editedFacts?.length
            ? applyEditedFactsToStash(stash, editedFacts)
            : stash;

          await ensureFreshSession();
          const persistResult = await persistAiResultToSectionBackground({
            sectionId: row.sectionId,
            sectionKey:
              nextStash.section_key ||
              AI_SECTION_BY_ID[row.sectionId]?.key ||
              row.sectionId,
            result: nextStash.result,
            subsection: nextStash.subsection,
          });

          if (!persistResult.ok) {
            toast.error(
              persistResult.error ||
                'Could not save these fields. Please try again.',
            );
            return;
          }

          markAiSectionFilled(row.sectionId);
          markAiAutofillDoneForSection({
            sectionId: row.sectionId,
            fileId: row.fileId || nextStash.file_id,
            fileName: row.fileName,
          });

          // Refresh stash as accepted (cleared below).
          stashDashboardAiPatch({
            ...nextStash,
            pending_accept: false,
            detectedFields: editedFacts || nextStash.detectedFields,
          });
        }

        markAiSectionReviewed({
          sectionId: row.sectionId,
          fileId: row.fileId,
        });
        takeDashboardAiPatch(row.sectionId);
        routing?.clearPendingForSection(row.sectionId);
        if (row.fileId) {
          routing?.clearAllPendingForFile(row.fileId);
        }
        setReviewTick(value => value + 1);
        toast.success('Saved to your vault');
      } finally {
        setApprovingId(null);
      }
    },
    [routing],
  );

  const handleDeleteReviewDoc = useCallback(async () => {
    if (!reviewDoc) return;
    const fileId = reviewDoc.fileId;
    markAiSectionReviewed({
      sectionId: reviewDoc.sectionId,
      fileId,
    });
    takeDashboardAiPatch(reviewDoc.sectionId);
    routing?.clearPendingForSection(reviewDoc.sectionId);
    if (fileId) {
      routing?.clearAllPendingForFile(fileId);
      clearAiUploadMeta(fileId);
      removeAiUploadHistoryItem({ fileId });
      try {
        await deleteAIDocument(fileId);
      } catch {
        // History/local clear still helps even if server delete fails.
      }
    }
    setReviewTick(value => value + 1);
    setReviewDoc(null);
    toast.success('Upload removed');
  }, [reviewDoc, routing]);

  const showEmptyInbox = inboxRows.length === 0;
  const reminderCount = reminders.length;

  return (
    <section
      id="ai-review-inbox"
      data-ai-review-inbox
      className={cn(
        'overflow-hidden rounded-2xl border border-[#213D59]/12 bg-white shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e7eef7] text-[#213D59]">
            <Inbox className="h-4.5 w-4.5 h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-[#213D59]">
              Review inbox
            </h3>
            <p className="truncate text-[12px] text-[#5a6b80]">
            Confirm AI filled the right place — edit, then Accept to save
          </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pt-3 sm:px-5">
        {(
          [
            { id: 'inbox' as const, label: 'Inbox', count: readyCount },
            { id: 'files' as const, label: 'Files', count: historyFiles.length },
            {
              id: 'reminders' as const,
              label: 'Reminders',
              count: reminderCount,
            },
          ] as const
        ).map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition',
              tab === item.id
                ? 'bg-[#213D59] text-white shadow-sm'
                : 'bg-slate-100 text-[#5a6b80] hover:bg-slate-200/80',
            )}
          >
            {item.label}
            {item.count > 0 ? (
              <span
                className={cn(
                  'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold',
                  tab === item.id
                    ? 'bg-white/20 text-white'
                    : 'bg-[#2B5A8C] text-white',
                )}
              >
                {item.count > 99 ? '99+' : item.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === 'inbox' ? (
        <div className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          {!bannerDismissed && readyCount > 0 ? (
            <div className="mb-3 flex items-start gap-3 rounded-2xl bg-[#2B5A8C] px-3.5 py-3 text-white sm:px-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#213D59]/90">
                <Paperclip className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold tracking-tight">
                  New files to review
                </p>
                <p className="text-[12.5px] text-white/85">
                  {readyCount === 1
                    ? '1 file is ready — check the preview and fields, edit if needed, then Accept to save.'
                    : `${readyCount} files are ready — check each preview and fields, edit if needed, then Accept to save.`}
                  {processingCount > 0
                    ? ` ${processingCount} still processing.`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={dismissBanner}
                className="rounded-full p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          {showEmptyInbox ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center">
              <Inbox className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-[#213D59]">
                Inbox is clear
              </p>
              <p className="mx-auto mt-1 max-w-[28ch] text-[12.5px] leading-relaxed text-[#5a6b80]">
                Upload a document above. When AI finishes reading it, it will
                show up here for your review and approval.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupByDay(inboxRows).map(group => (
                <div key={group.label}>
                  <p className="mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#6b7785]">
                    {group.label}
                  </p>
                  <ul className="space-y-2">
                    {group.items.map(row => (
                      <li
                        key={row.id}
                        className="flex gap-3 rounded-2xl border border-slate-200/90 bg-[#f7f8fa] p-2.5 sm:p-3"
                      >
                        <button
                          type="button"
                          onClick={() => handleReview(row)}
                          className="w-[4.25rem] shrink-0 overflow-hidden rounded-xl sm:w-[5rem]"
                          title={row.fileName}
                        >
                          <AiUploadHistoryThumb
                            fileId={row.fileId}
                            fileName={row.fileName}
                            className="!rounded-xl"
                          />
                        </button>

                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleReview(row)}
                            className="w-full text-left"
                          >
                            <p className="truncate text-[13.5px] font-semibold text-[#1a2b3d] sm:text-[14px]">
                              {row.fileName}
                            </p>
                            <p className="mt-0.5 truncate text-[12px] text-[#5a6b80]">
                              File to: {row.sectionLabel}
                              {row.subsectionLabel
                                ? ` · ${row.subsectionLabel}`
                                : ''}
                            </p>
                          </button>

                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {row.status === 'ready' ? (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-8 rounded-lg bg-[#213D59] px-3 text-[12px] font-semibold text-white hover:bg-[#1a3149]"
                                  onClick={() => handleReview(row)}
                                >
                                  Review
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={approvingId === row.id}
                                  className="h-8 rounded-lg border-[#213D59]/20 px-3 text-[12px] font-semibold text-[#213D59]"
                                  onClick={() => void handleApprove(row)}
                                >
                                  {approvingId === row.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="mr-1 h-3.5 w-3.5" />
                                      Accept
                                    </>
                                  )}
                                </Button>
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-800 ring-1 ring-inset ring-sky-100">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {row.status === 'queued'
                                  ? 'In queue'
                                  : `Processing${typeof row.progress === 'number' ? ` · ${row.progress}%` : ''}`}
                              </span>
                            )}
                            <span className="text-[11px] text-[#8a97a8]">
                              {formatUploadRelativeShort(
                                new Date(row.createdAt).toISOString(),
                              ) || 'Just now'}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'files' ? (
        <div className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a97a8]" />
            <input
              type="search"
              value={fileSearch}
              onChange={event => setFileSearch(event.target.value)}
              placeholder="Search for files"
              className="h-11 w-full rounded-full border border-slate-200 bg-[#f7f8fa] pl-10 pr-4 text-[13.5px] text-[#1a2b3d] outline-none ring-[#213D59]/20 placeholder:text-[#8a97a8] focus:border-[#213D59]/35 focus:bg-white focus:ring-2"
            />
          </div>

          {filesLoading && historyFiles.length === 0 ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-[13px] text-[#5a6b80]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading uploads…
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-[#213D59]">
                {fileSearch.trim() ? 'No matching files' : 'No uploads yet'}
              </p>
              <p className="mt-1 text-[12.5px] text-[#5a6b80]">
                {fileSearch.trim()
                  ? 'Try a different name or category.'
                  : 'Every document you upload will appear here.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3">
              {filteredFiles.map((item: AiUploadHistoryItem) => {
                const when =
                  formatUploadRelativeShort(
                    item.updatedAt || item.createdAt,
                  ) || 'Just now';
                const category = fileCategoryLine(item);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!item.fileId) {
                        toast.message('Preview is not available yet for this file.');
                        return;
                      }
                      setPreviewFile({
                        fileId: item.fileId,
                        fileName: item.fileName,
                      });
                    }}
                    className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-[#f7f8fa] text-left transition hover:border-[#213D59]/25 hover:bg-white"
                  >
                    <AiUploadHistoryThumb
                      fileId={item.fileId}
                      fileName={item.fileName}
                      className="!rounded-none !rounded-t-2xl ring-0"
                    />
                    <div className="space-y-0.5 px-2.5 py-2 sm:px-3">
                      <p className="truncate text-[11px] font-medium text-[#8a97a8]">
                        {when}
                      </p>
                      <p className="truncate text-[12.5px] font-semibold text-[#1a2b3d]">
                        {item.fileName}
                      </p>
                      <p className="truncate text-[11px] text-[#5a6b80]">
                        {category}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'reminders' ? (
        <div className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          {reminderCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center">
              <Bell className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-[#213D59]">
                No reminders found
              </p>
              <p className="mx-auto mt-1 max-w-[36ch] text-[12.5px] leading-relaxed text-[#5a6b80]">
                As you upload documents, AI extracts key dates — like passport
                or driver&apos;s license expiry — and creates reminders. You can
                also add expiry dates on any section page.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {reminders.map(alert => {
                const tones = reminderToneClasses(alert.tone);
                return (
                  <li key={alert.id}>
                    <button
                      type="button"
                      onClick={() => onNavigateToSection?.(alert.sectionId)}
                      className="flex w-full items-start gap-3 rounded-2xl border border-slate-200/90 bg-[#f7f8fa] p-3 text-left transition hover:border-[#213D59]/25 hover:bg-white"
                    >
                      <div
                        className={cn(
                          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                          tones.icon,
                        )}
                      >
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[13.5px] font-semibold text-[#1a2b3d]">
                            {alert.label}
                          </p>
                          <span
                            className={cn(
                              'inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset',
                              tones.badge,
                            )}
                          >
                            {formatReminderDue(alert.daysUntil)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12.5px] leading-snug text-[#5a6b80]">
                          {alert.text}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-[#8a97a8]">
                          {getAiSectionLabel(alert.sectionId)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      <AiInboxDocumentReviewDialog
        open={Boolean(reviewDoc)}
        onOpenChange={open => {
          if (!open) setReviewDoc(null);
        }}
        document={reviewDoc}
        ownerName={ownerName}
        ownerEmail={ownerEmail}
        onAccept={async editedFacts => {
          if (!reviewDoc) return;
          await handleApprove(
            {
              id: reviewDoc.id,
              fileId: reviewDoc.fileId,
              fileName: reviewDoc.fileName,
              sectionId: reviewDoc.sectionId,
              sectionLabel: reviewDoc.sectionLabel,
              subsectionLabel: reviewDoc.subsectionLabel,
              createdAt: Date.now(),
              status: 'ready',
            },
            editedFacts,
          );
        }}
        onDelete={() => handleDeleteReviewDoc()}
        onOpenSection={() => {
          if (!reviewDoc) return;
          const pending =
            routing?.getPendingUploadsForSection(reviewDoc.sectionId)?.[0];
          if (pending && routing) {
            routing.navigateToPendingSection(pending, 'review');
            return;
          }
          onNavigateToSection?.(reviewDoc.sectionId);
        }}
      />

      <AiDocumentPreviewDialog
        open={Boolean(previewFile)}
        onOpenChange={open => {
          if (!open) setPreviewFile(null);
        }}
        fileId={previewFile?.fileId}
        fileName={previewFile?.fileName}
      />
    </section>
  );
}
