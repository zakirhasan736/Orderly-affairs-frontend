// src/components/EnhancedNOKDashboard.tsx
import React, { useMemo, useState } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Badge } from '@common/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  Circle,
  Heart,
  FileText,
  List,
  Loader2,
  Search,
  LogOut,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@common/ui/alert-dialog';
import { Input } from '@common/ui/input';
import { formConfig } from '../config/formConfig';
import {
  hasChecklist,
  hasDoveTag,
  isHiddenFromNokDashboard,
} from '../config/nokConfig';
import {
  useGetMyNextKinAccessQuery,
  useReportOwnerDeceasedMutation,
} from '@/services/authApi';
import { toast } from 'sonner';
interface KitSection {
  id: string;
  data?: any;
  subsections?: {
    data?: any;
  }[];
}


type Filter = 'all' | 'obituary' | 'checklists';

interface PreviewAccess {
  full_access: boolean;
  authorized_sections: 'all' | string[];
  nextkin?: { full_name?: string; email?: string };
}

interface EnhancedNOKDashboardProps {
  nokData: any;
  kit: {
    sections?: KitSection[];
  };
  formData: Record<string, any>;
  onViewSection: (sectionId: string) => void;
  onLogout: () => void;
  onOwnerLetterAccess: () => void;
  onDeliverMessages: () => void;
  sessionTime: number;
  previewAccess?: PreviewAccess;
}


export function EnhancedNOKDashboard({
  nokData,
  kit,
  onViewSection,
  onLogout,
  onOwnerLetterAccess,
  onDeliverMessages,
  sessionTime,
  previewAccess,
}: EnhancedNOKDashboardProps) {
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeathReportDialog, setShowDeathReportDialog] = useState(false);
  const [reportOwnerDeceased, { isLoading: isReportingDeath }] =
    useReportOwnerDeceasedMutation();

  const isPreview = !!previewAccess;

  // Either use live API or preview access
  const {
    data: access,
    error: accessError,
    isLoading: accessLoading,
  } = useGetMyNextKinAccessQuery(undefined, { skip: isPreview });

  const effectiveAccess = isPreview
    ? {
        full_access: previewAccess!.full_access,
        authorized_sections: previewAccess!.authorized_sections,
        nextkin: previewAccess!.nextkin ?? {},
      }
    : access;

  // Sections source
const allSections = useMemo(
  () => formConfig.chunks.flatMap(chunk => chunk.sections),
  [],
);


  // Allowed IDs
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

  // Completion helper
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

  // Visible sections
  const visibleSections = useMemo(() => {
    const base = allSections.filter(
      sec => allowedIds.has(sec.id) && !isHiddenFromNokDashboard(sec.id),
    );
    let filtered = base;

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
          section.subsections?.some((sub: any) =>
            sub.title.toLowerCase().includes(q),
          ),
      );
    }
    return filtered;
  }, [allSections, allowedIds, activeFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = visibleSections.length;
    const completed = visibleSections.filter(s =>
      getSectionCompletionStatus(s.id),
    ).length;
    const obituarySections = visibleSections.filter(s =>
      hasDoveTag(s.id),
    ).length;
    const checklistSections = visibleSections.filter(s =>
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
  }, [visibleSections, kit]);

  const ownerStatus = effectiveAccess?.owner?.status ?? 'alive';
  const ownerName =
    effectiveAccess?.owner?.full_name ||
    effectiveAccess?.owner?.email ||
    'the kit owner';
  const ownerIsDeceased = ownerStatus === 'deceased';
  const canReportOwnerPassing =
    !isPreview && effectiveAccess?.immediate_access && !ownerIsDeceased;

  const handleReportOwnerPassing = async () => {
    try {
      const result = await reportOwnerDeceased().unwrap();
      setShowDeathReportDialog(false);

      if (result.already_reported) {
        toast.info('This passing has already been recorded.');
      } else {
        toast.success(
          result.message ||
            'Passing recorded. Death letters and upon-death access notifications have been sent.',
        );
      }
    } catch (error: any) {
      toast.error(
        error?.data?.detail || 'Unable to record the passing right now.',
      );
    }
  };

  // Loading (only when NOT preview)
  if (!isPreview && accessLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">Loading your access…</div>
      </div>
    );
  }

  // Awaiting approval (403) — friendly screen
  if (!isPreview && (accessError as any)?.status === 403) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Awaiting Approval</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your access hasn’t been approved by the Kit Owner yet. You’ll see
              the sections you’re allowed to view once your access is granted.
            </p>
            <Button onClick={onLogout} variant="outline" className="w-full">
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Unexpected error
  if (!effectiveAccess) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">Unable to load your access.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="sticky top-0 z-10 border-b"
        style={{
          background: 'var(--glass-light-fill)',
          backdropFilter: 'blur(var(--background-blur))',
          WebkitBackdropFilter: 'blur(var(--background-blur))',
          border: 'var(--border-width) solid var(--border-light)',
          borderRadius: 'var(--corner-radius-panel)',
          boxShadow: 'var(--shadow-light)',
        }}
      >
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-brand-primary">
                {isPreview
                  ? 'Preview: Next of Kin Dashboard'
                  : 'Next of Kin Dashboard'}
              </h1>
              <p className="text-muted-foreground mt-1">
                Welcome
                {effectiveAccess?.nextkin?.full_name
                  ? `, ${effectiveAccess.nextkin.full_name}`
                  : ''}{' '}
                —{' '}
                {effectiveAccess.full_access
                  ? 'Full Access'
                  : 'Section-Specific Access'}
                {isPreview ? ' (Owner Preview)' : ''}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={onLogout}
                className="flex cursor-pointer items-center gap-2 pl-4 pr-3 md:px-5 py-2.5 text-[9px] md:text-[10px] font-black text-white bg-[#1e293b] rounded-xl hover:bg-slate-800 transition-all active:scale-95 uppercase tracking-widest shadow-lg shadow-slate-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">
                  {isPreview ? 'Exit Preview' : 'Logout'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-8">
          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-brand-primary">
                  {stats.completed}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  of {stats.total} sections completed
                </p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-accent-blue">
                  {stats.progress}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Overall progress
                </p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="text-3xl font-bold flex items-center gap-2 text-brand-primary">
                  🕊️ {stats.obituarySections}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Obituary sections
                </p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="text-3xl font-bold flex items-center gap-2 text-brand-primary">
                  📋 {stats.checklistSections}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  With checklists
                </p>
              </CardContent>
            </Card>
          </div>

          {ownerIsDeceased && !isPreview && (
            <Card className="border-amber-200 bg-amber-50/60">
              <CardContent className="flex items-start gap-3 p-5">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div>
                  <p className="font-semibold text-amber-900">
                    {ownerName} has been marked as deceased
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    Death-triggered letters and upon-death access notifications
                    have been processed. Use Important Actions below for the
                    personal letter and message delivery.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {canReportOwnerPassing && (
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-brand-primary">
                  Report a Passing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  If {ownerName} has passed away, record it here to automatically
                  send death-triggered letters and personal messages, and grant
                  access to trusted people who were set to receive it upon death.
                </p>
                <Button
                  variant="outline"
                  className="border-amber-300 text-amber-900 hover:bg-amber-50"
                  onClick={() => setShowDeathReportDialog(true)}
                  disabled={isReportingDeath}
                >
                  {isReportingDeath ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="mr-2 h-4 w-4" />
                  )}
                  Report Owner Passing
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Important Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-primary">
                Important Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Button
                  onClick={onOwnerLetterAccess}
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-start gap-3 text-left transition-all duration-200 hover:scale-105"
                  style={{ borderColor: 'rgba(236, 72, 153, 0.3)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor =
                      'rgba(236, 72, 153, 0.4)';
                    e.currentTarget.style.background =
                      'rgba(252, 231, 243, 0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor =
                      'rgba(236, 72, 153, 0.3)';
                    e.currentTarget.style.background = '';
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-pink-500" />
                    <span className="font-semibold text-brand-primary">
                      Read Personal Letter
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Access the personal letter written for you
                  </p>
                </Button>

                <Button
                  onClick={onDeliverMessages}
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-start gap-3 text-left transition-all duration-200 hover:scale-105"
                  style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor =
                      'rgba(59, 130, 246, 0.4)';
                    e.currentTarget.style.background =
                      'rgba(239, 246, 255, 0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor =
                      'rgba(59, 130, 246, 0.3)';
                    e.currentTarget.style.background = '';
                  }}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-accent-blue" />
                    <span className="font-semibold text-brand-primary">
                      Deliver Messages
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Send messages to other loved ones
                  </p>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex gap-3">
              <Button
                onClick={() => setActiveFilter('all')}
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                className={`transition-all duration-200 ${
                  activeFilter === 'all'
                    ? 'bg-brand-primary text-white'
                    : 'text-brand-primary hover:bg-brand-primary/10'
                }`}
                size="sm"
              >
                <List className="h-4 w-4 mr-2" />
                All Sections
              </Button>
              <Button
                onClick={() => setActiveFilter('obituary')}
                variant={activeFilter === 'obituary' ? 'default' : 'outline'}
                className={`transition-all duration-200 ${
                  activeFilter === 'obituary'
                    ? 'bg-brand-primary text-white'
                    : 'text-brand-primary hover:bg-brand-primary/10'
                }`}
                size="sm"
              >
                🕊️ Obituary Material
              </Button>
              <Button
                onClick={() => setActiveFilter('checklists')}
                variant={activeFilter === 'checklists' ? 'default' : 'outline'}
                className={`transition-all duration-200 ${
                  activeFilter === 'checklists'
                    ? 'bg-brand-primary text-white'
                    : 'text-brand-primary hover:bg-brand-primary/10'
                }`}
                size="sm"
              >
                📋 Action Items
              </Button>
            </div>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sections..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Sections Grid (filtered to allowed) */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleSections.map(section => {
              const isCompleted = getSectionCompletionStatus(section.id);
              const sectionHasChecklist = hasChecklist(section.id);
              const sectionHasDove = hasDoveTag(section.id);
              return (
                <Card
                  key={section.id}
                  className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  onClick={() => onViewSection(section.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base flex items-center gap-2 text-brand-primary">
                          {sectionHasDove && (
                            <span className="text-lg">🕊️</span>
                          )}
                          <span className="truncate font-semibold">
                            {section.id}. {section.title}
                          </span>
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        {sectionHasChecklist && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-1"
                          >
                            📋
                          </Badge>
                        )}
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0" />
                </Card>
              );
            })}
          </div>

          {visibleSections.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                No sections available.
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={showDeathReportDialog}
        onOpenChange={setShowDeathReportDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report owner passing?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-left">
              <span className="block">
                This will mark <strong>{ownerName}</strong> as deceased and
                cannot be undone from your dashboard.
              </span>
              <span className="block">The system will automatically:</span>
              <ul className="list-disc space-y-1 pl-5">
                <li>Send death-triggered letters and personal messages</li>
                <li>Email upon-death trusted people with login access</li>
                <li>Keep letter and message actions available at the top</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReportingDeath}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={event => {
                event.preventDefault();
                void handleReportOwnerPassing();
              }}
              disabled={isReportingDeath}
              className="bg-amber-700 hover:bg-amber-800"
            >
              {isReportingDeath ? 'Recording…' : 'Confirm Passing'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
