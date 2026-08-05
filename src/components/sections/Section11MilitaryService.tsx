'use client';

import React, { useRef, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/common/ui/card';
import { Button } from '@/components/common/ui/button';
import {
  Plus,
  Minus,
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Medal,
  Heart,
  Landmark,
} from 'lucide-react';
import { cn } from '@common/ui/utils';
import { DynamicFormField } from '@/components/DynamicFormField';
import {
  type FieldGroup,
  buildFieldMap,
  VaultEncryptedBadge,
  VaultGroupCards,
} from '@/utils/vaultGroupedFields';
import { Alert, AlertDescription } from '@/components/common/ui/alert';

import { releaseDeferredAiRoutingDialog, runAiSectionAutofill } from '@/services/aiSectionAutofill';
import { mergeAiPatchWithDefaults } from '@/utils/aiPatchNormalizer';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import {
  resolveAiUploadedFileForScope,
  useRestoreAiPendingUploadForSection,
} from '@/hooks/useAiUploadedFileResolver';
import { uploadAIDocument } from '@/services/aiDocumentUpload';
import { SectionAiDocumentUploader } from '@/components/ai/SectionAiDocumentUploader';
import {
  buildUploadedAiFile,
  type UploadedAIFile,
  validateAiDocumentFile,
} from '@/utils/aiDocumentUploadUi';
import {
  getTopicCardProps,
  useScrollToVaultTopic,
} from '@/utils/vaultTopicNavigation';
import { getItemDisplayLabel } from '@/utils/dynamicVaultTopics';
import { useAiMultiItemAutofill } from '@/hooks/useAiMultiItemAutofill';
import { militaryServicePeriodsAreDuplicates, collapseMilitaryServicePeriods } from '@/utils/aiItemDedup';
import { createEmptyItemFromFields } from '@/utils/sectionUploadFields';

/* ------------------------------------------------------------------ */
/* CONFIG                                                              */
/* ------------------------------------------------------------------ */

const SECTION_11A = {
  subsectionId: '11A',
  title: 'Military Service Record',
  itemLabel: 'Service Period',
  fields: [
    {
      key: 'branch_of_service',
      label: 'Branch of Service',
      type: 'Dropdown',
      options: [
        'Army',
        'Navy',
        'Air Force',
        'Marines',
        'Coast Guard',
        'Space Force',
        'National Guard',
        'Reserves',
        'Other',
      ],
      helperText: 'Which branch of the military you served in',
    },
    {
      key: 'branch_of_service_other',
      label: 'Please specify other branch of service',
      type: 'TextInput',
      helperText: 'Please describe the specific branch or service',
      conditionalDisplay: {
        field: 'branch_of_service',
        value: 'Other',
      },
    },
    {
      key: 'service_dates',
      label: 'Service Dates',
      type: 'TextInput',
      helperText: 'Start and end dates of service (e.g., 1985–1989)',
    },
    {
      key: 'rank_achieved',
      label: 'Highest Rank Achieved',
      type: 'TextInput',
      helperText: 'Final rank or pay grade attained',
    },
    {
      key: 'military_occupational_specialty',
      label: 'Military Occupational Specialty (MOS)',
      type: 'TextInput',
      helperText: 'Your job or specialty code in the military',
    },
    {
      key: 'deployments',
      label: 'Deployments / Stations',
      type: 'TextArea',
      helperText: 'Locations where you were stationed or deployed',
    },
    {
      key: 'combat_service',
      label: 'Combat Service',
      type: 'RadioButtons',
      options: ['Yes', 'No'],
      helperText: 'Did you serve in a combat zone?',
    },
    {
      key: 'awards_decorations',
      label: 'Awards & Decorations',
      type: 'TextArea',
      helperText: 'Military awards, medals, ribbons, or commendations received',
    },
    {
      key: 'discharge_type',
      label: 'Type of Discharge',
      type: 'Dropdown',
      options: [
        'Honorable',
        'General (Under Honorable Conditions)',
        'Other Than Honorable',
        'Bad Conduct',
        'Dishonorable',
        'Medical',
      ],
      helperText: 'Type of military discharge received',
    },
    {
      key: 'va_benefits',
      label: 'VA Benefits Information',
      type: 'TextArea',
      helperText:
        'Current VA benefits, disability ratings, or services you receive',
    },
    {
      key: 'military_documents',
      label: 'Military Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload DD-214, service records, discharge papers, or note their location',
    },
    {
      key: 'burial_preferences',
      label: 'Military Burial Preferences',
      type: 'TextArea',
      helperText:
        'Preferences for military funeral honors or burial in national cemetery',
    },
    {
      key: 'veteran_contacts',
      label: 'Veteran Organization Contacts',
      type: 'TextInputWithUpload',
      helperText:
        'VFW, American Legion, or other veteran organization contacts',
    },
  ],
};

const FIELD_MAP_11A = buildFieldMap(SECTION_11A.fields);

const SECTION_11A_GROUPS: FieldGroup[] = [
  {
    key: 'service_details',
    title: 'Service Details',
    subtitle: 'Branch, dates, rank, and occupational specialty',
    icon: ShieldCheck,
    accent: 'from-indigo-500/[0.07] to-blue-500/[0.03]',
    iconWrap: 'bg-indigo-500/10 text-indigo-700',
    layout: 'grid',
    fieldKeys: [
      'branch_of_service',
      'branch_of_service_other',
      'service_dates',
      'rank_achieved',
      'military_occupational_specialty',
    ],
  },
  {
    key: 'deployments_honors',
    title: 'Deployments & Honors',
    subtitle: 'Stations, combat service, awards, and discharge',
    icon: Medal,
    accent: 'from-amber-500/[0.07] to-orange-500/[0.03]',
    iconWrap: 'bg-amber-500/10 text-amber-700',
    layout: 'grid',
    fieldKeys: [
      'deployments',
      'combat_service',
      'awards_decorations',
      'discharge_type',
    ],
  },
  {
    key: 'benefits_records',
    title: 'Benefits & Records',
    subtitle: 'VA benefits and military service documents',
    icon: Landmark,
    accent: 'from-cyan-500/[0.07] to-sky-500/[0.03]',
    iconWrap: 'bg-cyan-500/10 text-cyan-700',
    layout: 'grid',
    fieldKeys: ['va_benefits', 'military_documents'],
  },
  {
    key: 'legacy_contacts',
    title: 'Legacy Contacts',
    subtitle: 'Burial preferences and veteran organization contacts',
    icon: Heart,
    accent: 'from-rose-500/[0.07] to-pink-500/[0.03]',
    iconWrap: 'bg-rose-500/10 text-rose-700',
    layout: 'grid',
    fieldKeys: ['burial_preferences', 'veteran_contacts'],
  },
];

/* ------------------------------------------------------------------ */
/* TYPES                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  activeSubsection?: string | null;
  activeTopicId?: string | null;
}

type UploadScope = 'full' | `service:${number}`;



/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function Section11MilitaryService({
  data = {},
  onChange = () => {},
  activeSubsection,
  activeTopicId,
}: Props) {
  const [aiNotice, setAiNotice] = useState('');
  const [aiError, setAiError] = useState('');

  const [uploadingScope, setUploadingScope] = useState<UploadScope | null>(
    null,
  );
  const [aiLoadingScope, setAiLoadingScope] = useState<UploadScope | null>(
    null,
  );

  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, UploadedAIFile | null>
  >({
    full: null,
  });

  const latestUploadRef = useRef<Record<string, UploadedAIFile>>({});

  const aiRouting = useOptionalAiDocumentRouting();

  useRestoreAiPendingUploadForSection({
    sectionId: '11',
    setUploadedFiles,
    latestUploadRef,
  });

  const servicePeriods: any[] = Array.isArray(data['11A'])
    ? data['11A']
    : data['11A'] && typeof data['11A'] === 'object'
      ? [data['11A']]
      : [];
  const show11A = !activeSubsection || activeSubsection === '11A';

  useScrollToVaultTopic(activeTopicId, servicePeriods.length);

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const createEmptyServicePeriod = () => {
    return createEmptyItemFromFields(SECTION_11A.fields);
  };

  const updateServicePeriods = (next: any[]) => {
    onChange({
      ...data,
      '11A': next,
    });
  };

  const addServicePeriod = () => {
    updateServicePeriods([...servicePeriods, createEmptyServicePeriod()]);
  };

  const updateServicePeriod = (index: number, key: string, value: any) => {
    const next = [...servicePeriods];

    next[index] = {
      ...(next[index] || {}),
      [key]: value,
    };

    updateServicePeriods(next);
  };

  const removeServicePeriod = (index: number) => {
    updateServicePeriods(servicePeriods.filter((_, itemIndex) => itemIndex !== index));
  };

  const multiItemAutofill = useAiMultiItemAutofill({
    itemLabel: SECTION_11A.itemLabel,
    createEmpty: createEmptyServicePeriod,
    getCurrentItems: () => servicePeriods,
    setItems: updateServicePeriods,
    setAiNotice,
    describeFields: ['branch_of_service', 'rank_achieved', 'service_dates'],
    isDuplicate: militaryServicePeriodsAreDuplicates,
    conflictMode: 'ask',
    onFlowComplete: () => releaseDeferredAiRoutingDialog(aiRouting),
  });

  const getUploadedFileForScope = (scope: UploadScope) => {
    const pendingFile =
      aiRouting?.getPendingFileForSection('11', String(scope)) ?? null;

    return resolveAiUploadedFileForScope(scope, uploadedFiles, latestUploadRef, pendingFile);
  };

  const cleanPatchObject = (patch: any) => {
    if (!patch || typeof patch !== 'object') return {};

    return Object.fromEntries(
      Object.entries(patch).filter(([, value]) => {
        if (value === null || value === undefined || value === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      }),
    );
  };

  const normalizeServicePeriodPatch = (patch: any) =>
    mergeAiPatchWithDefaults(patch, SECTION_11A.fields, createEmptyServicePeriod);

  const extractServicePeriodArrayFromPatch = (patch: any) => {
    const rawServicePeriods = patch?.['11A'];

    if (Array.isArray(rawServicePeriods)) {
      const normalized = rawServicePeriods
        .map(item => normalizeServicePeriodPatch(item))
        .filter(item => {
          return Object.values(item).some(value => value !== '');
        });
      return collapseMilitaryServicePeriods(normalized);
    }

    if (rawServicePeriods && typeof rawServicePeriods === 'object') {
      const item = normalizeServicePeriodPatch(rawServicePeriods);

      return Object.values(item).some(value => value !== '') ? [item] : [];
    }

    return [];
  };

  const handleDocumentUpload = async (file?: File | null,
    scope: UploadScope = 'full', runAutofill?: () => void | Promise<void>) => {
    try {
      if (!file) return;

      setAiError('');
      setAiNotice('');

      const validationError = validateAiDocumentFile(file);
      if (validationError) {
        setAiError(validationError);
        return;
      }

      setUploadingScope(scope);

      const uploaded = await uploadAIDocument(file, { section: '11' });

      const uploadedRecord: UploadedAIFile = buildUploadedAiFile(uploaded, file, {
        sectionId: '11',
        source: 'section',
      });

      latestUploadRef.current[String(scope)] = uploadedRecord;
      setUploadedFiles(prev => ({
        ...prev,
        [scope]: uploadedRecord,
      }));

      setUploadingScope(null);
      setAiNotice('Document uploaded. Running AI autofill…');

      if (runAutofill) {
        await runAutofill();
      }
    
      return uploadedRecord;
    } catch (err: any) {
      setAiError(err?.message || 'Document upload failed');
    } finally {
      setUploadingScope(null);
    }
  };

  const handleAutofill = async (
    scope: UploadScope = 'full',
    serviceIndex?: number,
  ) => {
    try {
      const uploadedFile = getUploadedFileForScope(scope);

      if (!uploadedFile) {
        setAiError('Please upload a document first.');
        return;
      }

      setAiError('');
      setAiNotice('');
      setAiLoadingScope(scope);

      const json = await runAiSectionAutofill({
        sectionKey: 'military_service',
        sectionId: '11',
        file_id: uploadedFile.file_id,
        mime_type: uploadedFile.mime_type,
        subsection: '11A',
        uploadScope: String(scope),
        fields: SECTION_11A.fields,
        aiRouting,
        });

      if (!json) return;

      const patch = json?.result?.patch ?? {};
      const extractedServicePeriods = extractServicePeriodArrayFromPatch(patch);

      const disposition = multiItemAutofill.processExtraction(
        extractedServicePeriods,
        serviceIndex,
        {
          setAiError,
          setAiNotice,
          emptyError:
            'AI could not find military service information in this document.',
        },
      );
      if (disposition !== 'pending_user') {
        releaseDeferredAiRoutingDialog(aiRouting);
      }
    } catch (err: any) {
      setAiError(err?.message || 'AI autofill failed');
    } finally {
      setAiLoadingScope(null);
    }
  };

    const renderUploader = ({
    scope,
    title,
    description,
    buttonLabel = 'Auto-fill',
    uploadLabel,
    onAutofill,
    compact = false,
    tone,
  }: {
    scope: UploadScope;
    title: string;
    description: string;
    buttonLabel?: string;
    uploadLabel?: string;
    onAutofill: () => void | Promise<void>;
    compact?: boolean;
    tone?: import('@/components/ai/SectionAiDocumentUploader').SectionAiUploaderTone;
  }) => (
    <SectionAiDocumentUploader
      title={title}
      description={description}
      buttonLabel={buttonLabel}
      uploadLabel={uploadLabel}
      compact={compact}
      tone={tone}
      disabled={isAnyAIActionRunning}
      isUploading={uploadingScope === scope}
      isReading={aiLoadingScope === scope}
      uploadedFile={getUploadedFileForScope(scope)}
      highlightUpload={aiRouting?.shouldHighlightUpload('11', String(scope)) ?? false}
      onUpload={file => handleDocumentUpload(file, scope, onAutofill)}
      onAutofill={onAutofill}
    />
  );

  if (!show11A) return null;

  return (
    <div className="space-y-4 sm:space-y-5">
      {multiItemAutofill.dialog}
      {(aiNotice || aiError) && (
        <div className="space-y-3">
          {aiNotice && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{aiNotice}</AlertDescription>
            </Alert>
          )}

          {aiError && (
            <Alert variant="destructive">
              <AlertDescription>{aiError}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div
        id="subsection-11A"
        className={cn(
          'rounded-3xl',
          activeSubsection === '11A' && 'border border-primary p-1',
        )}
      >
        <Card className="overflow-hidden border-slate-200/80 shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 via-white to-indigo-50/60 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="flex min-w-0 items-center gap-2 text-lg tracking-tight text-slate-900 sm:text-xl">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-indigo-600" />
                  <span className="min-w-0">11A. {SECTION_11A.title}</span>
                </CardTitle>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <VaultEncryptedBadge />
                <Button
                  type="button"
                  size="sm"
                  onClick={addServicePeriod}
                  className="w-auto rounded-xl"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add {SECTION_11A.itemLabel}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.05),transparent_36%)] p-4 sm:space-y-6 sm:p-6">
          {servicePeriods.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center sm:py-8">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                <ShieldCheck className="h-5 w-5 text-slate-500" />
              </div>

              <p className="text-sm font-medium text-slate-800 sm:text-base">
                No service periods yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Tap Add Service Period or upload a DD-214 on a card to autofill.
              </p>
            </div>
          )}

          {servicePeriods.map((item, index) => {
            const itemScope = `service:${index}` as UploadScope;
            const itemLabel = getItemDisplayLabel(
              '11',
              '11A',
              item || {},
              index,
              SECTION_11A.itemLabel,
            );
            const topicProps = getTopicCardProps('11A', index, activeTopicId);

            return (
              <Card
                key={`${itemScope}-${index}`}
                id={topicProps.id}
                className={topicProps.className}
              >
                <div className="flex flex-col gap-3 border-b bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
                  <strong className="min-w-0 text-slate-900">{itemLabel}</strong>

                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeServicePeriod(index)}
                    className="w-auto shrink-0 self-start rounded-xl sm:self-auto"
                  >
                    <Minus className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                </div>

                <CardContent className="space-y-5 p-4 sm:space-y-6 sm:p-5">
                  {renderUploader({
                    scope: itemScope,
                    title: `Upload for ${itemLabel}`,
                    description:
                      'DD-214, discharge papers, VA letters, or service records — fills this card only.',
                    buttonLabel: `Auto-fill ${itemLabel}`,
                    compact: true,
                    onAutofill: () => handleAutofill(itemScope, index),
                  })}

                  <VaultGroupCards
                    groups={SECTION_11A_GROUPS}
                    fieldMap={FIELD_MAP_11A}
                    renderField={fieldKey => (
                      <DynamicFormField
                        key={fieldKey}
                        field={FIELD_MAP_11A[fieldKey]}
                        value={item?.[fieldKey]}
                        formData={item}
                        onChange={value =>
                          updateServicePeriod(index, fieldKey, value)
                        }
                        className="space-y-2"
                      />
                    )}
                  />
                </CardContent>
              </Card>
            );
          })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
