'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getMessages } from '@/libs/api/lettersOfNaxtKinMessage';

import { Card, CardContent } from '@common/ui/card';
import { Button } from '@common/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@common/ui/tabs';
import { Badge } from '@common/ui/badge';
import { Progress } from '@common/ui/progress';

import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleCheck,
  Clock3,
  FileText,
  Fingerprint,
  LockKeyhole,
  Mail,
  MessageCircleHeart,
  MessageSquare,
  Mic,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  X,
} from 'lucide-react';

import { AccessPersonCard } from './AccessPersonCard';
import { NOKLetterCard } from './NOKLetterCard';
import { MessageCard } from './MessageCard';

interface DataBindingDashboardProps {
  formData: any;
  nextKinList: any[];
  nokLetter: any;
  isNextOfKin?: boolean;
  nextTask: { id: string; title: string } | null;
  onNavigateToSection: (sectionId: string) => void;
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

type MessageFilter = 'all' | 'letter' | 'audio' | 'video';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function safeText(value: any) {
  return String(value || '').toLowerCase();
}

function accessPersonName(item: any) {
  return item?.full_name || item?.person_name || '';
}

function accessPersonEmail(item: any) {
  return item?.email || item?.email_address || '';
}

function accessPersonPhone(item: any) {
  return item?.phone_number || item?.phone || '';
}

function hasData(value: any) {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
}

export function DataBindingDashboard({
  formData,
  nextKinList,
  nokLetter,
  onNavigateToSection,
  isNextOfKin = false,
  nextTask,
}: DataBindingDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [messageFilter, setMessageFilter] = useState<MessageFilter>('all');
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const response = await getMessages();
        setMessages(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, []);

  const accessManagementData = useMemo(() => {
    return Array.isArray(nextKinList) ? nextKinList : [];
  }, [nextKinList]);

  const nextOfKinLetterData = nokLetter;

  const fallbackLettersData = useMemo(() => {
    return (
      formData?.['4']?.['4A']?.letters_data ||
      formData?.['4A']?.letters_data ||
      []
    );
  }, [formData]);

  const hasMessagesData = useMemo(() => {
    return messages.length > 0 || hasData(fallbackLettersData);
  }, [messages.length, fallbackLettersData]);

  const computedProgress = useMemo(() => {
    const checks = [
      hasData(accessManagementData),
      hasData(nextOfKinLetterData),
      hasMessagesData,
    ];

    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [accessManagementData, nextOfKinLetterData, hasMessagesData]);

  const remainingProgress = Math.max(0, 100 - computedProgress);

  const allPendingMessages = useMemo(() => {
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

  const filteredAccessData = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return accessManagementData;

    return accessManagementData.filter((item: any) => {
      return (
        safeText(accessPersonName(item)).includes(search) ||
        safeText(item.relationship).includes(search) ||
        safeText(accessPersonEmail(item)).includes(search) ||
        safeText(accessPersonPhone(item)).includes(search)
      );
    });
  }, [accessManagementData, searchTerm]);

  const pendingMessages = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return allPendingMessages
      .filter(item =>
        messageFilter === 'all' ? true : item.messageType === messageFilter,
      )
      .filter(item => {
        if (!search) return true;

        return (
          safeText(item.title).includes(search) ||
          safeText(item.recipient).includes(search) ||
          safeText(item.recipientEmail).includes(search) ||
          safeText(item.content).includes(search) ||
          safeText(item.subject).includes(search)
        );
      });
  }, [allPendingMessages, messageFilter, searchTerm]);

  const letterCount = allPendingMessages.filter(
    item => item.messageType === 'letter',
  ).length;

  const audioCount = allPendingMessages.filter(
    item => item.messageType === 'audio',
  ).length;

  const videoCount = allPendingMessages.filter(
    item => item.messageType === 'video',
  ).length;

  const clearFilters = () => {
    setSearchTerm('');
    setMessageFilter('all');
  };

  const goToNextIncompleteSection = () => {
    const sections = [
      { id: '2', data: accessManagementData },
      { id: '3', data: nextOfKinLetterData },
      { id: '4', data: hasMessagesData },
    ];

    const incomplete = sections.find(section => !hasData(section.data));

    if (incomplete) {
      onNavigateToSection(incomplete.id);
      return;
    }

    onNavigateToSection(nextTask?.id || '0');
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.08),transparent_34%)]" />

        <div className="relative grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-8">
          <div className="min-w-0 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-slate-950 px-3 py-1 text-white hover:bg-slate-950">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Dashboard Overview
              </Badge>

              <Badge
                variant="outline"
                className="rounded-full border-slate-200 bg-white/80 px-3 py-1 text-slate-600"
              >
                {computedProgress}% organized
              </Badge>
            </div>

            <div>
              <h1 className="max-w-3xl text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
                Your secure vault overview.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Review trusted access, next-of-kin letters, and personal
                messages from one clear place before opening any section.
              </p>
            </div>

            <div className="max-w-xl rounded-[26px] border border-slate-200 bg-white/75 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <ShieldCheck className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Legacy setup progress
                    </p>
                    <p className="text-xs text-slate-500">
                      {remainingProgress > 0
                        ? `${remainingProgress}% left to complete`
                        : 'Core overview completed'}
                    </p>
                  </div>
                </div>

                <span className="text-lg font-semibold text-slate-950">
                  {computedProgress}%
                </span>
              </div>

              <Progress value={computedProgress} className="mt-4 h-2.5" />

              <div className="mt-4 grid grid-cols-3 gap-2">
                <ProgressPill
                  active={accessManagementData.length > 0}
                  label="Access"
                />
                <ProgressPill
                  active={Boolean(nextOfKinLetterData)}
                  label="NOK"
                />
                <ProgressPill active={hasMessagesData} label="Messages" />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={goToNextIncompleteSection}
                className="h-12 rounded-2xl bg-slate-950 px-5 text-white shadow-sm hover:bg-slate-800"
              >
                Continue organizing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigateToSection('0')}
                className="h-12 rounded-2xl border-slate-200 bg-white px-5"
              >
                Open guide
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 rounded-[26px] border border-slate-200 bg-white/75 p-2 shadow-sm backdrop-blur">
              <HeroMetric
                icon={<Users className="h-4 w-4" />}
                label="Access"
                value={accessManagementData.length}
              />
              <HeroMetric
                icon={<FileText className="h-4 w-4" />}
                label="NOK"
                value={nextOfKinLetterData ? 1 : 0}
              />
              <HeroMetric
                icon={<MessageCircleHeart className="h-4 w-4" />}
                label="Messages"
                value={allPendingMessages.length}
              />
            </div>

            <div className="rounded-[28px] bg-slate-950 p-5 text-white shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Next best action
                  </p>

                  <h3 className="mt-3 text-base font-bold leading-6">
                    {nextTask
                      ? `Complete ${nextTask.title}`
                      : 'Your core overview is ready'}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {nextTask
                      ? 'Jump to the next section that needs your attention.'
                      : 'You can continue reviewing or editing your details.'}
                  </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <Clock3 className="h-5 w-5" />
                </div>
              </div>

              <Button
                type="button"
                onClick={() => onNavigateToSection(nextTask?.id || '0')}
                className="mt-5 h-11 w-full rounded-2xl bg-white text-slate-950 hover:bg-slate-100"
              >
                {nextTask ? 'Open next section' : 'Open guide'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <LockKeyhole className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-950">
                    Vault protected
                  </p>
                  <p className="text-xs text-slate-500">
                    Sensitive information stays secured.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickActionCard
          title="Instructions"
          description="Guide and setup notes"
          icon={<FileText className="h-5 w-5" />}
          tone="emerald"
          onClick={() => onNavigateToSection('0')}
        />

        <QuickActionCard
          title="Access People"
          description={`${accessManagementData.length} authorized ${
            accessManagementData.length === 1 ? 'person' : 'people'
          }`}
          icon={<Fingerprint className="h-5 w-5" />}
          tone="indigo"
          onClick={() => onNavigateToSection('2')}
        />

        <QuickActionCard
          title="Next of Kin"
          description={
            nextOfKinLetterData ? 'Letter configured' : 'No letter yet'
          }
          icon={<ShieldCheck className="h-5 w-5" />}
          tone="rose"
          onClick={() => onNavigateToSection('3')}
        />

        <QuickActionCard
          title="Messages"
          description={`${allPendingMessages.length} pending ${
            allPendingMessages.length === 1 ? 'message' : 'messages'
          }`}
          icon={<MessageCircleHeart className="h-5 w-5" />}
          tone="blue"
          onClick={() => onNavigateToSection('4')}
        />
      </section>

      {/* SEARCH + FILTER */}
      <section className="sticky top-[84px] z-20 rounded-[26px] border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-xl md:static md:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Search people, recipients, emails, messages..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-11 text-sm font-medium text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-slate-900/10"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm hover:text-slate-900"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
            <FilterChip
              active={messageFilter === 'all'}
              onClick={() => setMessageFilter('all')}
            >
              All {allPendingMessages.length}
            </FilterChip>

            <FilterChip
              active={messageFilter === 'letter'}
              onClick={() => setMessageFilter('letter')}
            >
              <Mail className="mr-1.5 h-4 w-4" />
              Letters {letterCount}
            </FilterChip>

            <FilterChip
              active={messageFilter === 'audio'}
              onClick={() => setMessageFilter('audio')}
            >
              <Mic className="mr-1.5 h-4 w-4" />
              Audio {audioCount}
            </FilterChip>

            <FilterChip
              active={messageFilter === 'video'}
              onClick={() => setMessageFilter('video')}
            >
              <Video className="mr-1.5 h-4 w-4" />
              Video {videoCount}
            </FilterChip>
          </div>
        </div>

        {(searchTerm || messageFilter !== 'all') && (
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">
              Showing filtered results
            </p>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 rounded-xl"
            >
              Clear
            </Button>
          </div>
        )}
      </section>

      {/* CONTENT TABS */}
      <Tabs defaultValue="access" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-[22px] bg-slate-100 p-1">
          <TabsTrigger
            value="access"
            className="min-h-12 rounded-2xl px-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm sm:text-sm"
          >
            <Users className="mr-1.5 h-4 w-4" />
            <span>Access</span>
          </TabsTrigger>

          <TabsTrigger
            value="nok-letters"
            className="min-h-12 rounded-2xl px-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm sm:text-sm"
          >
            <FileText className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">NOK Letter</span>
            <span className="sm:hidden">NOK</span>
          </TabsTrigger>

          <TabsTrigger
            value="messages"
            className="min-h-12 rounded-2xl px-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm sm:text-sm"
          >
            <MessageSquare className="mr-1.5 h-4 w-4" />
            <span>Messages</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="access" className="mt-5">
          <SectionHeader
            title="Access Management"
            description="Trusted people who may access or help manage your important information."
            count={filteredAccessData.length}
            actionLabel="Manage Access"
            onAction={() => onNavigateToSection('2')}
          />

          {filteredAccessData.length > 0 ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {filteredAccessData.map((item: any, index: number) => (
                <AccessPersonCard
                  key={item.id || item._id || item.email || `access-${index}`}
                  item={item}
                  onEdit={() => onNavigateToSection('2')}
                  showSensitiveInfo={false}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="No access people found"
              description={
                searchTerm
                  ? 'No authorized people match your current search.'
                  : 'Add trusted people who can access or help manage your kit.'
              }
              buttonLabel={searchTerm ? 'Clear search' : 'Add access people'}
              onClick={
                searchTerm
                  ? () => setSearchTerm('')
                  : () => onNavigateToSection('2')
              }
            />
          )}
        </TabsContent>

        <TabsContent value="nok-letters" className="mt-5">
          <SectionHeader
            title="Next of Kin Letter"
            description="A clear letter to guide your designated next of kin."
            count={nextOfKinLetterData ? 1 : 0}
            actionLabel="Manage Letter"
            onAction={() => onNavigateToSection('3')}
          />

          {nextOfKinLetterData ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <NOKLetterCard
                obj={nextOfKinLetterData}
                onEdit={() => onNavigateToSection('3')}
                onView={() => onNavigateToSection('3')}
              />
            </div>
          ) : (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="No next of kin letter yet"
              description="Create a helpful letter so your next of kin knows what to do first."
              buttonLabel="Create letter"
              onClick={() => onNavigateToSection('3')}
            />
          )}
        </TabsContent>

        <TabsContent value="messages" className="mt-5">
          <SectionHeader
            title="Personal Messages"
            description="Letters, audio, and video messages prepared for loved ones."
            count={pendingMessages.length}
            actionLabel="Manage Messages"
            onAction={() => onNavigateToSection('4')}
          />

          {loadingMessages ? (
            <Card className="mt-4 rounded-[28px] border-dashed border-slate-200">
              <CardContent className="flex items-center justify-center gap-3 p-10 text-slate-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                Loading personal messages...
              </CardContent>
            </Card>
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
            <EmptyState
              icon={<MessageCircleHeart className="h-8 w-8" />}
              title="No messages found"
              description={
                searchTerm || messageFilter !== 'all'
                  ? 'No messages match your current filters.'
                  : 'Create heartfelt letters, voice notes, or videos for loved ones.'
              }
              buttonLabel={
                searchTerm || messageFilter !== 'all'
                  ? 'Clear filters'
                  : 'Create message'
              }
              onClick={
                searchTerm || messageFilter !== 'all'
                  ? clearFilters
                  : () => onNavigateToSection('4')
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SMALL COMPONENTS                                                    */
/* ------------------------------------------------------------------ */

function ProgressPill({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[11px] font-bold',
        active ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-400',
      )}
    >
      {active ? (
        <CircleCheck className="h-3.5 w-3.5" />
      ) : (
        <span className="h-3.5 w-3.5 rounded-full border border-current" />
      )}
      {label}
    </div>
  );
}

function HeroMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[22px] bg-slate-50 p-3 text-center">
      <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm">
        {icon}
      </div>

      <p className="text-lg font-semibold leading-none text-slate-950">{value}</p>
      <p className="mt-1 text-[11px] font-semibold text-slate-400">{label}</p>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  tone,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  tone: 'emerald' | 'indigo' | 'rose' | 'blue';
  onClick: () => void;
}) {
  const toneClass = {
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600',
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-[28px] border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5"
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition group-hover:scale-105',
            toneClass,
          )}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-sm font-semibold text-slate-950 sm:text-base">
            {title}
          </h3>

          <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500 sm:text-sm">
            {description}
          </p>
        </div>

        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-900" />
      </div>
    </button>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? 'default' : 'outline'}
      onClick={onClick}
      className={cn(
        'h-10 shrink-0 rounded-2xl px-4 text-xs font-bold sm:text-sm',
        active
          ? 'bg-slate-950 text-white hover:bg-slate-800'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
      )}
    >
      {children}
    </Button>
  );
}

function SectionHeader({
  title,
  description,
  count,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  count: number;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0">
        <Badge variant="secondary" className="mb-2 rounded-full">
          {count} {count === 1 ? 'item' : 'items'}
        </Badge>

        <h2 className="text-base font-semibold text-slate-950 sm:text-lg">
          {title}
        </h2>

        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onAction}
        className="h-11 rounded-2xl border-slate-200 bg-white"
      >
        {actionLabel}
      </Button>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  buttonLabel,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <Card className="mt-4 rounded-[32px] border-dashed border-slate-200 bg-slate-50/60">
      <CardContent className="p-8 text-center sm:p-12">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-white text-slate-950 shadow-sm">
          {icon}
        </div>

        <h3 className="text-base font-semibold text-slate-950 sm:text-lg">
          {title}
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>

        <Button
          type="button"
          onClick={onClick}
          className="mt-5 rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
        >
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
