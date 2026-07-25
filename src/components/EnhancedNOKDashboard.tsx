'use client';

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import { Button } from '@common/ui/button';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import {
  AlertTriangle,
  Banknote,
  Briefcase,
  Building2,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardList,
  CreditCard,
  FileText,
  Flower2,
  GraduationCap,
  Heart,
  HeartHandshake,
  Home,
  Landmark,
  LayoutGrid,
  ListChecks,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Search,
  Settings,
  Shield,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { formConfig } from '../config/formConfig';
import {
  hasChecklist,
  hasDoveTag,
  isHiddenFromNokDashboard,
} from '../config/nokConfig';
import {
  type NextKinOwnerSummary,
  useGetMyNextKinAccessQuery,
  useReportOwnerDeceasedMutation,
} from '@/services/authApi';
import { toast } from 'sonner';
import { getSafeErrorMessage } from '@/utils/safeErrorMessage';
import {
  MobileBottomSheet,
  MobileSheetHandle,
  useIsMobile,
} from '@/components/MobileBottomSheet';
import { NokBottomNav } from '@/components/nok/NokBottomNav';
import { cn } from '@common/ui/utils';
import { BRAND_LOGO } from '@/constants/brand';

interface KitSection {
  id: string;
  data?: any;
  subsections?: { data?: any }[];
}

type ContentFilter = 'all' | 'obituary' | 'checklists';
type NavKey =
  | 'dashboard'
  | 'all'
  | 'obituary'
  | 'actions'
  | 'checklists'
  | 'messages'
  | 'settings';

type DashboardAccess = {
  full_access: boolean;
  authorized_sections: 'all' | string[];
  nextkin: { full_name?: string; email?: string };
  immediate_access?: boolean;
  owner?: NextKinOwnerSummary;
};

interface PreviewAccess {
  full_access: boolean;
  authorized_sections: 'all' | string[];
  nextkin?: { full_name?: string; email?: string };
  immediate_access?: boolean;
  owner?: NextKinOwnerSummary;
}

interface EnhancedNOKDashboardProps {
  nokData: any;
  kit: { sections?: KitSection[] };
  formData: Record<string, any>;
  onViewSection: (sectionId: string) => void;
  onLogout: () => void;
  onOwnerLetterAccess: () => void;
  onDeliverMessages: () => void;
  sessionTime: number;
  previewAccess?: PreviewAccess;
  onPrefetchSection?: (sectionId: string) => void;
}

const SECTION_ICONS: Record<
  string,
  { icon: LucideIcon; bg: string; fg: string }
> = {
  '1': { icon: Users, bg: 'bg-sky-50', fg: 'text-sky-600' },
  '2': { icon: Car, bg: 'bg-indigo-50', fg: 'text-indigo-600' },
  '3': { icon: Home, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  '4': { icon: Shield, bg: 'bg-violet-50', fg: 'text-violet-600' },
  '5': { icon: Users, bg: 'bg-cyan-50', fg: 'text-cyan-600' },
  '6': { icon: HeartHandshake, bg: 'bg-rose-50', fg: 'text-rose-500' },
  '7': { icon: GraduationCap, bg: 'bg-amber-50', fg: 'text-amber-600' },
  '8': { icon: Landmark, bg: 'bg-slate-100', fg: 'text-slate-600' },
  '9': { icon: Banknote, bg: 'bg-teal-50', fg: 'text-teal-600' },
  '10': { icon: Shield, bg: 'bg-orange-50', fg: 'text-orange-600' },
  '11': { icon: Sparkles, bg: 'bg-fuchsia-50', fg: 'text-fuchsia-600' },
  '12': { icon: Heart, bg: 'bg-pink-50', fg: 'text-pink-600' },
  '13': { icon: CreditCard, bg: 'bg-blue-50', fg: 'text-blue-600' },
  '14': { icon: Users, bg: 'bg-lime-50', fg: 'text-lime-700' },
  '15': { icon: Briefcase, bg: 'bg-stone-100', fg: 'text-stone-600' },
  '16': { icon: Building2, bg: 'bg-yellow-50', fg: 'text-yellow-700' },
  '17': { icon: FileText, bg: 'bg-sky-50', fg: 'text-sky-700' },
  '18': { icon: Landmark, bg: 'bg-indigo-50', fg: 'text-indigo-700' },
  '19': { icon: FileText, bg: 'bg-slate-100', fg: 'text-slate-600' },
  '20': { icon: FileText, bg: 'bg-violet-50', fg: 'text-violet-700' },
  '21': { icon: Flower2, bg: 'bg-rose-50', fg: 'text-rose-600' },
};

function ProgressRing({
  value,
  size = 112,
  stroke = 8,
}: {
  value: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, value) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#60a5fa"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums text-white">
          {value}%
        </span>
      </div>
    </div>
  );
}

export function EnhancedNOKDashboard({
  kit,
  onViewSection,
  onLogout,
  onOwnerLetterAccess,
  onDeliverMessages,
  previewAccess,
  onPrefetchSection,
}: EnhancedNOKDashboardProps) {
  const isMobile = useIsMobile();
  const [activeNav, setActiveNav] = useState<NavKey>('dashboard');
  const [activeFilter, setActiveFilter] = useState<ContentFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPassword, setReportPassword] = useState('');
  const [reportConfirmed, setReportConfirmed] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isPreview = !!previewAccess;

  const {
    data: access,
    error: accessError,
    isLoading: accessLoading,
    refetch: refetchAccess,
  } = useGetMyNextKinAccessQuery(undefined, { skip: isPreview });
  const [reportOwnerDeceased, { isLoading: reportingDeceased }] =
    useReportOwnerDeceasedMutation();

  const effectiveAccess: DashboardAccess | undefined = isPreview
    ? {
        full_access: previewAccess!.full_access,
        authorized_sections: previewAccess!.authorized_sections,
        nextkin: previewAccess!.nextkin ?? {},
        immediate_access: previewAccess!.immediate_access,
        owner: previewAccess!.owner,
      }
    : access
      ? {
          full_access: access.full_access,
          authorized_sections: access.authorized_sections,
          nextkin: access.nextkin,
          immediate_access: access.immediate_access,
          owner: access.owner,
        }
      : undefined;

  const allSections = useMemo(
    () => formConfig.chunks.flatMap(chunk => chunk.sections),
    [],
  );

  const allowedIds = useMemo(() => {
    if (!effectiveAccess) return new Set<string>();
    if (
      effectiveAccess.full_access ||
      effectiveAccess.authorized_sections === 'all'
    ) {
      return new Set(allSections.map(s => s.id));
    }
    return new Set((effectiveAccess.authorized_sections as string[]) || []);
  }, [effectiveAccess, allSections]);

  const getSectionCompletionStatus = (sectionId: string) => {
    const section = kit?.sections?.find((s: any) => s.id === sectionId);
    if (!section) return false;
    const values = [
      section.data,
      ...(section.subsections || []).map((ss: any) => ss.data),
    ];
    return values.some(value => {
      if (!value) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return Object.keys(value).length > 0;
      return Boolean(value);
    });
  };

  const baseSections = useMemo(
    () =>
      allSections.filter(
        sec => allowedIds.has(sec.id) && !isHiddenFromNokDashboard(sec.id),
      ),
    [allSections, allowedIds],
  );

  const visibleSections = useMemo(() => {
    let filtered = baseSections;
    if (activeFilter === 'obituary') {
      filtered = filtered.filter(sec => hasDoveTag(sec.id));
    } else if (activeFilter === 'checklists') {
      filtered = filtered.filter(sec => hasChecklist(sec.id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        section =>
          section.title.toLowerCase().includes(q) ||
          section.id.toLowerCase().includes(q) ||
          section.subsections?.some((sub: any) =>
            sub.title?.toLowerCase().includes(q),
          ),
      );
    }
    return filtered;
  }, [baseSections, activeFilter, searchQuery]);

  useEffect(() => {
    if (!onPrefetchSection) return;
    visibleSections.slice(0, 12).forEach(s => onPrefetchSection(s.id));
  }, [visibleSections, onPrefetchSection]);

  const stats = useMemo(() => {
    const total = baseSections.length;
    const completed = baseSections.filter(s =>
      getSectionCompletionStatus(s.id),
    ).length;
    const obituarySections = baseSections.filter(s =>
      hasDoveTag(s.id),
    ).length;
    const checklistSections = baseSections.filter(s =>
      hasChecklist(s.id),
    ).length;
    return {
      total,
      completed,
      obituarySections,
      checklistSections,
      progress:
        total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100)),
    };
  }, [baseSections, kit]);

  const recentActivity = useMemo(() => {
    return baseSections
      .filter(s => getSectionCompletionStatus(s.id))
      .slice(0, 3)
      .map((s, i) => ({
        id: s.id,
        title: `Reviewed ${s.title}`,
        when: i === 0 ? 'Recently' : i === 1 ? 'Earlier' : 'Previously',
      }));
  }, [baseSections, kit]);

  const ownerStatus = effectiveAccess?.owner?.status ?? 'alive';
  const ownerName =
    effectiveAccess?.owner?.full_name ||
    effectiveAccess?.owner?.email ||
    'the kit owner';
  const ownerIsDeceased = ownerStatus === 'deceased';
  const displayName =
    effectiveAccess?.nextkin?.full_name?.trim() ||
    effectiveAccess?.nextkin?.email ||
    'Trusted person';
  const accessLabel = effectiveAccess?.full_access
    ? 'Full Access'
    : 'Limited Access';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('');

  const openSection = (sectionId: string) => {
    setOpeningId(sectionId);
    onPrefetchSection?.(sectionId);
    startTransition(() => onViewSection(sectionId));
  };

  const scrollToSections = () => {
    document
      .getElementById('nok-sections')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const applyNav = (key: NavKey) => {
    setActiveNav(key);
    setSidebarOpen(false);
    if (key === 'dashboard') {
      setActiveFilter('all');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (key === 'all') {
      setActiveFilter('all');
      scrollToSections();
      return;
    }
    if (key === 'obituary') {
      setActiveFilter('obituary');
      scrollToSections();
      return;
    }
    if (key === 'actions' || key === 'checklists') {
      setActiveFilter('checklists');
      scrollToSections();
      return;
    }
    if (key === 'messages') {
      onDeliverMessages();
      return;
    }
    if (key === 'settings') {
      toast.message('Vault settings are managed by the kit owner.');
    }
  };

  const handleReportPassing = async () => {
    if (!reportPassword.trim() || !reportConfirmed) {
      toast.error('Enter your password and confirm this report');
      return;
    }
    try {
      const result = await reportOwnerDeceased({
        master_password: reportPassword,
        confirm: true,
      }).unwrap();
      setShowReportModal(false);
      setReportPassword('');
      setReportConfirmed(false);
      await refetchAccess();
      toast.success(
        result.message ||
          'Passing recorded. Letters and upon-death access are being processed.',
      );
    } catch (err: unknown) {
      toast.error(
        getSafeErrorMessage(err, 'Unable to record this report. Try again.'),
      );
    }
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setReportPassword('');
    setReportConfirmed(false);
  };

  if (!isPreview && accessLoading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#f6f8fb]">
        <div className="h-10 w-10 animate-pulse rounded-2xl bg-[#132b26]" />
      </div>
    );
  }

  if (!isPreview && (accessError as any)?.status === 403) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#f6f8fb] px-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
          <Shield className="mb-3 h-8 w-8 text-[#132b26]" />
          <h2 className="text-xl font-semibold text-[#132b26]">
            Awaiting approval
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            The kit owner hasn&apos;t approved your access yet.
          </p>
          <Button
            onClick={onLogout}
            variant="outline"
            className="mt-6 h-11 w-auto rounded-xl"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>
    );
  }

  if (!effectiveAccess) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#f6f8fb]">
        <p className="text-sm text-slate-500">Unable to load your access.</p>
      </div>
    );
  }

  const navItems: {
    key: NavKey;
    label: string;
    icon: LucideIcon;
  }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: Home },
    { key: 'all', label: 'All Sections', icon: LayoutGrid },
    { key: 'obituary', label: 'Obituary Material', icon: Flower2 },
    { key: 'actions', label: 'Action Items', icon: ClipboardList },
    { key: 'checklists', label: 'Checklists', icon: ListChecks },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
  ];

  const tabs: { id: ContentFilter; label: string }[] = [
    { id: 'all', label: 'All Sections' },
    { id: 'obituary', label: 'Obituary Material' },
    { id: 'checklists', label: 'Action Items' },
  ];

  const SidebarNav = (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-[70] flex w-[88vw] max-w-[300px] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out md:sticky md:top-0 md:z-20 md:h-screen md:w-[272px] md:max-w-none md:translate-x-0 md:shadow-none',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}
    >
      <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-6">
        <button
          type="button"
          onClick={() => applyNav('dashboard')}
          className="flex min-w-0 items-center gap-2.5 text-left"
        >
          <Image
            src={BRAND_LOGO}
            alt="Orderly Affairs"
            width={40}
            height={40}
            className="h-10 w-10 rounded-xl bg-white object-contain p-0.5 ring-1 ring-[#132b26]/10"
          />
          <span className="truncate text-[15px] font-semibold tracking-tight text-[#132b26]">
            Orderly Affairs
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 md:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {navItems.map(item => {
          const active = activeNav === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => applyNav(item.key)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-semibold transition',
                active
                  ? 'bg-[#132b26] text-white shadow-md shadow-slate-900/10'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-slate-100 px-3 py-4">
        <button
          type="button"
          onClick={() => applyNav('settings')}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-semibold text-slate-600 hover:bg-slate-100"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <div className="rounded-2xl bg-[#132b26] p-4 text-white">
          <p className="text-[13px] font-semibold">Need Help?</p>
          <p className="mt-1 text-[11px] leading-4 text-white/70">
            We&apos;re here if you need guidance.
          </p>
          <Button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('orderly-open-help', {
                  detail: { mode: 'chat' },
                }),
              )
            }
            className="mt-3 h-9 w-auto rounded-xl bg-white px-3 text-[12px] font-semibold text-[#132b26] hover:bg-slate-100"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </aside>
  );

  const RightRail = (
    <aside className="hidden w-[300px] shrink-0 space-y-4 xl:block">
      <div className="overflow-hidden rounded-[24px] bg-[#132b26] p-5 text-white shadow-lg shadow-slate-900/10">
        <p className="text-[12px] font-medium text-white/70">Overall Progress</p>
        <div className="mt-4 flex justify-center">
          <ProgressRing value={stats.progress} />
        </div>
        <p className="mt-4 text-center text-[13px] font-semibold leading-5">
          {stats.progress >= 90
            ? 'Almost there!'
            : stats.progress >= 50
              ? 'Great progress'
              : 'Getting started'}{' '}
          {stats.completed} of {stats.total} sections completed
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={scrollToSections}
          className="mt-4 h-9 w-auto rounded-xl border-white/25 bg-white/10 px-4 text-[12px] font-semibold text-white hover:bg-white/15 hover:text-white"
        >
          View Progress
        </Button>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[13px] font-semibold text-[#132b26]">Quick Actions</p>
        <div className="mt-3 space-y-1">
          {[
            {
              label: 'View All Sections',
              icon: LayoutGrid,
              onClick: () => applyNav('all'),
            },
            {
              label: 'View Checklists',
              icon: ListChecks,
              onClick: () => applyNav('checklists'),
            },
            {
              label: 'Unread Messages',
              icon: Mail,
              onClick: onDeliverMessages,
              badge: null as number | null,
            },
            {
              label: 'Action Items',
              icon: ClipboardList,
              onClick: () => applyNav('actions'),
              badge: stats.checklistSections || null,
            },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[13px] font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[#132b26]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
                    {item.badge}
                  </span>
                ) : null}
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[13px] font-semibold text-[#132b26]">
          Recent Activity
        </p>
        <div className="mt-3 space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-[12px] text-slate-500">No recent activity yet.</p>
          ) : (
            recentActivity.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => openSection(item.id)}
                className="flex w-full items-start gap-3 text-left"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-[#132b26]">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-slate-400">{item.when}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  );

  const reportBody = (
    <>
      {isMobile ? <MobileSheetHandle /> : null}
      <div className={cn('px-5', isMobile ? 'pb-2 pt-1' : 'pt-5')}>
        <h3
          id="nok-report-title"
          className="text-lg font-semibold text-[#132b26]"
        >
          Confirm passing report
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This cannot be undone. Re-enter your password to confirm.
        </p>
        <div className="mt-4 space-y-2">
          <Label htmlFor="report-password">Master password</Label>
          <Input
            id="report-password"
            type="password"
            value={reportPassword}
            onChange={e => setReportPassword(e.target.value)}
            autoComplete="current-password"
            className="h-11 rounded-xl"
          />
        </div>
        <label className="mt-4 flex items-start gap-2.5 text-sm leading-6 text-slate-700">
          <input
            type="checkbox"
            checked={reportConfirmed}
            onChange={e => setReportConfirmed(e.target.checked)}
            className="mt-1"
          />
          <span>
            I confirm that {ownerName} has passed and I understand this will
            release upon-death content and access.
          </span>
        </label>
        <div className="mt-5 flex flex-wrap gap-2.5 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            variant="outline"
            className="h-11 w-auto rounded-xl px-5"
            onClick={closeReportModal}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="h-11 w-auto rounded-xl px-5"
            disabled={reportingDeceased}
            onClick={() => void handleReportPassing()}
          >
            {reportingDeceased ? 'Submitting…' : 'Confirm'}
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh] bg-[#f6f8fb] text-slate-950 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <div className="flex min-h-[100dvh] md:min-h-0">
        {SidebarNav}

        {sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-slate-950/55 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation overlay"
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top header */}
          <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-[1480px] items-center gap-3 px-4 py-3 sm:px-5 md:px-6 lg:px-8 xl:px-10">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#132b26] md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[17px] font-semibold tracking-tight text-[#132b26] sm:text-xl md:text-2xl">
                  {isPreview ? 'NOK Preview' : 'Next of Kin Dashboard'}
                </h1>
                <p className="mt-0.5 truncate text-[12px] text-slate-500 sm:text-[13px]">
                  Welcome,{' '}
                  <span className="font-semibold text-[#132b26]">
                    {displayName}
                  </span>{' '}
                  — {accessLabel}
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setHeaderSearchOpen(v => !v);
                    scrollToSections();
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
                  aria-label="Search"
                >
                  <Search className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen(v => !v)}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2 transition hover:bg-slate-50 sm:pr-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#132b26] text-[11px] font-bold text-white">
                      {initials || 'NK'}
                    </span>
                    <span className="hidden min-w-0 text-left sm:block">
                      <span className="block max-w-[120px] truncate text-[12px] font-semibold text-[#132b26]">
                        {displayName}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {accessLabel}
                      </span>
                    </span>
                    <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
                  </button>
                  {profileOpen ? (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-40"
                        aria-label="Close profile menu"
                        onClick={() => setProfileOpen(false)}
                      />
                      <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            onLogout();
                          }}
                          className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <LogOut className="h-4 w-4" />
                          {isPreview ? 'Exit Preview' : 'Log out'}
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1">
            <div className="mx-auto w-full max-w-[1480px] px-4 py-4 sm:px-5 md:px-6 md:py-6 lg:px-8 xl:px-10">
              <div className="flex gap-6">
                <div className="nok-welcome min-w-0 flex-1 space-y-4 md:space-y-5">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
                    {[
                      {
                        label: `${stats.completed} of ${stats.total} sections completed`,
                        value: stats.progress,
                        bar: 'bg-sky-500',
                        track: 'bg-sky-100',
                        card: 'bg-sky-50/90 border-sky-100',
                        icon: FileText,
                        iconWrap: 'bg-white text-sky-600',
                        showBar: true,
                      },
                      {
                        label: `${stats.progress}% Overall progress`,
                        value: stats.progress,
                        bar: 'bg-emerald-500',
                        track: 'bg-emerald-100',
                        card: 'bg-emerald-50/90 border-emerald-100',
                        icon: CheckCircle2,
                        iconWrap: 'bg-white text-emerald-600',
                        showBar: true,
                      },
                      {
                        label: `${stats.obituarySections} Obituary sections`,
                        card: 'bg-violet-50/90 border-violet-100',
                        icon: Flower2,
                        iconWrap: 'bg-white text-violet-600',
                        showBar: false,
                      },
                      {
                        label: `${stats.checklistSections} With checklists`,
                        card: 'bg-orange-50/90 border-orange-100',
                        icon: ClipboardList,
                        iconWrap: 'bg-white text-orange-600',
                        showBar: false,
                      },
                    ].map(card => {
                      const Icon = card.icon;
                      return (
                        <div
                          key={card.label}
                          className={cn(
                            'rounded-[18px] border p-3.5 shadow-sm sm:rounded-[20px] sm:p-4',
                            card.card,
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[12px] font-semibold leading-5 text-[#132b26] sm:text-[13px]">
                              {card.label}
                            </p>
                            <span
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm',
                                card.iconWrap,
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                          </div>
                          {card.showBar ? (
                            <div
                              className={cn(
                                'mt-3 h-1.5 overflow-hidden rounded-full',
                                card.track,
                              )}
                            >
                              <div
                                className={cn('h-full rounded-full', card.bar)}
                                style={{ width: `${card.value}%` }}
                              />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {/* Tablet progress (right rail substitute) */}
                  <div className="hidden rounded-[20px] bg-[#132b26] p-4 text-white md:block xl:hidden">
                    <div className="flex items-center gap-4">
                      <ProgressRing value={stats.progress} size={72} stroke={6} />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold">
                          Overall progress
                        </p>
                        <p className="mt-1 text-[12px] text-white/70">
                          {stats.completed} of {stats.total} sections completed
                        </p>
                      </div>
                    </div>
                  </div>

                  {ownerIsDeceased && !isPreview && (
                    <div className="flex gap-3 rounded-[20px] border border-amber-200 bg-amber-50 p-4">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                      <div>
                        <p className="text-sm font-semibold text-amber-950">
                          Passing recorded for {ownerName}
                        </p>
                        <p className="mt-1 text-[13px] text-amber-900/80">
                          Letters and upon-death access have been processed.
                        </p>
                      </div>
                    </div>
                  )}

                  {!ownerIsDeceased &&
                    !isPreview &&
                    effectiveAccess.immediate_access && (
                      <div className="flex flex-col gap-3 rounded-[20px] border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                          <div>
                            <p className="text-sm font-semibold text-rose-950">
                              Report a passing
                            </p>
                            <p className="mt-1 text-[13px] leading-5 text-rose-900/75">
                              Only use this after {ownerName} has passed. This
                              releases upon-death letters, messages, and access.
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={() => setShowReportModal(true)}
                          className="h-10 w-auto shrink-0 rounded-xl px-4"
                        >
                          Report passing
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    )}

                  {/* Important actions */}
                  <section className="owner-letter">
                    <h2 className="mb-3 text-[15px] font-semibold text-[#132b26]">
                      Important Actions
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={onOwnerLetterAccess}
                        className="flex items-center gap-3 rounded-[20px] border border-rose-100 bg-rose-50/60 p-4 text-left transition hover:bg-rose-50 active:scale-[0.99]"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
                          <Heart className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-semibold text-[#132b26]">
                            Read Personal Letter
                          </span>
                          <span className="mt-0.5 block text-[12px] text-slate-500">
                            Access the personal letter written for you
                          </span>
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={onDeliverMessages}
                        className="flex items-center gap-3 rounded-[20px] border border-sky-100 bg-sky-50/60 p-4 text-left transition hover:bg-sky-50 active:scale-[0.99]"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
                          <Mail className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-semibold text-[#132b26]">
                            Deliver Messages
                          </span>
                          <span className="mt-0.5 block text-[12px] text-slate-500">
                            Send messages to other loved ones
                          </span>
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </button>
                    </div>
                  </section>

                  {/* Sections */}
                  <section
                    id="nok-sections"
                    className="authorized-sections rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm sm:p-5"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h2 className="text-[15px] font-semibold text-[#132b26]">
                        All Sections
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilter('all');
                          setActiveNav('all');
                          setSearchQuery('');
                        }}
                        className="text-[13px] font-semibold text-sky-600"
                      >
                        View All
                      </button>
                    </div>

                    <div className="mb-3 flex gap-2">
                      <div className="relative min-w-0 flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          placeholder="Search sections..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-9"
                        />
                      </div>
                    </div>

                    <div className="mb-3 hidden gap-1 overflow-x-auto border-b border-slate-100 sm:flex">
                      {tabs.map(tab => {
                        const active = activeFilter === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setActiveFilter(tab.id);
                              setActiveNav(
                                tab.id === 'all'
                                  ? 'all'
                                  : tab.id === 'obituary'
                                    ? 'obituary'
                                    : 'actions',
                              );
                            }}
                            className={cn(
                              'shrink-0 border-b-2 px-3 py-2 text-[13px] font-semibold transition',
                              active
                                ? 'border-[#132b26] text-[#132b26]'
                                : 'border-transparent text-slate-500 hover:text-[#132b26]',
                            )}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    {visibleSections.length === 0 ? (
                      <div className="px-2 py-12 text-center">
                        <p className="text-sm text-slate-500">
                          No sections in this view
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-3 h-9 w-auto rounded-xl"
                          onClick={() => {
                            setActiveFilter('all');
                            setSearchQuery('');
                            setActiveNav('all');
                          }}
                        >
                          Show all sections
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Mobile list (attachment) */}
                        <div className="space-y-2 sm:hidden">
                          {visibleSections.map(section => {
                            const isCompleted = getSectionCompletionStatus(
                              section.id,
                            );
                            const meta =
                              SECTION_ICONS[section.id] || SECTION_ICONS['1'];
                            const Icon = meta.icon;
                            const isOpening =
                              openingId === section.id && isPending;
                            return (
                              <button
                                key={section.id}
                                type="button"
                                onClick={() => openSection(section.id)}
                                onTouchStart={() =>
                                  onPrefetchSection?.(section.id)
                                }
                                disabled={isOpening}
                                className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-sm active:scale-[0.99] disabled:opacity-70"
                              >
                                <span
                                  className={cn(
                                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                                    meta.bg,
                                    meta.fg,
                                  )}
                                >
                                  <Icon className="h-[18px] w-[18px]" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[13px] font-semibold text-[#132b26]">
                                    {section.id}. {section.title}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {isOpening
                                      ? 'Opening…'
                                      : isCompleted
                                        ? 'Completed'
                                        : 'Tap to open'}
                                  </span>
                                </span>
                                {hasChecklist(section.id) ? (
                                  <ClipboardList className="h-4 w-4 shrink-0 text-orange-400" />
                                ) : null}
                                {isCompleted ? (
                                  <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-emerald-500" />
                                ) : (
                                  <Circle className="h-[18px] w-[18px] shrink-0 text-slate-300" />
                                )}
                                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                              </button>
                            );
                          })}
                        </div>

                        {/* Desktop/tablet grid */}
                        <div className="mt-1 hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                          {visibleSections.map(section => {
                            const isCompleted = getSectionCompletionStatus(
                              section.id,
                            );
                            const meta =
                              SECTION_ICONS[section.id] || SECTION_ICONS['1'];
                            const Icon = meta.icon;
                            const isOpening =
                              openingId === section.id && isPending;

                            return (
                              <button
                                key={section.id}
                                type="button"
                                onClick={() => openSection(section.id)}
                                onMouseEnter={() =>
                                  onPrefetchSection?.(section.id)
                                }
                                disabled={isOpening}
                                className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-3.5 text-left shadow-sm transition hover:border-[#132b26]/25 hover:shadow-md active:scale-[0.99] disabled:opacity-70"
                              >
                                <span
                                  className={cn(
                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                                    meta.bg,
                                    meta.fg,
                                  )}
                                >
                                  <Icon className="h-[18px] w-[18px]" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[13px] font-semibold text-[#132b26]">
                                    {section.id}. {section.title}
                                  </span>
                                  <span className="mt-0.5 block text-[11px] text-slate-400">
                                    {isOpening
                                      ? 'Opening…'
                                      : isCompleted
                                        ? 'Completed'
                                        : 'Not reviewed'}
                                  </span>
                                </span>
                                {hasChecklist(section.id) ? (
                                  <ClipboardList className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                                ) : null}
                                {isCompleted ? (
                                  <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-emerald-500" />
                                ) : (
                                  <Circle className="h-[18px] w-[18px] shrink-0 text-slate-300" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </section>
                </div>

                {RightRail}
              </div>
            </div>
          </main>
        </div>
      </div>

      <NokBottomNav
        active={
          sidebarOpen
            ? 'more'
            : activeNav === 'dashboard'
              ? 'dashboard'
              : activeNav === 'messages'
                ? 'messages'
                : activeNav === 'checklists' || activeNav === 'actions'
                  ? 'checklists'
                  : 'sections'
        }
        onDashboard={() => applyNav('dashboard')}
        onSections={() => applyNav('all')}
        onMessages={() => applyNav('messages')}
        onChecklists={() => applyNav('checklists')}
        onMore={() => setSidebarOpen(true)}
      />

      {/* Report modal / sheet */}
      {isMobile ? (
        <MobileBottomSheet
          open={showReportModal}
          onClose={closeReportModal}
          labelledBy="nok-report-title"
        >
          {reportBody}
        </MobileBottomSheet>
      ) : showReportModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45"
            aria-label="Close"
            onClick={closeReportModal}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl">
            {reportBody}
          </div>
        </div>
      ) : null}
    </div>
  );
}
