'use client';

import { AiUploadedAttachmentList } from '@/components/ai/AiUploadedAttachmentList';
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
  HeartPulse,
  Stethoscope,
  ShieldCheck,
  ClipboardList,
  CalendarDays,
  Phone,
  Pill,
} from 'lucide-react';
import { cn } from '@common/ui/utils';
import { DynamicFormField } from '@/components/DynamicFormField';
import { Alert, AlertDescription } from '@/components/common/ui/alert';

import { releaseDeferredAiRoutingDialog, runAiSectionAutofill } from '@/services/aiSectionAutofill';
import {
  createEmptyItemFromFields,
  mergeAiPatchWithDefaults,
  buildAiFieldPatch,
  unwrapAiAutofillPatch,
  extractSubsectionPatch,
  aiPatchHasValues,
} from '@/utils/aiPatchNormalizer';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import {
  resolveAiUploadedFileForScope,
  useRestoreAiPendingUploadForSection,
} from '@/hooks/useAiUploadedFileResolver';
import { uploadAIDocument } from '@/services/aiDocumentUpload';
import {
  buildUploadedAiFile,
  validateAiDocumentFile,
} from '@/utils/aiDocumentUploadUi';
import { AiDocumentDropZoneInput } from '@/components/ai/AiDocumentDropZoneInput';
import { AI_PENDING_ROUTED_HINT } from '@/utils/aiRoutingUi';
import {
  getTopicCardProps,
  useScrollToVaultTopic,
} from '@/utils/vaultTopicNavigation';
import {
  type FieldGroup,
  buildFieldMap,
  getInstructionOverview,
  VaultOverviewBox,
  VaultEncryptedBadge,
  VaultGroupCards,
} from '@/utils/vaultGroupedFields';

/* ------------------------------------------------------------------ */
/* CONFIG — 15A                                                        */
/* ------------------------------------------------------------------ */

const SECTION_15A = {
  subsectionId: '15A',
  title: 'Health Insurance & Medical Information',
  fields: [
    {
      key: 'health_overview_instructions',
      label: 'Health Information Overview',
      type: 'Instructions',
      content:
        'This section helps document your health information, medical providers, and insurance details so your next of kin can manage your healthcare needs and make informed decisions.',
    },
    {
      key: 'primary_health_insurance',
      label: 'Primary Health Insurance',
      type: 'TextInputWithUpload',
      helperText:
        'Primary insurance company, policy number, group number, and cards',
    },
    {
      key: 'secondary_health_insurance',
      label: 'Secondary Health Insurance',
      type: 'TextInputWithUpload',
      helperText: 'Secondary or supplemental insurance information',
    },
    {
      key: 'medicare_medicaid',
      label: 'Medicare / Medicaid Information',
      type: 'TextInputWithUpload',
      helperText:
        'Medicare or Medicaid numbers, cards, and supplement information',
    },
    {
      key: 'medical_conditions_header',
      label: 'Current Medical Conditions',
      type: 'Instructions',
      content: 'Document your current health conditions and medical history',
    },
    {
      key: 'current_conditions',
      label: 'Current Medical Conditions',
      type: 'TextArea',
    },
    {
      key: 'allergies',
      label: 'Allergies',
      type: 'TextArea',
    },
    {
      key: 'current_medications',
      label: 'Current Medications',
      type: 'TextInputWithUpload',
    },
    {
      key: 'medical_devices',
      label: 'Medical Devices / Equipment',
      type: 'TextArea',
    },
    {
      key: 'emergency_contacts_header',
      label: 'Emergency Medical Contacts',
      type: 'Instructions',
      content: 'Important contacts for medical emergencies',
    },
    {
      key: 'emergency_contact_1',
      label: 'Emergency Contact 1',
      type: 'TextInput',
    },
    {
      key: 'emergency_contact_2',
      label: 'Emergency Contact 2',
      type: 'TextInput',
    },
    {
      key: 'medical_power_of_attorney',
      label: 'Medical Power of Attorney',
      type: 'TextInputWithUpload',
    },
  ],
};

const FIELD_MAP_15A = buildFieldMap(SECTION_15A.fields);

const SECTION_15A_GROUPS: FieldGroup[] = [
  {
    key: 'insurance_coverage',
    title: 'Insurance Coverage',
    subtitle: 'Primary, secondary, and Medicare/Medicaid details',
    icon: ShieldCheck,
    accent: 'from-red-500/[0.07] to-rose-500/[0.03]',
    iconWrap: 'bg-red-500/10 text-red-600',
    layout: 'grid',
    fieldKeys: [
      'primary_health_insurance',
      'secondary_health_insurance',
      'medicare_medicaid',
    ],
  },
  {
    key: 'medical_conditions',
    title: 'Medical Conditions',
    subtitle: 'Current conditions, allergies, medications, and devices',
    icon: Pill,
    accent: 'from-amber-500/[0.07] to-orange-500/[0.03]',
    iconWrap: 'bg-amber-500/10 text-amber-700',
    layout: 'stack',
    fieldKeys: [
      'current_conditions',
      'allergies',
      'current_medications',
      'medical_devices',
    ],
  },
  {
    key: 'emergency_contacts',
    title: 'Emergency Contacts',
    subtitle: 'Emergency contacts and medical power of attorney',
    icon: Phone,
    accent: 'from-cyan-500/[0.07] to-sky-500/[0.03]',
    iconWrap: 'bg-cyan-500/10 text-cyan-700',
    layout: 'grid',
    fieldKeys: [
      'emergency_contact_1',
      'emergency_contact_2',
      'medical_power_of_attorney',
    ],
  },
];

const SECTION_15A_SUBTITLE =
  'Grouped health insurance, medical conditions, and emergency contacts so your next of kin can manage healthcare decisions without scrolling through one long form.';

/* ------------------------------------------------------------------ */
/* CONFIG — 15B                                                        */
/* ------------------------------------------------------------------ */

const SECTION_15B = {
  subsectionId: '15B',
  title: 'Healthcare Providers',
  itemLabel: 'Healthcare Provider',
  fields: [
    {
      key: 'provider_name',
      label: 'Provider / Practice Name',
      type: 'TextInput',
    },
    {
      key: 'specialty',
      label: 'Specialty',
      type: 'Dropdown',
      options: [
        'Primary Care Physician',
        'Cardiologist',
        'Dermatologist',
        'Dentist',
        'Optometrist/Ophthalmologist',
        'Neurologist',
        'Orthopedist',
        'Gynecologist',
        'Urologist',
        'Psychiatrist/Psychologist',
        'Pharmacy',
        'Physical Therapy',
        'Chiropractor',
        'Other Specialist',
      ],
    },
    {
      key: 'doctor_name',
      label: 'Doctor / Provider Name',
      type: 'TextInput',
    },
    {
      key: 'contact_info',
      label: 'Contact Information',
      type: 'TextInputWithUpload',
    },
    {
      key: 'patient_id',
      label: 'Patient ID / Account Number',
      type: 'TextInput',
    },
    {
      key: 'frequency',
      label: 'Visit Frequency',
      type: 'TextInput',
    },
    {
      key: 'last_visit',
      label: 'Last Visit Date',
      type: 'DatePicker',
    },
    {
      key: 'conditions_treated',
      label: 'Conditions Treated',
      type: 'TextArea',
    },
    {
      key: 'insurance_accepted',
      label: 'Insurance Information',
      type: 'TextArea',
    },
    {
      key: 'portal_access',
      label: 'Patient Portal Access',
      type: 'TextArea',
    },
    {
      key: 'important_notes',
      label: 'Important Notes',
      type: 'TextArea',
    },
  ],
};

const FIELD_MAP_15B = buildFieldMap(SECTION_15B.fields);

const SECTION_15B_GROUPS: FieldGroup[] = [
  {
    key: 'provider_basics',
    title: 'Provider Basics',
    subtitle: 'Practice name, specialty, doctor, and contact details',
    icon: Stethoscope,
    accent: 'from-cyan-500/[0.07] to-sky-500/[0.03]',
    iconWrap: 'bg-cyan-500/10 text-cyan-700',
    layout: 'grid',
    fieldKeys: [
      'provider_name',
      'specialty',
      'doctor_name',
      'contact_info',
      'patient_id',
    ],
  },
  {
    key: 'visit_details',
    title: 'Visit Details',
    subtitle: 'Visit frequency, insurance, and patient portal access',
    icon: CalendarDays,
    accent: 'from-blue-500/[0.07] to-indigo-500/[0.03]',
    iconWrap: 'bg-blue-500/10 text-blue-600',
    layout: 'grid',
    fieldKeys: [
      'frequency',
      'last_visit',
      'conditions_treated',
      'insurance_accepted',
      'portal_access',
    ],
  },
  {
    key: 'clinical_notes',
    title: 'Clinical Notes',
    subtitle: 'Important notes about this provider or your care',
    icon: ClipboardList,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'stack',
    fieldKeys: ['important_notes'],
  },
];

const SECTION_15B_SUBTITLE =
  'Document doctors, specialists, pharmacies, and other healthcare providers so your family knows who to contact and how to access your care.';

const SECTION_15B_OVERVIEW = {
  label: 'Healthcare Providers Overview',
  content:
    'Add each provider as its own card. Include contact details, visit history, insurance accepted, and patient portal access so your next of kin can coordinate ongoing care.',
};

/* ------------------------------------------------------------------ */
/* TYPES                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  activeSubsection?: string | null;
  activeTopicId?: string | null;
}

type UploadScope = '15A-full' | '15B-full' | `15B:${number}`;

type UploadedAIFile = {
  file_id: string;
  mime_type: string;
  expires_at?: string;
  file_name?: string;
  uploaded_at?: number;
};

const ALLOWED_UPLOAD_TYPES = [
  'application/pdf',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
];

const MAX_UPLOAD_SIZE = 15 * 1024 * 1024;

const getReadableFileType = (mimeType?: string) => {
  if (!mimeType) return 'Document';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'text/plain') return 'Text';
  if (mimeType.includes('image')) return 'Image';
  return mimeType;
};

const createRowId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function Section15HealthInformation({
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
  >({});

  const latestUploadRef = useRef<Record<string, UploadedAIFile>>({});

  const aiRouting = useOptionalAiDocumentRouting();

  useRestoreAiPendingUploadForSection({
    sectionId: '15',
    setUploadedFiles,
    latestUploadRef,
  });

  const section15A = data['15A'] || {};
  const providers: any[] = Array.isArray(data['15B']) ? data['15B'] : [];

  useScrollToVaultTopic(activeTopicId, providers.length);

  const show15A = !activeSubsection || activeSubsection === '15A';
  const show15B = !activeSubsection || activeSubsection === '15B';

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const update15A = (key: string, value: any) => {
    onChange({
      ...data,
      '15A': {
        ...section15A,
        [key]: value,
      },
    });
  };

  const update15AWithPatch = (patch: any) => {
    onChange({
      ...data,
      '15A': {
        ...section15A,
        ...patch,
      },
    });
  };

  const updateProviders = (next: any[]) => {
    onChange({
      ...data,
      '15B': next,
    });
  };

  const createEmptyProvider = () => {
    return {
      ...Object.fromEntries(SECTION_15B.fields.map(field => [field.key, ''])),
      __rowId: createRowId(),
    };
  };

  const addProvider = () => {
    updateProviders([...providers, createEmptyProvider()]);
  };

  const updateProvider = (index: number, key: string, value: any) => {
    const next = [...providers];

    next[index] = {
      ...(next[index] || {}),
      [key]: value,
      __rowId: next[index]?.__rowId || createRowId(),
    };

    updateProviders(next);
  };

  const removeProvider = (index: number) => {
    updateProviders(providers.filter((_, itemIndex) => itemIndex !== index));
  };

  const getUploadedFileForScope = (scope: UploadScope) => {
    const pendingFile =
      aiRouting?.getPendingFileForSection('15', String(scope)) ?? null;

    return resolveAiUploadedFileForScope(scope, uploadedFiles, latestUploadRef, pendingFile);
  };

  const cleanPatchObject = (patch: any) => {
    if (!patch || typeof patch !== 'object') return {};

    return Object.fromEntries(
      Object.entries(patch).filter(([key, value]) => {
        if (key === '__rowId') return false;
        if (value === null || value === undefined || value === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      }),
    );
  };

  const extract15AObjectFromPatch = (patch: any) => {
    const raw = patch?.['15A'];

    if (Array.isArray(raw)) {
      return cleanPatchObject(raw[0] || {});
    }

    if (raw && typeof raw === 'object') {
      return cleanPatchObject(raw);
    }

    return {};
  };

  const normalizeProviderPatch = (patch: any) => {
    return {
      ...mergeAiPatchWithDefaults(
        patch,
        SECTION_15B.fields as any,
        () => createEmptyItemFromFields(SECTION_15B.fields as any),
      ),
      __rowId: createRowId(),
    };
  };

  const extractProviderArrayFromPatch = (patch: any) => {
    const rawProviders = patch?.['15B'];

    if (Array.isArray(rawProviders)) {
      return rawProviders
        .map(provider => normalizeProviderPatch(provider))
        .filter(provider => {
          return Object.entries(provider).some(([key, value]) => {
            return key !== '__rowId' && value !== '';
          });
        });
    }

    if (rawProviders && typeof rawProviders === 'object') {
      const provider = normalizeProviderPatch(rawProviders);

      const hasValue = Object.entries(provider).some(([key, value]) => {
        return key !== '__rowId' && value !== '';
      });

      return hasValue ? [provider] : [];
    }

    return [];
  };

  const handleDocumentUpload = async (file?: File | null,
    scope?: UploadScope,
    runAutofill?: () => void | Promise<void>,
  ) => {
    try {
      if (!file || !scope) return;

      setAiError('');
      setAiNotice('');

            const validationError = validateAiDocumentFile(file);
      if (validationError) {
        setAiError(validationError);
        return;
      }

      setUploadingScope(scope as UploadScope);

      const uploaded = await uploadAIDocument(file, { section: '15' });

      const uploadedRecord: UploadedAIFile = buildUploadedAiFile(uploaded, file, {
        sectionId: '15',
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

  const handleAutofill15A = async () => {
    try {
      const scope: UploadScope = '15A-full';
      const uploadedFile = getUploadedFileForScope(scope);

      if (!uploadedFile) {
        setAiError('Please upload a health document first.');
        return;
      }

      setAiError('');
      setAiNotice('');
      setAiLoadingScope(scope);

      const json = await runAiSectionAutofill({
        sectionKey: 'health_information',
        sectionId: '15',
        file_id: uploadedFile.file_id,
        mime_type: uploadedFile.mime_type,
        subsection: '15A',
        uploadScope: String(scope),
        aiRouting,
        });

      if (!json) return;

      const patch = unwrapAiAutofillPatch(json?.result);
      const extracted15A = extractSubsectionPatch(patch, '15A');
      const normalized15A = buildAiFieldPatch(
        extracted15A,
        SECTION_15A.fields as any,
      );

      if (!aiPatchHasValues(normalized15A)) {
        setAiError(
          'AI could not find health insurance or medical information in this document.',
        );
        return;
      }

      update15AWithPatch(normalized15A);
      setAiNotice(
        'AI filled health insurance and medical information. Please review the fields.',
      );
    } catch (err: any) {
      setAiError(err?.message || 'AI autofill failed');
    } finally {
      setAiLoadingScope(null);
      releaseDeferredAiRoutingDialog(aiRouting);
    }
  };

  const handleAutofill15B = async (
    scope: UploadScope = '15B-full',
    providerIndex?: number,
  ) => {
    try {
      const uploadedFile = getUploadedFileForScope(scope);

      if (!uploadedFile) {
        setAiError('Please upload a healthcare provider document first.');
        return;
      }

      setAiError('');
      setAiNotice('');
      setAiLoadingScope(scope);

      const json = await runAiSectionAutofill({
        sectionKey: 'health_information',
        sectionId: '15',
        file_id: uploadedFile.file_id,
        mime_type: uploadedFile.mime_type,
        subsection: '15B',
        uploadScope: String(scope),
        aiRouting,
        });

      if (!json) return;

      const patch = unwrapAiAutofillPatch(json?.result);
      const extractedProviders = extractProviderArrayFromPatch(patch);

      if (extractedProviders.length === 0) {
        setAiError(
          'AI could not find healthcare provider information in this document.',
        );
        return;
      }

      if (typeof providerIndex === 'number') {
        const firstProvider = cleanPatchObject(extractedProviders[0]);
        const next = [...providers];

        next[providerIndex] = {
          ...(next[providerIndex] || createEmptyProvider()),
          ...firstProvider,
          __rowId: next[providerIndex]?.__rowId || createRowId(),
        };

        updateProviders(next);

        setAiNotice(
          `AI filled ${SECTION_15B.itemLabel} #${providerIndex + 1}. Please review the fields.`,
        );

        return;
      }

      updateProviders([...providers, ...extractedProviders]);

      setAiNotice(
        extractedProviders.length === 1
          ? 'AI added 1 healthcare provider. Please review the fields.'
          : `AI added ${extractedProviders.length} healthcare providers. Please review the fields.`,
      );
    } catch (err: any) {
      setAiError(err?.message || 'AI autofill failed');
    } finally {
      setAiLoadingScope(null);
      releaseDeferredAiRoutingDialog(aiRouting);
    }
  };

  const renderUploader = ({
    scope,
    title,
    description,
    buttonLabel,
    compact = false,
    variant = 'health',
    onAutofill,
  }: {
    scope: UploadScope;
    title: string;
    description: string;
    buttonLabel: string;
    compact?: boolean;
    variant?: 'health' | 'provider';
    onAutofill: () => void;
  }) => {
    const uploadedFile = getUploadedFileForScope(scope);
    const isUploading = uploadingScope === scope;
    const isReading = aiLoadingScope === scope;
    const highlightUpload =
      aiRouting?.shouldHighlightUpload('15', String(scope)) ?? false;

    const isHealth = variant === 'health';

    const wrapperClass = isHealth
      ? 'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-red-50/50 hover:border-red-300'
      : 'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-cyan-50/50 hover:border-cyan-300';

    const iconClass = isHealth ? 'text-red-600' : 'text-cyan-600';

    const uploadBoxClass = isHealth
      ? 'hover:border-red-300 hover:bg-red-50/50'
      : 'hover:border-cyan-300 hover:bg-cyan-50/50';

    const glowOne = isHealth ? 'bg-red-100/70' : 'bg-cyan-100/70';
    const glowTwo = isHealth ? 'bg-pink-100/70' : 'bg-blue-100/70';

    return (
      <div
        data-ai-upload-zone={highlightUpload ? 'highlight' : undefined}
        className={[
          'relative overflow-hidden rounded-2xl border border-dashed p-4 shadow-sm transition-all duration-200 hover:shadow-md',
          wrapperClass,
          compact ? 'space-y-3' : 'space-y-4',
        ].join(' ')}
      >
        <div
          className={[
            'pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl',
            glowOne,
          ].join(' ')}
        />

        <div
          className={[
            'pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full blur-2xl',
            glowTwo,
          ].join(' ')}
        />

        {highlightUpload && (
          <div className="relative rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
            {AI_PENDING_ROUTED_HINT}
          </div>
        )}

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              {isUploading ? (
                <Loader2 className={`h-5 w-5 animate-spin ${iconClass}`} />
              ) : uploadedFile ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <UploadCloud className={`h-5 w-5 ${iconClass}`} />
              )}
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-slate-900">{title}</p>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            data-ai-autofill-trigger
            onClick={onAutofill}
            disabled={isAnyAIActionRunning || !uploadedFile}
            className="shrink-0 rounded-xl"
          >
            {isReading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}

            {isReading ? 'Reading…' : buttonLabel}
          </Button>
        </div>

        <div className="relative grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <AiDocumentDropZoneInput
            onFile={uploaded => handleDocumentUpload(uploaded, scope, onAutofill)}
            disabled={isAnyAIActionRunning}
            showSupportedHint
            className={[
              'group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-3.5 text-center transition',
              uploadBoxClass,
              compact
                ? 'md:flex-row md:justify-start md:py-3 md:text-left'
                : '',
              isAnyAIActionRunning ? 'pointer-events-none opacity-60' : '',
            ].join(' ')}
            iconClassName={iconClass}
          />
        </div>

        <AiUploadedAttachmentList file={uploadedFile} />

        {isUploading && (
          <div className="relative flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading document…
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-10">
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
        id="subsection-15A"
        className={cn(
          'rounded-3xl',
          show15A && 'border border-primary p-1',
        )}
      >
        <Card className="overflow-hidden border-slate-200/80 shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 via-white to-red-50/60 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl tracking-tight text-slate-900">
                  <HeartPulse className="h-5 w-5 text-red-600" />
                  15A. {SECTION_15A.title}
                </CardTitle>
                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  {SECTION_15A_SUBTITLE}
                </p>
              </div>

              <VaultEncryptedBadge />
            </div>
          </CardHeader>

          <CardContent className="space-y-6 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.05),transparent_36%)] p-4 sm:p-6">
            {/* {renderUploader({
              scope: '15A-full',
              title: 'Upload health insurance or medical document',
              description:
                'Upload insurance cards, Medicare/Medicaid cards, medication lists, allergy lists, medical history, emergency contact sheets, or medical power of attorney documents. AI will fill this health information section.',
              buttonLabel: 'Auto-fill Health Info',
              variant: 'health',
              onAutofill: handleAutofill15A,
            })} */}

            {getInstructionOverview(
              SECTION_15A.fields,
              'health_overview_instructions',
            ) && (
              <VaultOverviewBox
                {...getInstructionOverview(
                  SECTION_15A.fields,
                  'health_overview_instructions',
                )!}
              />
            )}

            <VaultGroupCards
              groups={SECTION_15A_GROUPS}
              fieldMap={FIELD_MAP_15A}
              renderField={fieldKey => {
                const field = FIELD_MAP_15A[fieldKey];
                if (!field || field.type === 'Instructions') return null;

                return (
                  <DynamicFormField
                    key={field.key}
                    field={field}
                    value={section15A[field.key]}
                    formData={section15A}
                    onChange={value => update15A(field.key, value)}
                    className="space-y-2"
                  />
                );
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div
        id="subsection-15B"
        className={cn(
          'rounded-3xl',
          show15B && 'border border-primary p-1',
        )}
      >
        <Card className="overflow-hidden border-slate-200/80 shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 via-white to-cyan-50/60 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl tracking-tight text-slate-900">
                  <Stethoscope className="h-5 w-5 text-cyan-600" />
                  15B. {SECTION_15B.title}
                </CardTitle>
                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  {SECTION_15B_SUBTITLE}
                </p>
              </div>

              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                <VaultEncryptedBadge />
                <Button
                  type="button"
                  size="sm"
            data-ai-autofill-trigger
            onClick={addProvider}
                  className="rounded-xl"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add {SECTION_15B.itemLabel}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.05),transparent_36%)] p-4 sm:p-6">
            <VaultOverviewBox
              label={SECTION_15B_OVERVIEW.label}
              content={SECTION_15B_OVERVIEW.content}
            />

            {renderUploader({
              scope: '15B-full',
              title: 'Upload document for multiple healthcare providers',
              description:
                'Use this if one document contains one or more doctors, clinics, pharmacies, therapists, dentists, patient portal records, or provider contact details. AI will add extracted providers as new cards.',
              buttonLabel: 'Extract Providers',
              variant: 'provider',
              onAutofill: () => handleAutofill15B('15B-full'),
            })}

            {providers.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <Stethoscope className="h-5 w-5 text-slate-500" />
                </div>

                <p className="font-medium text-slate-800">
                  No healthcare providers added yet.
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Click “Add Healthcare Provider” to create a blank card, or
                  upload a provider document above and let AI create the card.
                </p>
              </div>
            )}

            {providers.map((provider, index) => {
              const itemScope = `15B:${index}` as UploadScope;
              const itemLabel = `${SECTION_15B.itemLabel} #${index + 1}`;
              const topicProps = getTopicCardProps('15B', index, activeTopicId);

              return (
                <Card
                  key={provider.__rowId || `${itemScope}-${index}`}
                  id={topicProps.id}
                  className={topicProps.className}
                >
                  <div className="flex flex-col gap-3 border-b bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <strong className="text-slate-900">{itemLabel}</strong>

                      <p className="text-sm text-slate-500">
                        Upload a doctor contact card, provider record, patient
                        portal screenshot, appointment note, pharmacy profile,
                        or medical visit summary to autofill only this provider.
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeProvider(index)}
                      className="rounded-xl"
                    >
                      <Minus className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  </div>

                  <CardContent className="space-y-6 p-5">
                    {renderUploader({
                      scope: itemScope,
                      title: `Upload document for ${itemLabel}`,
                      description: `This will autofill only ${itemLabel}. It will not overwrite other healthcare provider cards.`,
                      buttonLabel: `Auto-fill ${itemLabel}`,
                      compact: true,
                      variant: 'provider',
                      onAutofill: () => handleAutofill15B(itemScope, index),
                    })}

                    <VaultGroupCards
                      groups={SECTION_15B_GROUPS}
                      fieldMap={FIELD_MAP_15B}
                      renderField={fieldKey => {
                        const field = FIELD_MAP_15B[fieldKey];
                        if (!field) return null;

                        return (
                          <DynamicFormField
                            key={`${field.key}-${provider.__rowId || index}`}
                            field={field}
                            value={provider?.[field.key]}
                            formData={provider}
                            rowId={provider.__rowId}
                            onChange={value =>
                              updateProvider(index, field.key, value)
                            }
                            className="space-y-2"
                          />
                        );
                      }}
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
