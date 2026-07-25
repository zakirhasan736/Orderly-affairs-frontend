'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';

import { AccessPersonCard } from './AccessPersonCard';
import { NOKLetterCard } from './NOKLetterCard';
import { MessageCard } from './MessageCard';
import { OverviewAiUploadCard } from './ai/OverviewAiUploadCard';
import { OverviewTaskBoard } from './ai/OverviewTaskBoard';
import { AiUploadSupportedSectionsHint } from './ai/AiUploadSupportedSectionsHint';
import { useDashboardAiBatchRunner } from '@/hooks/useDashboardAiBatchRunner';
import {
  buildExpiryReminderMailto,
  collectOverviewExpiryAlerts,
  markExpiryEmailPromptShown,
  wasExpiryEmailPromptShown,
  type OverviewExpiryAlert,
} from '@/utils/overviewExpiryAlerts';
import { cn } from '@common/ui/utils';
import { toast } from 'sonner';

interface DataBindingDashboardProps {
  formData: any;
  nextKinList: any[];
  nokLetter: any;
  isNextOfKin?: boolean;
  nextTask: { id: string; title: string } | null;
  onNavigateToSection: (sectionId: string) => void;
  progress?: number;
  completedCount?: number;
  totalCount?: number;
  completedSectionIds?: string[];
  lastUpdatedBySection?: Record<string, string>;
  afterHero?: React.ReactNode;
  ownerEmail?: string | null;
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
  isNextOfKin = false,
  completedCount = 0,
  totalCount = 0,
  progress = 0,
  completedSectionIds = [],
  lastUpdatedBySection = {},
  ownerEmail = null,
}: DataBindingDashboardProps) {
  const [activeTab, setActiveTab] = useState<PeopleTab>('access');
  const [mobileHubTab, setMobileHubTab] = useState<MobileHubTab>('people');
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const batch = useDashboardAiBatchRunner();

  const expiryAlerts = useMemo(
    () => collectOverviewExpiryAlerts(formDataProp),
    [formDataProp],
  );

  const vaultPct = useMemo(() => {
    if (typeof progress === 'number' && progress > 0) {
      return Math.min(100, Math.round(progress));
    }
    if (totalCount > 0) {
      return Math.min(100, Math.round((completedCount / totalCount) * 100));
    }
    return 0;
  }, [progress, completedCount, totalCount]);

  const docsFilledCount = useMemo(
    () => batch.jobs.filter(job => job.status === 'done').length,
    [batch.jobs],
  );

  const docsWorkingCount = useMemo(
    () =>
      batch.jobs.filter(
        job => job.status !== 'done' && job.status !== 'error',
      ).length,
    [batch.jobs],
  );

  useEffect(() => {
    let cancelled = false;

    const fetchMessages = async () => {
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

    fetchMessages();
    return () => {
      cancelled = true;
    };
  }, []);

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
    const onOpenPeople = () => {
      setMobileHubTab('people');
      setActiveTab('access');
    };
    window.addEventListener('orderly-open-people-hub', onOpenPeople);
    return () =>
      window.removeEventListener('orderly-open-people-hub', onOpenPeople);
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      {!isNextOfKin && (
        <>
          <OverviewAlertRow
            alerts={expiryAlerts}
            ownerEmail={ownerEmail}
            onOpenSection={onNavigateToSection}
          />

          {/* 1) Overview snapshot — vault health (mobile + desktop) */}
          <div className="overview-vault-snapshot grid grid-cols-3 gap-2 sm:gap-3">
            <OverviewStatCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              accent="sky"
              value={`${vaultPct}%`}
              label="Vault complete"
              detail={
                totalCount > 0
                  ? `${completedCount} of ${totalCount} sections`
                  : 'Track your progress'
              }
              action="Continue"
              onClick={() => {
                const done = new Set(
                  (completedSectionIds || []).map(id => String(id)),
                );
                const nextId = Array.from(
                  { length: Math.max(totalCount || 22, 1) },
                  (_, i) => String(i === 0 ? 1 : i),
                ).find(id => !done.has(id) && id !== '0');
                onNavigateToSection(nextId || '1');
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
              accent={expiryAlerts.length > 0 ? 'amber' : 'emerald'}
              value={String(expiryAlerts.length)}
              label={expiryAlerts.length === 1 ? 'Reminder due' : 'Reminders due'}
              detail={
                expiryAlerts.length > 0
                  ? 'Review dates in Alerts'
                  : 'Nothing urgent'
              }
              action={expiryAlerts.length > 0 ? 'Review' : 'All clear'}
              onClick={() => {
                if (expiryAlerts[0]?.sectionId) {
                  onNavigateToSection(expiryAlerts[0].sectionId);
                }
              }}
            />
            <OverviewStatCard
              icon={<FolderOpen className="h-4 w-4" />}
              accent="violet"
              value={String(docsFilledCount)}
              label={docsFilledCount === 1 ? 'Doc filled' : 'Docs filled'}
              detail={
                docsWorkingCount > 0
                  ? `${docsWorkingCount} in progress`
                  : 'AI document fill'
              }
              action="Upload"
              onClick={() => {
                document
                  .querySelector<HTMLElement>('[data-ai-overview-upload]')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            />
          </div>

          {/* 2) Upload document */}
          <OverviewAiUploadCard
            jobs={batch.jobs}
            enqueueFiles={batch.enqueueFiles}
            dismissJob={batch.dismissJob}
            maxConcurrent={batch.maxConcurrent}
          />
          <div className="overview-upload-types">
            <AiUploadSupportedSectionsHint />
          </div>

          {/* 3) Continue where you left off slider (+ desktop grids) */}
          <div className="overview-task-board">
            <OverviewTaskBoard
              jobs={batch.jobs}
              completedSectionIds={completedSectionIds}
              lastUpdatedBySection={lastUpdatedBySection}
              onNavigateToSection={onNavigateToSection}
            />
          </div>

          {/* 4) Quick actions */}
          <section className="md:hidden">
            <div className="grid grid-cols-4 gap-2">
              <QuickAction
                icon={<Plus className="h-4 w-4" />}
                label="Add a person"
                onClick={() => onNavigateToSection('2')}
              />
              <QuickAction
                icon={<Pencil className="h-4 w-4" />}
                label="Write letter"
                onClick={() => onNavigateToSection('3')}
              />
              <QuickAction
                icon={<Mail className="h-4 w-4" />}
                label="Send message"
                onClick={() => onNavigateToSection('4')}
              />
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
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setMobileHubTab('people')}
                  className={cn(
                    'rounded-xl px-3 py-2.5 text-[12px] font-semibold transition',
                    mobileHubTab === 'people'
                      ? 'bg-[#132b26] text-white shadow-sm'
                      : 'text-slate-500',
                  )}
                >
                  People & messages
                </button>
                <button
                  type="button"
                  onClick={() => setMobileHubTab('activity')}
                  className={cn(
                    'rounded-xl px-3 py-2.5 text-[12px] font-semibold transition',
                    mobileHubTab === 'activity'
                      ? 'bg-[#132b26] text-white shadow-sm'
                      : 'text-slate-500',
                  )}
                >
                  Recent activity
                </button>
              </div>
            </div>

            {mobileHubTab === 'activity' ? (
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
                        <span className="block truncate text-[13px] font-medium text-[#132b26]">
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
                  <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                    <TabsTrigger
                      value="access"
                      className="min-h-10 rounded-lg text-[11px] font-semibold data-[state=active]:bg-white data-[state=active]:text-[#132b26]"
                    >
                      Access ({accessPeople.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="nok-letters"
                      className="min-h-10 rounded-lg text-[11px] font-semibold data-[state=active]:bg-white data-[state=active]:text-[#132b26]"
                    >
                      Letter ({nokLetter ? 1 : 0})
                    </TabsTrigger>
                    <TabsTrigger
                      value="messages"
                      className="min-h-10 rounded-lg text-[11px] font-semibold data-[state=active]:bg-white data-[state=active]:text-[#132b26]"
                    >
                      Messages ({pendingMessages.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="access" className="mt-3 space-y-3">
                    <ListPanelHeader
                      title="People you trust"
                      action="Manage"
                      onAction={() => onNavigateToSection('2')}
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
                                iconClassName="bg-[#132b26] text-white"
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
                        description="Add trusted people who can access your kit."
                        action="Add access people"
                        onClick={() => onNavigateToSection('2')}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="nok-letters" className="mt-3 space-y-3">
                    <ListPanelHeader
                      title="Next of kin letter"
                      action="Manage"
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
                        description="Write a letter so your next of kin knows what to do."
                        action="Create letter"
                        onClick={() => onNavigateToSection('3')}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="messages" className="mt-3 space-y-3">
                    <ListPanelHeader
                      title="Personal messages"
                      action="Manage"
                      onAction={() => onNavigateToSection('4')}
                    />
                    {loadingMessages ? (
                      <div className="flex items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 py-10 text-sm text-slate-500">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#132b26] border-t-transparent" />
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
                        description="Create letters, audio, or video for loved ones."
                        action="Create message"
                        onClick={() => onNavigateToSection('4')}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </section>
        </>
      )}

      {/* Desktop people & messages panel */}
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
              <h2 className="text-lg font-semibold text-[#132b26]">
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
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
              <TabsTrigger
                value="access"
                className="min-h-11 rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#132b26]"
              >
                <Users className="mr-1.5 h-4 w-4" />
                Access ({accessPeople.length})
              </TabsTrigger>
              <TabsTrigger
                value="nok-letters"
                className="min-h-11 rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#132b26]"
              >
                <FileText className="mr-1.5 h-4 w-4" />
                Letter ({nokLetter ? 1 : 0})
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="min-h-11 rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#132b26]"
              >
                <MessageSquare className="mr-1.5 h-4 w-4" />
                Messages ({pendingMessages.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="access" className="mt-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
                <div>
                  <PanelActions
                    onAction={() => onNavigateToSection('2')}
                    label="Manage access"
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
                      description="Add trusted people who can access your kit."
                      action="Add access people"
                      onClick={() => onNavigateToSection('2')}
                    />
                  )}
                </div>

                <aside className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 shadow-sm">
                  <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-inner ring-1 ring-emerald-100">
                    <div className="relative flex h-16 w-12 items-end justify-center rounded-md bg-[#132b26]">
                      <span className="mb-2 h-5 w-5 rounded-full border-2 border-emerald-400 bg-emerald-500 shadow" />
                    </div>
                  </div>
                  <h3 className="text-center text-base font-semibold text-[#132b26]">
                    Your information is secure
                  </h3>
                  <p className="mt-2 text-center text-sm leading-relaxed text-slate-500">
                    Access people only see what you allow. You can change
                    permissions anytime.
                  </p>
                  <Button
                    type="button"
                    onClick={() => onNavigateToSection('2')}
                    className="mt-4 h-11 w-full rounded-xl bg-[#132b26] text-white hover:bg-[#0e1f1c]"
                  >
                    Manage Access
                  </Button>
                </aside>
              </div>
            </TabsContent>

            <TabsContent value="nok-letters" className="mt-5">
              <PanelActions
                onAction={() => onNavigateToSection('3')}
                label="Manage letter"
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
                  description="Write a letter so your next of kin knows what to do."
                  action="Create letter"
                  onClick={() => onNavigateToSection('3')}
                />
              )}
            </TabsContent>

            <TabsContent value="messages" className="mt-5">
              <PanelActions
                onAction={() => onNavigateToSection('4')}
                label="Manage messages"
              />
              {loadingMessages ? (
                <div className="mt-4 flex items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 py-12 text-sm text-slate-500">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#132b26] border-t-transparent" />
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
                  description="Create letters, audio, or video for loved ones."
                  action="Create message"
                  onClick={() => onNavigateToSection('4')}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
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
  accent: 'sky' | 'emerald' | 'violet' | 'amber';
  value: string;
  label: string;
  detail: string;
  action: string;
  onClick: () => void;
}) {
  const accents = {
    sky: {
      shell:
        'border-sky-100/80 bg-[linear-gradient(165deg,#ffffff_0%,#f0f9ff_100%)]',
      icon: 'bg-sky-500/10 text-sky-600 ring-sky-100',
      action: 'text-sky-700',
    },
    emerald: {
      shell:
        'border-emerald-100/80 bg-[linear-gradient(165deg,#ffffff_0%,#ecfdf5_100%)]',
      icon: 'bg-emerald-500/10 text-emerald-600 ring-emerald-100',
      action: 'text-emerald-700',
    },
    violet: {
      shell:
        'border-violet-100/80 bg-[linear-gradient(165deg,#ffffff_0%,#f5f3ff_100%)]',
      icon: 'bg-violet-500/10 text-violet-600 ring-violet-100',
      action: 'text-violet-700',
    },
    amber: {
      shell:
        'border-amber-100/80 bg-[linear-gradient(165deg,#ffffff_0%,#fffbeb_100%)]',
      icon: 'bg-amber-500/10 text-amber-600 ring-amber-100',
      action: 'text-amber-700',
    },
  }[accent];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex min-h-[118px] flex-col overflow-hidden rounded-[18px] border p-2.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition active:scale-[0.98] sm:min-h-[128px] sm:rounded-[20px] sm:p-3.5',
        accents.shell,
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-xl ring-1 sm:h-9 sm:w-9 sm:rounded-2xl',
          accents.icon,
        )}
      >
        {icon}
      </span>
      <span className="mt-2.5 text-[20px] font-bold leading-none tracking-tight text-[#132b26] sm:mt-3 sm:text-[24px]">
        {value}
      </span>
      <span className="mt-1 truncate text-[10px] font-semibold text-slate-700 sm:text-[11px]">
        {label}
      </span>
      <span className="mt-0.5 line-clamp-1 text-[9px] font-medium text-slate-400 sm:text-[10px]">
        {detail}
      </span>
      <span
        className={cn(
          'mt-auto inline-flex items-center gap-0.5 pt-2 text-[10px] font-semibold sm:text-[11px]',
          accents.action,
        )}
      >
        {action}
        <ChevronRight className="h-3 w-3" />
      </span>
    </button>
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
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-1 py-3 shadow-sm active:scale-[0.98]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-600">
        {icon}
      </span>
      <span className="text-center text-[10px] font-semibold leading-tight text-[#132b26]">
        {label}
      </span>
    </button>
  );
}

function ListPanelHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-0.5">
      <h2 className="text-[15px] font-semibold text-[#132b26]">{title}</h2>
      <button
        type="button"
        onClick={onAction}
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
        <span className="block truncate text-[14px] font-semibold text-[#132b26]">
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
  ownerEmail,
  onOpenSection,
}: {
  alerts: OverviewExpiryAlert[];
  ownerEmail?: string | null;
  onOpenSection: (sectionId: string) => void;
}) {
  useEffect(() => {
    const due = alerts.filter(
      alert =>
        alert.emailDue &&
        !wasExpiryEmailPromptShown(alert.id, alert.daysUntil),
    );
    if (!due.length) return;

    const top = due[0];
    markExpiryEmailPromptShown(top.id, top.daysUntil);
    window.setTimeout(() => {
      window.location.href = buildExpiryReminderMailto(top, ownerEmail);
      toast.message('Email reminder opened', {
        description: top.text,
      });
    }, 600);
  }, [alerts, ownerEmail]);

  const startEmail = (alert: OverviewExpiryAlert) => {
    markExpiryEmailPromptShown(alert.id, alert.daysUntil);
    window.location.href = buildExpiryReminderMailto(alert, ownerEmail);
    toast.message('Email reminder opened');
  };

  if (!alerts.length) {
    return (
      <div className="hidden flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:flex">
        <AlertPill
          tone="ok"
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          text="Nothing due in the next 2 weeks."
        />
      </div>
    );
  }

  return (
    <div className="hidden flex-col gap-2 sm:flex">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm"
        >
          <button
            type="button"
            onClick={() => onOpenSection(alert.sectionId)}
            className="min-w-0 flex-1 text-left"
          >
            <AlertPill
              tone={alert.tone === 'critical' ? 'critical' : 'warn'}
              icon={<AlarmClock className="h-3.5 w-3.5" />}
              text={alert.text}
            />
          </button>
          <button
            type="button"
            onClick={() => startEmail(alert)}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition',
              alert.emailDue
                ? 'bg-[#132b26] text-white hover:bg-[#0e1f1c]'
                : 'border border-slate-200 bg-slate-50 text-[#132b26] hover:bg-white',
            )}
          >
            <Mail className="h-3.5 w-3.5" />
            {alert.emailDue ? 'Email now' : 'Email'}
          </button>
        </div>
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
      ? 'inline-flex w-full max-w-full items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800'
      : tone === 'critical'
        ? 'inline-flex w-full max-w-full items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-900'
        : 'inline-flex w-full max-w-full items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900';

  return (
    <div className={classes}>
      <span
        className={cn(
          'shrink-0',
          tone === 'ok'
            ? 'text-emerald-600'
            : tone === 'critical'
              ? 'text-rose-600'
              : 'text-rose-500',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 break-words">{text}</span>
    </div>
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
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center sm:mt-4 sm:px-6 sm:py-10">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
        {description}
      </p>
      <Button
        type="button"
        onClick={onClick}
        className="mt-4 rounded-xl bg-[#132b26] text-white hover:bg-[#0e1f1c]"
      >
        {action}
      </Button>
    </div>
  );
}
