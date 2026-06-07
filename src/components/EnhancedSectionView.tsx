import React, { useState, useMemo } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Badge } from '@common/ui/badge';
import Cookies from 'js-cookie';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@common/ui/tabs';
import { 
  ArrowLeft, 
  Clock, 
  LogOut, 
  CheckCircle, 
  Circle, 
  FileText,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { Checkbox } from '@common/ui/checkbox';
import { formConfig } from '../config/formConfig';
import { 
  nokConfig, 
  getNOKSectionConfig, 
  hasChecklist, 
  hasDoveTag, 
  getChecklistReference 
} from '../config/nokConfig';
import { NOKInstructions } from './NOKInstructions';
import { isDeathSignalChecklistItem } from '../config/nokDeathSignals';
import { toast } from 'sonner';
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
  sessionTime
}: EnhancedSectionViewProps) {
  const [activeTab, setActiveTab] = useState('content');
  const savedChecklist = kit?.checklists?.[sectionId] ?? {};
  const [checklistState, setChecklistState] =
    useState<Record<string, boolean>>(savedChecklist);

  const [showEmptySections, setShowEmptySections] = useState(false);

  // Format session time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/kit/checklist`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Cookies.get('nok_auth_token')}`,
      },
      body: JSON.stringify({
        section_id: sectionId,
        items,
      }),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to save checklist');
  }

  const data = (await response.json()) as {
    owner_deceased_triggered?: boolean;
  };

  if (data.owner_deceased_triggered) {
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

  if (!section) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Section not found</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={onBack} variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  {sectionHasDove && <span>🕊️</span>}
                  {section.id}. {section.title}
                  {sectionHasChecklist && (
                    <Badge variant="secondary" className="text-xs">
                      📋 Checklist Available
                    </Badge>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {nokData.person_name} • Next of Kin Access
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                {formatTime(sessionTime)}
              </div>
              <Button onClick={onLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">
              <FileText className="h-4 w-4 mr-2" />
              Section Content
            </TabsTrigger>
            {sectionHasChecklist && (
              <TabsTrigger value="checklist">
                📋 Action Checklist ({completedItems}/{checklist.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            {/* Content Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge
                  variant={
                    visibleSubsections.length > 0 ? 'default' : 'secondary'
                  }
                >
                  {visibleSubsections.length} subsection
                  {visibleSubsections.length !== 1 ? 's' : ''} with data
                </Badge>
                {!sectionHasData &&
                  section.subsections &&
                  section.subsections.length > visibleSubsections.length && (
                    <Button
                      onClick={() => setShowEmptySections(!showEmptySections)}
                      variant="outline"
                      size="sm"
                    >
                      {showEmptySections ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide Empty Sections
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Show All Sections
                        </>
                      )}
                    </Button>
                  )}
              </div>

              {nokSectionConfig?.exports_allowed && (
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Section
                </Button>
              )}
            </div>

            {/* Special NOK Instructions for Section 1 */}
            {sectionId === '1' && onOwnerLetterAccess && onDeliverMessages && (
              <NOKInstructions
                onOwnerLetterAccess={onOwnerLetterAccess}
                onDeliverMessages={onDeliverMessages}
              />
            )}

            {/* Subsections Content */}
            {visibleSubsections.length > 0 ? (
              <div className="grid gap-6">
                {(showEmptySections
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
                    <Card
                      key={subsection.id}
                      className={!hasData ? 'opacity-60' : ''}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {hasDoveTag(sectionId, subsection.id) && (
                            <span>🕊️</span>
                          )}
                          {subsection.id}. {subsection.title}
                          {hasChecklist(sectionId, subsection.id) && (
                            <Badge variant="outline" className="text-xs">
                              📋
                            </Badge>
                          )}
                          {!hasData && (
                            <Badge variant="secondary" className="text-xs">
                              No Data
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {hasData ? (
                          <div className="space-y-4">
                            {/* Render subsection data */}
                            {Array.isArray(subsectionData) ? (
                              <div className="space-y-3">
                                {subsectionData.map(
                                  (item: any, index: number) => (
                                    <div
                                      key={index}
                                      className="p-3 bg-muted/50 rounded-lg"
                                    >
                                      <div className="space-y-1">
                                        {Object.entries(item).map(
                                          ([key, value]) => {
                                            if (!value || key === 'id')
                                              return null;
                                            return (
                                              <div
                                                key={key}
                                                className="flex flex-col"
                                              >
                                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                                  {key.replace(/[_-]/g, ' ')}
                                                </span>
                                                <span className="text-sm">
                                                  {typeof value === 'string'
                                                    ? value
                                                    : JSON.stringify(value)}
                                                </span>
                                              </div>
                                            );
                                          },
                                        )}
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : typeof subsectionData === 'object' ? (
                              <div className="grid gap-3">
                                {Object.entries(subsectionData).map(
                                  ([key, value]) => {
                                    if (!value || key === 'id') return null;
                                    return (
                                      <div
                                        key={key}
                                        className="p-3 bg-muted/50 rounded-lg"
                                      >
                                        <div className="flex flex-col">
                                          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                            {key.replace(/[_-]/g, ' ')}
                                          </span>
                                          <span className="text-sm">
                                            {Array.isArray(value)
                                              ? value.map((item, i) => (
                                                  <div
                                                    key={i}
                                                    className="mt-1 p-2 bg-background rounded border"
                                                  >
                                                    {typeof item === 'object'
                                                      ? Object.entries(
                                                          item,
                                                        ).map(([k, v]) =>
                                                          v ? (
                                                            <div key={k}>
                                                              <strong>
                                                                {k.replace(
                                                                  /[_-]/g,
                                                                  ' ',
                                                                )}
                                                                :
                                                              </strong>{' '}
                                                              {String(v)}
                                                            </div>
                                                          ) : null,
                                                        )
                                                      : String(item)}
                                                  </div>
                                                ))
                                              : typeof value === 'string'
                                                ? value
                                                : JSON.stringify(value)}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            ) : (
                              <p className="text-sm">
                                {String(subsectionData)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No information has been provided for this
                            subsection.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No information has been provided for this section yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {sectionHasChecklist && (
            <TabsContent value="checklist" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Action Checklist</h2>
                  <p className="text-sm text-muted-foreground">
                    {getChecklistReference(sectionId) ||
                      'Tasks for managing this section'}
                  </p>
                </div>
                <Badge variant="outline">
                  {completedItems}/{checklist.length} completed (
                  {Math.round(checklistProgress)}%)
                </Badge>
              </div>

              <p className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-amber-900">
                If you check at least two passing-related items (marked
                &quot;Passing signal&quot;), the system will treat the owner as
                deceased and send death letters, personal messages, and
                upon-death access emails. Separately, if the owner has not
                signed in for 90 days they receive a check-in email; if they do
                not sign in within 15 more days, the same upon-death workflows
                run automatically.
              </p>

              <div className="space-y-3">
                {checklist.map(item => (
                  <Card
                    key={item.id}
                    className={
                      item.important
                        ? 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/50'
                        : ''
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={item.id}
                          checked={checklistState[item.id] || false}
                          onCheckedChange={() => toggleChecklistItem(item.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 space-y-1">
                          <label
                            htmlFor={item.id}
                            className={`text-sm font-medium cursor-pointer flex items-center gap-2 ${
                              checklistState[item.id]
                                ? 'line-through text-muted-foreground'
                                : ''
                            }`}
                          >
                            {item.label}
                            {item.important && (
                              <Badge variant="destructive" className="text-xs">
                                Important
                              </Badge>
                            )}
                            {(item.deathSignal ||
                              isDeathSignalChecklistItem(item.id)) && (
                              <Badge
                                variant="outline"
                                className="border-amber-300 text-xs text-amber-800"
                              >
                                Passing signal
                              </Badge>
                            )}
                          </label>
                          {item.description && (
                            <p
                              className={`text-xs ${checklistState[item.id] ? 'text-muted-foreground' : 'text-muted-foreground'}`}
                            >
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {checklistProgress === 100 && (
                <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="font-medium text-green-700 dark:text-green-300">
                      All checklist items completed!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      You've finished all the recommended tasks for this
                      section.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}