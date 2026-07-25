import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@common/ui/button';
import { secureFetch } from '@/libs/secureFetch';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Download,
  Eye,
  EyeOff,
  Heart,
  LogOut,
} from 'lucide-react';
import { Checkbox } from '@common/ui/checkbox';
import { formConfig } from '../config/formConfig';
import {
  getNOKSectionConfig,
  hasChecklist,
  hasDoveTag,
  getChecklistReference,
} from '../config/nokConfig';
import { NOKInstructions } from './NOKInstructions';
import { isDeathSignalChecklistItem } from '../config/nokDeathSignals';
import { toast } from 'sonner';
import { useNokSessionTimer } from '@/hooks/useNokSessionTimer';
import { NokBottomNav } from '@/components/nok/NokBottomNav';
import { cn } from '@common/ui/utils';
interface Subsection {
  id: string;
  title: string;
}

interface EnhancedSectionViewProps {
  sectionId: string;
  nokData: any;
  formData: Record<string, any>;
  kit: {
    sections: Array<{
      id: string;
      data: any;
      subsections: Array<{
        id: string;
        data: any;
      }>;
    }>;
    checklists?: Record<string, Record<string, boolean>>;
  };
  onBack: () => void;
  onLogout: () => void;
  onOwnerLetterAccess?: () => void;
  onDeliverMessages?: () => void;
  sessionTime: number;
}

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  important?: boolean;
  deathSignal?: boolean;
}

export function EnhancedSectionView({
  sectionId,
  nokData,
  kit,
  onBack,
  onLogout,
  onOwnerLetterAccess,
  onDeliverMessages,
  sessionTime,
}: EnhancedSectionViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('content');
  const savedChecklist = kit?.checklists?.[sectionId] ?? {};
  const [checklistState, setChecklistState] =
    useState<Record<string, boolean>>(savedChecklist);
  const [showEmptySections, setShowEmptySections] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const handleExpire = React.useCallback(() => {
    toast.message('Session expired. Please sign in again.');
    void onLogout();
  }, [onLogout]);

  const { formatted: timerLabel } = useNokSessionTimer(
    sessionTime || 15 * 60,
    handleExpire,
  );

  // Get section from formConfig
  const section = useMemo(() => 
    formConfig.chunks.flatMap(chunk => chunk.sections).find(s => s.id === sectionId),
    [sectionId]
  );


  // Get NOK configuration for this section
 const nokSectionConfig = getNOKSectionConfig(sectionId) as {
   exports_allowed?: boolean;
 };

  const sectionHasChecklist = hasChecklist(sectionId);
  const sectionHasDove = hasDoveTag(sectionId);

  // Get section data
  const sectionFromKit = kit.sections.find(s => s.id === sectionId);

  const sectionData = sectionFromKit?.data || {};
  const subsections = sectionFromKit?.subsections || [];

const getSubsectionData = (subsectionId: string) => {
  // SECTION 1 special handling
  if (sectionId === '1') {
    if (subsectionId === '1A') {
      return sectionData.vital_info;
    }

    if (subsectionId === '1C') {
      return {
        next_of_kin: sectionData.next_of_kin,
        executor_trustee: sectionData.executor_trustee,
        additional_contacts: sectionData.additional_contacts,
      };
    }
  }

  // DEFAULT behavior (all other sections)
  return sectionData[subsectionId];
};

  // Generate dynamic checklist based on section content and type
  const generateChecklist = (): ChecklistItem[] => {
    const baseChecklist: ChecklistItem[] = [];
    const checklistRef = getChecklistReference(sectionId);

    // Standard checklist items based on section type
    switch (sectionId) {
      case '1': // Vital Information & Key Contacts
        return [
          {
            id: 'read_instructions',
            label: 'Read the instructions thoroughly',
            description: 'Understand your role and responsibilities as next of kin',
            completed: false,
            important: true
          },
          {
            id: 'gather_documents',
            label: 'Gather death certificates',
            description: 'Request at least 10 certified copies from funeral home',
            completed: false,
            important: true,
            deathSignal: true,
          },
          {
            id: 'notify_immediate',
            label: 'Notify immediate family and close friends',
            description: 'Contact those listed in Family & Friends sections',
            completed: false,
            deathSignal: true,
          },
          {
            id: 'contact_attorney',
            label: 'Contact estate attorney if needed',
            description: 'Based on estate size and complexity',
            completed: false
          }
        ];

      case '5': // Vehicles
        return [
          {
            id: 'locate_titles',
            label: 'Locate vehicle titles',
            description: 'Find physical titles or DMV records',
            completed: false,
            important: true
          },
          {
            id: 'contact_insurance',
            label: 'Contact insurance companies',
            description: 'Notify of death and determine coverage continuation',
            completed: false,
            deathSignal: true,
          },
          {
            id: 'transfer_registration',
            label: 'Handle registration transfers',
            description: 'Transfer or cancel vehicle registrations',
            completed: false
          },
          {
            id: 'handle_loans',
            label: 'Address any vehicle loans',
            description: 'Contact lenders about outstanding loans',
            completed: false
          }
        ];

      case '12': // Banking & Financial Accounts
        return [
          {
            id: 'notify_banks',
            label: 'Notify all banks of death',
            description: 'Contact each bank with death certificate',
            completed: false,
            important: true,
            deathSignal: true,
          },
          {
            id: 'freeze_accounts',
            label: 'Understand account freezing',
            description: 'Learn which accounts are frozen and which continue',
            completed: false,
            deathSignal: true,
          },
          {
            id: 'payable_on_death',
            label: 'Handle payable-on-death accounts',
            description: 'Process POD beneficiary claims',
            completed: false
          },
          {
            id: 'close_unnecessary',
            label: 'Close unnecessary accounts',
            description: 'Close accounts no longer needed',
            completed: false
          }
        ];

      case '13': // Passwords & Online Accounts
        return [
          {
            id: 'inventory_accounts',
            label: 'Create inventory of digital accounts',
            description: 'List all online accounts and their purposes',
            completed: false
          },
          {
            id: 'access_passwords',
            label: 'Access password information',
            description: 'Use provided passwords or recovery methods',
            completed: false,
            important: true
          },
          {
            id: 'memorial_accounts',
            label: 'Set up memorial accounts',
            description: 'Convert social media to memorial status if desired',
            completed: false
          },
          {
            id: 'close_accounts',
            label: 'Close unnecessary accounts',
            description: 'Close accounts that are no longer needed',
            completed: false
          }
        ];

      case '18': // Employment & Business
        return [
          {
            id: 'notify_employer',
            label: 'Notify current employer',
            description: 'Contact HR department with death certificate',
            completed: false,
            important: true,
            deathSignal: true,
          },
          {
            id: 'benefits_info',
            label: 'Gather benefits information',
            description: 'Understand final pay, benefits, and survivor benefits',
            completed: false
          },
          {
            id: 'retirement_accounts',
            label: 'Handle retirement accounts',
            description: 'Contact 401k administrators and pension providers',
            completed: false
          },
          {
            id: 'business_succession',
            label: 'Execute business succession plans',
            description: 'Follow documented business succession procedures',
            completed: false
          }
        ];

      case '21': // Estate Planning & Final Wishes
        return [
          {
            id: 'locate_will',
            label: 'Locate the will and trust documents',
            description: 'Find original documents in fireproof bag or safe',
            completed: false,
            important: true,
            deathSignal: true,
          },
          {
            id: 'contact_attorney',
            label: 'Contact estate attorney',
            description: 'Reach out to the attorney who prepared the documents',
            completed: false,
            important: true
          },
          {
            id: 'probate_process',
            label: 'Understand probate requirements',
            description: 'Determine if probate is required in your state',
            completed: false
          },
          {
            id: 'funeral_arrangements',
            label: 'Honor funeral and burial wishes',
            description: 'Follow documented end-of-life preferences',
            completed: false,
            important: true,
            deathSignal: true,
          }
        ];

      default:
        // Generic checklist for other sections
        return [
          {
            id: 'review_content',
            label: 'Review all section content',
            description: 'Go through each subsection carefully',
            completed: false
          },
          {
            id: 'gather_section_documents',
            label: 'Gather referenced documents',
            description: 'Collect any documents mentioned in this section',
            completed: false
          },
          {
            id: 'contact_providers',
            label: 'Contact service providers',
            description: 'Reach out to companies or individuals listed',
            completed: false
          }
        ];
    }
  };

  const checklist = generateChecklist();
  const completedItems = checklist.filter(item => checklistState[item.id]).length;
  const checklistProgress = checklist.length > 0 ? (completedItems / checklist.length) * 100 : 0;

const saveChecklist = async (items: Record<string, boolean>) => {
  const response = await secureFetch('/kit/checklist', {
    method: 'POST',
    body: JSON.stringify({
      section_id: sectionId,
      items,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to save checklist');
  }

  const data = (await response.json()) as {
    death_signals_ready?: boolean;
    owner_deceased_triggered?: boolean;
  };

  if (data.death_signals_ready) {
    toast.message(
      'Passing-related checklist items recorded. Use Report Passing on the dashboard to confirm before any letters or access are released.',
      { duration: 8000 },
    );
  } else if (data.owner_deceased_triggered) {
    toast.success(
      'Passing recorded. Death letters, messages, and upon-death access have been sent.',
    );
  }
};

const toggleChecklistItem = (itemId: string) => {
  setChecklistState(prev => {
    const updated = { ...prev, [itemId]: !prev[itemId] };
    void saveChecklist(updated).catch(() => {
      toast.error('Could not save checklist progress');
    });
    return updated;
  });
};


  // Filter subsections based on data availability
const getVisibleSubsections = () => {
  if (!section?.subsections) return [];

  // 1️⃣ If SECTION has data → show all subsections
  if (sectionHasData) {
    return section.subsections;
  }

  // 2️⃣ Manual override
  if (showEmptySections) {
    return section.subsections;
  }

  // 3️⃣ Only subsections that have data in KIT
return section.subsections.filter((subsection: Subsection) => {
  const subsectionData = sectionFromKit?.subsections?.find(
    (ss: { id: string; data: any }) => ss.id === subsection.id,
  )?.data;

  if (!subsectionData) return false;

  if (Array.isArray(subsectionData)) {
    return subsectionData.length > 0;
  }

  if (typeof subsectionData === 'object') {
    return Object.values(subsectionData).some(value => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null)
        return Object.keys(value).length > 0;
      return Boolean(value);
    });
  }

  return Boolean(subsectionData);
});

};

const sectionHasData = useMemo(() => {
  if (!sectionFromKit?.data) return false;

  if (Array.isArray(sectionFromKit.data)) {
    return sectionFromKit.data.length > 0;
  }

  if (typeof sectionFromKit.data === 'object') {
    return Object.values(sectionFromKit.data).some(value => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null)
        return Object.keys(value).length > 0;
      return Boolean(value);
    });
  }

  return Boolean(sectionFromKit.data);
}, [sectionFromKit]);

  const visibleSubsections = getVisibleSubsections();

  const formatFieldLabel = (key: string) =>
    key.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const renderValue = (value: unknown): React.ReactNode => {
    if (value == null || value === '') return null;
    if (typeof value === 'string' || typeof value === 'number') {
      return (
        <span className="text-[14px] leading-6 text-[#132b26]">
          {String(value)}
        </span>
      );
    }
    if (Array.isArray(value)) {
      return (
        <div className="mt-1 space-y-2">
          {value.map((item, i) => (
            <div
              key={i}
              className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100"
            >
              {typeof item === 'object' && item !== null
                ? Object.entries(item as Record<string, unknown>).map(
                    ([k, v]) =>
                      v ? (
                        <div key={k} className="py-0.5 text-[13px]">
                          <span className="font-medium text-slate-500">
                            {formatFieldLabel(k)}:{' '}
                          </span>
                          <span className="text-[#132b26]">{String(v)}</span>
                        </div>
                      ) : null,
                  )
                : String(item)}
            </div>
          ))}
        </div>
      );
    }
    if (typeof value === 'object') {
      return (
        <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-[12px] text-slate-700">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    return (
      <span className="text-[14px] text-[#132b26]">{String(value)}</span>
    );
  };

  if (!section) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#f6f8fb] px-5">
        <div className="text-center">
          <p className="text-sm text-slate-500">Section not found</p>
          <Button
            onClick={onBack}
            className="mt-4 w-auto rounded-xl bg-[#132b26]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
      </div>
    );
  }

  const personLabel =
    nokData?.full_name ||
    nokData?.person_name ||
    nokData?.email ||
    'Next of Kin';

  return (
    <div className="min-h-[100dvh] bg-[#f4f6f9] pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1480px] items-start gap-2.5 px-3 py-2.5 pt-[max(0.65rem,env(safe-area-inset-top))] sm:px-5 md:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBack}
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#132b26] shadow-sm"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1 pt-0.5">
            <h1 className="text-[15px] font-bold leading-snug tracking-tight text-[#132b26] sm:text-[17px]">
              {sectionHasDove ? '🕊️ ' : ''}
              {section.id}. {section.title}
            </h1>
            {sectionHasChecklist ? (
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <CheckCircle className="h-3.5 w-3.5" />
                Checklist Available
              </p>
            ) : (
              <p className="mt-1 truncate text-[11px] text-slate-500">
                {personLabel}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
            <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-2 text-[12px] font-bold tabular-nums text-[#132b26] shadow-sm">
              <Clock className="h-3.5 w-3.5" />
              {timerLabel}
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#132b26] shadow-sm"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1480px] px-3 pb-3 sm:px-5 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={cn(
                'rounded-[10px] px-2 py-2.5 text-center text-[12px] font-semibold transition',
                activeTab === 'content'
                  ? 'bg-white text-[#132b26] shadow-sm ring-1 ring-slate-200/80'
                  : 'text-slate-500',
              )}
            >
              <span
                className={cn(
                  'inline-block border-b-2 pb-0.5',
                  activeTab === 'content'
                    ? 'border-[#132b26]'
                    : 'border-transparent',
                )}
              >
                Section Content
              </span>
            </button>
            {sectionHasChecklist ? (
              <button
                type="button"
                onClick={() => setActiveTab('checklist')}
                className={cn(
                  'rounded-[10px] px-2 py-2.5 text-center text-[12px] font-semibold transition',
                  activeTab === 'checklist'
                    ? 'bg-white text-[#132b26] shadow-sm ring-1 ring-slate-200/80'
                    : 'text-slate-500',
                )}
              >
                <span
                  className={cn(
                    'inline-block border-b-2 pb-0.5',
                    activeTab === 'checklist'
                      ? 'border-[#132b26]'
                      : 'border-transparent',
                  )}
                >
                  Action Checklist ({completedItems}/{checklist.length})
                </span>
              </button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1480px] px-3 py-4 sm:px-5 md:px-6 md:py-6 lg:px-8">
        {activeTab === 'content' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#132b26] px-3 py-1 text-[11px] font-semibold text-white">
                {visibleSubsections.length} subsection
                {visibleSubsections.length !== 1 ? 's' : ''} with data
              </span>
              {!sectionHasData &&
                section.subsections &&
                section.subsections.length > visibleSubsections.length && (
                  <button
                    type="button"
                    onClick={() => setShowEmptySections(!showEmptySections)}
                    className="inline-flex w-auto items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200"
                  >
                    {showEmptySections ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                    {showEmptySections ? 'Hide empty' : 'Show all'}
                  </button>
                )}
              {nokSectionConfig?.exports_allowed && (
                <button
                  type="button"
                  className="inline-flex w-auto items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200"
                >
                  <Download className="h-3 w-3" /> Export
                </button>
              )}
            </div>

            {sectionId === '1' &&
              onOwnerLetterAccess &&
              onDeliverMessages && (
                <NOKInstructions
                  onOwnerLetterAccess={onOwnerLetterAccess}
                  onDeliverMessages={onDeliverMessages}
                />
              )}

            {visibleSubsections.length > 0 ? (
              (showEmptySections
                ? section.subsections
                : visibleSubsections
              ).map((subsection: any) => {
                const subsectionData = getSubsectionData(subsection.id);
                const hasData =
                  subsectionData &&
                  (Array.isArray(subsectionData)
                    ? subsectionData.length > 0
                    : typeof subsectionData === 'object'
                      ? Object.values(subsectionData).some(v =>
                          Array.isArray(v)
                            ? v.length > 0
                            : typeof v === 'object' && v !== null
                              ? Object.keys(v).length > 0
                              : Boolean(v),
                        )
                      : Boolean(subsectionData));

                return (
                  <section
                    key={subsection.id}
                    className={cn(
                      'overflow-hidden rounded-[18px] border border-sky-100/80 bg-white shadow-sm',
                      !hasData && 'opacity-70',
                    )}
                  >
                    <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#132b26] text-[11px] font-bold text-white">
                        {subsection.id}
                      </span>
                      <h2 className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#132b26]">
                        {hasDoveTag(sectionId, subsection.id) ? '🕊️ ' : ''}
                        {subsection.title}
                      </h2>
                      {!hasData && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          Empty
                        </span>
                      )}
                    </div>
                    <div className="px-4 py-3.5">
                      {hasData ? (
                        Array.isArray(subsectionData) ? (
                          <div className="space-y-2.5">
                            {subsectionData.map((item: any, index: number) => (
                              <div
                                key={index}
                                className="space-y-2 rounded-2xl bg-slate-50/90 p-3.5 ring-1 ring-slate-100"
                              >
                                {Object.entries(item).map(([key, value]) => {
                                  if (!value || key === 'id') return null;
                                  return (
                                    <div key={key}>
                                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                                        {formatFieldLabel(key)}
                                      </p>
                                      <div className="mt-0.5">
                                        {renderValue(value)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        ) : typeof subsectionData === 'object' ? (
                          <div className="divide-y divide-slate-100">
                            {Object.entries(subsectionData).map(
                              ([key, value]) => {
                                if (!value || key === 'id') return null;
                                return (
                                  <div
                                    key={key}
                                    className="py-3 first:pt-0 last:pb-0"
                                  >
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                                      {formatFieldLabel(key)}
                                    </p>
                                    <div className="mt-1">
                                      {renderValue(value)}
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-[#132b26]">
                            {String(subsectionData)}
                          </p>
                        )
                      ) : (
                        <p className="text-[13px] italic text-slate-400">
                          No information provided for this part.
                        </p>
                      )}
                    </div>
                  </section>
                );
              })
            ) : sectionId !== '1' ? (
              <div className="rounded-[18px] bg-white px-5 py-12 text-center shadow-sm ring-1 ring-slate-200/80">
                <p className="text-sm text-slate-500">
                  No information has been provided for this section yet.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'checklist' && sectionHasChecklist && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold text-[#132b26]">
                    Action checklist
                  </h2>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    {getChecklistReference(sectionId) ||
                      'Recommended tasks for this section'}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-[#132b26]">
                  {Math.round(checklistProgress)}%
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#132b26] transition-all"
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
            </div>

            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-[12px] leading-5 text-amber-900 ring-1 ring-amber-200/80">
              Checking two or more &quot;Passing signal&quot; items records
              death-related progress. Confirm on the dashboard before letters
              and access are released.
            </p>

            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
              {checklist.map((item, index) => (
                <label
                  key={item.id}
                  htmlFor={item.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 px-4 py-3.5 transition active:bg-slate-50',
                    index < checklist.length - 1 &&
                      'border-b border-slate-100',
                    item.important && 'bg-orange-50/40',
                  )}
                >
                  <Checkbox
                    id={item.id}
                    checked={checklistState[item.id] || false}
                    onCheckedChange={() => toggleChecklistItem(item.id)}
                    className="mt-0.5"
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'flex flex-wrap items-center gap-1.5 text-[13px] font-semibold',
                        checklistState[item.id]
                          ? 'text-slate-400 line-through'
                          : 'text-[#132b26]',
                      )}
                    >
                      {item.label}
                      {item.important && (
                        <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 no-underline">
                          Important
                        </span>
                      )}
                      {(item.deathSignal ||
                        isDeathSignalChecklistItem(item.id)) && (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 no-underline">
                          Passing signal
                        </span>
                      )}
                    </span>
                    {item.description ? (
                      <span className="mt-1 block text-[12px] leading-5 text-slate-500">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>

            {checklistProgress === 100 && (
              <div className="rounded-2xl bg-emerald-50 px-4 py-5 text-center ring-1 ring-emerald-200/80">
                <CheckCircle className="mx-auto mb-2 h-7 w-7 text-emerald-500" />
                <p className="text-sm font-semibold text-emerald-800">
                  Checklist complete
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <NokBottomNav
        active="sections"
        onDashboard={() => router.push('/next-kin/dashboard')}
        onSections={onBack}
        onMessages={() =>
          onDeliverMessages
            ? onDeliverMessages()
            : router.push('/next-kin/messages')
        }
        onChecklists={() => {
          setActiveTab('checklist');
        }}
        onMore={() => setMoreOpen(v => !v)}
      />

      {moreOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-slate-950/40 md:hidden"
            aria-label="Close"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[70] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 md:hidden">
            {onOwnerLetterAccess ? (
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  onOwnerLetterAccess();
                }}
                className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-left text-[14px] font-medium text-[#132b26]"
              >
                <Heart className="h-4 w-4 text-rose-500" /> Personal letter
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[14px] font-medium text-rose-700"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
