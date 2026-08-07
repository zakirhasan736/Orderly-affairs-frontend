'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/common/ui/card';
import { Button } from '@/components/common/ui/button';
import { Alert, AlertDescription } from '@/components/common/ui/alert';
import { DynamicFormField } from '@/components/DynamicFormField';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  FileText,
  History,
  Loader2,
  Minus,
  Plus,
  Sparkles,
  UploadCloud,
  Wallet,
} from 'lucide-react';

import { releaseDeferredAiRoutingDialog, runAiSectionAutofill } from '@/services/aiSectionAutofill';
import {
  createEmptyItemFromFields,
  mergeAiPatchWithDefaults,
} from '@/utils/aiPatchNormalizer';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import {
  resolveAiUploadedFileForScope,
  useRestoreAiPendingUploadForSection,
} from '@/hooks/useAiUploadedFileResolver';
import { uploadAIDocument } from '@/services/aiDocumentUpload';
import {
  buildUploadedAiFile,
  type UploadedAIFile,
  validateAiDocumentFile,
} from '@/utils/aiDocumentUploadUi';
import { AiDocumentDropZoneInput } from '@/components/ai/AiDocumentDropZoneInput';
import { AI_PENDING_ROUTED_HINT } from '@/utils/aiRoutingUi';
import {
  getTopicCardProps,
  useScrollToVaultTopic,
} from '@/utils/vaultTopicNavigation';
import { getItemDisplayLabel } from '@/utils/dynamicVaultTopics';

import { getVaultSubsectionDisplayId } from '@/utils/vaultNavigation';
/* ============================================================
   SECTION 18A — CURRENT EMPLOYMENT
============================================================ */

const SECTION_18A = {
  subsectionId: '18A',
  title: 'Current Employment',
  itemLabel: 'Current Employment',
  fields: [
    {
      key: 'employment_status',
      label: 'Employment Status',
      type: 'RadioButtons',
      options: [
        'Employed Full-Time',
        'Employed Part-Time',
        'Self-Employed',
        'Business Owner',
        'Retired',
        'Unemployed',
        'Disabled',
        'Other',
      ],
      helperText: 'Your current employment situation',
    },
    {
      key: 'employer_name',
      label: 'Employer/Company Name',
      type: 'TextInput',
      helperText: 'Name of your current employer or company',
      conditionalDisplay: {
        field: 'employment_status',
        value: ['Employed Full-Time', 'Employed Part-Time'],
      },
    },
    {
      key: 'job_title',
      label: 'Job Title/Position',
      type: 'TextInput',
      helperText: 'Your current job title or position',
    },
    {
      key: 'work_address',
      label: 'Work Address',
      type: 'TextArea',
      helperText: 'Address of your workplace',
    },
    {
      key: 'work_phone',
      label: 'Work Phone Number',
      type: 'TextInput',
      helperText: 'Main phone number for your workplace',
    },
    {
      key: 'supervisor_hr',
      label: 'Supervisor/HR Contact',
      type: 'TextInputWithUpload',
      helperText: 'Contact information for your supervisor or HR department',
    },
    {
      key: 'employee_id',
      label: 'Employee ID',
      type: 'TextInput',
      helperText: 'Your employee identification number',
    },
    {
      key: 'start_date',
      label: 'Start Date',
      type: 'DatePicker',
      helperText: 'When you started this job',
    },
    {
      key: 'salary_wage',
      label: 'Salary/Wage Information',
      type: 'TextArea',
      helperText: 'Annual salary or hourly wage information',
    },
    {
      key: 'benefits',
      label: 'Employment Benefits',
      type: 'TextArea',
      helperText:
        'Health insurance, retirement plans, life insurance, or other benefits through work',
    },
    {
      key: 'vacation_sick_time',
      label: 'Vacation/Sick Time',
      type: 'TextArea',
      helperText: 'Accrued vacation time, sick leave, or PTO balances',
    },
    {
      key: 'work_equipment',
      label: 'Company Equipment',
      type: 'TextArea',
      helperText:
        'Company-owned equipment you have (laptop, phone, car, tools, etc.)',
    },
    {
      key: 'employment_documents',
      label: 'Employment Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload employee handbook, benefits information, or contracts',
    },
  ],
};

/* ============================================================
   SECTIONS 18B–18D
============================================================ */

const createRepeatableSection = (
  subsectionId: '18B' | '18C' | '18D',
  title: string,
  itemLabel: string,
  fields: any[],
) => ({ subsectionId, title, itemLabel, fields });

const SECTION_18B = createRepeatableSection(
  '18B',
  'Business Ownership',
  'Business',
  [
    {
      key: 'business_name',
      label: 'Business Name',
      type: 'TextInput',
      helperText: 'Legal name of your business',
    },
    {
      key: 'business_type',
      label: 'Business Type',
      type: 'Dropdown',
      options: [
        'Sole Proprietorship',
        'Partnership',
        'LLC',
        'Corporation',
        'S-Corporation',
        'Non-Profit',
        'Other',
      ],
      helperText: 'Legal structure of your business',
    },
    {
      key: 'business_type_other',
      label: 'Please specify other business type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of business structure',
      conditionalDisplay: { field: 'business_type', value: 'Other' },
    },
    {
      key: 'business_address',
      label: 'Business Address',
      type: 'TextArea',
      helperText: 'Physical address of your business',
    },
    {
      key: 'business_phone',
      label: 'Business Phone',
      type: 'TextInput',
      helperText: 'Main business phone number',
    },
    {
      key: 'tax_id',
      label: 'Tax ID/EIN',
      type: 'TextInput',
      helperText: 'Business tax identification number',
    },
    {
      key: 'business_description',
      label: 'Business Description',
      type: 'TextArea',
      helperText: 'What your business does and main services/products',
    },
    {
      key: 'ownership_percentage',
      label: 'Ownership Percentage',
      type: 'TextInput',
      helperText: 'Your percentage of ownership in this business',
    },
    {
      key: 'business_partners',
      label: 'Business Partners',
      type: 'TextArea',
      helperText:
        'Names and contact information of business partners or co-owners',
    },
    {
      key: 'key_employees',
      label: 'Key Employees',
      type: 'TextArea',
      helperText: 'Important employees and their contact information',
    },
    {
      key: 'succession_plan',
      label: 'Business Succession Plan',
      type: 'TextArea',
      helperText:
        'Plans for business continuation or sale upon your death or incapacity',
    },
    {
      key: 'business_attorney',
      label: 'Business Attorney/Advisor',
      type: 'TextInputWithUpload',
      helperText:
        'Contact information for business attorney, accountant, or advisor',
    },
    {
      key: 'business_accounts',
      label: 'Business Financial Accounts',
      type: 'TextArea',
      helperText: 'Business bank accounts, credit cards, or financial accounts',
    },
    {
      key: 'business_documents',
      label: 'Business Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload business formation documents, partnerships agreements, or important contracts',
    },
  ],
);

const SECTION_18C = createRepeatableSection(
  '18C',
  'Past Employment',
  'Previous Job',
  [
    {
      key: 'employer_name',
      label: 'Employer Name',
      type: 'TextInput',
      helperText: 'Company or organization name',
    },
    {
      key: 'job_title',
      label: 'Job Title/Position',
      type: 'TextInput',
      helperText: 'Your position or title at this employer',
    },
    {
      key: 'employment_dates',
      label: 'Employment Dates',
      type: 'TextInput',
      helperText: 'Start and end dates (e.g., Jan 2010 - Dec 2015)',
    },
    {
      key: 'job_description',
      label: 'Job Description',
      type: 'TextArea',
      helperText: 'Brief description of your role and responsibilities',
    },
    {
      key: 'employer_address',
      label: 'Employer Address',
      type: 'TextArea',
      helperText: 'Company address and contact information',
    },
    {
      key: 'supervisor_contact',
      label: 'Supervisor/HR Contact',
      type: 'TextInputWithUpload',
      helperText: 'Contact information for former supervisor or HR department',
    },
    {
      key: 'reason_for_leaving',
      label: 'Reason for Leaving',
      type: 'TextArea',
      helperText: 'Why you left this position',
    },
    {
      key: 'achievements',
      label: 'Key Achievements',
      type: 'TextArea',
      helperText: 'Notable accomplishments or contributions in this role',
    },
    {
      key: 'employment_documents',
      label: 'Employment Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload employment letters, performance reviews, or other relevant documents',
    },
  ],
);

const SECTION_18D = createRepeatableSection(
  '18D',
  'Income Sources',
  'Income Source',
  [
    {
      key: 'income_type',
      label: 'Type of Income',
      type: 'Dropdown',
      options: [
        'Salary/Wages',
        'Social Security',
        'Pension',
        'Retirement Account Distributions',
        'Investment Income',
        'Rental Income',
        'Business Income',
        'Freelance/Contract Work',
        'Disability Benefits',
        'Alimony',
        'Other',
      ],
      helperText: 'Category of this income source',
    },
    {
      key: 'income_type_other',
      label: 'Please specify other income type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of income',
      conditionalDisplay: { field: 'income_type', value: 'Other' },
    },
    {
      key: 'income_source',
      label: 'Income Source',
      type: 'TextInput',
      helperText:
        'Where this income comes from (employer, government, investment company, etc.)',
    },
    {
      key: 'income_amount',
      label: 'Income Amount',
      type: 'TextInput',
      helperText: 'Amount and frequency (e.g., $3,000/month, $50,000/year)',
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      type: 'TextArea',
      helperText: 'How you receive this income (direct deposit, check, etc.)',
    },
    {
      key: 'tax_withholding',
      label: 'Tax Withholding',
      type: 'TextArea',
      helperText: 'Information about taxes withheld from this income',
    },
    {
      key: 'income_contact',
      label: 'Contact Information',
      type: 'TextInputWithUpload',
      helperText: 'Contact information for this income source',
    },
    {
      key: 'income_documents',
      label: 'Income Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload pay stubs, 1099s, benefit statements, or other income documentation',
    },
  ],
);

const REPEATABLE_SECTIONS = [SECTION_18B, SECTION_18C, SECTION_18D];

/* ============================================================
   TYPES / CONFIG
============================================================ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  activeSubsection?: string | null;
  activeTopicId?: string | null;
}

type SubsectionId = '18A' | '18B' | '18C' | '18D';

const SUBSECTION_UI: Record<
  SubsectionId,
  {
    title: string;
    icon: React.ElementType;
    tone: {
      wrapper: string;
      icon: string;
      uploadBox: string;
      glowOne: string;
      glowTwo: string;
      header: string;
    };
    uploadTitle: string;
    uploadDescription: string;
    buttonLabel: string;
    emptyError: string;
    successMessage: string;
  }
> = {
  '18A': {
    title: 'Current Employment',
    icon: Briefcase,
    tone: {
      wrapper:
        'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 hover:border-blue-300',
      icon: 'text-blue-600',
      uploadBox: 'hover:border-blue-300 hover:bg-blue-50/50',
      glowOne: 'bg-blue-100/70',
      glowTwo: 'bg-sky-100/70',
      header: 'from-slate-50 to-blue-50/70',
    },
    uploadTitle: 'Upload current employment document',
    uploadDescription:
      'Upload an employment contract, offer letter, pay stub, employee handbook, benefits statement, or HR document. AI will fill current employment fields.',
    buttonLabel: 'Auto-fill Current Employment',
    emptyError:
      'AI could not find current employment information in this file.',
    successMessage:
      'AI filled current employment fields. Please review the results.',
  },
  '18B': {
    title: 'Business Ownership',
    icon: Building2,
    tone: {
      wrapper:
        'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 hover:border-emerald-300',
      icon: 'text-emerald-600',
      uploadBox: 'hover:border-emerald-300 hover:bg-emerald-50/50',
      glowOne: 'bg-emerald-100/70',
      glowTwo: 'bg-green-100/70',
      header: 'from-slate-50 to-emerald-50/70',
    },
    uploadTitle: 'Upload business document for this card',
    uploadDescription:
      'Upload formation documents, operating agreements, business licenses, tax documents, contracts, or business account documents. AI will fill only this business card.',
    buttonLabel: 'Auto-fill This Business',
    emptyError:
      'AI could not find business ownership information in this file.',
    successMessage: 'AI filled this business card. Please review the results.',
  },
  '18C': {
    title: 'Past Employment',
    icon: History,
    tone: {
      wrapper:
        'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-violet-50/60 hover:border-violet-300',
      icon: 'text-violet-600',
      uploadBox: 'hover:border-violet-300 hover:bg-violet-50/50',
      glowOne: 'bg-violet-100/70',
      glowTwo: 'bg-purple-100/70',
      header: 'from-slate-50 to-violet-50/70',
    },
    uploadTitle: 'Upload past employment document for this card',
    uploadDescription:
      'Upload a resume, previous employment letter, performance review, contract, reference letter, W-2, or HR document. AI will fill only this previous job card.',
    buttonLabel: 'Auto-fill This Job',
    emptyError: 'AI could not find past employment information in this file.',
    successMessage:
      'AI filled this previous job card. Please review the results.',
  },
  '18D': {
    title: 'Income Sources',
    icon: Wallet,
    tone: {
      wrapper:
        'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-amber-50/60 hover:border-amber-300',
      icon: 'text-amber-600',
      uploadBox: 'hover:border-amber-300 hover:bg-amber-50/50',
      glowOne: 'bg-amber-100/70',
      glowTwo: 'bg-orange-100/70',
      header: 'from-slate-50 to-amber-50/70',
    },
    uploadTitle: 'Upload income document for this card',
    uploadDescription:
      'Upload pay stubs, 1099s, W-2s, benefit statements, pension statements, Social Security letters, rental records, or invoices. AI will fill only this income source card.',
    buttonLabel: 'Auto-fill This Income',
    emptyError: 'AI could not find income source information in this file.',
    successMessage:
      'AI filled this income source card. Please review the results.',
  },
};

/* ============================================================
   HELPERS
============================================================ */

const createRowId = () => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getReadableFileType = (mimeType?: string) => {
  if (!mimeType) return 'Document';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'text/plain') return 'Text';
  if (mimeType.includes('image')) return 'Image';
  return mimeType;
};

const getSafeObject = (value: any) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  return {};
};

const cleanPatchObject = (patch: any) => {
  if (!patch || typeof patch !== 'object') return {};

  return Object.fromEntries(
    Object.entries(patch).filter(([key, value]) => {
      if (key === '__rowId') return false;
      if (key.endsWith('_instructions')) return false;
      if (key.endsWith('_header')) return false;
      if (value === null || value === undefined || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  );
};

const extractObjectFromPatch = (subsection: SubsectionId, patch: any) => {
  const raw = patch?.[subsection];

  if (Array.isArray(raw)) {
    return cleanPatchObject(raw[0] || {});
  }

  if (raw && typeof raw === 'object') {
    return cleanPatchObject(raw);
  }

  return {};
};

/* ============================================================
   COMPONENT
============================================================ */

export default function Section18EmploymentBusiness({
  data = {},
  onChange = () => {},
  activeSubsection,
  activeTopicId,
}: Props) {
  const [aiNotice, setAiNotice] = useState('');
  const [aiError, setAiError] = useState('');

  const [uploadingScope, setUploadingScope] = useState<string | null>(null);
  const [aiLoadingScope, setAiLoadingScope] = useState<string | null>(null);

  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, UploadedAIFile | null>
  >({});

  const latestUploadRef = useRef<Record<string, UploadedAIFile>>({});

  const aiRouting = useOptionalAiDocumentRouting();

  useRestoreAiPendingUploadForSection({
    sectionId: '18',
    setUploadedFiles,
    latestUploadRef,
  });

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  useScrollToVaultTopic(activeTopicId, JSON.stringify(data));

  useEffect(() => {
    const next = { ...data };
    let changed = false;

    if (
      !next['18A'] ||
      typeof next['18A'] !== 'object' ||
      Array.isArray(next['18A'])
    ) {
      next['18A'] = {};
      changed = true;
    }

    (['18B', '18C', '18D'] as SubsectionId[]).forEach(id => {
      if (id === '18A') return;

      if (!Array.isArray(next[id])) {
        next[id] = [];
        changed = true;
        return;
      }

      const withRowIds = next[id].map((item: any) => {
        if (item?.__rowId) return item;
        changed = true;
        return {
          __rowId: createRowId(),
          ...(item || {}),
        };
      });

      next[id] = withRowIds;
    });

    if (changed) {
      onChange(next);
    }

    // Initialize once only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSubsection = (key: SubsectionId, value: any) => {
    onChange({
      ...data,
      [key]: value,
    });
  };

  const updateObjectField = (
    subsection: SubsectionId,
    key: string,
    value: any,
  ) => {
    const current = getSafeObject(data[subsection]);

    updateSubsection(subsection, {
      ...current,
      [key]: value,
    });
  };

  const updateObjectWithPatch = (subsection: SubsectionId, patch: any) => {
    const current = getSafeObject(data[subsection]);

    updateSubsection(subsection, {
      ...current,
      ...patch,
    });
  };

  const getItems = (subsection: SubsectionId) => {
    const raw = data[subsection];
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') return [raw];
    return [];
  };

  const makeEmptyItem = (fields: any[]) => ({
    __rowId: createRowId(),
    ...Object.fromEntries(fields.map(field => [field.key, ''])),
  });

  const addItem = (section: any) => {
    const items = getItems(section.subsectionId);

    updateSubsection(section.subsectionId, [
      ...items,
      makeEmptyItem(section.fields),
    ]);
  };

  const updateItem = (
    subsection: SubsectionId,
    index: number,
    key: string,
    value: any,
  ) => {
    const items = getItems(subsection);
    const next = [...items];

    next[index] = {
      ...next[index],
      [key]: value,
    };

    updateSubsection(subsection, next);
  };

  const updateItemWithPatch = (
    subsection: SubsectionId,
    index: number,
    patch: any,
  ) => {
    const items = getItems(subsection);
    const next = [...items];

    next[index] = {
      ...next[index],
      ...patch,
    };

    updateSubsection(subsection, next);
  };

  const removeItem = (subsection: SubsectionId, index: number) => {
    const items = getItems(subsection);
    updateSubsection(
      subsection,
      items.filter((_: any, i: number) => i !== index),
    );
  };

  const getUploadedFileForScope = (scope: string) => {
    const pendingFile =
      aiRouting?.getPendingFileForSection('18', String(scope)) ?? null;

    return resolveAiUploadedFileForScope(scope, uploadedFiles, latestUploadRef, pendingFile);
  };

  const handleDocumentUpload = async (
    file?: File | null,
    scope?: string,
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

      setUploadingScope(scope);

      const uploaded = await uploadAIDocument(file, { section: '18' });

      const uploadedRecord: UploadedAIFile = buildUploadedAiFile(uploaded, file, {
        sectionId: '18',
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

  const handleAutofill = async ({
    subsection,
    scope,
    itemIndex,
  }: {
    subsection: SubsectionId;
    scope: string;
    itemIndex?: number;
  }) => {
    const config = SUBSECTION_UI[subsection];

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
        sectionKey: 'employment_business',
        sectionId: '18',
        file_id: uploadedFile.file_id,
        subsection,
        uploadScope: String(scope),
        aiRouting,
        });

      if (!json) return;

      const patch = json?.result?.patch ?? {};
      const extracted = extractObjectFromPatch(subsection, patch);

      if (Object.keys(extracted).length === 0) {
        setAiError(config.emptyError);
        return;
      }

      if (subsection === '18A') {
        updateObjectWithPatch('18A', extracted);
      } else {
        if (typeof itemIndex !== 'number') {
          setAiError('Please select a card to autofill.');
          return;
        }

        updateItemWithPatch(subsection, itemIndex, extracted);
      }

      setAiNotice(config.successMessage);
    } catch (err: any) {
      setAiError(err?.message || 'AI autofill failed');
    } finally {
      setAiLoadingScope(null);
      releaseDeferredAiRoutingDialog(aiRouting);
    }
  };

  const renderUploader = ({
    subsection,
    scope,
    itemIndex,
  }: {
    subsection: SubsectionId;
    scope: string;
    itemIndex?: number;
  }) => {
    const config = SUBSECTION_UI[subsection];
    const uploadedFile = getUploadedFileForScope(scope);
    const isUploading = uploadingScope === scope;
    const isReading = aiLoadingScope === scope;
    const highlightUpload =
      aiRouting?.shouldHighlightUpload('18', String(scope)) ?? false;
    const tone = config.tone;
    const runAutofill = () =>
      handleAutofill({ subsection, scope, itemIndex });

    return (
      <div
        data-ai-upload-zone={highlightUpload ? 'highlight' : undefined}
        className={[
          'relative overflow-hidden rounded-2xl border border-dashed p-4 shadow-sm transition-all duration-200 hover:shadow-md',
          tone.wrapper,
          'space-y-4',
        ].join(' ')}
      >
        <div
          className={[
            'pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl',
            tone.glowOne,
          ].join(' ')}
        />

        <div
          className={[
            'pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full blur-2xl',
            tone.glowTwo,
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
                <Loader2 className={`h-5 w-5 animate-spin ${tone.icon}`} />
              ) : uploadedFile ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <UploadCloud className={`h-5 w-5 ${tone.icon}`} />
              )}
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-slate-900">
                {config.uploadTitle}
              </p>

              <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                {config.uploadDescription}
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            data-ai-autofill-trigger
            onClick={() => handleAutofill({ subsection, scope, itemIndex })}
            disabled={isAnyAIActionRunning || !uploadedFile}
            className="shrink-0 rounded-xl"
          >
            {isReading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}

            {isReading ? 'Reading…' : config.buttonLabel}
          </Button>
        </div>

        <div className="relative grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <AiDocumentDropZoneInput
            onFile={uploaded => handleDocumentUpload(uploaded, scope, runAutofill)}
            disabled={isAnyAIActionRunning}
            showSupportedHint
            sectionId="18"
            className={[
              'group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-3.5 text-center transition',
              tone.uploadBox,
              isAnyAIActionRunning ? 'pointer-events-none opacity-60' : '',
            ].join(' ')}
            iconClassName={tone.icon}
          />
        </div>

        {isUploading && (
          <div className="relative flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading document…
          </div>
        )}
      </div>
    );
  };

  const render18A = () => {
    const show = !activeSubsection || activeSubsection === '18A';
    const sectionData = getSafeObject(data['18A']);
    const config = SUBSECTION_UI['18A'];
    const Icon = config.icon;

    return (
      <div
        id="subsection-18A"
        className={`rounded-3xl ${show ? 'border border-primary p-1' : ''}`}
      >
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader
            className={`border-b bg-gradient-to-r ${config.tone.header}`}
          >
            <CardTitle className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${config.tone.icon}`} />
              {getVaultSubsectionDisplayId('18', '18A')}. {SECTION_18A.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 p-5">
            {renderUploader({
              subsection: '18A',
              scope: '18A-full',
            })}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {SECTION_18A.fields.map(field => (
                <DynamicFormField
                  key={field.key}
                  field={field}
                  value={sectionData?.[field.key]}
                  formData={sectionData}
                  onChange={value => updateObjectField('18A', field.key, value)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRepeatable = (section: any) => {
    const subsection = section.subsectionId as SubsectionId;
    const show = !activeSubsection || activeSubsection === subsection;
    const items = getItems(subsection);
    const config = SUBSECTION_UI[subsection];
    const Icon = config.icon;

    return (
      <div
        key={subsection}
        id={`subsection-${subsection}`}
        className={`rounded-3xl ${show ? 'border border-primary p-1' : ''}`}
      >
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader
            className={`border-b bg-gradient-to-r ${config.tone.header}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${config.tone.icon}`} />
                {getVaultSubsectionDisplayId('18', subsection)}. {section.title}
              </CardTitle>

              <Button
                type="button"
                size="sm"
            data-ai-autofill-trigger
            onClick={() => addItem(section)}
                className="w-auto rounded-xl sm:w-auto"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add {section.itemLabel}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-5">
            {items.length === 0 && (
              <div className="rounded-2xl border border-dashed bg-slate-50 px-4 py-8 text-center">
                <p className="text-sm font-medium text-slate-700">
                  No {section.itemLabel.toLowerCase()} added yet.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Add a card first, then upload a document to autofill that
                  specific card.
                </p>

                <Button
                  type="button"
                  size="sm"
            data-ai-autofill-trigger
            onClick={() => addItem(section)}
                  className="w-auto  mt-4 rounded-xl"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add {section.itemLabel}
                </Button>
              </div>
            )}

            {items.map((item: any, index: number) => {
              const rowId = item?.__rowId || `${subsection}-${index}`;
              const scope = `${subsection}-${rowId}`;
              const topicProps = getTopicCardProps(
                subsection,
                index,
                activeTopicId,
              );
              const itemLabel = getItemDisplayLabel(
                '18',
                subsection,
                item || {},
                index,
                section.itemLabel,
              );

              return (
                <Card
                  key={rowId}
                  id={topicProps.id}
                  className={topicProps.className}
                >
                  <CardHeader className="border-b bg-slate-50/70">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {itemLabel}
                        </p>
                        <p className="text-sm text-slate-500">
                          Upload a document here to autofill only this card.
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeItem(subsection, index)}
                        className="w-auto rounded-xl sm:w-auto"
                      >
                        <Minus className="mr-1 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 p-5">
                    {renderUploader({
                      subsection,
                      scope,
                      itemIndex: index,
                    })}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {section.fields.map((field: any) => (
                        <DynamicFormField
                          key={`${field.key}-${rowId}`}
                          field={field}
                          value={item?.[field.key]}
                          formData={item}
                          rowId={rowId}
                          onChange={(value: any) =>
                            updateItem(subsection, index, field.key, value)
                          }
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
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

      {render18A()}

      {REPEATABLE_SECTIONS.map(renderRepeatable)}
    </div>
  );
}
