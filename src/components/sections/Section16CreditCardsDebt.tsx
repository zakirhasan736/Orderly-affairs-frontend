'use client';

import React, { useState } from 'react';
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
  CreditCard,
  Landmark,
  Receipt,
  ShieldCheck,
  Wallet,
  ScrollText,
  Users,
} from 'lucide-react';
import { cn } from '@common/ui/utils';
import { DynamicFormField } from '@/components/DynamicFormField';
import { Alert, AlertDescription } from '@/components/common/ui/alert';

import { autofillSectionFromDocument } from '@/services/aiAutofill';
import { uploadAIDocument } from '@/services/aiDocumentUpload';
import {
  getTopicCardProps,
  useScrollToVaultTopic,
} from '@/utils/vaultTopicNavigation';
import {
  type FieldGroup,
  buildFieldMap,
  VaultOverviewBox,
  VaultEncryptedBadge,
  VaultGroupCards,
} from '@/utils/vaultGroupedFields';

/* ------------------------------------------------------------------ */
/* CONFIG — 16A CREDIT CARDS                                           */
/* ------------------------------------------------------------------ */

const SECTION_16A = {
  subsectionId: '16A',
  title: 'Credit Cards',
  itemLabel: 'Credit Card',
  fields: [
    {
      key: 'card_name',
      label: 'Card Name/Bank',
      type: 'TextInput',
      helperText: 'Name of the credit card or issuing bank',
    },
    {
      key: 'card_type',
      label: 'Card Type',
      type: 'Dropdown',
      options: [
        'Visa',
        'MasterCard',
        'American Express',
        'Discover',
        'Store Card',
        'Business Card',
        'Other',
      ],
      helperText: 'Type of credit card',
    },
    {
      key: 'card_type_other',
      label: 'Please specify other card type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of credit card',
      conditionalDisplay: { field: 'card_type', value: 'Other' },
    },
    {
      key: 'card_number',
      label: 'Card Number (last 4 digits)',
      type: 'TextInput',
      helperText: 'Last 4 digits of the card number for identification',
    },
    {
      key: 'account_number',
      label: 'Full Account Number',
      type: 'TextInputWithUpload',
      helperText:
        'Full account number or upload photo of card/statement (store securely)',
    },
    {
      key: 'credit_limit',
      label: 'Credit Limit',
      type: 'TextInput',
      helperText: 'Maximum credit limit on this card',
    },
    {
      key: 'current_balance',
      label: 'Approximate Current Balance',
      type: 'TextInput',
      helperText: 'Current balance owed on this card',
    },
    {
      key: 'monthly_payment',
      label: 'Monthly Payment',
      type: 'TextInput',
      helperText: 'Typical monthly payment amount',
    },
    {
      key: 'autopay_setup',
      label: 'Autopay Information',
      type: 'TextArea',
      helperText:
        'If autopay is set up, which bank account and for what amount',
    },
    {
      key: 'card_benefits',
      label: 'Card Benefits',
      type: 'TextArea',
      helperText:
        'Rewards programs, cash back, travel benefits, or other card perks',
    },
    {
      key: 'customer_service',
      label: 'Customer Service Contact',
      type: 'TextInputWithUpload',
      helperText:
        'Phone number for customer service or upload contact information',
    },
    {
      key: 'online_account',
      label: 'Online Account Access',
      type: 'TextArea',
      inputType: 'password',
      helperText: 'Username and password for online account management',
    },
    {
      key: 'authorized_users',
      label: 'Authorized Users',
      type: 'TextArea',
      helperText: 'Names of any authorized users on this account',
    },
    {
      key: 'card_documents',
      label: 'Card Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload recent statements, terms and conditions, or card agreements',
    },
  ],
};

const FIELD_MAP_16A = buildFieldMap(SECTION_16A.fields);

const SECTION_16A_GROUPS: FieldGroup[] = [
  {
    key: 'card_identity',
    title: 'Card Identity',
    subtitle: 'Bank name, card type, and identifying digits',
    icon: CreditCard,
    accent: 'from-rose-500/[0.07] to-pink-500/[0.03]',
    iconWrap: 'bg-rose-500/10 text-rose-700',
    layout: 'grid',
    fieldKeys: ['card_name', 'card_type', 'card_type_other', 'card_number'],
  },
  {
    key: 'account_balances',
    title: 'Account & Balances',
    subtitle: 'Full account number, limits, and current balances',
    icon: Wallet,
    accent: 'from-blue-500/[0.07] to-indigo-500/[0.03]',
    iconWrap: 'bg-blue-500/10 text-blue-600',
    layout: 'grid',
    fieldKeys: [
      'account_number',
      'credit_limit',
      'current_balance',
      'monthly_payment',
    ],
  },
  {
    key: 'payments_benefits',
    title: 'Payments & Benefits',
    subtitle: 'Autopay setup and card rewards or perks',
    icon: Receipt,
    accent: 'from-emerald-500/[0.07] to-teal-500/[0.03]',
    iconWrap: 'bg-emerald-500/10 text-emerald-700',
    layout: 'stack',
    fieldKeys: ['autopay_setup', 'card_benefits'],
  },
  {
    key: 'access_support',
    title: 'Access & Support',
    subtitle: 'Customer service, online login, and authorized users',
    icon: ShieldCheck,
    accent: 'from-cyan-500/[0.07] to-sky-500/[0.03]',
    iconWrap: 'bg-cyan-500/10 text-cyan-700',
    layout: 'stack',
    fieldKeys: ['customer_service', 'online_account', 'authorized_users'],
  },
  {
    key: 'documentation',
    title: 'Documentation',
    subtitle: 'Statements, terms, and card agreements',
    icon: FileText,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'grid',
    fieldKeys: ['card_documents'],
  },
];

const SECTION_16A_SUBTITLE =
  'Document each credit card with balances, autopay, benefits, and login details so your family can manage accounts and avoid missed payments.';

const SECTION_16A_OVERVIEW = {
  label: 'Credit Cards Overview',
  content:
    'Add one card per entry. Include the last four digits for identification, full account details stored securely, and customer service contacts so accounts can be closed or transferred promptly.',
};

/* ------------------------------------------------------------------ */
/* CONFIG — 16B OTHER DEBTS                                            */
/* ------------------------------------------------------------------ */

const SECTION_16B = {
  subsectionId: '16B',
  title: 'Other Debts',
  itemLabel: 'Debt',
  fields: [
    {
      key: 'debt_type',
      label: 'Type of Debt',
      type: 'Dropdown',
      options: [
        'Personal Loan',
        'Student Loan',
        'Auto Loan',
        'Home Equity Loan',
        'Line of Credit',
        'Medical Debt',
        'Tax Debt',
        'Business Loan',
        'Other',
      ],
      helperText: 'Category of this debt',
    },
    {
      key: 'debt_type_other',
      label: 'Please specify other debt type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of debt',
      conditionalDisplay: { field: 'debt_type', value: 'Other' },
    },
    {
      key: 'creditor_name',
      label: 'Creditor/Lender Name',
      type: 'TextInput',
      helperText: 'Name of the company or institution you owe money to',
    },
    {
      key: 'account_number',
      label: 'Account Number',
      type: 'TextInputWithUpload',
      helperText: 'Account or loan number for this debt',
    },
    {
      key: 'current_balance',
      label: 'Current Balance Owed',
      type: 'TextInput',
      helperText: 'Amount currently owed on this debt',
    },
    {
      key: 'monthly_payment',
      label: 'Monthly Payment Amount',
      type: 'TextInput',
      helperText: 'Required monthly payment amount',
    },
    {
      key: 'payment_due_date',
      label: 'Payment Due Date',
      type: 'TextInput',
      helperText: 'Day of the month payment is due',
    },
    {
      key: 'interest_rate',
      label: 'Interest Rate',
      type: 'TextInput',
      helperText: 'Interest rate on this debt',
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      type: 'TextArea',
      helperText: 'How payments are made (autopay, check, online, etc.)',
    },
    {
      key: 'cosigners',
      label: 'Co-signers or Joint Borrowers',
      type: 'TextArea',
      helperText: 'Names of any co-signers or joint borrowers on this debt',
    },
    {
      key: 'collateral',
      label: 'Collateral',
      type: 'TextArea',
      helperText: 'Any property securing this debt (car, house, etc.)',
    },
    {
      key: 'creditor_contact',
      label: 'Creditor Contact Information',
      type: 'TextInputWithUpload',
      helperText:
        'Phone, address, or upload contact information for the lender',
    },
    {
      key: 'debt_documents',
      label: 'Debt Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload loan agreements, recent statements, or payment records',
    },
  ],
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

type SubsectionId = '16A' | '16B';

type UploadScope = '16A-full' | '16B-full' | `16A:${number}` | `16B:${number}`;

type UploadedAIFile = {
  file_id: string;
  mime_type: string;
  expires_at?: string;
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

export default function Section16CreditCardsDebt({
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

  const creditCards: any[] = Array.isArray(data['16A']) ? data['16A'] : [];
  const debts: any[] = Array.isArray(data['16B']) ? data['16B'] : [];

  useScrollToVaultTopic(activeTopicId, creditCards.length + debts.length);

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const getConfig = (subsection: SubsectionId) => {
    return subsection === '16A' ? SECTION_16A : SECTION_16B;
  };

  const getItems = (subsection: SubsectionId) => {
    return subsection === '16A' ? creditCards : debts;
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
    return uploadedFiles[scope] || null;
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

  const handleDocumentUpload = async (
    file?: File | null,
    scope?: UploadScope,
  ) => {
    try {
      if (!file || !scope) return;

      setAiError('');
      setAiNotice('');

      if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
        setAiError('Upload PDF, TXT, PNG, JPG, JPEG, or WEBP only.');
        return;
      }

      if (file.size > MAX_UPLOAD_SIZE) {
        setAiError('File too large. Max 15MB.');
        return;
      }

      setUploadingScope(scope);

      const uploaded = await uploadAIDocument(file);

      setUploadedFiles(prev => ({
        ...prev,
 [scope]: {
    file_id: uploaded.file_id,
    mime_type: uploaded.mime_type,
    expires_at: uploaded.expires_at,
  },
      }));

      setAiNotice('Document uploaded. You can now use AI autofill.');
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

      const json = await autofillSectionFromDocument({
        section: 'credit_cards_debt',
        file_id: uploadedFile.file_id,
        subsection,
      });

      const patch = json?.result?.patch ?? {};
      const extractedItems = extractArrayFromPatch(subsection, patch);

      if (extractedItems.length === 0) {
        setAiError(
          subsection === '16A'
            ? 'AI could not find credit card information in this document.'
            : 'AI could not find debt information in this document.',
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
    const isCreditCard = subsection === '16A';

    const wrapperClass = isCreditCard
      ? 'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-rose-50/50 hover:border-rose-300'
      : 'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-orange-50/50 hover:border-orange-300';

    const iconClass = isCreditCard ? 'text-rose-600' : 'text-orange-600';

    const uploadBoxClass = isCreditCard
      ? 'hover:border-rose-300 hover:bg-rose-50/50'
      : 'hover:border-orange-300 hover:bg-orange-50/50';

    const glowOne = isCreditCard ? 'bg-rose-100/70' : 'bg-orange-100/70';
    const glowTwo = isCreditCard ? 'bg-pink-100/70' : 'bg-yellow-100/70';

    return (
      <div
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
          <label
            className={[
              'group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-5 text-center transition',
              uploadBoxClass,
              compact
                ? 'md:flex-row md:justify-start md:py-3 md:text-left'
                : '',
              isAnyAIActionRunning ? 'pointer-events-none opacity-60' : '',
            ].join(' ')}
          >
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.txt,.png,.jpg,.jpeg,.webp,application/pdf,text/plain,image/png,image/jpeg,image/webp"
              disabled={isAnyAIActionRunning}
              onChange={event => {
                const file = event.currentTarget.files?.[0] || null;
                void handleDocumentUpload(file, scope);
                event.currentTarget.value = '';
              }}
            />

            <UploadCloud className={`h-5 w-5 ${iconClass}`} />

            <div>
              <p className="text-sm font-medium text-slate-800">
                Click to upload credit/debt document
              </p>
              <p className="text-xs text-slate-500">
                PDF, TXT, PNG, JPG, JPEG, WEBP · Max 15MB
              </p>
            </div>
          </label>

          {uploadedFile && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <FileText className="h-4 w-4" />
              <span>{getReadableFileType(uploadedFile.mime_type)} ready</span>
            </div>
          )}
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

  const renderSubsection = (subsection: SubsectionId) => {
    const config = getConfig(subsection);
    const items = getItems(subsection);
    const isCreditCard = subsection === '16A';
    const fullScope = `${subsection}-full` as UploadScope;
    const Icon = isCreditCard ? CreditCard : FileText;

    const show = !activeSubsection || activeSubsection === subsection;

    return (
      <div
        id={`subsection-${subsection}`}
        className={`rounded-3xl ${show ? 'border border-primary p-1' : ''}`}
      >
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader
            className={[
              'border-b bg-gradient-to-r from-slate-50',
              isCreditCard ? 'to-rose-50/70' : 'to-orange-50/70',
            ].join(' ')}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <Icon
                  className={[
                    'h-5 w-5',
                    isCreditCard ? 'text-rose-600' : 'text-orange-600',
                  ].join(' ')}
                />
                {subsection}. {config.title}
              </CardTitle>

              <Button
                type="button"
                size="sm"
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
              title: isCreditCard
                ? 'Upload document for multiple credit cards'
                : 'Upload document for multiple debts',
              description: isCreditCard
                ? 'Use this if one document contains one or more credit cards, card statements, card agreements, balances, benefits, or customer service details. AI will add extracted cards as new cards.'
                : 'Use this if one document contains one or more loans, debts, statements, payment records, tax notices, medical bills, or lender documents. AI will add extracted debts as new cards.',
              buttonLabel: isCreditCard
                ? 'Extract Credit Cards'
                : 'Extract Debts',
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
                        {isCreditCard
                          ? 'Upload a card statement, card photo, card agreement, online account screenshot, or customer service document to autofill only this credit card.'
                          : 'Upload a loan statement, payment record, tax notice, medical bill, lender letter, or loan agreement to autofill only this debt.'}
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

                    <div className="grid gap-4 md:grid-cols-2">
                      {config.fields.map(field => (
                        <DynamicFormField
                          key={`${field.key}-${item.__rowId || index}`}
                          field={field}
                          value={item?.[field.key]}
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

      {renderSubsection('16A')}
      {renderSubsection('16B')}
    </div>
  );
}
