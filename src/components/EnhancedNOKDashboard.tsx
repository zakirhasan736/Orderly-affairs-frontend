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
  BookOpen,
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
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { formConfig } from '../config/formConfig';
import {
  formatVaultSectionTitle,
  VAULT_NAVIGATION,
} from '@/utils/vaultNavigation';
import {
  hasChecklist,
  hasDoveTag,
  isHiddenFromNokDashboard,
} from '../config/nokConfig';
import {
  type NextKinOwnerSummary,
  useGetMyNextKinAccessQuery,
  useGetAfterDeathCaseQuery,
  useReportOwnerDeceasedMutation,
  useUploadDeathCertificateMutation,
} from '@/services/authApi';
import { NokMfaSettingsSheet } from '@/components/NokMfaSettingsSheet';
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
  didit?: {
    configured?: boolean;
    status?: string;
    approved?: boolean;
    session_url?: string | null;
    is_attorney_or_executor?: boolean;
    didit_before_report?: boolean;
  };
  death_verification?: {
    certificate_uploaded?: boolean;
    certificate_filename?: string | null;
    ssdmf_status?: string | null;
  };
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

const SECTION_ICONS: Record<string, LucideIcon> = {
  '1': Users,
  '2': Car,
  '3': Home,
  '4': Shield,
  '5': Users,
  '6': HeartHandshake,
  '7': GraduationCap,
  '8': Landmark,
  '9': Banknote,
  '10': Shield,
  '11': Sparkles,
  '12': Heart,
  '13': CreditCard,
  '14': Users,
  '15': Briefcase,
  '16': Building2,
  '17': FileText,
  '18': Landmark,
  '19': FileText,
  '20': FileText,
  '21': Flower2,
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
          stroke="#3EB1E5"
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
  const [mfaSettingsOpen, setMfaSettingsOpen] = useState(false);
  const [reportPassword, setReportPassword] = useState('');
  const [reportConfirmed, setReportConfirmed] = useState(false);
  const [certDragOver, setCertDragOver] = useState(false);
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
  const [uploadDeathCertificate, { isLoading: uploadingCert }] =
    useUploadDeathCertificateMutation();
  const { data: afterDeath } = useGetAfterDeathCaseQuery(undefined, {
    skip: isPreview,
  });
  const afterDeathCase = afterDeath?.case;

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
          didit: access.didit,
          death_verification: access.death_verification || undefined,
        }
      : undefined;

  const allSections = useMemo(() => {
    const order = new Map(VAULT_NAVIGATION.map((s, i) => [s.id, i]));
    return formConfig.chunks
      .flatMap(chunk => chunk.sections)
      .slice()
      .sort(
        (a, b) =>
          (order.get(String(a.id)) ?? 999) - (order.get(String(b.id)) ?? 999),
      );
  }, []);

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
    'the Vault owner';
  const ownerIsDeceased = ownerStatus === 'deceased';
  const deathReportPending = Boolean(
    effectiveAccess?.owner?.death_report_pending,
  );
  const canUploadCertificate =
    !isPreview && (deathReportPending || ownerIsDeceased);
  const certOnFile = Boolean(
    effectiveAccess?.death_verification?.certificate_uploaded,
  );

  const uploadCertificate = async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    try {
      const result = await uploadDeathCertificate(form).unwrap();
      await refetchAccess();
      toast.success(
        result.message ||
          'Certificate received. Independent death records were checked for the vault owner. Access stays sealed until our team releases it.',
      );
    } catch (err: unknown) {
      toast.error(
        getSafeErrorMessage(err, 'Could not upload the death certificate.'),
      );
    }
  };

  const handleCertificateFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) await uploadCertificate(file);
  };

  const handleCertificateDrop = async (
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    setCertDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) await uploadCertificate(file);
  };

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
      setMfaSettingsOpen(true);
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
          'Passing reported. Upload the death certificate next. The vault stays sealed.',
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
      <div className="grid min-h-[100dvh] place-items-center bg-[#F6F8FA]">
        <div className="h-10 w-10 animate-pulse rounded-2xl bg-[#3EB1E5]" />
      </div>
    );
  }

  if (!isPreview && (accessError as any)?.status === 403) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#F6F8FA] px-5">
        <div className="w-full max-w-md rounded-[16px] border border-[#E4EAF0] bg-white p-7">
          <Shield className="mb-3 h-8 w-8 text-[#3EB1E5]" />
          <h2 className="font-[family-name:var(--font-family-display)] text-xl font-normal text-[#213D59]">
            Awaiting approval
          </h2>
          <p className="mt-2 text-sm text-[#7A8794]">
            The Vault owner hasn&apos;t approved your access yet.
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
      <div className="grid min-h-[100dvh] place-items-center bg-[#F6F8FA]">
        <p className="text-sm text-[#7A8794]">Unable to load your access.</p>
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
        'fixed inset-y-0 left-0 z-[70] flex w-[88vw] max-w-[272px] flex-col border-r border-[#E4EAF0] bg-white shadow-2xl transition-transform duration-300 ease-out md:sticky md:top-0 md:z-20 md:h-screen md:w-[272px] md:max-w-none md:translate-x-0 md:shadow-none',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#EFF3F7] px-5 pb-3 pt-5">
        <button
          type="button"
          onClick={() => applyNav('dashboard')}
          className="flex min-w-0 items-center gap-2.5 text-left"
        >
          <Image
            src={BRAND_LOGO}
            alt="Orderly Affairs"
            width={36}
            height={36}
            className="h-9 w-9 rounded-[10px] bg-[#213D59] object-contain p-0.5"
          />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-bold tracking-tight text-[#213D59]">
              Orderly Affairs
            </span>
            <span className="block text-[11.5px] font-semibold uppercase tracking-wide text-[#7A8794]">
              Next of Kin
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="grid h-9 w-9 place-items-center rounded-[9px] text-[#213D59] md:hidden"
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
                'flex w-full items-center gap-3 rounded-[9px] px-3 py-2 text-left text-[14px] transition',
                active
                  ? 'bg-[#213D59] font-semibold text-white'
                  : 'text-[#414A55] hover:bg-[#EFF3F7]',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-[#E4EAF0] px-3 py-4">
        <button
          type="button"
          onClick={() => applyNav('settings')}
          className="flex w-full items-center gap-3 rounded-[9px] px-3 py-2 text-left text-[14px] text-[#414A55] hover:bg-[#EFF3F7]"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <div className="rounded-[16px] bg-[#213D59] p-4 text-white">
          <p className="text-[13px] font-semibold">Need help?</p>
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
            className="mt-3 h-9 w-auto rounded-full bg-[#3EB1E5] px-3 text-[12px] font-semibold text-[#16293C] hover:bg-[#7ACAF9]"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </aside>
  );

  const RightRail = (
    <aside className="hidden w-[300px] shrink-0 space-y-4 xl:block">
      <div className="overflow-hidden rounded-[16px] bg-[#213D59] p-5 text-white">
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

      <div className="rounded-[16px] border border-[#E4EAF0] bg-white p-4">
        <p className="text-[13px] font-semibold text-[#213D59]">Quick Actions</p>
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
                className="flex w-full items-center gap-3 rounded-[9px] px-2.5 py-2.5 text-left text-[13px] font-medium text-[#414A55] transition hover:bg-[#EFF3F7]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#EAF6FC] text-[#3EB1E5]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-[#EAF6FC] px-1.5 py-0.5 text-[10px] font-bold text-[#2E7FAD]">
                    {item.badge}
                  </span>
                ) : null}
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[16px] border border-[#E4EAF0] bg-white p-4">
        <p className="text-[13px] font-semibold text-[#213D59]">
          Recent Activity
        </p>
        <div className="mt-3 space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-[12px] text-[#7A8794]">No recent activity yet.</p>
          ) : (
            recentActivity.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => openSection(item.id)}
                className="flex w-full items-start gap-3 text-left"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#EAF6FC] text-[#3EB1E5]">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-[#213D59]">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-[#7A8794]">{item.when}</span>
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
          className="text-lg font-semibold text-[#213D59]"
        >
          Confirm passing report
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This starts Orderly Affairs&apos; verification. Vault access and
          sealed letters stay closed until our team releases them.
        </p>
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] leading-5 text-amber-950">
          You do not need a second person to approve this report. If the owner
          is still living, they are emailed so they can tell us this was a
          mistake. After-death next of kin receive a claim link only after an
          admin releases access.
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
            I confirm that {ownerName} has passed. I understand this reports
            a passing for verification and does not instantly unlock the vault.
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
    <div className="min-h-[100dvh] bg-[#F6F8FA] font-[family-name:var(--font-family)] text-[#213D59] pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
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
          <header className="sticky top-0 z-40 min-h-[70px] border-b border-[#E4EAF0] bg-white/95 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-[1480px] min-h-[70px] items-center gap-3 px-4 sm:px-5 md:px-6 lg:px-8 xl:px-10">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#F6F8FA] text-[#213D59] md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1">
                <h1 className="truncate font-[family-name:var(--font-family-display)] text-[20px] font-normal tracking-tight text-[#213D59] sm:text-[24px]">
                  {isPreview ? 'NOK Preview' : 'Next of Kin'}
                </h1>
                <p className="mt-0.5 truncate text-[12px] text-[#7A8794] sm:text-[13px]">
                  Welcome,{' '}
                  <span className="font-semibold text-[#213D59]">
                    {displayName}
                  </span>
                  {' · '}
                  {accessLabel}
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setHeaderSearchOpen(v => !v);
                    scrollToSections();
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E4EAF0] text-[#7A8794] transition hover:bg-[#F6F8FA]"
                  aria-label="Search"
                >
                  <Search className="h-[18px] w-[18px]" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen(v => !v)}
                    className="flex items-center gap-2 rounded-full border border-[#E4EAF0] bg-white py-1 pl-1 pr-2 transition hover:bg-[#F6F8FA] sm:pr-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3EB1E5] text-[11px] font-bold text-[#16293C]">
                      {initials || 'NK'}
                    </span>
                    <span className="hidden min-w-0 text-left sm:block">
                      <span className="block max-w-[120px] truncate text-[12px] font-semibold text-[#213D59]">
                        {displayName}
                      </span>
                      <span className="block text-[10px] text-[#7A8794]">
                        {accessLabel}
                      </span>
                    </span>
                    <ChevronDown className="hidden h-3.5 w-3.5 text-[#7A8794] sm:block" />
                  </button>
                  {profileOpen ? (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-40"
                        aria-label="Close profile menu"
                        onClick={() => setProfileOpen(false)}
                      />
                      <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-[16px] border border-[#E4EAF0] bg-white py-1 shadow-xl">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            onLogout();
                          }}
                          className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] font-medium text-[#414A55] hover:bg-[#F6F8FA]"
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
            {headerSearchOpen ? (
              <div className="border-t border-[#E4EAF0] px-4 py-2.5 sm:px-5 md:px-6 lg:px-8 xl:px-10">
                <div className="relative mx-auto max-w-xl">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8794]" />
                  <Input
                    autoFocus
                    placeholder="Search sections"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="h-10 rounded-full border-[#E4EAF0] bg-[#F6F8FA] pl-10 text-[#213D59]"
                  />
                </div>
              </div>
            ) : null}
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
                        bar: 'bg-[#3EB1E5]',
                        track: 'bg-[#EAF6FC]',
                        icon: FileText,
                        showBar: true,
                      },
                      {
                        label: `${stats.progress}% Overall progress`,
                        value: stats.progress,
                        bar: 'bg-[#3EB1E5]',
                        track: 'bg-[#EAF6FC]',
                        icon: CheckCircle2,
                        showBar: true,
                      },
                      {
                        label: `${stats.obituarySections} Obituary sections`,
                        icon: Flower2,
                        showBar: false,
                      },
                      {
                        label: `${stats.checklistSections} With checklists`,
                        icon: ClipboardList,
                        showBar: false,
                      },
                    ].map(card => {
                      const Icon = card.icon;
                      return (
                        <div
                          key={card.label}
                          className="rounded-[16px] border border-[#E4EAF0] bg-white p-3.5 sm:p-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[12px] font-semibold leading-5 text-[#213D59] sm:text-[13px]">
                              {card.label}
                            </p>
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#EAF6FC] text-[#3EB1E5]">
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
                  <div className="hidden rounded-[16px] bg-[#213D59] p-4 text-white md:block xl:hidden">
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

                  {afterDeathCase ? (
                    <div className="rounded-[20px] border border-[#213D59]/15 bg-white p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5c6b66]">
                        After-Death Access Request
                      </p>
                      <dl className="mt-3 grid gap-2 text-[13px] text-[#213D59]">
                        <div className="flex justify-between gap-3">
                          <dt className="text-[#5c6b66]">Owner</dt>
                          <dd>{afterDeathCase.owner_display_name}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-[#5c6b66]">Case</dt>
                          <dd>{afterDeathCase.case_reference}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-[#5c6b66]">Your relationship</dt>
                          <dd>{afterDeathCase.relationship || '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-[#5c6b66]">Your identity</dt>
                          <dd>{afterDeathCase.identity_label}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-[#5c6b66]">Death certificate</dt>
                          <dd>{afterDeathCase.certificate_label}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-[#5c6b66]">Owner death record check</dt>
                          <dd>{afterDeathCase.death_record_label}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-[#5c6b66]">Owner protection period</dt>
                          <dd>{afterDeathCase.protection_label}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-[#5c6b66]">Admin review</dt>
                          <dd>{afterDeathCase.admin_label}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-[#5c6b66]">Access</dt>
                          <dd>{afterDeathCase.access_label}</dd>
                        </div>
                      </dl>
                      <p className="mt-3 text-[12px] leading-5 text-[#5c6b66]">
                        Identity is completed at first sign-in. Report a passing,
                        then upload the death certificate. The owner’s 7-day
                        (168-hour) hold and death-record check start when that
                        file is stored. An Orderly Affairs admin still has to
                        release access by hand. Nothing is automatic.
                      </p>
                    </div>
                  ) : null}

                  {ownerIsDeceased && !isPreview && (
                    <div className="flex gap-3 rounded-[20px] border border-amber-200 bg-amber-50 p-4">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                      <div>
                        <p className="text-sm font-semibold text-amber-950">
                          Passing recorded for {ownerName}
                        </p>
                        <p className="mt-1 text-[13px] text-amber-900/80">
                          After-death claim links go out only after identity
                          verification and a human release.
                        </p>
                      </div>
                    </div>
                  )}

                  {canUploadCertificate && (
                    <div
                      className={`rounded-[20px] border p-4 ${
                        certDragOver
                          ? 'border-[#3EB1E5] bg-[#EAF6FC]'
                          : 'border-[#213D59]/20 bg-white'
                      }`}
                      onDragOver={event => {
                        event.preventDefault();
                        setCertDragOver(true);
                      }}
                      onDragLeave={() => setCertDragOver(false)}
                      onDrop={event => void handleCertificateDrop(event)}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <Upload className="mt-0.5 h-5 w-5 shrink-0 text-[#213D59]" />
                          <div>
                            <p className="text-sm font-semibold text-[#213D59]">
                              {certOnFile
                                ? 'Death certificate on file'
                                : 'Upload a death certificate'}
                            </p>
                            <p className="mt-1 text-[13px] leading-5 text-[#5c6b66]">
                              {certOnFile
                                ? `We received the certificate. Owner death record check: ${afterDeathCase?.death_record_label || 'Pending'}. The owner was notified and a 7-day hold is running. Our team still has to release access.`
                                : 'Drag and drop a PDF or photo here, or choose a file. After we store it privately, independent U.S. death records are checked for the vault owner, and the owner is emailed on a 7-day schedule. That still does not unlock the kit.'}
                            </p>
                          </div>
                        </div>
                        <label className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#213D59] px-4 text-sm font-medium text-white">
                          {uploadingCert
                            ? 'Uploading…'
                            : certOnFile
                              ? 'Replace file'
                              : 'Choose file'}
                          <input
                            type="file"
                            accept="application/pdf,image/jpeg,image/png,image/webp"
                            className="sr-only"
                            disabled={uploadingCert}
                            onChange={event => void handleCertificateFile(event)}
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {!ownerIsDeceased &&
                    !deathReportPending &&
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
                              After {ownerName} has passed, report it here. You
                              will then upload the death certificate. The vault
                              stays sealed until our team releases access.
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
                    <h2 className="mb-3 font-[family-name:var(--font-family-display)] text-[18px] font-normal text-[#213D59]">
                      Important actions
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={onOwnerLetterAccess}
                        className="flex items-center gap-3 rounded-[16px] border border-[#E4EAF0] bg-white p-4 text-left transition hover:border-[#3EB1E5]/40 active:scale-[0.99]"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#EAF6FC] text-[#3EB1E5]">
                          <Heart className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-semibold text-[#213D59]">
                            Read personal letter
                          </span>
                          <span className="mt-0.5 block text-[12px] text-[#7A8794]">
                            Access the personal letter written for you
                          </span>
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F6F8FA] text-[#7A8794]">
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </button>
                      <a
                        href="/instructions-for-next-of-kin"
                        className="flex items-center gap-3 rounded-[16px] border border-[#E4EAF0] bg-white p-4 text-left transition hover:border-[#3EB1E5]/40 active:scale-[0.99]"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#EAF6FC] text-[#3EB1E5]">
                          <BookOpen className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-semibold text-[#213D59]">
                            Instructions for next of kin
                          </span>
                          <span className="mt-0.5 block text-[12px] text-[#7A8794]">
                            What to do now, and how access is released
                          </span>
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F6F8FA] text-[#7A8794]">
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </a>
                      <button
                        type="button"
                        onClick={onDeliverMessages}
                        className="flex items-center gap-3 rounded-[16px] border border-[#E4EAF0] bg-white p-4 text-left transition hover:border-[#3EB1E5]/40 active:scale-[0.99]"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#EAF6FC] text-[#3EB1E5]">
                          <Mail className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-semibold text-[#213D59]">
                            Deliver messages
                          </span>
                          <span className="mt-0.5 block text-[12px] text-[#7A8794]">
                            Send messages to other loved ones
                          </span>
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F6F8FA] text-[#7A8794]">
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </button>
                    </div>
                  </section>

                  {/* Sections */}
                  <section
                    id="nok-sections"
                    className="authorized-sections rounded-[16px] border border-[#E4EAF0] bg-white p-3 sm:p-5"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h2 className="font-[family-name:var(--font-family-display)] text-[18px] font-normal text-[#213D59]">
                        All sections
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilter('all');
                          setActiveNav('all');
                          setSearchQuery('');
                        }}
                        className="text-[13px] font-semibold text-[#2E7FAD]"
                      >
                        View All
                      </button>
                    </div>

                    <div className="mb-3 flex gap-2">
                      <div className="relative min-w-0 flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8794]" />
                        <Input
                          placeholder="Search sections..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="h-11 rounded-[10px] border-[#E4EAF0] bg-[#F6F8FA] pl-9 text-[#213D59]"
                        />
                      </div>
                    </div>

                    <div className="mb-3 hidden gap-1 overflow-x-auto border-b border-[#E4EAF0] sm:flex">
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
                                ? 'border-[#3EB1E5] text-[#213D59]'
                                : 'border-transparent text-[#7A8794] hover:text-[#213D59]',
                            )}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    {visibleSections.length === 0 ? (
                      <div className="px-2 py-12 text-center">
                        <p className="text-sm text-[#7A8794]">
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
                            const Icon =
                              SECTION_ICONS[section.id] || SECTION_ICONS['1'];
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
                                className="flex w-full items-center gap-3 rounded-[16px] border border-[#E4EAF0] bg-white p-3 text-left active:scale-[0.99] disabled:opacity-70"
                              >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#EAF6FC] text-[#3EB1E5]">
                                  <Icon className="h-[18px] w-[18px]" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[13px] font-semibold text-[#213D59]">
                                    {formatVaultSectionTitle(section)}
                                  </span>
                                  <span className="text-[11px] text-[#7A8794]">
                                    {isOpening
                                      ? 'Opening…'
                                      : isCompleted
                                        ? 'Completed'
                                        : 'Tap to open'}
                                  </span>
                                </span>
                                {hasChecklist(section.id) ? (
                                  <ClipboardList className="h-4 w-4 shrink-0 text-[#3EB1E5]" />
                                ) : null}
                                {isCompleted ? (
                                  <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-[#1F9D6B]" />
                                ) : (
                                  <Circle className="h-[18px] w-[18px] shrink-0 text-[#E4EAF0]" />
                                )}
                                <ChevronRight className="h-4 w-4 shrink-0 text-[#7A8794]" />
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
                            const Icon =
                              SECTION_ICONS[section.id] || SECTION_ICONS['1'];
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
                                className="flex items-center gap-3 rounded-[16px] border border-[#E4EAF0] bg-white p-3.5 text-left transition hover:border-[#3EB1E5]/40 active:scale-[0.99] disabled:opacity-70"
                              >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#EAF6FC] text-[#3EB1E5]">
                                  <Icon className="h-[18px] w-[18px]" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[13px] font-semibold text-[#213D59]">
                                    {formatVaultSectionTitle(section)}
                                  </span>
                                  <span className="mt-0.5 block text-[11px] text-[#7A8794]">
                                    {isOpening
                                      ? 'Opening…'
                                      : isCompleted
                                        ? 'Completed'
                                        : 'Not reviewed'}
                                  </span>
                                </span>
                                {hasChecklist(section.id) ? (
                                  <ClipboardList className="h-3.5 w-3.5 shrink-0 text-[#3EB1E5]" />
                                ) : null}
                                {isCompleted ? (
                                  <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-[#1F9D6B]" />
                                ) : (
                                  <Circle className="h-[18px] w-[18px] shrink-0 text-[#E4EAF0]" />
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

      {!isPreview ? (
        <NokMfaSettingsSheet
          open={mfaSettingsOpen}
          onOpenChange={setMfaSettingsOpen}
        />
      ) : null}
    </div>
  );
}
