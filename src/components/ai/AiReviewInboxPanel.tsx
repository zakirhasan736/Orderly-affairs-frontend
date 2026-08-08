'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Check,
  FileText,
  Loader2,
  Mail,
  MailOpen,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import { cn } from '@common/ui/utils';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import { useDashboardAiBatch } from '@/contexts/DashboardAiBatchContext';
import { AiUploadHistoryThumb } from '@/components/ai/AiUploadHistoryThumb';
import { AiDocumentPreviewDialog } from '@/components/ai/AiDocumentPreviewDialog';
import {
  listDashboardAiPatches,
  peekDashboardAiPatch,
  takeDashboardAiPatch,
  type DetectedAiFact,
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
  flushQueuedAiAccepts,
  queueAiAccept,
} from '@/utils/aiQueuedAccept';
import { gateUploadedDocumentPerson } from '@/utils/aiDocumentPersonGate';
import { isIdentityDocumentCandidate } from '@/utils/aiIdentityDocument';
import { isHealthInsuranceCardCandidate } from '@/utils/aiInsuranceDocument';
import {
  formatUploadRelativeShort,
  hydrateAiUploadHistoryFromServer,
  listAiUploadHistory,
  removeAiUploadHistoryItem,
  collapseDuplicates,
  type AiUploadHistoryItem,
} from '@/utils/aiUploadHistory';
import { toast } from 'sonner';
import {
  AiInboxDocumentReviewDialog,
  type AiInboxReviewDocument,
} from '@/components/ai/AiInboxDocumentReviewDialog';
import {
  deleteAIDocument,
  type OwnerAiDocument,
} from '@/services/aiDocumentUpload';
import { useListOwnerAiDocumentsQuery } from '@/services/aiDocumentsApi';
import { clearAiUploadMeta } from '@/utils/aiDocumentUploadUi';
import { buildAiUploadReviewSummary } from '@/utils/aiUploadReviewSummary';
import { applyEditedFactsToStash } from '@/utils/aiReviewAcceptSave';
import {
  persistAllPendingStashesForSection,
  persistPartnerStashesForFiles,
  persistAiResultToSectionBackground,
} from '@/services/aiBackgroundSectionPersist';
import { ensureFreshSession } from '@/libs/secureFetch';
import { flattenDetectedFactsFromPatch } from '@/utils/aiSemanticFieldMatch';
import { unwrapAiAutofillPatch } from '@/utils/aiPatchNormalizer';
import type { OverviewExpiryAlert } from '@/utils/overviewExpiryAlerts';
import { OVERVIEW_BROWSE_CATEGORIES } from '@/utils/overviewBrowseCategories';
import type { DashboardNotice } from '@/utils/dashboardNotifications';
import {
  dismissNotice,
  filterVisibleNotices,
  isNoticeRead,
  markAllNoticesRead,
  markNoticeRead,
  markNoticeUnread,
} from '@/utils/dashboardNotifications';
import {
  dismissFile,
  dismissReminder,
  fileAlertKey,
  filterVisibleFiles,
  filterVisibleReminders,
  isAiReviewRead,
  isFileRead,
  isReminderRead,
  markAiReviewRead,
  markAiReviewUnread,
  markAllAiReviewsRead,
  markAllFilesRead,
  markAllRemindersRead,
  markFileRead,
  markFileUnread,
  markReminderRead,
  markReminderUnread,
} from '@/utils/vaultAlertState';
import {
  normalizeVaultActivityTab,
  OPEN_VAULT_ACTIVITY_TAB_EVENT,
  type VaultActivityTab,
  type VaultActivityTabInput,
} from '@/utils/vaultActivityTabs';

function formatReminderDue(daysUntil: number): string {
  if (daysUntil < 0) {
    const n = Math.abs(daysUntil);
    return n === 1 ? '1 day overdue' : `${n} days overdue`;
  }
  if (daysUntil === 0) return 'Due today';
  if (daysUntil === 1) return 'Due tomorrow';
  return `Due in ${daysUntil} days`;
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
  if (
    category &&
    section &&
    !section.toLowerCase().includes(category.toLowerCase())
  ) {
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
    const key = item.fileId ? `file:${item.fileId}` : `id:${item.id}`;
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
      mimeType: item.mimeType || prev.mimeType,
      sectionId: item.sectionId || prev.sectionId,
      sectionIds: Array.from(
        new Set([...(prev.sectionIds || []), ...(item.sectionIds || [])]),
      ),
      targetSectionLabel: item.targetSectionLabel || prev.targetSectionLabel,
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
      fileName: doc.original_filename || doc.name || 'Uploaded document',
      status:
        doc.status === 'ready' || !doc.status ? 'done' : String(doc.status),
      createdAt: doc.created_at || doc.updated_at || new Date().toISOString(),
      updatedAt: doc.updated_at || doc.created_at || new Date().toISOString(),
      fileId,
      mimeType: doc.mime_type || undefined,
      contentHash: doc.content_hash || undefined,
      sectionId: section,
      sectionIds: section ? [section] : [],
      targetSectionLabel: section ? getAiSectionLabel(section) : undefined,
      source: 'overview',
    });
  }

  return collapseDuplicates(Array.from(byKey.values()))
    .filter(item => Boolean(String(item.fileId || '').trim()))
    .sort((a, b) => {
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

function shortSectionLabel(sectionId: string) {
  const full = getAiSectionLabel(sectionId);
  if (full.length <= 22) return full;
  const first = full.split(/[&•|,]/)[0]?.trim();
  return first && first.length <= 22 ? first : `${full.slice(0, 20)}…`;
}

function subsectionDisplay(sectionId: string, subsection?: string | null) {
  const code =
    subsection || AI_SECTION_BY_ID[sectionId]?.defaultSubsection || '';
  if (!code) return 'Details';
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
        (sectionId === 'overview' ? 'Matching…' : shortSectionLabel(sectionId)),
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

function AlertActions({
  isRead,
  onMarkRead,
  onMarkUnread,
  onDelete,
  deleteLabel = 'Remove',
}: {
  isRead: boolean;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onDelete: () => void;
  deleteLabel?: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {isRead ? (
        <button
          type="button"
          title="Mark unread"
          aria-label="Mark unread"
          onClick={event => {
            event.stopPropagation();
            onMarkUnread();
          }}
          className="rounded-md p-1.5 text-[#8a97a8] transition hover:bg-[#213D59]/8 hover:text-[#213D59]"
        >
          <Mail className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button
          type="button"
          title="Mark read"
          aria-label="Mark read"
          onClick={event => {
            event.stopPropagation();
            onMarkRead();
          }}
          className="rounded-md p-1.5 text-[#8a97a8] transition hover:bg-[#213D59]/8 hover:text-[#213D59]"
        >
          <MailOpen className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        type="button"
        title={deleteLabel}
        aria-label={deleteLabel}
        onClick={event => {
          event.stopPropagation();
          onDelete();
        }}
        className="rounded-md p-1.5 text-[#8a97a8] transition hover:bg-rose-50 hover:text-rose-700"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/**
 * Vault activity center — alerts to review, uploaded docs, and due dates.
 * Distinct from generic Inbox / Files / Reminders competitor layouts.
 */
export function AiReviewInboxPanel({
  onNavigateToSection,
  onOpenNotificationSettings,
  ownerName,
  ownerEmail,
  reminders = [],
  notices = [],
  className,
}: {
  onNavigateToSection?: (sectionId: string) => void;
  onOpenNotificationSettings?: () => void;
  ownerName?: string | null;
  ownerEmail?: string | null;
  reminders?: OverviewExpiryAlert[];
  notices?: DashboardNotice[];
  className?: string;
}) {
  const routing = useOptionalAiDocumentRouting();
  const batch = useDashboardAiBatch();
  const [tab, setTab] = useState<VaultActivityTab>('alerts');
  const [stashTick, setStashTick] = useState(0);
  const [reviewTick, setReviewTick] = useState(0);
  const [alertTick, setAlertTick] = useState(0);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingFileKey, setDeletingFileKey] = useState<string | null>(null);
  const [reviewDoc, setReviewDoc] = useState<AiInboxReviewDocument | null>(
    null,
  );
  const [fileSearch, setFileSearch] = useState('');
  const [previewFile, setPreviewFile] = useState<{
    fileId: string;
    fileName: string;
    mimeType?: string;
  } | null>(null);

  // RTK cache — reopen vault activity / switch tabs won't re-hit the API
  // unless data is older than 60s (uploads/deletes invalidate tags).
  const {
    data: serverDocs = [],
    isLoading: filesLoading,
  } = useListOwnerAiDocumentsQuery(undefined, {
    pollingInterval: 45_000,
    refetchOnMountOrArgChange: 60,
    refetchOnFocus: false,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (filesLoading && serverDocs.length === 0) return;
    hydrateAiUploadHistoryFromServer(serverDocs);
  }, [serverDocs, filesLoading]);

  useEffect(() => {
    const onStash = () => {
      setStashTick(value => value + 1);
      void flushQueuedAiAccepts().then(result => {
        if (result.flushed <= 0) return;
        result.clearedFiles.forEach(fileId => {
          routing?.clearAllPendingForFile(fileId);
        });
        result.sectionIds.forEach(sectionId => {
          routing?.clearPendingForSection(sectionId);
        });
        setReviewTick(value => value + 1);
        toast.success(
          result.flushed > 1
            ? `Saved ${result.flushed} documents to your vault`
            : 'Saved to your vault',
        );
      });
    };
    const onReviewed = () => setReviewTick(value => value + 1);
    const onHistory = () => setStashTick(value => value + 1);
    const onAlerts = () => setAlertTick(value => value + 1);
    const onOpenTab = (event: Event) => {
      const detail = (event as CustomEvent<{ tab?: VaultActivityTabInput }>)
        .detail;
      if (detail?.tab) setTab(normalizeVaultActivityTab(detail.tab));
    };
    window.addEventListener('orderly-ai-patch-stashed', onStash);
    window.addEventListener('orderly-ai-section-reviewed', onReviewed);
    window.addEventListener('orderly-ai-section-persisted', onStash);
    window.addEventListener('orderly-ai-upload-history', onHistory);
    window.addEventListener('orderly-notices-read-changed', onAlerts);
    window.addEventListener('orderly-vault-alerts-changed', onAlerts);
    window.addEventListener(OPEN_VAULT_ACTIVITY_TAB_EVENT, onOpenTab);
    // Catch accepts queued before this panel mounted.
    void flushQueuedAiAccepts();
    return () => {
      window.removeEventListener('orderly-ai-patch-stashed', onStash);
      window.removeEventListener('orderly-ai-section-reviewed', onReviewed);
      window.removeEventListener('orderly-ai-section-persisted', onStash);
      window.removeEventListener('orderly-ai-upload-history', onHistory);
      window.removeEventListener('orderly-notices-read-changed', onAlerts);
      window.removeEventListener('orderly-vault-alerts-changed', onAlerts);
      window.removeEventListener(OPEN_VAULT_ACTIVITY_TAB_EVENT, onOpenTab);
    };
  }, [routing]);

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

  const visibleNotices = useMemo(() => {
    void alertTick;
    return filterVisibleNotices(notices, 50);
  }, [notices, alertTick]);

  const visibleReminders = useMemo(() => {
    void alertTick;
    return filterVisibleReminders(reminders);
  }, [reminders, alertTick]);

  const historyFiles = useMemo(() => {
    void stashTick;
    void alertTick;
    return filterVisibleFiles(
      mergeInboxFiles({
        history: listAiUploadHistory(),
        jobs: batch.jobs,
        serverDocs,
      }),
    );
  }, [stashTick, alertTick, batch.jobs, serverDocs]);

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

  const unreadNoticeCount = useMemo(() => {
    void alertTick;
    return visibleNotices.filter(n => !isNoticeRead(n.id)).length;
  }, [visibleNotices, alertTick]);

  const unreadReviewCount = useMemo(() => {
    void alertTick;
    return inboxRows.filter(
      row =>
        row.status === 'ready' && !isAiReviewRead(row.sectionId, row.fileId),
    ).length;
  }, [inboxRows, alertTick]);

  const unreadDocCount = useMemo(() => {
    void alertTick;
    return historyFiles.filter(item => !isFileRead(fileAlertKey(item))).length;
  }, [historyFiles, alertTick]);

  const unreadDueCount = useMemo(() => {
    void alertTick;
    return visibleReminders.filter(item => !isReminderRead(item.id)).length;
  }, [visibleReminders, alertTick]);

  const alertsBadge = unreadNoticeCount + unreadReviewCount;
  const showEmptyAlerts =
    inboxRows.length === 0 && visibleNotices.length === 0;

  const openReviewDetail = useCallback(
    (row: InboxRow) => {
      if (row.status !== 'ready' || row.sectionId === 'overview') return;
      markAiReviewRead(row.sectionId, row.fileId);

      const patch = peekDashboardAiPatch(row.sectionId, row.fileId);
      const pending =
        routing?.pendingUploads?.find(
          item =>
            item.file_id === row.fileId &&
            item.targetSectionId === row.sectionId,
        ) ||
        routing?.getPendingUploadsForSection(row.sectionId)?.[0];

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

      const facts = (
        factsFromPatch.length ? factsFromPatch : factsFromPending
      ).filter(fact => String(fact.label || '').trim());

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
            patch?.document_summary || pending?.documentSummary || undefined,
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
    },
    [routing],
  );

  const handleApprove = useCallback(
    async (row: InboxRow, editedFacts?: DetectedAiFact[]) => {
      if (!row.sectionId || row.sectionId === 'overview') {
        return;
      }
      setApprovingId(row.id);
      try {
        const stash = peekDashboardAiPatch(row.sectionId, row.fileId);
        const primary = stash
          ? editedFacts?.length
            ? applyEditedFactsToStash(stash, editedFacts)
            : stash
          : null;

        await ensureFreshSession();

        const { isE2eeUnlocked } = await import('@/libs/e2ee/unlock');
        const { fetchE2eeStatus } = await import('@/libs/e2ee/vaultApi');
        const e2eeStatus = await fetchE2eeStatus().catch(() => null);
        if (
          e2eeStatus?.enabled &&
          e2eeStatus?.configured &&
          !isE2eeUnlocked()
        ) {
          toast.error(
            'Vault is locked. Unlock encryption on the overview, then Accept again to save.',
          );
          return;
        }

        const sectionMeta = AI_SECTION_BY_ID[row.sectionId];
        const identitySource = primary?.result ?? null;
        if (
          identitySource &&
          !primary?.vault_persisted &&
          (isIdentityDocumentCandidate({
            sectionId: row.sectionId,
            sectionKey: sectionMeta?.key || primary?.section_key,
            documentSummary: primary?.document_summary,
            fileName: row.fileName || primary?.file_name,
            result: identitySource,
          }) ||
            isHealthInsuranceCardCandidate({
              sectionId: row.sectionId,
              sectionKey: sectionMeta?.key || primary?.section_key,
              documentSummary: primary?.document_summary,
              fileName: row.fileName || primary?.file_name,
              result: identitySource,
            }))
        ) {
          const gated = await gateUploadedDocumentPerson({
            sectionId: row.sectionId,
            sectionKey: sectionMeta?.key || primary?.section_key || '',
            subsection: primary?.subsection,
            sectionLabel: sectionMeta?.label || row.sectionLabel,
            result: identitySource,
            documentSummary: primary?.document_summary,
            fileName: row.fileName || primary?.file_name,
          });

          if (gated.skipped) {
            markAiSectionReviewed({
              sectionId: row.sectionId,
              fileId: row.fileId,
            });
            setReviewTick(value => value + 1);
            toast.message('Skipped this document fill');
            return;
          }

          if (gated.target.sectionId !== row.sectionId) {
            takeDashboardAiPatch(row.sectionId, row.fileId);
            const saved = await persistAiResultToSectionBackground({
              sectionId: gated.target.sectionId,
              sectionKey: gated.target.sectionKey,
              result: gated.target.result,
              subsection: gated.target.subsection,
            });
            if (!saved.ok) {
              toast.error(
                saved.error ||
                  `Could not save this document to ${gated.target.sectionLabel || 'the vault'}.`,
              );
              return;
            }
            routing?.clearPendingForSection(row.sectionId);
            routing?.clearPendingForSection(gated.target.sectionId);
            if (row.fileId) routing?.clearAllPendingForFile(row.fileId);
            markAiSectionReviewed({
              sectionId: row.sectionId,
              fileId: row.fileId,
            });
            markAiSectionReviewed({
              sectionId: gated.target.sectionId,
              fileId: row.fileId,
            });
            setReviewTick(value => value + 1);
            const toInsurance = gated.target.sectionId === '7';
            toast.success(
              `Saved to ${gated.target.sectionLabel || (toInsurance ? 'Insurance Policies' : 'Family & Relationships')}`,
              {
                description: toInsurance
                  ? gated.choice === 'spouse'
                    ? 'Tagged as Spouse/Partner on the health insurance policy.'
                    : gated.choice === 'dependent'
                      ? 'Tagged as Dependent on the health insurance policy.'
                      : 'Saved on your Insurance Policies card.'
                  : gated.choice === 'spouse'
                    ? 'Added under Spouse / partner in Family Members.'
                    : gated.choice === 'dependent'
                      ? 'Added under Dependents.'
                      : 'Added as a family member card.',
              },
            );
            return;
          }

          // Same section (e.g. health card stays on Insurance) — persist stamped result.
          if (gated.target.result && gated.choice) {
            takeDashboardAiPatch(row.sectionId, row.fileId);
            const saved = await persistAiResultToSectionBackground({
              sectionId: gated.target.sectionId,
              sectionKey: gated.target.sectionKey,
              result: gated.target.result,
              subsection: gated.target.subsection,
            });
            if (!saved.ok) {
              toast.error(
                saved.error || 'Could not save these fields. Please try again.',
              );
              return;
            }
            routing?.clearPendingForSection(gated.target.sectionId);
            if (row.fileId) routing?.clearAllPendingForFile(row.fileId);
            markAiSectionReviewed({
              sectionId: gated.target.sectionId,
              fileId: row.fileId,
            });
            setReviewTick(value => value + 1);
            toast.success('Saved to your vault', {
              description:
                gated.choice === 'self'
                  ? 'Tagged as your primary coverage.'
                  : `Tagged as ${gated.choice === 'spouse' ? 'Spouse/Partner' : gated.choice === 'dependent' ? 'Dependent' : 'Other'}.`,
            });
            return;
          }
        }

        // Accept one vehicle/insurance alert → save ALL pending docs for that
        // section (Toyota + Honda + Jeep), then partner extracts on those files.
        const clearedFiles = new Set<string>();
        const flush = await persistAllPendingStashesForSection({
          sectionId: row.sectionId,
          primary,
          onFileDone: fileId => {
            if (fileId) clearedFiles.add(fileId);
          },
        });

        if (flush.saved === 0 && flush.failed > 0) {
          toast.error(
            flush.error ||
              'Could not save these fields. Please try again.',
          );
          return;
        }

        if (flush.saved === 0) {
          // Extraction still running — queue Accept, remove from list, save later.
          queueAiAccept({
            sectionId: row.sectionId,
            fileId: row.fileId,
            fileName: row.fileName,
          });
          markAiSectionReviewed({
            sectionId: row.sectionId,
            fileId: row.fileId,
          });
          setReviewTick(value => value + 1);
          toast.success('Accepted — saving in the background', {
            description:
              'We will write this into your vault as soon as extraction finishes.',
          });
          void flushQueuedAiAccepts().then(result => {
            if (result.flushed > 0) {
              result.clearedFiles.forEach(fileId => {
                routing?.clearAllPendingForFile(fileId);
              });
              result.sectionIds.forEach(sectionId => {
                routing?.clearPendingForSection(sectionId);
              });
              setReviewTick(value => value + 1);
              toast.success(
                result.flushed > 1
                  ? `Saved ${result.flushed} documents to your vault`
                  : 'Saved to your vault',
              );
            }
          });
          return;
        }

        const partners = await persistPartnerStashesForFiles({
          fileIds: [...clearedFiles],
          excludeSectionId: row.sectionId,
          onFileDone: fileId => {
            if (fileId) clearedFiles.add(fileId);
          },
        });

        // Clear pending only for sections we actually wrote. Keep partner
        // pending badges if their stash was not ready yet.
        const savedSectionIds = new Set([
          ...(flush.sectionIds || []),
          ...(partners.sectionIds || []),
          row.sectionId,
        ]);
        clearedFiles.forEach(fileId => {
          const remainingPartners = listDashboardAiPatches().filter(
            p =>
              p.file_id === fileId &&
              p.section_id !== row.sectionId &&
              !savedSectionIds.has(p.section_id),
          );
          if (remainingPartners.length === 0) {
            routing?.clearAllPendingForFile(fileId);
          } else {
            routing?.clearPendingForSection(row.sectionId);
          }
        });
        if (!clearedFiles.size) {
          routing?.clearPendingForSection(row.sectionId);
        }

        markAiSectionReviewed({
          sectionId: row.sectionId,
          fileId: row.fileId,
        });
        setReviewTick(value => value + 1);

        const totalSaved = flush.saved + partners.saved;
        toast.success(
          totalSaved > 1
            ? `Saved ${totalSaved} documents to your vault`
            : 'Saved to your vault',
          {
            description:
              totalSaved > 1
                ? 'Separate cards were created for each distinct vehicle/policy. Matching data updates existing cards instead of duplicating.'
                : 'Open the section to finish any blanks — use Fill empty fields.',
          },
        );

        if (flush.failed > 0 || partners.failed > 0) {
          toast.error(
            flush.error ||
              partners.error ||
              'Some documents could not be saved. Check Vault Activity and Accept again.',
          );
        }
      } finally {
        setApprovingId(null);
      }
    },
    [routing],
  );

  const dismissAiReview = useCallback(
    (row: InboxRow) => {
      markAiSectionReviewed({
        sectionId: row.sectionId,
        fileId: row.fileId,
      });
      takeDashboardAiPatch(row.sectionId, row.fileId);
      if (row.fileId) {
        routing?.clearAllPendingForFile(row.fileId);
      } else {
        routing?.clearPendingForSection(row.sectionId);
      }
      setReviewTick(value => value + 1);
      toast.message('Alert removed');
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
    takeDashboardAiPatch(reviewDoc.sectionId, fileId);
    if (fileId) {
      routing?.clearAllPendingForFile(fileId);
      clearAiUploadMeta(fileId);
      try {
      await deleteAIDocument(fileId);
    } catch {
      // still clear local UI
    }
      removeAiUploadHistoryItem({ fileId });
    } else {
      routing?.clearPendingForSection(reviewDoc.sectionId);
    }
    setReviewTick(value => value + 1);
    setReviewDoc(null);
    toast.success('Document deleted');
  }, [reviewDoc, routing]);

  const handleDeleteFile = useCallback(async (item: AiUploadHistoryItem) => {
    const key = fileAlertKey(item);
    const fileId = item.fileId;
    if (
      !window.confirm(
        `Remove “${item.fileName}”? This deletes the file from Cloudinary and your vault.`,
      )
    ) {
      return;
    }
    setDeletingFileKey(key);
    try {
      dismissFile(key);
      if (fileId) {
        clearAiUploadMeta(fileId);
        const ok = await deleteAIDocument(fileId);
        if (!ok) throw new Error('delete failed');
        removeAiUploadHistoryItem({ fileId });
      } else {
        removeAiUploadHistoryItem({ id: item.id });
      }
      toast.success('Document deleted');
    } catch {
      toast.error('Could not delete document');
    } finally {
      setDeletingFileKey(null);
    }
  }, []);

  const markAllCurrentRead = useCallback(() => {
    if (tab === 'alerts') {
      markAllNoticesRead(visibleNotices.map(n => n.id));
      markAllAiReviewsRead(
        inboxRows.map(row => ({
          sectionId: row.sectionId,
          fileId: row.fileId,
        })),
      );
      toast.message('Alerts marked read');
      return;
    }
    if (tab === 'docs') {
      markAllFilesRead(historyFiles.map(fileAlertKey));
      toast.message('Documents marked read');
      return;
    }
    markAllRemindersRead(visibleReminders.map(r => r.id));
    toast.message('Due dates marked read');
  }, [tab, visibleNotices, inboxRows, historyFiles, visibleReminders]);

  const tabs: {
    id: VaultActivityTab;
    label: string;
    hint: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
    {
      id: 'alerts',
      label: 'To review',
      hint: 'Notices & AI fills',
      icon: <Sparkles className="h-4 w-4" />,
      count: alertsBadge,
    },
    {
      id: 'docs',
      label: 'Vault docs',
      hint: 'Uploaded files',
      icon: <FileText className="h-4 w-4" />,
      count: unreadDocCount,
    },
    {
      id: 'dues',
      label: 'Due dates',
      hint: 'Expiries & renewals',
      icon: <CalendarClock className="h-4 w-4" />,
      count: unreadDueCount,
    },
  ];

  return (
    <section
      id="ai-review-inbox"
      data-ai-review-inbox
      className={cn(
        'overflow-hidden rounded-xl border border-[#213D59]/15 bg-[#f4f6f8] shadow-sm',
        className,
      )}
    >
      <header className="border-b border-[#213D59]/12 bg-[#213D59] px-4 py-4 text-white sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Vault activity
            </p>
            <h3 className="mt-1 truncate text-[17px] font-semibold tracking-tight">
              What needs attention
            </h3>
            <p className="mt-0.5 text-[12px] text-white/70">
              Review AI fills, documents, and upcoming dates — mark read or
              clear what you&apos;re done with.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <button
              type="button"
              onClick={markAllCurrentRead}
              className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/15"
            >
              Mark all read
            </button>
            {onOpenNotificationSettings ? (
              <button
                type="button"
                onClick={onOpenNotificationSettings}
                className="text-[11px] font-medium text-white/70 underline-offset-2 transition hover:text-white hover:underline"
              >
                Notification settings
              </button>
            ) : null}
          </div>
        </div>

        <nav
          className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-white/15"
          aria-label="Activity areas"
        >
          {tabs.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'flex flex-col items-start gap-0.5 px-2.5 py-2.5 text-left transition sm:px-3',
                tab === item.id
                  ? 'bg-white text-[#213D59]'
                  : 'bg-[#213D59]/40 text-white/80 hover:bg-[#213D59]/25 hover:text-white',
              )}
            >
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold sm:text-[13px]">
                {item.icon}
                {item.label}
                {item.count > 0 ? (
                  <span
                    className={cn(
                      'inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded px-1 text-[10px] font-bold',
                      tab === item.id
                        ? 'bg-[#213D59] text-white'
                        : 'bg-white/20 text-white',
                    )}
                  >
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  'hidden text-[10px] sm:block',
                  tab === item.id ? 'text-[#5a6b80]' : 'text-white/50',
                )}
              >
                {item.hint}
              </span>
            </button>
          ))}
        </nav>
      </header>

      {tab === 'alerts' ? (
        <div className="max-h-[min(58dvh,28rem)] overflow-y-auto px-3 py-3 sm:px-4">
          {showEmptyAlerts ? (
            <div className="border border-dashed border-[#213D59]/20 bg-white px-4 py-12 text-center">
              <Sparkles className="mx-auto h-7 w-7 text-[#213D59]/35" />
              <p className="mt-3 text-sm font-semibold text-[#213D59]">
                Nothing to review
              </p>
              <p className="mx-auto mt-1 max-w-[32ch] text-[12.5px] leading-relaxed text-[#5a6b80]">
                Notices and AI document fills waiting for Accept will show here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleNotices.length > 0 ? (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b7785]">
                    Notices
                  </p>
                  <ul className="divide-y divide-[#213D59]/10 overflow-hidden border border-[#213D59]/12 bg-white">
                    {visibleNotices.map(notice => {
                      const read = isNoticeRead(notice.id);
                      return (
                        <li
                          key={notice.id}
                          className={cn(
                            'flex items-stretch gap-0',
                            !read && 'bg-[#eef3f8]',
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              'w-1 shrink-0',
                              read
                                ? 'bg-transparent'
                                : notice.tone === 'critical'
                                  ? 'bg-rose-500'
                                  : notice.tone === 'warn'
                                    ? 'bg-amber-500'
                                    : 'bg-[#2B5A8C]',
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              markNoticeRead(notice.id);
                              if (notice.category === 'reminder') {
                                // Jump to Due dates and open the related vault section.
                                setTab('dues');
                                if (notice.sectionId) {
                                  onNavigateToSection?.(notice.sectionId);
                                }
                                return;
                              }
                              if (notice.sectionId) {
                                onNavigateToSection?.(notice.sectionId);
                              }
                            }}
                            className="min-w-0 flex-1 px-3 py-2.5 text-left"
                          >
                            <p
                              className={cn(
                                'truncate text-[13px] text-[#1a2b3d]',
                                !read && 'font-semibold',
                              )}
                            >
                              {notice.title}
                            </p>
                            <p className="mt-0.5 text-[12px] leading-snug text-[#5a6b80]">
                              {notice.body}
                            </p>
                          </button>
                          <div className="flex items-center pr-1.5">
                            <AlertActions
                              isRead={read}
                              onMarkRead={() => markNoticeRead(notice.id)}
                              onMarkUnread={() => markNoticeUnread(notice.id)}
                              onDelete={() => {
                                dismissNotice(notice.id);
                                toast.message('Notice removed');
                              }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {inboxRows.length > 0 ? (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b7785]">
                    AI fills awaiting Accept
                  </p>
                  <ul className="divide-y divide-[#213D59]/10 overflow-hidden border border-[#213D59]/12 bg-white">
                    {inboxRows.map(row => {
                      const read = isAiReviewRead(row.sectionId, row.fileId);
                      return (
                        <li
                          key={row.id}
                          className={cn(
                            'flex items-stretch gap-0',
                            !read && row.status === 'ready' && 'bg-[#eef3f8]',
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              'w-1 shrink-0',
                              read || row.status !== 'ready'
                                ? 'bg-transparent'
                                : 'bg-[#2B5A8C]',
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => openReviewDetail(row)}
                            className="w-[3.75rem] shrink-0 self-center p-2 sm:w-[4.25rem]"
                            title={row.fileName}
                          >
                            <AiUploadHistoryThumb
                              fileId={row.fileId}
                              fileName={row.fileName}
                              className="!rounded-md"
                            />
                          </button>
                          <div className="min-w-0 flex-1 py-2.5 pr-1">
                            <button
                              type="button"
                              onClick={() => openReviewDetail(row)}
                              className="w-full text-left"
                            >
                              <p
                                className={cn(
                                  'truncate text-[13px] text-[#1a2b3d]',
                                  !read && 'font-semibold',
                                )}
                              >
                                {row.fileName}
                              </p>
                              <p className="mt-0.5 truncate text-[12px] text-[#5a6b80]">
                                {row.sectionLabel}
                                {row.subsectionLabel
                                  ? ` · ${row.subsectionLabel}`
                                  : ''}
                              </p>
                            </button>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              {row.status === 'ready' ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-7 rounded-md bg-[#213D59] px-2.5 text-[11px] font-semibold text-white hover:bg-[#1a3149]"
                                  onClick={() => openReviewDetail(row)}
                                >
                                  Review
                                </Button>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-800">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  {row.status === 'queued'
                                    ? 'In queue'
                                    : `Processing${typeof row.progress === 'number' ? ` · ${row.progress}%` : ''}`}
                                </span>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={approvingId === row.id}
                                className="h-7 rounded-md border-[#213D59]/20 px-2.5 text-[11px] font-semibold text-[#213D59]"
                                onClick={() => void handleApprove(row)}
                              >
                                {approvingId === row.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="mr-1 h-3 w-3" />
                                    Accept
                                  </>
                                )}
                              </Button>
                              <span className="text-[11px] text-[#8a97a8]">
                                {formatUploadRelativeShort(
                                  new Date(row.createdAt).toISOString(),
                                ) || 'Just now'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center pr-1.5">
                            <AlertActions
                              isRead={read}
                              onMarkRead={() =>
                                markAiReviewRead(row.sectionId, row.fileId)
                              }
                              onMarkUnread={() =>
                                markAiReviewUnread(row.sectionId, row.fileId)
                              }
                              onDelete={() => dismissAiReview(row)}
                              deleteLabel="Remove alert"
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'docs' ? (
        <div className="max-h-[min(58dvh,28rem)] overflow-y-auto px-3 py-3 sm:px-4">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a97a8]" />
            <input
              type="search"
              value={fileSearch}
              onChange={event => setFileSearch(event.target.value)}
              placeholder="Find a document…"
              className="h-10 w-full border border-[#213D59]/15 bg-white pl-10 pr-3 text-[13px] text-[#1a2b3d] outline-none ring-[#213D59]/20 placeholder:text-[#8a97a8] focus:border-[#213D59]/40 focus:ring-2"
            />
          </div>

          {filesLoading && historyFiles.length === 0 ? (
            <div className="flex items-center justify-center gap-2 border border-dashed border-[#213D59]/20 bg-white px-4 py-12 text-[13px] text-[#5a6b80]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading documents…
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="border border-dashed border-[#213D59]/20 bg-white px-4 py-12 text-center">
              <FileText className="mx-auto h-7 w-7 text-[#213D59]/35" />
              <p className="mt-3 text-sm font-semibold text-[#213D59]">
                {fileSearch.trim() ? 'No matching documents' : 'No uploads yet'}
              </p>
              <p className="mt-1 text-[12.5px] text-[#5a6b80]">
                {fileSearch.trim()
                  ? 'Try a different name or category.'
                  : 'Documents you upload for AI fill appear here.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#213D59]/10 overflow-hidden border border-[#213D59]/12 bg-white">
              {filteredFiles.map(item => {
                const key = fileAlertKey(item);
                const read = isFileRead(key);
                const when =
                  formatUploadRelativeShort(item.updatedAt || item.createdAt) ||
                  'Just now';
                return (
                  <li
                    key={item.id}
                    className={cn(
                      'flex items-stretch gap-0',
                      !read && 'bg-[#eef3f8]',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'w-1 shrink-0',
                        read ? 'bg-transparent' : 'bg-[#2B5A8C]',
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        markFileRead(key);
                        if (!item.fileId) {
                          toast.message(
                            'Preview is not available yet for this file.',
                          );
                          return;
                        }
                        setPreviewFile({
                          fileId: item.fileId,
                          fileName: item.fileName,
                          mimeType: item.mimeType,
                        });
                      }}
                      className="w-[3.75rem] shrink-0 self-center p-2 sm:w-[4.25rem]"
                    >
                      <AiUploadHistoryThumb
                        fileId={item.fileId}
                        fileName={item.fileName}
                        mimeType={item.mimeType}
                        className="!rounded-md"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        markFileRead(key);
                        if (!item.fileId) {
                          toast.message(
                            'Preview is not available yet for this file.',
                          );
                          return;
                        }
                        setPreviewFile({
                          fileId: item.fileId,
                          fileName: item.fileName,
                          mimeType: item.mimeType,
                        });
                      }}
                      className="min-w-0 flex-1 py-2.5 text-left"
                    >
                      <p className="text-[11px] text-[#8a97a8]">{when}</p>
                      <p
                        className={cn(
                          'truncate text-[13px] text-[#1a2b3d]',
                          !read && 'font-semibold',
                        )}
                      >
                        {item.fileName}
                      </p>
                      <p className="truncate text-[12px] text-[#5a6b80]">
                        {fileCategoryLine(item)}
                      </p>
                    </button>
                    <div className="flex items-center pr-1.5">
                      {deletingFileKey === key ? (
                        <Loader2 className="mx-2 h-3.5 w-3.5 animate-spin text-[#8a97a8]" />
                      ) : (
                        <AlertActions
                          isRead={read}
                          onMarkRead={() => markFileRead(key)}
                          onMarkUnread={() => markFileUnread(key)}
                          onDelete={() => void handleDeleteFile(item)}
                          deleteLabel="Delete document"
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {tab === 'dues' ? (
        <div className="max-h-[min(58dvh,28rem)] overflow-y-auto px-3 py-3 sm:px-4">
          {visibleReminders.length === 0 ? (
            <div className="border border-dashed border-[#213D59]/20 bg-white px-4 py-12 text-center">
              <CalendarClock className="mx-auto h-7 w-7 text-[#213D59]/35" />
              <p className="mt-3 text-sm font-semibold text-[#213D59]">
                No due dates right now
              </p>
              <p className="mx-auto mt-1 max-w-[36ch] text-[12.5px] leading-relaxed text-[#5a6b80]">
                Passport, license, policy, and other expiry dates from your
                vault will land here when they&apos;re coming up.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#213D59]/10 overflow-hidden border border-[#213D59]/12 bg-white">
              {visibleReminders.map(alert => {
                const read = isReminderRead(alert.id);
                return (
                  <li
                    key={alert.id}
                    className={cn(
                      'flex items-stretch gap-0',
                      !read && 'bg-[#eef3f8]',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'w-1 shrink-0',
                        read
                          ? 'bg-transparent'
                          : alert.tone === 'critical'
                            ? 'bg-rose-500'
                            : 'bg-amber-500',
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        markReminderRead(alert.id);
                        onNavigateToSection?.(alert.sectionId);
                      }}
                      className="min-w-0 flex-1 px-3 py-2.5 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={cn(
                            'truncate text-[13px] text-[#1a2b3d]',
                            !read && 'font-semibold',
                          )}
                        >
                          {alert.label}
                        </p>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[#6b7785]">
                          {formatReminderDue(alert.daysUntil)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[12px] leading-snug text-[#5a6b80]">
                        {alert.text}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-[#8a97a8]">
                        {getAiSectionLabel(alert.sectionId)}
                      </p>
                    </button>
                    <div className="flex items-center pr-1.5">
                      <AlertActions
                        isRead={read}
                        onMarkRead={() => markReminderRead(alert.id)}
                        onMarkUnread={() => markReminderUnread(alert.id)}
                        onDelete={() => {
                          dismissReminder(alert.id);
                          toast.message('Due date cleared');
                        }}
                      />
                    </div>
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
        mimeType={previewFile?.mimeType}
        onNotFound={fileId => {
          setServerDocs(prev => prev.filter(d => d.file_id !== fileId));
          setPreviewFile(null);
        }}
      />
    </section>
  );
}
