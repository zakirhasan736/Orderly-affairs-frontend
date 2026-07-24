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
  Landmark,
  WalletCards,
  CreditCard,
  Users,
  KeyRound,
  Smartphone,
  Shield,
} from 'lucide-react';
import { cn } from '@common/ui/utils';
import { DynamicFormField } from '@/components/DynamicFormField';
import {
  type FieldGroup,
  buildFieldMap,
  VaultOverviewBox,
  VaultEncryptedBadge,
  VaultGroupCards,
} from '@/utils/vaultGroupedFields';
import { Alert, AlertDescription } from '@/components/common/ui/alert';

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
  validateAiDocumentFile,
} from '@/utils/aiDocumentUploadUi';
import { AiDocumentDropZoneInput } from '@/components/ai/AiDocumentDropZoneInput';
import { AI_PENDING_ROUTED_HINT } from '@/utils/aiRoutingUi';
import {
  getTopicCardProps,
  useScrollToVaultTopic,
} from '@/utils/vaultTopicNavigation';

/* ------------------------------------------------------------------ */
/* CONFIG                                                              */
/* ------------------------------------------------------------------ */

const SECTION_12A = {
  subsectionId: '12A',
  title: 'Bank Accounts',
  itemLabel: 'Bank Account',
  fields: [
    {
      key: 'bank_name',
      label: 'Bank Name',
      type: 'TextInput',
      helperText: 'Name of the financial institution',
      required: true,
    },
    {
      key: 'account_type',
      label: 'Account Type',
      type: 'Dropdown',
      options: [
        'Checking',
        'Savings',
        'Money Market',
        'Certificate of Deposit (CD)',
        'Business Checking',
        'Business Savings',
        'Other',
      ],
      helperText: 'Type of bank account',
    },
    {
      key: 'account_type_other',
      label: 'Please specify other account type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of bank account',
      conditionalDisplay: { field: 'account_type', value: 'Other' },
    },
    {
      key: 'account_number',
      label: 'Account Number',
      type: 'TextInputWithUpload',
      helperText:
        'Account number or upload a photo of bank statement showing account details',
    },
    {
      key: 'routing_number',
      label: 'Routing Number',
      type: 'TextInput',
      helperText: 'Bank routing number for transfers',
    },
    {
      key: 'account_purpose',
      label: 'Account Purpose',
      type: 'TextArea',
      helperText:
        'What this account is used for (household expenses, emergency fund, business, etc.)',
    },
    {
      key: 'joint_account_holders',
      label: 'Joint Account Holders',
      type: 'TextArea',
      helperText: 'Names of other people on this account',
    },
    {
      key: 'beneficiaries',
      label: 'Beneficiaries',
      type: 'TextArea',
      helperText: 'Named beneficiaries for this account',
    },
    {
      key: 'bank_contact',
      label: 'Bank Contact Information',
      type: 'TextInputWithUpload',
      helperText: 'Branch location, phone number, or upload business cards',
    },
    {
      key: 'online_banking',
      label: 'Online Banking Username',
      type: 'TextInput',
      helperText: 'Username for online banking access',
    },
    {
      key: 'online_banking_password',
      label: 'Online Banking Password',
      type: 'TextInput',
      inputType: 'password',
      helperText: 'Password for online banking',
    },
    {
      key: 'automatic_payments',
      label: 'Automatic Payments',
      type: 'TextArea',
      helperText:
        'List of bills or transfers automatically paid from this account',
    },
    {
      key: 'debit_cards',
      label: 'Debit/ATM Cards',
      type: 'TextInputWithUpload',
      helperText: 'Information about cards linked to this account',
    },
    {
      key: 'safe_deposit_box',
      label: 'Safe Deposit Box',
      type: 'TextArea',
      helperText:
        'If you have a safe deposit box at this bank, include box number and key location',
    },
    {
      key: 'account_documents',
      label: 'Account Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload recent statements, signature cards, or account opening documents',
    },
  ],
};

const SECTION_12B = {
  subsectionId: '12B',
  title: '12B- Digital payment app',
  itemLabel: 'Digital Payment Account',
  fields: [
    {
      key: 'service_name',
      label: 'Service Name',
      type: 'Dropdown',
      options: [
        'PayPal',
        'Venmo',
        'Cash App',
        'Zelle',
        'Apple Pay',
        'Google Pay',
        'Samsung Pay',
        'Stripe',
        'Square',
        'Other',
      ],
      helperText: 'Name of the digital payment service',
    },
    {
      key: 'service_name_other',
      label: 'Please specify other service name',
      type: 'TextInput',
      helperText: 'Please describe the specific digital payment service',
      conditionalDisplay: { field: 'service_name', value: 'Other' },
    },
    {
      key: 'account_email_phone',
      label: 'Account Email/Phone',
      type: 'TextInput',
      helperText: 'Email address or phone number associated with the account',
    },
    {
      key: 'username',
      label: 'Username',
      type: 'TextInput',
      helperText: 'Username or handle for the service',
    },
    {
      key: 'password',
      label: 'Password',
      type: 'TextInput',
      inputType: 'password',
      helperText: 'Password for the account',
    },
    {
      key: 'linked_accounts',
      label: 'Linked Bank Accounts/Cards',
      type: 'TextArea',
      helperText: 'Bank accounts or credit cards linked to this service',
    },
    {
      key: 'account_balance',
      label: 'Typical Account Balance',
      type: 'TextInput',
      helperText: 'Approximate balance usually maintained',
    },
    {
      key: 'business_personal',
      label: 'Account Type',
      type: 'RadioButtons',
      options: ['Personal', 'Business'],
      helperText: 'Is this a personal or business account?',
    },
    {
      key: 'regular_transactions',
      label: 'Regular Transactions',
      type: 'TextArea',
      helperText: 'Regular payments or transfers made through this service',
    },
    {
      key: 'security_info',
      label: 'Security Information',
      type: 'TextArea',
      helperText:
        'Two-factor authentication setup, security questions, or backup codes',
    },
    {
      key: 'service_documents',
      label: 'Service Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload account statements, transaction records, or screenshots',
    },
  ],
};

const FIELD_MAP_12A = buildFieldMap(SECTION_12A.fields);
const FIELD_MAP_12B = buildFieldMap(SECTION_12B.fields);

const SECTION_12A_GROUPS: FieldGroup[] = [
  {
    key: 'account_basics',
    title: 'Account Basics',
    subtitle: 'Bank name, account type, and account numbers',
    icon: Landmark,
    accent: 'from-emerald-500/[0.07] to-teal-500/[0.03]',
    iconWrap: 'bg-emerald-500/10 text-emerald-700',
    layout: 'grid',
    fieldKeys: [
      'bank_name',
      'account_type',
      'account_type_other',
      'account_number',
      'routing_number',
    ],
  },
  {
    key: 'account_access',
    title: 'Account Access',
    subtitle: 'Online banking credentials and bank contact info',
    icon: KeyRound,
    accent: 'from-blue-500/[0.07] to-indigo-500/[0.03]',
    iconWrap: 'bg-blue-500/10 text-blue-600',
    layout: 'grid',
    fieldKeys: ['online_banking', 'online_banking_password', 'bank_contact'],
  },
  {
    key: 'people_purpose',
    title: 'People & Purpose',
    subtitle: 'Account purpose, joint holders, and beneficiaries',
    icon: Users,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'stack',
    fieldKeys: [
      'account_purpose',
      'joint_account_holders',
      'beneficiaries',
      'safe_deposit_box',
    ],
  },
  {
    key: 'payments_cards',
    title: 'Payments & Cards',
    subtitle: 'Automatic payments and linked debit/ATM cards',
    icon: CreditCard,
    accent: 'from-amber-500/[0.07] to-orange-500/[0.03]',
    iconWrap: 'bg-amber-500/10 text-amber-700',
    layout: 'grid',
    fieldKeys: ['automatic_payments', 'debit_cards'],
  },
  {
    key: 'documents',
    title: 'Documents',
    subtitle: 'Statements, signature cards, and account records',
    icon: FileText,
    accent: 'from-slate-500/[0.07] to-gray-500/[0.03]',
    iconWrap: 'bg-slate-500/10 text-slate-600',
    layout: 'grid',
    fieldKeys: ['account_documents'],
  },
];

const SECTION_12B_GROUPS: FieldGroup[] = [
  {
    key: 'service_identity',
    title: 'Service Identity',
    subtitle: 'Payment service, login email, and username',
    icon: Smartphone,
    accent: 'from-blue-500/[0.07] to-indigo-500/[0.03]',
    iconWrap: 'bg-blue-500/10 text-blue-600',
    layout: 'grid',
    fieldKeys: [
      'service_name',
      'service_name_other',
      'account_email_phone',
      'username',
    ],
  },
  {
    key: 'account_profile',
    title: 'Account Profile',
    subtitle: 'Password, linked accounts, balance, and account type',
    icon: WalletCards,
    accent: 'from-cyan-500/[0.07] to-sky-500/[0.03]',
    iconWrap: 'bg-cyan-500/10 text-cyan-700',
    layout: 'grid',
    fieldKeys: [
      'password',
      'linked_accounts',
      'account_balance',
      'business_personal',
    ],
  },
  {
    key: 'activity_security',
    title: 'Activity & Security',
    subtitle: 'Regular transactions and security settings',
    icon: Shield,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'grid',
    fieldKeys: ['regular_transactions', 'security_info'],
  },
  {
    key: 'documents',
    title: 'Documents',
    subtitle: 'Statements, screenshots, and transaction records',
    icon: FileText,
    accent: 'from-slate-500/[0.07] to-gray-500/[0.03]',
    iconWrap: 'bg-slate-500/10 text-slate-600',
    layout: 'grid',
    fieldKeys: ['service_documents'],
  },
];

const SUBSECTION_GROUPS: Record<SubsectionId, FieldGroup[]> = {
  '12A': SECTION_12A_GROUPS,
  '12B': SECTION_12B_GROUPS,
};

const SUBSECTION_FIELD_MAP: Record<SubsectionId, Record<string, any>> = {
  '12A': FIELD_MAP_12A,
  '12B': FIELD_MAP_12B,
};

const SUBSECTION_OVERVIEW: Record<
  SubsectionId,
  { label: string; content: string }
> = {
  '12A': {
    label: 'Bank Accounts Overview',
    content:
      'Document checking, savings, and other bank accounts so your family can manage finances and access funds. Add one card per account with login details, beneficiaries, and linked cards.',
  },
  '12B': {
    label: 'Digital Payment Apps Overview',
    content:
      'Record PayPal, Venmo, Cash App, and other digital payment accounts with login credentials and linked bank accounts. Add one card per service.',
  },
};

const SUBSECTION_SUBTITLE: Record<SubsectionId, string> = {
  '12A':
    'Add each bank account with grouped access, people, payments, and document details in a mobile-friendly layout.',
  '12B':
    'Add each digital payment account with grouped identity, security, and document details in the same layout.',
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

type SubsectionId = '12A' | '12B';

type UploadScope = '12A-full' | '12B-full' | `12A:${number}` | `12B:${number}`;

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

export default function Section12BankingFinancialAccounts({
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
    sectionId: '12',
    setUploadedFiles,
    latestUploadRef,
  });

  const bankAccounts: any[] = Array.isArray(data['12A']) ? data['12A'] : [];
  const digitalAccounts: any[] = Array.isArray(data['12B']) ? data['12B'] : [];

  useScrollToVaultTopic(
    activeTopicId,
    bankAccounts.length + digitalAccounts.length,
  );

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const getConfig = (subsection: SubsectionId) => {
    return subsection === '12A' ? SECTION_12A : SECTION_12B;
  };

  const getItems = (subsection: SubsectionId) => {
    return subsection === '12A' ? bankAccounts : digitalAccounts;
  };

  const updateSubsection = (subsection: SubsectionId, next: any[]) => {
    onChange({
      ...data,
      [subsection]: next,
    });
  };

  const makeEmptyItem = (fields: any[]) => {
    return {
      ...Object.fromEntries(fields.map(field => [field.key, ''])),
      __rowId: createRowId(),
    };
  };

  const addItem = (subsection: SubsectionId) => {
    const config = getConfig(subsection);
    const items = getItems(subsection);

    updateSubsection(subsection, [...items, makeEmptyItem(config.fields)]);
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
      ...(next[index] || {}),
      [key]: value,
      __rowId: next[index]?.__rowId || createRowId(),
    };

    updateSubsection(subsection, next);
  };

  const removeItem = (subsection: SubsectionId, index: number) => {
    const items = getItems(subsection);
    updateSubsection(
      subsection,
      items.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const getUploadedFileForScope = (scope: UploadScope) => {
    const pendingFile =
      aiRouting?.getPendingFileForSection('12', String(scope)) ?? null;

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

  const normalizePatchItem = (subsection: SubsectionId, patch: any) => {
    const config = getConfig(subsection);

    return {
      ...makeEmptyItem(config.fields),
      ...cleanPatchObject(patch),
    };
  };

  const extractArrayFromPatch = (subsection: SubsectionId, patch: any) => {
    const rawItems = patch?.[subsection];

    if (Array.isArray(rawItems)) {
      return rawItems
        .map(item => normalizePatchItem(subsection, item))
        .filter(item => {
          return Object.entries(item).some(([key, value]) => {
            return key !== '__rowId' && value !== '';
          });
        });
    }

    if (rawItems && typeof rawItems === 'object') {
      const item = normalizePatchItem(subsection, rawItems);

      const hasValue = Object.entries(item).some(([key, value]) => {
        return key !== '__rowId' && value !== '';
      });

      return hasValue ? [item] : [];
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

      const uploaded = await uploadAIDocument(file);

      const uploadedRecord: UploadedAIFile = buildUploadedAiFile(uploaded, file);

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
    } catch (err: any) {
      setAiError(err?.message || 'Document upload failed');
    } finally {
      setUploadingScope(null);
    }
  };

  const handleAutofill = async (
    subsection: SubsectionId,
    scope: UploadScope,
    itemIndex?: number,
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
        sectionKey: 'banking_financial_accounts',
        sectionId: '12',
        file_id: uploadedFile.file_id,
        subsection,
        uploadScope: String(scope),
        aiRouting,
        });

      if (!json) return;

      const patch = json?.result?.patch ?? {};
      const extractedItems = extractArrayFromPatch(subsection, patch);

      if (extractedItems.length === 0) {
        setAiError(
          subsection === '12A'
            ? 'AI could not find bank account information in this document.'
            : 'AI could not find digital payment account information in this document.',
        );
        return;
      }

      const config = getConfig(subsection);
      const items = getItems(subsection);

      if (typeof itemIndex === 'number') {
        const firstPatch = cleanPatchObject(extractedItems[0]);
        const next = [...items];

        next[itemIndex] = {
          ...(next[itemIndex] || makeEmptyItem(config.fields)),
          ...firstPatch,
          __rowId: next[itemIndex]?.__rowId || createRowId(),
        };

        updateSubsection(subsection, next);

        setAiNotice(
          `AI filled ${config.itemLabel} #${itemIndex + 1}. Please review the fields.`,
        );

        return;
      }

      updateSubsection(subsection, [...items, ...extractedItems]);

      setAiNotice(
        extractedItems.length === 1
          ? `AI added 1 ${config.itemLabel.toLowerCase()}. Please review the fields.`
          : `AI added ${extractedItems.length} ${config.itemLabel.toLowerCase()}s. Please review the fields.`,
      );
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
    title,
    description,
    buttonLabel = 'Auto-fill',
    compact = false,
    onAutofill,
  }: {
    subsection: SubsectionId;
    scope: UploadScope;
    title: string;
    description: string;
    buttonLabel?: string;
    compact?: boolean;
    onAutofill: () => void;
  }) => {
    const uploadedFile = getUploadedFileForScope(scope);
    const isUploading = uploadingScope === scope;
    const isReading = aiLoadingScope === scope;
    const highlightUpload =
      aiRouting?.shouldHighlightUpload('12', String(scope)) ?? false;
    const isBank = subsection === '12A';

    const colorClasses = isBank
      ? {
          gradient: 'to-emerald-50/50',
          hoverBorder: 'hover:border-emerald-300',
          hoverBg: 'hover:bg-emerald-50/50',
          icon: 'text-emerald-600',
          glowOne: 'bg-emerald-100/70',
          glowTwo: 'bg-cyan-100/70',
        }
      : {
          gradient: 'to-blue-50/50',
          hoverBorder: 'hover:border-blue-300',
          hoverBg: 'hover:bg-blue-50/50',
          icon: 'text-blue-600',
          glowOne: 'bg-blue-100/70',
          glowTwo: 'bg-indigo-100/70',
        };

    return (
      <div
        data-ai-upload-zone={highlightUpload ? 'highlight' : undefined}
        className={[
          'relative overflow-hidden rounded-2xl border border-dashed',
          'border-slate-300 bg-gradient-to-br from-slate-50 via-white',
          colorClasses.gradient,
          'p-4 shadow-sm transition-all duration-200',
          colorClasses.hoverBorder,
          'hover:shadow-md',
          compact ? 'space-y-3' : 'space-y-4',
        ].join(' ')}
      >
        <div
          className={[
            'pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl',
            colorClasses.glowOne,
          ].join(' ')}
        />
        <div
          className={[
            'pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full blur-2xl',
            colorClasses.glowTwo,
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
                <Loader2
                  className={`h-5 w-5 animate-spin ${colorClasses.icon}`}
                />
              ) : uploadedFile ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <UploadCloud className={`h-5 w-5 ${colorClasses.icon}`} />
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
              colorClasses.hoverBorder,
              colorClasses.hoverBg,
              compact
                ? 'md:flex-row md:justify-start md:py-3 md:text-left'
                : '',
              isAnyAIActionRunning ? 'pointer-events-none opacity-60' : '',
            ].join(' ')}
            iconClassName={colorClasses.icon}
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

  const renderSubsection = (subsection: SubsectionId) => {
    const config = getConfig(subsection);
    const items = getItems(subsection);
    const isBank = subsection === '12A';
    const fullScope = `${subsection}-full` as UploadScope;
    const Icon = isBank ? Landmark : WalletCards;

    const highlighted =
      activeSubsection && activeSubsection === subsection
        ? 'border border-primary rounded-3xl p-1'
        : '';

    return (
      <div id={`subsection-${subsection}`} className={highlighted}>
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader
            className={[
              'border-b bg-gradient-to-r from-slate-50',
              isBank ? 'to-emerald-50/70' : 'to-blue-50/70',
            ].join(' ')}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <Icon
                  className={[
                    'h-5 w-5',
                    isBank ? 'text-emerald-600' : 'text-blue-600',
                  ].join(' ')}
                />
                {subsection}. {config.title}
              </CardTitle>

              <Button
                type="button"
                size="sm"
            data-ai-autofill-trigger
            onClick={() => addItem(subsection)}
                className="rounded-xl"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add {config.itemLabel}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 p-5">
            {/* {renderUploader({
              subsection,
              scope: fullScope,
              title: isBank
                ? 'Upload document for multiple bank accounts'
                : 'Upload document for multiple digital payment accounts',
              description: isBank
                ? 'Use this if one document contains one or more bank accounts, statements, direct deposit forms, or account records. AI will add extracted accounts as new cards.'
                : 'Use this if one document contains one or more digital payment accounts, payment service statements, screenshots, or transaction records. AI will add extracted accounts as new cards.',
              buttonLabel: isBank
                ? 'Extract Bank Accounts'
                : 'Extract Digital Accounts',
              onAutofill: () => handleAutofill(subsection, fullScope),
            })} */}

            {items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-500" />
                </div>

                <p className="font-medium text-slate-800">
                  No {config.title.toLowerCase()} added yet.
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Click “Add {config.itemLabel}” to create a blank card, or
                  upload a document above and let AI create the card.
                </p>
              </div>
            )}

            {items.map((item, index) => {
              const itemScope = `${subsection}:${index}` as UploadScope;
              const itemLabel = `${config.itemLabel} #${index + 1}`;
              const topicProps = getTopicCardProps(
                subsection,
                index,
                activeTopicId,
              );

              return (
                <Card
                  key={item.__rowId || `${subsection}-${index}`}
                  id={topicProps.id}
                  className={topicProps.className}
                >
                  <div className="flex flex-col gap-3 border-b bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <strong className="text-slate-900">{itemLabel}</strong>

                      <p className="text-sm text-slate-500">
                        {isBank
                          ? 'Upload a bank statement, direct deposit form, voided check, account document, safe deposit box note, or contact card to autofill only this account.'
                          : 'Upload a payment service statement, screenshot, transaction record, account note, or service document to autofill only this account.'}
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeItem(subsection, index)}
                      className="rounded-xl"
                    >
                      <Minus className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  </div>

                  <CardContent className="space-y-6 p-5">
                    {renderUploader({
                      subsection,
                      scope: itemScope,
                      title: `Upload document for ${itemLabel}`,
                      description: `This will autofill only ${itemLabel}. It will not overwrite other cards.`,
                      buttonLabel: `Auto-fill ${itemLabel}`,
                      compact: true,
                      onAutofill: () =>
                        handleAutofill(subsection, itemScope, index),
                    })}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {config.fields.map(field => (
                        <DynamicFormField
                          key={`${field.key}-${item.__rowId || index}`}
                          field={field}
                          value={item[field.key]}
                          formData={item}
                          rowId={item.__rowId}
                          onChange={value =>
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
    <div className="space-y-12">
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

      {renderSubsection('12A')}
      {renderSubsection('12B')}
    </div>
  );
}
