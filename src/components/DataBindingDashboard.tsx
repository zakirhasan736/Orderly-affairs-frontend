'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getMessages } from '@/libs/api/lettersOfNaxtKinMessage';

import { Button } from '@common/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@common/ui/tabs';

import {
  Activity,
  AlarmClock,
  CheckCircle2,
  ChevronRight,
  FileText,
  FolderOpen,
  Mail,
  MessageSquare,
  Mic,
  Pencil,
  Plus,
  ShieldAlert,
  Users,
  Video,
  ArrowRight,
} from 'lucide-react';

import { AccessPersonCard } from './AccessPersonCard';
import { NOKLetterCard } from './NOKLetterCard';
import { MessageCard } from './MessageCard';
import { OverviewAiUploadCard } from './ai/OverviewAiUploadCard';
import { OverviewTaskBoard } from './ai/OverviewTaskBoard';
import { OverviewBrowseGrid } from './ai/OverviewBrowseGrid';
import { AiUploadHistoryPopup } from './ai/AiUploadHistoryPopup';
import { UploadedDocumentsButton } from '@/components/vault/UploadedDocumentsButton';
import { useUploadedDocuments } from '@/hooks/useUploadedDocuments';
import { useSyncSpecialDaysFromVault } from '@/hooks/useSyncSpecialDaysFromVault';
import { useDashboardAiBatch } from '@/contexts/DashboardAiBatchContext';
import { AiOverviewReadMatchDialog } from './ai/AiOverviewReadMatchDialog';
import type {
  OverviewApprovePayload,
  OverviewDocumentReview,
} from './ai/AiOverviewReadMatchDialog';
import {
  listDashboardAiPatches,
} from '@/utils/aiDashboardPatchCache';
import { getAiSectionLabel, AI_SECTION_BY_KEY } from '@/utils/aiSectionRegistry';
import { listAiUploadHistory, toVaultSectionId } from '@/utils/aiUploadHistory';
import {
  approveOverviewAiDocuments,
  detectOverviewPersonPrompt,
} from '@/utils/approveOverviewAiDocuments';
import { isHealthInsuranceCardCandidate } from '@/utils/aiInsuranceDocument';
import { isIdentityDocumentCandidate } from '@/utils/aiIdentityDocument';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import {
  collectOverviewExpiryAlerts,
  isOverviewUrgentAlert,
  OVERVIEW_REMINDER_HORIZON_DAYS,
  OVERVIEW_URGENT_WITHIN_DAYS,
  type OverviewExpiryAlert,
} from '@/utils/overviewExpiryAlerts';
import type { DashboardNotice } from '@/utils/dashboardNotifications';
import { cn } from '@common/ui/utils';
import { AttentionChip, EmptyState, ProgressRing, StatCard } from '@/components/vault-ui';
import { openVaultUploadDrawer } from '@/components/vault-prototype/VaultUploadDrawer';
import { isAiSectionReviewed } from '@/utils/aiSectionReviewState';
import {
  OPEN_AI_REVIEW_FILL,
  type OpenAiReviewFillDetail,
} from '@/utils/vaultActivityTabs';
import { factsFromStashForReview, pickDocsByFileId, synthesizeReviewStashFromVault } from '@/utils/aiMatchReviewDocs';

interface DataBindingDashboardProps {
  formData: any;
  nextKinList: any[];
  nokLetter: any;
  isNextOfKin?: boolean;
  nextTask: { id: string; title: string } | null;
  onNavigateToSection: (sectionId: string) => void;
  onOpenNewFill?: (marker: {
    sectionId: string;
    subsectionId?: string;
    topicId?: string;
  }) => void;
  progress?: number;
  completedCount?: number;
  totalCount?: number;
  completedSectionIds?: string[];
  sectionProgressById?: Record<
    string,
    {
      percent: number;
      complete: boolean;
      started?: boolean;
      itemCount?: number;
      completeItemCount?: number;
      status?: string;
    }
  >;
  lastUpdatedBySection?: Record<string, string>;
  afterHero?: React.ReactNode;
  ownerEmail?: string | null;
  ownerName?: string | null;
  /** False on first-ever sign-in; true for returning owners/family. */
  isReturningUser?: boolean;
  notices?: DashboardNotice[];
  /** Family Viewer — hide mutating overview actions. */
  readOnly?: boolean;
  /** Family without can_upload — hide AI document drop zone. */
  uploadsDisabled?: boolean;
  /** Restrict browse / cards to these vault section ids. */
  allowedSectionIds?: 'all' | Set<string>;
  showAccessPeople?: boolean;
  showNokLetters?: boolean;
  showMessages?: boolean;
}

interface ApiMessage {
  _id: string;
  title: string;
  recipient: string;
  recipient_email: string;
  content: string;
  message_type: 'letter' | 'video' | 'audio';
  delivery_trigger: string;
  delivery_date?: string;
  delivery_occasion?: string;
  status: string;
  updated_at: string;
  media?: any;
  subject?: string;
}

type PeopleTab = 'access' | 'nok-letters' | 'messages';
type MobileHubTab = 'activity' | 'people';

export function DataBindingDashboard({
  formData: formDataProp,
  nextKinList,
  nokLetter,
  onNavigateToSection,
  onOpenNewFill,
  nextTask,
  isNextOfKin = false,
  completedCount = 0,
  totalCount = 0,
  progress = 0,
  completedSectionIds = [],
  sectionProgressById = {},
  lastUpdatedBySection = {},
  ownerEmail: _ownerEmail = null,
  ownerName = null,
  isReturningUser = true,
  notices: _notices = [],
  readOnly = false,
  uploadsDisabled = false,
  allowedSectionIds = 'all',
  showAccessPeople = true,
  showNokLetters = true,
  showMessages = true,
}: DataBindingDashboardProps) {
  void _ownerEmail;
  void _notices;
  const welcomeName = useMemo(() => {
    const raw = String(ownerName || '').trim();
    if (!raw) return null;
    if (raw.includes('@')) {
      const local = raw
        .split('@')[0]
        ?.replace(/[._+-]+/g, ' ')
        .trim();
      const first = local?.split(/\s+/)[0];
      if (!first) return null;
      return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
    }
    const first = raw.split(/\s+/)[0];
    return first || null;
  }, [ownerName]);

  const welcomeHeading = useMemo(() => {
    if (welcomeName) {
      return isReturningUser
        ? `Welcome back, ${welcomeName}`
        : `Welcome, ${welcomeName}`;
    }
    return isReturningUser ? 'Welcome back' : 'Welcome';
  }, [welcomeName, isReturningUser]);

  const welcomeSubtitle = isReturningUser
    ? 'Pick up where you left off. Upload a document and it files itself, or open a section below and keep building.'
    : 'Upload a document and it files itself, or open a section below and start filling your Vault.';
  const [activeTab, setActiveTab] = useState<PeopleTab>('access');
  const [mobileHubTab, setMobileHubTab] = useState<MobileHubTab>('people');
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const batch = useDashboardAiBatch();
  const routing = useOptionalAiDocumentRouting();
  const [overviewReviewOpen, setOverviewReviewOpen] = useState(false);
  const [overviewFocusFileId, setOverviewFocusFileId] = useState<string | null>(
    null,
  );
  const [approvingOverview, setApprovingOverview] = useState(false);
  const [choosingSectionDocId, setChoosingSectionDocId] = useState<
    string | null
  >(null);
  const [stashTick, setStashTick] = useState(0);
  const batchReviewShownRef = useRef(false);
  const prevWorkingRef = useRef(false);
  const clearedErrorFileIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Prefer a visible people tab when ACL hides the default.
    if (showAccessPeople) setActiveTab('access');
    else if (showNokLetters) setActiveTab('nok-letters');
    else if (showMessages) setActiveTab('messages');
  }, [showAccessPeople, showNokLetters, showMessages]);

  useEffect(() => {
    const onStash = () => setStashTick(value => value + 1);
    window.addEventListener('orderly-ai-patch-stashed', onStash);
    window.addEventListener('orderly-ai-section-reviewed', onStash);
    return () => {
      window.removeEventListener('orderly-ai-patch-stashed', onStash);
      window.removeEventListener('orderly-ai-section-reviewed', onStash);
    };
  }, []);

  const docsWorkingCount = useMemo(
    () =>
      batch.jobs.filter(
        job =>
          job.status !== 'done' &&
          job.status !== 'error' &&
          job.status !== 'needs_section_choice',
      ).length,
    [batch.jobs],
  );

  const doneJobs = useMemo(
    () => batch.jobs.filter(job => job.status === 'done'),
    [batch.jobs],
  );

  const needsChoiceJobs = useMemo(
    () => batch.jobs.filter(job => job.status === 'needs_section_choice'),
    [batch.jobs],
  );

  const reviewableJobs = useMemo(
    () =>
      [...needsChoiceJobs, ...doneJobs].filter(job => {
        if (job.status === 'needs_section_choice') return true;
        const sectionId = job.targetSectionId;
        if (!sectionId) return true;
        return !isAiSectionReviewed(sectionId, job.file_id);
      }),
    [needsChoiceJobs, doneJobs, stashTick],
  );

  // Clear pending pins once per failed file. Do not depend on `routing` —
  // clearAllPendingForFile used to always emit a new pendingUploads array,
  // which recreated the context value and re-fired this effect (React #185).
  const errorFileIdsKey = useMemo(
    () =>
      batch.jobs
        .filter(job => job.status === 'error' && job.file_id)
        .map(job => String(job.file_id))
        .sort()
        .join('|'),
    [batch.jobs],
  );

  useEffect(() => {
    if (!errorFileIdsKey || !routing) return;
    for (const fileId of errorFileIdsKey.split('|')) {
      if (!fileId || clearedErrorFileIdsRef.current.has(fileId)) continue;
      clearedErrorFileIdsRef.current.add(fileId);
      routing.clearAllPendingForFile(fileId);
    }
  }, [errorFileIdsKey, routing]);

  // Open review when a doc needs a section, or after the batch finishes.
  useEffect(() => {
    const working = docsWorkingCount > 0;
    const finishedBatch =
      prevWorkingRef.current && !working && doneJobs.length > 0;
    prevWorkingRef.current = working;

    if (needsChoiceJobs.length > 0) {
      setOverviewFocusFileId(null);
      setOverviewReviewOpen(true);
      return;
    }

    if (!finishedBatch || batchReviewShownRef.current) return;

    batchReviewShownRef.current = true;
    const timer = window.setTimeout(() => {
      setOverviewFocusFileId(null);
      setOverviewReviewOpen(true);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [docsWorkingCount, doneJobs.length, needsChoiceJobs.length]);

  // Allow another popup when the user queues a new batch later.
  useEffect(() => {
    if (docsWorkingCount > 0) {
      batchReviewShownRef.current = false;
    }
  }, [docsWorkingCount]);

  useEffect(() => {
    const onOpenFill = (event: Event) => {
      const detail =
        (event as CustomEvent<OpenAiReviewFillDetail>).detail || {};
      if (detail.from === 'section' && detail.sectionId) return;
      setOverviewFocusFileId(detail.fileId || null);
      setOverviewReviewOpen(true);
    };
    window.addEventListener(OPEN_AI_REVIEW_FILL, onOpenFill);
    return () => window.removeEventListener(OPEN_AI_REVIEW_FILL, onOpenFill);
  }, []);

  const overviewDocuments = useMemo((): OverviewDocumentReview[] => {
    void stashTick;
    const fromJobs = reviewableJobs.map(job => {
      const fileId = job.file_id;
      const facts = fileId
        ? listDashboardAiPatches()
            .filter(entry => entry.file_id === fileId)
            .flatMap(entry =>
              factsFromStashForReview(
                entry,
                job.fileName,
                job.documentSummary,
              ),
            )
        : [];

      const byId = new Map<
        string,
        {
          sectionId: string;
          sectionLabel?: string;
          summary?: string;
          factCount?: number;
        }
      >();

      const add = (
        sectionId: string | undefined,
        meta?: { label?: string; summary?: string; factCount?: number },
      ) => {
        if (!sectionId) return;
        const existing = byId.get(sectionId);
        byId.set(sectionId, {
          sectionId,
          sectionLabel:
            meta?.label ||
            existing?.sectionLabel ||
            getAiSectionLabel(sectionId),
          summary: meta?.summary || existing?.summary,
          factCount: Math.max(meta?.factCount || 0, existing?.factCount || 0),
        });
      };

      if (job.targetSectionId) {
        add(job.targetSectionId, {
          label: job.targetSectionLabel,
          summary: job.documentSummary,
        });
      }

      listDashboardAiPatches()
        .filter(entry => !fileId || entry.file_id === fileId)
        .forEach(entry => {
          add(entry.section_id, {
            label: getAiSectionLabel(entry.section_id),
            summary: entry.document_summary,
            factCount: entry.detectedFields?.length,
          });
        });

      (routing?.pendingUploads || [])
        .filter(upload => !fileId || upload.file_id === fileId)
        .forEach(upload => {
          add(upload.targetSectionId, {
            summary: upload.documentSummary,
            factCount: upload.extractedFields?.length,
          });
        });

      // Health cards: always offer Insurance for structured member ID / group #.
      const healthCard = isHealthInsuranceCardCandidate({
        sectionId: job.targetSectionId,
        documentSummary: job.documentSummary,
        fileName: job.fileName,
        result: fileId
          ? listDashboardAiPatches().find(entry => entry.file_id === fileId)
              ?.result
          : undefined,
      });
      if (healthCard) {
        add('7', {
          label: getAiSectionLabel('7'),
          summary: job.documentSummary,
        });
        // Don't push non-personal card data into Vital by default.
        byId.delete('1');
      }

      const person = detectOverviewPersonPrompt({
        fileId,
        fileName: job.fileName,
        documentSummary: job.documentSummary,
        sectionId: job.targetSectionId,
      });

      // Multi-ID batches: prompt whose document even when summary is thin.
      const identityHint =
        !person.needsPersonChoice &&
        !healthCard &&
        isIdentityDocumentCandidate({
          sectionId: job.targetSectionId,
          documentSummary: job.documentSummary,
          fileName: job.fileName,
        });

      return {
        id: job.id,
        fileId,
        fileName: job.fileName,
        mimeType: job.mime_type,
        documentSummary: job.documentSummary,
        facts,
        matchedSections: Array.from(byId.values()),
        readSource: job.readSource,
        extractMethod: job.extractMethod,
        needsPersonChoice: person.needsPersonChoice || identityHint,
        personPromptKind:
          person.personPromptKind || (identityHint ? 'identity' : undefined),
        personName: person.personName,
        needsSectionChoice: job.status === 'needs_section_choice',
      };
    });

    const seen = new Set(
      fromJobs.map(doc => String(doc.fileId || '').trim()).filter(Boolean),
    );
    const history = listAiUploadHistory();
    const extraByFile = new Map<string, ReturnType<typeof listDashboardAiPatches>>();
    listDashboardAiPatches().forEach(entry => {
      const fileId = String(entry.file_id || '').trim();
      if (!fileId || seen.has(fileId)) return;
      if (isAiSectionReviewed(entry.section_id, fileId)) return;
      const list = extraByFile.get(fileId) || [];
      list.push(entry);
      extraByFile.set(fileId, list);
    });

    const extras: OverviewDocumentReview[] = [...extraByFile.entries()].map(
      ([fileId, entries]) => {
        const hist = history.find(item => item.fileId === fileId);
        const first = entries[0];
        return {
          id: `stash-${fileId}`,
          fileId,
          fileName: first.file_name || hist?.fileName || 'Uploaded document',
          mimeType: hist?.mimeType,
          documentSummary: first.document_summary,
          facts: entries.flatMap(entry =>
            factsFromStashForReview(
              entry,
              first.file_name || hist?.fileName,
              first.document_summary || hist?.documentSummary,
            ),
          ),
          matchedSections: entries.map(entry => ({
            sectionId: entry.section_id,
            sectionLabel: getAiSectionLabel(entry.section_id),
            summary: entry.document_summary,
            factCount: entry.detectedFields?.length,
          })),
        };
      },
    );

    return [...fromJobs, ...extras];
  }, [reviewableJobs, routing?.pendingUploads, stashTick]);

  const focusedOverviewDocuments = useMemo((): OverviewDocumentReview[] => {
    const picked = pickDocsByFileId(
      overviewDocuments,
      overviewFocusFileId,
      doc => doc.fileId || doc.id,
      { strict: Boolean(overviewFocusFileId) },
    );
    if (!overviewFocusFileId || picked.length) return picked;

    const history = listAiUploadHistory().find(
      item => item.fileId === overviewFocusFileId,
    );
    const sectionIds = (
      history?.sectionIds?.length
        ? history.sectionIds
        : history?.sectionId
          ? [history.sectionId]
          : []
    )
      .map(id => toVaultSectionId(id) || String(id || '').trim())
      .filter(Boolean);

    for (const sectionId of sectionIds) {
      const synthesized = synthesizeReviewStashFromVault({
        sectionId,
        fileId: overviewFocusFileId,
        fileName: history?.fileName,
        documentSummary: history?.documentSummary,
        sectionData: formDataProp?.[sectionId],
      });
      if (!synthesized) continue;
      return [
        {
          id: `stash-${synthesized.file_id}`,
          fileId: synthesized.file_id,
          fileName:
            synthesized.file_name || history?.fileName || 'Uploaded document',
          mimeType: history?.mimeType,
          documentSummary: synthesized.document_summary,
          facts: factsFromStashForReview(
            synthesized,
            history?.fileName,
            history?.documentSummary,
          ),
          matchedSections: [
            {
              sectionId: synthesized.section_id,
              sectionLabel: getAiSectionLabel(synthesized.section_id),
              summary: synthesized.document_summary,
              factCount: synthesized.detectedFields?.length,
            },
          ],
        },
      ];
    }
    return [];
  }, [overviewDocuments, overviewFocusFileId, formDataProp]);

  // Avoid Radix presence thrash: only open when we have docs to show.
  const overviewDialogOpen =
    overviewReviewOpen && focusedOverviewDocuments.length > 0;

  const hasReviewableDocs = overviewDocuments.length > 0;

  // Same horizon as the notification bell / Review inbox dues tab.
  const expiryAlerts = useMemo(
    () =>
      collectOverviewExpiryAlerts(formDataProp, {
        limit: 40,
        withinDays: OVERVIEW_REMINDER_HORIZON_DAYS,
      }),
    [formDataProp],
  );

  const urgentExpiryAlerts = useMemo(
    () =>
      expiryAlerts.filter(alert => isOverviewUrgentAlert(alert.daysUntil)),
    [expiryAlerts],
  );

  // Compact overview pills stay focused on the next two weeks.
  const overviewStripAlerts = useMemo(
    () =>
      collectOverviewExpiryAlerts(formDataProp, {
        limit: 4,
        withinDays: OVERVIEW_URGENT_WITHIN_DAYS,
      }),
    [formDataProp],
  );

  const openReviewInbox = (
    tab: 'alerts' | 'docs' | 'dues' | 'inbox' | 'files' | 'reminders' = 'alerts',
  ) => {
    window.dispatchEvent(
      new CustomEvent('orderly-open-ai-inbox-tab', {
        detail: { tab },
      }),
    );
  };

  const vaultPct = useMemo(() => {
    if (typeof progress === 'number' && Number.isFinite(progress)) {
      return Math.min(100, Math.max(0, Math.round(progress)));
    }
    if (totalCount > 0) {
      return Math.min(100, Math.round((completedCount / totalCount) * 100));
    }
    return 0;
  }, [progress, completedCount, totalCount]);

  const uploadedDocs = useUploadedDocuments();
  const docsFilledCount = uploadedDocs.count;
  useSyncSpecialDaysFromVault(formDataProp);

  useEffect(() => {
    let cancelled = false;

    const fetchMessages = async () => {
      if (!showMessages) {
        setMessages([]);
        return;
      }
      try {
        setLoadingMessages(true);
        const response = await getMessages();
        if (!cancelled) {
          setMessages(Array.isArray(response) ? response : []);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    };

    void fetchMessages();
    return () => {
      cancelled = true;
    };
  }, [showMessages]);

  const accessPeople = useMemo(
    () => (Array.isArray(nextKinList) ? nextKinList : []),
    [nextKinList],
  );

  const pendingMessages = useMemo(() => {
    return messages
      .map((item: ApiMessage) => ({
        id: item._id,
        title: item.title || 'Untitled message',
        recipient: item.recipient || '',
        recipientEmail: item.recipient_email || '',
        content: item.content || '',
        lastModified: item.updated_at,
        messageType: item.message_type as 'letter' | 'video' | 'audio',
        deliveryTrigger: item.delivery_trigger,
        isDelivered: item.status === 'sent',
        deliveryDate: item.delivery_date,
        deliveryOccasion: item.delivery_occasion,
        subject: item.subject,
        media: item.media,
        audioFile:
          item.message_type === 'audio' && item.media
            ? { name: 'Audio Message', type: 'audio' }
            : undefined,
        videoFile:
          item.message_type === 'video' && item.media
            ? { name: 'Video Message', type: 'video' }
            : undefined,
      }))
      .filter(item => !item.isDelivered);
  }, [messages]);

  const recentActivity = useMemo(() => {
    const items: Array<{
      id: string;
      label: string;
      at: number;
      sectionId: string;
      tone: 'ok' | 'warn' | 'info';
    }> = [];

    Object.entries(lastUpdatedBySection || {}).forEach(([sectionId, iso]) => {
      const at = Date.parse(iso);
      if (Number.isNaN(at)) return;
      const titles: Record<string, string> = {
        '1': 'Vital information updated',
        '2': 'Access people updated',
        '3': 'Next of kin letter updated',
        '4': 'Personal messages updated',
        '5': 'Vehicles updated',
        '7': 'Insurance policies updated',
        '12': 'Bank accounts updated',
      };
      items.push({
        id: `sec-${sectionId}-${iso}`,
        label: titles[sectionId] || `Section ${sectionId} updated`,
        at,
        sectionId,
        tone: 'ok',
      });
    });

    batch.jobs.slice(0, 6).forEach(job => {
      if (job.status !== 'done' && job.status !== 'error') return;
      const stamp = Date.parse(String(job.updatedAt || job.createdAt || ''));
      if (!Number.isFinite(stamp)) return;
      items.push({
        id: `job-${job.id}`,
        label:
          job.status === 'done'
            ? `Document filled · ${job.fileName}`
            : `Upload issue · ${job.fileName}`,
        at: stamp,
        sectionId: String(job.targetSectionId || '1'),
        tone: job.status === 'done' ? 'ok' : 'warn',
      });
    });

    pendingMessages.slice(0, 3).forEach(msg => {
      const at = Date.parse(msg.lastModified);
      if (Number.isNaN(at)) return;
      items.push({
        id: `msg-${msg.id}`,
        label:
          msg.messageType === 'audio'
            ? 'Audio message recorded'
            : msg.messageType === 'video'
              ? 'Video message recorded'
              : `Message drafted · ${msg.title}`,
        at,
        sectionId: '4',
        tone:
          msg.messageType === 'audio' || msg.messageType === 'video'
            ? 'warn'
            : 'info',
      });
    });

    return items.sort((a, b) => b.at - a.at).slice(0, 6);
  }, [batch.jobs, lastUpdatedBySection, pendingMessages]);

  const formatActivityTime = (at: number) =>
    new Date(at).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const openPeopleTab = (tab: PeopleTab) => {
    setMobileHubTab('people');
    setActiveTab(tab);
    window.requestAnimationFrame(() => {
      document
        .getElementById('people-messages')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  useEffect(() => {
    const onOpenPeople = (event: Event) => {
      const detail = (event as CustomEvent<{ tab?: PeopleTab }>).detail;
      setMobileHubTab('people');
      setActiveTab(detail?.tab ?? 'access');
    };
    window.addEventListener('orderly-open-people-hub', onOpenPeople);
    return () =>
      window.removeEventListener('orderly-open-people-hub', onOpenPeople);
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      {!isNextOfKin && (
        <>
          <header className="relative overflow-hidden rounded-[22px] bg-[linear-gradient(120deg,#213D59_0%,#2C4B6B_62%,#3A6288_100%)] px-8 py-[30px] text-white max-md:rounded-[14px] max-md:px-5 max-md:py-6">
            <span className="pointer-events-none absolute -right-[70px] -top-[90px] h-[300px] w-[300px] rounded-full bg-[rgba(122,202,249,.16)]" />
            <span className="pointer-events-none absolute bottom-[-140px] right-[70px] h-[230px] w-[230px] rounded-full bg-[rgba(122,202,249,.1)]" />
            <div className="relative z-[1] flex flex-wrap items-center gap-7">
              <div className="min-w-[220px] flex-1">
                <h1 className="text-[29px] font-bold tracking-[-0.028em] max-md:text-[23px]">
                  {welcomeHeading}
                </h1>
                <p className="mt-2 max-w-[520px] text-[15px] text-white/80">
                  {welcomeSubtitle}
                </p>
                <div className="mt-[18px] flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => onNavigateToSection(nextTask?.id || '1')}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-[#3EB1E5] px-[18px] text-[14px] font-semibold text-[#16293C] hover:bg-[#7ACAF9]"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Continue where I left off
                  </button>
                  <button
                    type="button"
                    onClick={() => openVaultUploadDrawer()}
                    className="inline-flex h-10 items-center rounded-full border border-white/26 bg-white/10 px-[18px] text-[14px] font-semibold text-white hover:bg-white/18"
                  >
                    Upload documents
                  </button>
                </div>
              </div>
              <div className="mx-auto text-center md:ml-auto md:mr-0">
                <ProgressRing value={vaultPct} size="hero" surface="navy">
                  <span className="flex flex-col items-center leading-none">
                    <span className="text-[22px] font-bold tracking-[-0.02em] text-white tabular-nums">
                      {completedCount}/{totalCount || 22}
                    </span>
                    <span className="mt-1 text-[12px] font-medium text-white/70">
                      sections
                    </span>
                  </span>
                </ProgressRing>
              </div>
            </div>
          </header>

          <OverviewAlertRow
            alerts={overviewStripAlerts}
            onOpenSection={onNavigateToSection}
          />

          {/* 1) Overview snapshot — vault health (mobile + desktop) */}
          <div className="overview-vault-snapshot grid grid-cols-2 gap-4 md:grid-cols-4">
            <OverviewStatCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              accent="blue"
              value={`${completedCount} of ${totalCount}`}
              label="Sections completed"
              detail={
                nextTask?.title
                  ? `Next: ${nextTask.title}`
                  : 'Keep filling your vault'
              }
              action="Continue"
              onClick={() => {
                onNavigateToSection(nextTask?.id || '1');
              }}
            />
            <OverviewStatCard
              icon={
                expiryAlerts.length > 0 ? (
                  <ShieldAlert className="h-4 w-4" />
                ) : (
                  <AlarmClock className="h-4 w-4" />
                )
              }
              accent={
                urgentExpiryAlerts.length > 0
                  ? 'amber'
                  : expiryAlerts.length > 0
                    ? 'blue'
                    : 'green'
              }
              value={String(expiryAlerts.length)}
              label={
                expiryAlerts.length === 1 ? 'Reminder due' : 'Reminders due'
              }
              detail={
                urgentExpiryAlerts.length > 0
                  ? `${urgentExpiryAlerts.length} within 2 weeks`
                  : expiryAlerts.length > 0
                    ? 'Upcoming in the next year'
                    : 'Nothing coming up'
              }
              action={expiryAlerts.length > 0 ? 'Review' : 'All clear'}
              onClick={() => openReviewInbox('dues')}
            />
            <OverviewStatCard
              icon={<FolderOpen className="h-4 w-4" />}
              accent="navy"
              value={String(docsFilledCount)}
              label={docsFilledCount === 1 ? 'Document stored' : 'Documents stored'}
              detail={
                docsWorkingCount > 0 || uploadedDocs.processingCount > 0
                  ? `${docsWorkingCount || uploadedDocs.processingCount} still processing`
                  : uploadedDocs.isLoading
                    ? 'Loading from vault…'
                    : 'AI document fill'
              }
              action="Open library"
              onClick={() => openVaultUploadDrawer()}
            />
            <OverviewStatCard
              icon={<Users className="h-4 w-4" />}
              accent="green"
              value={String(nextKinList?.length || 0)}
              label="People with access"
              detail={
                nextKinList?.[0]?.full_name
                  ? String(nextKinList[0].full_name)
                  : 'Name a next of kin'
              }
              action="Manage access"
              onClick={() => onNavigateToSection('2')}
            />
          </div>

          {/* 2) Upload document — drop zone for Editor+; history for all family readers */}
          {!uploadsDisabled && !isNextOfKin && (
            <div className="overflow-hidden rounded-[22px] border border-[#E4EAF0] bg-white shadow-[0_1px_2px_rgba(33,61,89,.06)]">
              <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-[22px] max-md:px-4">
                <div className="min-w-0 flex-1">
                  <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#619FCE]">
                    Fastest way to fill your Vault
                  </p>
                  <h2 className="text-[19px] font-bold tracking-[-0.02em] text-[#213D59]">
                    Upload a document, we file it for you
                  </h2>
                  <p className="mt-1 text-[13.5px] text-[#7A8794]">
                    Drop in a policy, statement, title, or ID. It reads the document,
                    picks the right section, and shows you the fill to approve.
                  </p>
                </div>
                <UploadedDocumentsButton className="shrink-0" />
              </div>
              <OverviewAiUploadCard
                className="mx-6 mb-6 mt-[18px] max-md:mx-4"
                jobs={batch.jobs}
                enqueueFiles={batch.enqueueFiles}
                dismissJob={batch.dismissJob}
                maxConcurrent={batch.maxConcurrent}
                hasReviewableDocs={hasReviewableDocs}
                onOpenReview={() => setOverviewReviewOpen(true)}
                onOpenDrawer={() => openVaultUploadDrawer()}
              />
            </div>
          )}
          {uploadsDisabled && !isNextOfKin && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">
                  Document upload is not available for your family role. You can
                  still open documents the owner (or editors) already uploaded.
                </p>
                <AiUploadHistoryPopup
                  absolute={false}
                  source="overview"
                  variant="dialog"
                />
              </div>
            </div>
          )}

          <OverviewBrowseGrid
            className="hidden md:block"
            onNavigateToSection={onNavigateToSection}
            completedSectionIds={completedSectionIds}
            sectionProgressById={sectionProgressById}
            allowedSectionIds={allowedSectionIds}
          />

          <AiOverviewReadMatchDialog
            open={overviewDialogOpen}
            onOpenChange={open => {
              setOverviewReviewOpen(open);
              if (!open) setOverviewFocusFileId(null);
            }}
            documents={focusedOverviewDocuments}
            focusFileId={overviewFocusFileId}
            onOpenSection={onNavigateToSection}
            approving={approvingOverview}
            choosingSectionDocId={choosingSectionDocId}
            onChooseSection={async (docId, sectionId) => {
              setChoosingSectionDocId(docId);
              try {
                await batch.resolveSectionChoice(docId, sectionId);
                setStashTick(value => value + 1);
                setOverviewReviewOpen(true);
              } catch (error) {
                console.warn('Section choice failed', error);
              } finally {
                setChoosingSectionDocId(null);
              }
            }}
            onApproveFill={async (payload: OverviewApprovePayload) => {
              setApprovingOverview(true);
              try {
                await approveOverviewAiDocuments(payload);
                setOverviewReviewOpen(false);
                setStashTick(value => value + 1);
              } finally {
                setApprovingOverview(false);
              }
            }}
            vaultBySection={formDataProp || {}}
            onReviewLater={() => {
              window.setTimeout(() => openVaultUploadDrawer(), 160);
            }}
          />

          {/* Continue where you left off slider (+ desktop grids) */}
          <div className="overview-task-board">
            <OverviewTaskBoard
              jobs={batch.jobs}
              sectionProgressById={sectionProgressById}
              lastUpdatedBySection={lastUpdatedBySection}
              onNavigateToSection={onNavigateToSection}
              allowedSectionIds={allowedSectionIds}
            />
          </div>

          {/* 4) Quick actions */}
          <section className="md:hidden">
            <div className="grid grid-cols-4 gap-2">
              {showAccessPeople && (
                <QuickAction
                  icon={<Plus className="h-4 w-4" />}
                  label={readOnly ? 'View people' : 'Add a person'}
                  onClick={() => onNavigateToSection('2')}
                />
              )}
              {showNokLetters && (
                <QuickAction
                  icon={<Pencil className="h-4 w-4" />}
                  label={readOnly ? 'View letter' : 'Write letter'}
                  onClick={() => onNavigateToSection('3')}
                />
              )}
              {showMessages && (
                <QuickAction
                  icon={<Mail className="h-4 w-4" />}
                  label={readOnly ? 'View messages' : 'Send message'}
                  onClick={() => onNavigateToSection('4')}
                />
              )}
              <QuickAction
                icon={<Activity className="h-4 w-4" />}
                label="View activity"
                onClick={() => {
                  setMobileHubTab('activity');
                  window.requestAnimationFrame(() => {
                    document
                      .getElementById('mobile-hub')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  });
                }}
              />
            </div>
          </section>

          {/* 5–6) People & messages (default) + Recent activity */}
          <section
            id="mobile-hub"
            className="scroll-mt-24 space-y-3 md:hidden"
          >
            <div className="rounded-[22px] border border-slate-200 bg-white p-1.5 shadow-sm">
              <div
                className={cn(
                  'grid gap-1',
                  showAccessPeople || showNokLetters || showMessages
                    ? 'grid-cols-2'
                    : 'grid-cols-1',
                )}
              >
                {(showAccessPeople || showNokLetters || showMessages) && (
                <button
                  type="button"
                  onClick={() => setMobileHubTab('people')}
                  className={cn(
                    'rounded-xl px-3 py-2.5 text-[12px] font-semibold transition',
                    mobileHubTab === 'people'
                      ? 'bg-[#213D59] text-white shadow-sm'
                      : 'text-slate-500',
                  )}
                >
                  People & messages
                </button>
                )}
                <button
                  type="button"
                  onClick={() => setMobileHubTab('activity')}
                  className={cn(
                    'rounded-xl px-3 py-2.5 text-[12px] font-semibold transition',
                    mobileHubTab === 'activity' ||
                      !(showAccessPeople || showNokLetters || showMessages)
                      ? 'bg-[#213D59] text-white shadow-sm'
                      : 'text-slate-500',
                  )}
                >
                  Recent activity
                </button>
              </div>
            </div>

            {mobileHubTab === 'activity' ||
            !(showAccessPeople || showNokLetters || showMessages) ? (
              <div
                id="recent-activity"
                className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm"
              >
                {recentActivity.length ? (
                  recentActivity.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.sectionId && item.sectionId !== 'dashboard') {
                          onNavigateToSection(item.sectionId);
                        }
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 px-3.5 py-3 text-left transition active:bg-slate-50',
                        index > 0 && 'border-t border-slate-100',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                          item.tone === 'ok'
                            ? 'bg-emerald-50 text-emerald-600'
                            : item.tone === 'warn'
                              ? 'bg-rose-50 text-rose-500'
                              : 'bg-sky-50 text-sky-600',
                        )}
                      >
                        {item.tone === 'ok' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : item.tone === 'warn' ? (
                          <Mic className="h-4 w-4" />
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-[#213D59]">
                          {item.label}
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] font-medium text-slate-400">
                        {formatActivityTime(item.at)}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-8 text-center text-sm text-slate-500">
                    Activity will show here as you update your vault.
                  </p>
                )}
              </div>
            ) : (
              <div
                id="people-messages"
                className="overview-people-hub scroll-mt-24 space-y-3"
              >
                <Tabs
                  value={activeTab}
                  onValueChange={value => setActiveTab(value as PeopleTab)}
                >
                  <TabsList
                    className={cn(
                      'grid h-auto w-full gap-1 rounded-xl bg-slate-100 p-1',
                      [
                        showAccessPeople,
                        showNokLetters,
                        showMessages,
                      ].filter(Boolean).length <= 1
                        ? 'grid-cols-1'
                        : [
                              showAccessPeople,
                              showNokLetters,
                              showMessages,
                            ].filter(Boolean).length === 2
                          ? 'grid-cols-2'
                          : 'grid-cols-3',
                    )}
                  >
                    {showAccessPeople && (
                      <TabsTrigger
                        value="access"
                        data-tour="tour-people-tab-access"
                        className="min-h-10 rounded-lg text-[11px] font-semibold data-[state=active]:bg-white data-[state=active]:text-[#213D59]"
                      >
                        Access ({accessPeople.length})
                      </TabsTrigger>
                    )}
                    {showNokLetters && (
                      <TabsTrigger
                        value="nok-letters"
                        data-tour="tour-people-tab-letter"
                        className="min-h-10 rounded-lg text-[11px] font-semibold data-[state=active]:bg-white data-[state=active]:text-[#213D59]"
                      >
                        Letter ({nokLetter ? 1 : 0})
                      </TabsTrigger>
                    )}
                    {showMessages && (
                      <TabsTrigger
                        value="messages"
                        data-tour="tour-people-tab-messages"
                        className="min-h-10 rounded-lg text-[11px] font-semibold data-[state=active]:bg-white data-[state=active]:text-[#213D59]"
                      >
                        Messages ({pendingMessages.length})
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {showAccessPeople && (
                  <TabsContent value="access" className="mt-3 space-y-3">
                    <ListPanelHeader
                      title="People you trust"
                      action={readOnly ? 'View' : 'Manage'}
                      onAction={() => onNavigateToSection('2')}
                      actionTourId="tour-people-manage-access"
                    />
                    {accessPeople.length > 0 ? (
                      <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
                        {accessPeople
                          .slice(0, 4)
                          .map((item: any, index: number) => {
                            const name =
                              item.full_name ||
                              item.person_name ||
                              'Unnamed person';
                            const relationship =
                              item.relationship || 'Trusted person';
                            return (
                              <OverviewListRow
                                key={
                                  item.id || item._id || item.email || index
                                }
                                index={index}
                                icon={
                                  <span className="text-[13px] font-bold uppercase">
                                    {String(name).charAt(0)}
                                  </span>
                                }
                                iconClassName="bg-[#213D59] text-white"
                                title={name}
                                subtitle={relationship}
                                onClick={() => onNavigateToSection('2')}
                              />
                            );
                          })}
                      </div>
                    ) : (
                      <EmptyBlock
                        title="No access people yet"
                        description={
                          readOnly
                            ? 'No trusted people are listed for this Vault yet.'
                            : 'Add trusted people who can access your Vault.'
                        }
                        action={readOnly ? undefined : 'Add access people'}
                        onClick={
                          readOnly ? undefined : () => onNavigateToSection('2')
                        }
                      />
                    )}
                  </TabsContent>
                  )}

                  {showNokLetters && (
                  <TabsContent value="nok-letters" className="mt-3 space-y-3">
                    <ListPanelHeader
                      title="Next of kin letter"
                      action={readOnly ? 'View' : 'Manage'}
                      onAction={() => onNavigateToSection('3')}
                    />
                    {nokLetter ? (
                      <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
                        <OverviewListRow
                          index={0}
                          icon={<FileText className="h-4 w-4" />}
                          iconClassName="bg-emerald-50 text-emerald-600"
                          title={`Letter to ${nokLetter.letter_to || 'Next of Kin'}`}
                          subtitle={
                            nokLetter.nok_email ||
                            'Tap to review or edit your letter'
                          }
                          onClick={() => onNavigateToSection('3')}
                        />
                      </div>
                    ) : (
                      <EmptyBlock
                        title="No letter yet"
                        description={
                          readOnly
                            ? 'No next of kin letter has been written yet.'
                            : 'Write a letter so your next of kin knows what to do.'
                        }
                        action={readOnly ? undefined : 'Create letter'}
                        onClick={
                          readOnly ? undefined : () => onNavigateToSection('3')
                        }
                      />
                    )}
                  </TabsContent>
                  )}

                  {showMessages && (
                  <TabsContent value="messages" className="mt-3 space-y-3">
                    <ListPanelHeader
                      title="Personal messages"
                      action={readOnly ? 'View' : 'Manage'}
                      onAction={() => onNavigateToSection('4')}
                    />
                    {loadingMessages ? (
                      <div className="flex items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 py-10 text-sm text-slate-500">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#213D59] border-t-transparent" />
                        Loading…
                      </div>
                    ) : pendingMessages.length > 0 ? (
                      <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
                        {pendingMessages
                          .slice(0, 4)
                          .map((item, index) => (
                            <OverviewListRow
                              key={item.id || index}
                              index={index}
                              icon={
                                item.messageType === 'video' ? (
                                  <Video className="h-4 w-4" />
                                ) : item.messageType === 'audio' ? (
                                  <Mic className="h-4 w-4" />
                                ) : (
                                  <MessageSquare className="h-4 w-4" />
                                )
                              }
                              iconClassName={
                                item.messageType === 'video'
                                  ? 'bg-rose-50 text-rose-600'
                                  : item.messageType === 'audio'
                                    ? 'bg-sky-50 text-sky-600'
                                    : 'bg-violet-50 text-violet-600'
                              }
                              title={item.title || 'Untitled message'}
                              subtitle={
                                item.recipient
                                  ? `To ${item.recipient}`
                                  : 'Draft message'
                              }
                              onClick={() => onNavigateToSection('4')}
                            />
                          ))}
                      </div>
                    ) : (
                      <EmptyBlock
                        title="No messages yet"
                        description={
                          readOnly
                            ? 'No personal messages are saved yet.'
                            : 'Create letters, audio, or video for loved ones.'
                        }
                        action={readOnly ? undefined : 'Create message'}
                        onClick={
                          readOnly ? undefined : () => onNavigateToSection('4')
                        }
                      />
                    )}
                  </TabsContent>
                  )}
                </Tabs>
              </div>
            )}
          </section>
        </>
      )}

      {/* Desktop people & messages panel */}
      {(showAccessPeople || showNokLetters || showMessages) && (
      <section
        id={isNextOfKin ? 'people-messages' : undefined}
        className={cn(
          'overview-people-hub scroll-mt-24 rounded-2xl border border-slate-200 bg-white shadow-sm',
          !isNextOfKin && 'hidden md:block',
        )}
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-[#213D59]">
                People & messages
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Access people, next of kin letter, and personal messages.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <Tabs
            value={activeTab}
            onValueChange={value => setActiveTab(value as PeopleTab)}
          >
            <TabsList
              className={cn(
                'grid h-auto w-full gap-1 rounded-xl bg-slate-100 p-1',
                [
                  showAccessPeople,
                  showNokLetters,
                  showMessages,
                ].filter(Boolean).length <= 1
                  ? 'grid-cols-1'
                  : [
                        showAccessPeople,
                        showNokLetters,
                        showMessages,
                      ].filter(Boolean).length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-3',
              )}
            >
              {showAccessPeople && (
                <TabsTrigger
                  value="access"
                  data-tour="tour-people-tab-access"
                  className="min-h-11 rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#213D59]"
                >
                  <Users className="mr-1.5 h-4 w-4" />
                  Access ({accessPeople.length})
                </TabsTrigger>
              )}
              {showNokLetters && (
                <TabsTrigger
                  value="nok-letters"
                  data-tour="tour-people-tab-letter"
                  className="min-h-11 rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#213D59]"
                >
                  <FileText className="mr-1.5 h-4 w-4" />
                  Letter ({nokLetter ? 1 : 0})
                </TabsTrigger>
              )}
              {showMessages && (
                <TabsTrigger
                  value="messages"
                  data-tour="tour-people-tab-messages"
                  className="min-h-11 rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#213D59]"
                >
                  <MessageSquare className="mr-1.5 h-4 w-4" />
                  Messages ({pendingMessages.length})
                </TabsTrigger>
              )}
            </TabsList>

            {showAccessPeople && (
            <TabsContent value="access" className="mt-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
                <div>
                  <PanelActions
                    onAction={() => onNavigateToSection('2')}
                    label={readOnly ? 'View access' : 'Manage access'}
                  />
                  {accessPeople.length > 0 ? (
                    <div className="mt-4 grid gap-4">
                      {accessPeople.map((item: any, index: number) => (
                        <AccessPersonCard
                          key={item.id || item._id || item.email || index}
                          item={item}
                          onEdit={() => onNavigateToSection('2')}
                          showSensitiveInfo={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyBlock
                      title="No access people yet"
                      description={
                        readOnly
                          ? 'No trusted people are listed for this Vault yet.'
                          : 'Add trusted people who can access your Vault.'
                      }
                      action={readOnly ? undefined : 'Add access people'}
                      onClick={
                        readOnly ? undefined : () => onNavigateToSection('2')
                      }
                    />
                  )}
                </div>

                <aside className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 shadow-sm">
                  <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-inner ring-1 ring-emerald-100">
                    <div className="relative flex h-16 w-12 items-end justify-center rounded-md bg-[#213D59]">
                      <span className="mb-2 h-5 w-5 rounded-full border-2 border-emerald-400 bg-emerald-500 shadow" />
                    </div>
                  </div>
                  <h3 className="text-center text-base font-semibold text-[#213D59]">
                    Your information is secure
                  </h3>
                  <p className="mt-2 text-center text-sm leading-relaxed text-slate-500">
                    Access people only see what you allow. You can change
                    permissions anytime.
                  </p>
                  <Button
                    type="button"
                    onClick={() => onNavigateToSection('2')}
                    data-tour="tour-people-manage-access"
                    className="mt-4 h-11 w-full rounded-xl bg-[#213D59] text-white hover:bg-[#00305C]"
                  >
                    {readOnly ? 'View Access' : 'Manage Access'}
                  </Button>
                </aside>
              </div>
            </TabsContent>
            )}

            {showNokLetters && (
            <TabsContent value="nok-letters" className="mt-5">
              <PanelActions
                onAction={() => onNavigateToSection('3')}
                label={readOnly ? 'View letter' : 'Manage letter'}
              />
              {nokLetter ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <NOKLetterCard
                    obj={nokLetter}
                    onEdit={() => onNavigateToSection('3')}
                    onView={() => onNavigateToSection('3')}
                  />
                </div>
              ) : (
                <EmptyBlock
                  title="No next of kin letter yet"
                  description={
                    readOnly
                      ? 'No next of kin letter has been written yet.'
                      : 'Write a letter so your next of kin knows what to do.'
                  }
                  action={readOnly ? undefined : 'Create letter'}
                  onClick={
                    readOnly ? undefined : () => onNavigateToSection('3')
                  }
                />
              )}
            </TabsContent>
            )}

            {showMessages && (
            <TabsContent value="messages" className="mt-5">
              <PanelActions
                onAction={() => onNavigateToSection('4')}
                label={readOnly ? 'View messages' : 'Manage messages'}
              />
              {loadingMessages ? (
                <div className="mt-4 flex items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 py-12 text-sm text-slate-500">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#213D59] border-t-transparent" />
                  Loading messages…
                </div>
              ) : pendingMessages.length > 0 ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {pendingMessages.map((item, index) => (
                    <MessageCard
                      key={item.id || index}
                      item={item}
                      onEdit={() => onNavigateToSection('4')}
                      onView={() => onNavigateToSection('4')}
                      onDelete={() => onNavigateToSection('4')}
                    />
                  ))}
                </div>
              ) : (
                <EmptyBlock
                  title="No messages yet"
                  description={
                    readOnly
                      ? 'No personal messages are saved yet.'
                      : 'Create letters, audio, or video for loved ones.'
                  }
                  action={readOnly ? undefined : 'Create message'}
                  onClick={
                    readOnly ? undefined : () => onNavigateToSection('4')
                  }
                />
              )}
            </TabsContent>
            )}
          </Tabs>
        </div>
      </section>
      )}
    </div>
  );
}

function OverviewStatCard({
  icon,
  accent,
  value,
  label,
  detail,
  action,
  onClick,
}: {
  icon: React.ReactNode;
  accent: 'blue' | 'green' | 'navy' | 'amber';
  value: string;
  label: string;
  detail: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <StatCard
      tone={accent}
      icon={icon}
      value={value}
      label={label}
      detail={detail}
      action={action}
      onClick={onClick}
    />
  );
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-1 py-3 text-[#213D59] shadow-sm active:scale-[0.98]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-600">
        {icon}
      </span>
      <span className="text-center text-[10px] font-semibold leading-tight text-[#213D59]">
        {label}
      </span>
    </button>
  );
}

function ListPanelHeader({
  title,
  action,
  onAction,
  actionTourId,
}: {
  title: string;
  action: string;
  onAction: () => void;
  actionTourId?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-0.5">
      <h2 className="text-[15px] font-semibold text-[#213D59]">{title}</h2>
      <button
        type="button"
        onClick={onAction}
        data-tour={actionTourId}
        className="inline-flex items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-sky-700 active:bg-sky-50"
      >
        {action}
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function OverviewListRow({
  index,
  icon,
  iconClassName,
  title,
  subtitle,
  onClick,
}: {
  index: number;
  icon: React.ReactNode;
  iconClassName: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full min-h-[68px] items-center gap-3 px-3.5 py-3 text-left transition active:bg-slate-50',
        index > 0 && 'border-t border-slate-100',
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
          iconClassName,
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold text-[#213D59]">
          {title}
        </span>
        <span className="mt-0.5 block truncate text-[12px] text-slate-500">
          {subtitle}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
    </button>
  );
}

function OverviewAlertRow({
  alerts,
  onOpenSection,
}: {
  alerts: OverviewExpiryAlert[];
  onOpenSection: (sectionId: string) => void;
}) {
  if (!alerts.length) {
    return (
    <div className="flex flex-wrap items-center gap-2">
        <AlertPill
          tone="ok"
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          text="Nothing due in the next 2 weeks."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {alerts.map(alert => (
        <AttentionChip
          key={alert.id}
          tone={alert.tone === 'critical' ? 'overdue' : 'dueSoon'}
          onClick={() => onOpenSection(alert.sectionId)}
        >
          {alert.text}
        </AttentionChip>
      ))}
    </div>
  );
}

function AlertPill({
  tone,
  icon,
  text,
}: {
  tone: 'warn' | 'ok' | 'critical';
  icon: React.ReactNode;
  text: string;
}) {
  const classes =
    tone === 'ok'
      ? 'inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800'
      : tone === 'critical'
        ? 'inline-flex max-w-full items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-900'
        : 'inline-flex max-w-full items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900';

  return (
    <span className={classes}>
      <span
        className={cn(
          'shrink-0',
          tone === 'ok'
            ? 'text-emerald-600'
            : tone === 'critical'
              ? 'text-rose-600'
              : 'text-amber-600',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 truncate">{text}</span>
    </span>
  );
}

function PanelActions({
  label,
  onAction,
}: {
  label: string;
  onAction: () => void;
}) {
  return (
    <div className="flex justify-end">
      <Button
        type="button"
        variant="outline"
        onClick={onAction}
        className="h-9 rounded-lg border-slate-200 text-xs sm:text-sm"
      >
        {label}
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}

function EmptyBlock({
  title,
  description,
  action,
  onClick,
}: {
  title: string;
  description: string;
  action?: string;
  onClick?: () => void;
}) {
  return (
    <EmptyState
      className="mt-3 sm:mt-4"
      variant="neverStarted"
      title={title}
      description={description}
      action={action}
      onAction={onClick}
    />
  );
}
