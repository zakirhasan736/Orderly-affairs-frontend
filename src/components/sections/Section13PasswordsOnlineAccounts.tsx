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
  KeyRound,
  Globe,
  Mail,
  ScrollText,
} from 'lucide-react';
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
import { onlineAccountsAreDuplicates } from '@/utils/aiItemDedup';
import { createEmptyItemFromFields } from '@/utils/sectionUploadFields';

import {
  getVaultSectionDisplayNumber,
  getVaultSubsectionDisplayId,
} from '@/utils/vaultNavigation';
/* ------------------------------------------------------------------ */
/* CONFIG                                                              */
/* ------------------------------------------------------------------ */

const ACCOUNT_TYPE_OPTION_LABELS: Record<string, string> = {
  'Social Media': 'Social Media — Facebook, Instagram, LinkedIn, X…',
  Email: 'Email — Gmail, Outlook, Yahoo, iCloud…',
  Banking: 'Banking — Online banking login portals',
  Investment: 'Investment — Brokerage or trading sites',
  Shopping: 'Shopping — Amazon, eBay, retail stores…',
  Streaming: 'Streaming — Netflix, Spotify, YouTube…',
  'Cloud Storage': 'Cloud Storage — Google Drive, Dropbox, iCloud…',
  'Work/Professional': 'Work / Professional — Employer or business portals',
  Government: 'Government — IRS, DMV, benefits portals…',
  Utilities: 'Utilities — Electric, gas, internet provider…',
  Other: 'Other — Describe the type in the field below',
};

const ACCOUNT_TYPE_HINTS: Record<
  string,
  { description: string; examples: string[] }
> = {
  'Social Media': {
    description: 'Profiles and posts your family may want to memorialize or close.',
    examples: ['Facebook', 'Instagram', 'LinkedIn', 'X (Twitter)', 'TikTok'],
  },
  Email: {
    description: 'Often the recovery hub for other accounts — include login and recovery details.',
    examples: ['Gmail', 'Outlook', 'Yahoo Mail', 'Proton Mail'],
  },
  Banking: {
    description: `Online access to bank accounts (not the account numbers in Section ${getVaultSectionDisplayNumber('12')}).`,
    examples: ['Chase.com', 'Bank of America online', 'Credit union portal'],
  },
  Investment: {
    description: 'Brokerage, retirement, or crypto exchange logins.',
    examples: ['Fidelity', 'Vanguard', 'Robinhood', 'Coinbase'],
  },
  Shopping: {
    description: 'Retail sites where you shop or store payment methods.',
    examples: ['Amazon', 'eBay', 'Walmart', 'Etsy'],
  },
  Streaming: {
    description: 'Subscriptions for video, music, or entertainment.',
    examples: ['Netflix', 'Spotify', 'Hulu', 'Disney+'],
  },
  'Cloud Storage': {
    description: 'Where photos, documents, or backups are stored online.',
    examples: ['Google Drive', 'Dropbox', 'OneDrive', 'iCloud'],
  },
  'Work/Professional': {
    description: 'Employer systems, freelance platforms, or business tools.',
    examples: ['Slack', 'Microsoft 365 work account', 'Upwork', 'Company VPN'],
  },
  Government: {
    description: 'Federal, state, or local government portals.',
    examples: ['IRS', 'Social Security', 'DMV', 'Medicare'],
  },
  Utilities: {
    description: 'Bills and service accounts for home utilities.',
    examples: ['Electric company', 'Gas provider', 'Internet / cable', 'Water'],
  },
};

const SECTION_13A = {
  subsectionId: '13A',
  title: 'Online Accounts',
  itemLabel: 'Online Account',
  fields: [
    {
      key: 'account_type',
      label: 'Account Type',
      type: 'Dropdown',
      placeholder: 'Select what kind of online account this is',
      options: [
        'Social Media',
        'Email',
        'Banking',
        'Investment',
        'Shopping',
        'Streaming',
        'Cloud Storage',
        'Work/Professional',
        'Government',
        'Utilities',
        'Other',
      ],
      optionLabels: ACCOUNT_TYPE_OPTION_LABELS,
      helperText:
        'Start here: choose the category that best matches this login. Select Other if none fit — a text field will appear so you can describe it.',
    },
    {
      key: 'account_type_other',
      label: 'Specify account type',
      type: 'TextInput',
      placeholder:
        'e.g., Gaming (Steam), Password manager (1Password), News subscription',
      helperText:
        'Required when you choose Other — helps your family understand what this account is for.',
      conditionalDisplay: { field: 'account_type', value: 'Other' },
    },
    {
      key: 'service_name',
      label: 'Service/Website Name',
      type: 'TextInput',
      helperText:
        'Name of the website or service (e.g., Facebook, Amazon, Netflix)',
    },
    {
      key: 'account_username',
      label: 'Username',
      type: 'TextInput',
      helperText: 'Username or login ID for this account',
    },
    {
      key: 'account_password',
      label: 'Password',
      type: 'TextInput',
      inputType: 'password',
      helperText: 'Password for this account',
    },
    {
      key: 'email_associated',
      label: 'Associated Email',
      type: 'TextInput',
      helperText: 'Email address used for this account',
    },
    {
      key: 'phone_associated',
      label: 'Associated Phone',
      type: 'TextInput',
      helperText: 'Phone number linked to this account',
    },
    {
      key: 'recovery_info',
      label: 'Recovery Information',
      type: 'TextArea',
      helperText:
        'Security questions, backup emails, or recovery phone numbers',
    },
    {
      key: 'two_factor_auth',
      label: 'Two-Factor Authentication',
      type: 'TextArea',
      helperText:
        'Details about 2FA setup, authenticator apps, or backup codes',
    },
    {
      key: 'account_value',
      label: 'Account Value/Importance',
      type: 'TextArea',
      helperText:
        'Financial value, personal importance, or business significance',
    },
    {
      key: 'subscription_renewal_date',
      label: 'Subscription Renewal Date',
      type: 'DatePicker',
      helperText:
        'When this subscription or paid plan renews next (streaming, SaaS, memberships)',
    },
    {
      key: 'account_expiry_date',
      label: 'Account / Access Expiry Date',
      type: 'DatePicker',
      helperText:
        'When access, trial, or the account itself expires (if different from renewal)',
    },
    {
      key: 'closure_instructions',
      label: 'Account Closure Instructions',
      type: 'TextArea',
      helperText:
        'Instructions for closing, memorializing, or transferring this account',
    },
    {
      key: 'account_documents',
      label: 'Account Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload account statements, screenshots, or important account information',
    },
  ],
};

const FIELD_MAP_13A = buildFieldMap(SECTION_13A.fields);

const SECTION_13A_GROUPS: FieldGroup[] = [
  {
    key: 'account_identity',
    title: 'Login Details',
    subtitle: 'Service name, username, and password after you choose the account type above',
    icon: Globe,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'grid',
    fieldKeys: ['service_name', 'account_username', 'account_password'],
  },
  {
    key: 'contact_recovery',
    title: 'Contact & Recovery',
    subtitle: 'Associated email, phone, and recovery information',
    icon: Mail,
    accent: 'from-blue-500/[0.07] to-indigo-500/[0.03]',
    iconWrap: 'bg-blue-500/10 text-blue-600',
    layout: 'stack',
    fieldKeys: [
      'email_associated',
      'phone_associated',
      'recovery_info',
      'two_factor_auth',
    ],
  },
  {
    key: 'value_closure',
    title: 'Value & Closure',
    subtitle: 'Account importance and closure instructions',
    icon: ScrollText,
    accent: 'from-amber-500/[0.07] to-orange-500/[0.03]',
    iconWrap: 'bg-amber-500/10 text-amber-700',
    layout: 'stack',
    fieldKeys: [
      'account_value',
      'subscription_renewal_date',
      'account_expiry_date',
      'closure_instructions',
    ],
  },
  {
    key: 'documents',
    title: 'Documents',
    subtitle: 'Screenshots, statements, and account records',
    icon: FileText,
    accent: 'from-slate-500/[0.07] to-gray-500/[0.03]',
    iconWrap: 'bg-slate-500/10 text-slate-600',
    layout: 'grid',
    fieldKeys: ['account_documents'],
  },
];

const SUBSECTION_OVERVIEW = {
  label: 'How to add online accounts',
  content:
    'Add one card per website or app login. First choose an Account Type (or Other and describe it), then enter the service name, username, password, and recovery details. Your family can use this to access or close accounts when needed.',
};

const SUBSECTION_SUBTITLE =
  'Choose an account type first, then fill in login and recovery details — one card per website or app.';

const isAccountFieldVisible = (field: { conditionalDisplay?: { field: string; value: string } }, formData: Record<string, unknown>) => {
  if (!field.conditionalDisplay) return true;
  return formData[field.conditionalDisplay.field] === field.conditionalDisplay.value;
};

function AccountTypeGuidance({ accountType }: { accountType?: string }) {
  if (!accountType) {
    return (
      <div
        className="rounded-xl border border-amber-200/90 bg-amber-50/90 p-3.5 text-sm leading-relaxed text-amber-950"
        role="status"
      >
        <p className="font-medium">Choose an account type to continue</p>
        <p className="mt-1 text-amber-900/90">
          Open the dropdown above and pick the category that best describes this
          login. If nothing fits, select{' '}
          <span className="font-medium">Other</span> — a text field will appear
          so you can name the type yourself.
        </p>
      </div>
    );
  }

  if (accountType === 'Other') {
    return (
      <div
        className="rounded-xl border border-violet-200 bg-violet-50/90 p-3.5 text-sm leading-relaxed text-violet-950"
        role="status"
      >
        <p className="font-medium">You selected Other</p>
        <p className="mt-1 text-violet-900/90">
          Use the <span className="font-medium">Specify account type</span> field
          below to describe this login (for example: Gaming, Password manager, or
          News subscription).
        </p>
      </div>
    );
  }

  const hint = ACCOUNT_TYPE_HINTS[accountType];
  if (!hint) return null;

  return (
    <div
      className="rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 text-sm leading-relaxed text-slate-700"
      role="status"
    >
      <p>
        <span className="font-medium text-slate-900">{accountType}:</span>{' '}
        {hint.description}
      </p>
      <p className="mt-1.5 text-xs text-slate-500">
        Examples: {hint.examples.join(' · ')}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TYPES                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  activeSubsection?: string | null;
  activeTopicId?: string | null;
}

type UploadScope = 'full' | `account:${number}`;



const createRowId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function Section13PasswordsOnlineAccounts({
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
    sectionId: '13',
    setUploadedFiles,
    latestUploadRef,
  });

  const accounts: any[] = Array.isArray(data['13A'])
    ? data['13A']
    : data['13A'] && typeof data['13A'] === 'object'
      ? [data['13A']]
      : [];
  const show13A = !activeSubsection || activeSubsection === '13A';

  useScrollToVaultTopic(activeTopicId, accounts.length);

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const createEmptyAccount = () => {
    return {
      ...createEmptyItemFromFields(SECTION_13A.fields),
      __rowId: createRowId(),
    };
  };

  const updateAccounts = (next: any[]) => {
    onChange({
      ...data,
      '13A': next,
    });
  };

  const addAccount = () => {
    updateAccounts([...accounts, createEmptyAccount()]);
  };

  const updateAccount = (index: number, key: string, value: any) => {
    const next = [...accounts];
    const current = {
      ...(next[index] || {}),
      __rowId: next[index]?.__rowId || createRowId(),
    };

    if (key === 'account_type' && value !== 'Other') {
      current.account_type_other = '';
    }

    current[key] = value;
    next[index] = current;
    updateAccounts(next);
  };

  const removeAccount = (index: number) => {
    updateAccounts(accounts.filter((_, itemIndex) => itemIndex !== index));
  };

  const multiItemAutofill = useAiMultiItemAutofill({
    itemLabel: SECTION_13A.itemLabel,
    createEmpty: createEmptyAccount,
    getCurrentItems: () => accounts,
    setItems: updateAccounts,
    setAiNotice,
    describeFields: ['service_name', 'account_username', 'account_type'],
    isDuplicate: onlineAccountsAreDuplicates,
    conflictMode: 'ask',
    onFlowComplete: () => releaseDeferredAiRoutingDialog(aiRouting),
  });

  const getUploadedFileForScope = (scope: UploadScope) => {
    const pendingFile =
      aiRouting?.getPendingFileForSection('13', String(scope)) ?? null;

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

  const normalizeAccountPatch = (patch: any) =>
    mergeAiPatchWithDefaults(patch, SECTION_13A.fields, createEmptyAccount);

  const extractAccountArrayFromPatch = (patch: any) => {
    const rawAccounts = patch?.['13A'];

    if (Array.isArray(rawAccounts)) {
      return rawAccounts
        .map(account => normalizeAccountPatch(account))
        .filter(account => {
          return Object.entries(account).some(([key, value]) => {
            return key !== '__rowId' && value !== '';
          });
        });
    }

    if (rawAccounts && typeof rawAccounts === 'object') {
      const account = normalizeAccountPatch(rawAccounts);

      const hasValue = Object.entries(account).some(([key, value]) => {
        return key !== '__rowId' && value !== '';
      });

      return hasValue ? [account] : [];
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

      const uploaded = await uploadAIDocument(file, { section: '13' });

      const uploadedRecord: UploadedAIFile = buildUploadedAiFile(uploaded, file, {
        sectionId: '13',
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
    accountIndex?: number,
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
        sectionKey: 'passwords_online_accounts',
        sectionId: '13',
        file_id: uploadedFile.file_id,
        mime_type: uploadedFile.mime_type,
        subsection: '13A',
        uploadScope: String(scope),
        fields: SECTION_13A.fields,
        aiRouting,
        });

      if (!json) return;

      const patch = json?.result?.patch ?? {};
      const extractedAccounts = extractAccountArrayFromPatch(patch);

      const disposition = multiItemAutofill.processExtraction(
        extractedAccounts,
        accountIndex,
        {
          setAiError,
          setAiNotice,
          emptyError:
            'AI could not find online account information in this document.',
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
      highlightUpload={aiRouting?.shouldHighlightUpload('13', String(scope)) ?? false}
      onUpload={file => handleDocumentUpload(file, scope, onAutofill)}
      onAutofill={onAutofill}
    />
  );

  if (!show13A) return null;

  return (
    <div className="space-y-8">
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
        id="subsection-13A"
        className={`rounded-3xl ${show13A ? 'border border-primary p-1' : ''}`}
      >
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-violet-50/70">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-violet-600" />
                  {getVaultSubsectionDisplayId('13', '13A')}. {SECTION_13A.title}
                </CardTitle>
                <p className="text-sm text-slate-600">{SUBSECTION_SUBTITLE}</p>
              </div>

              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                <VaultEncryptedBadge />
                <Button
                  type="button"
                  size="sm"
                  onClick={addAccount}
                  className="rounded-xl"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add {SECTION_13A.itemLabel}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 p-5">
            <VaultOverviewBox
              label={SUBSECTION_OVERVIEW.label}
              content={SUBSECTION_OVERVIEW.content}
            />
            {/* {renderUploader({
              scope: 'full',
              title: 'Upload document for multiple online accounts',
              description:
                'Use this if one document contains one or more online accounts, website logins, password manager exports, account screenshots, recovery info, or 2FA notes. AI will add extracted accounts as new cards.',
              buttonLabel: 'Extract Online Accounts',
              onAutofill: () => handleAutofill('full'),
            })} */}

            {accounts.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <KeyRound className="h-5 w-5 text-slate-500" />
                </div>

                <p className="font-medium text-slate-800">
                  No online accounts added yet.
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Click “Add Online Account” to create a blank card. Start each
                  card by choosing an <strong>Account Type</strong> from the
                  dropdown.
                </p>
              </div>
            )}

            {accounts.map((account, index) => {
              const itemScope = `account:${index}` as UploadScope;
              const itemLabel = getItemDisplayLabel(
              '13',
              '13A',
              account || {},
              index,
              SECTION_13A.itemLabel,
            );
              const topicProps = getTopicCardProps('13A', index, activeTopicId);

              return (
                <Card
                  key={account.__rowId || `${itemScope}-${index}`}
                  id={topicProps.id}
                  className={topicProps.className}
                >
                  <div className="flex flex-col gap-3 border-b bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <strong className="text-slate-900">{itemLabel}</strong>

                      <p className="text-sm text-slate-500">
                        Upload a screenshot, password manager export, account
                        inventory note, login document, recovery information, or
                        2FA note to autofill only this account.
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeAccount(index)}
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
                      description: `This will autofill only ${itemLabel}. It will not overwrite other online account cards.`,
                      buttonLabel: `Auto-fill ${itemLabel}`,
                      compact: true,
                      onAutofill: () => handleAutofill(itemScope, index),
                    })}

                    <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/60 via-white to-white p-4 shadow-sm sm:p-5">
                      <div className="mb-4 space-y-1">
                        <p className="text-sm font-semibold text-slate-900">
                          Step 1 — What kind of account is this?
                        </p>
                        <p className="text-xs leading-relaxed text-slate-500">
                          Pick a category from the list. Choose{' '}
                          <span className="font-medium text-slate-700">Other</span>{' '}
                          if none match — you will get a field to describe the
                          type yourself.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <DynamicFormField
                          field={FIELD_MAP_13A.account_type}
                          value={account?.account_type}
                          formData={account}
                          rowId={account.__rowId}
                          onChange={value =>
                            updateAccount(index, 'account_type', value)
                          }
                        />

                        <AccountTypeGuidance accountType={account?.account_type} />

                        {account?.account_type === 'Other' && (
                          <DynamicFormField
                            field={FIELD_MAP_13A.account_type_other}
                            value={account?.account_type_other}
                            formData={account}
                            rowId={account.__rowId}
                            onChange={value =>
                              updateAccount(index, 'account_type_other', value)
                            }
                          />
                        )}
                      </div>
                    </div>

                    <VaultGroupCards
                      groups={SECTION_13A_GROUPS}
                      fieldMap={FIELD_MAP_13A}
                      renderField={fieldKey => {
                        const field = FIELD_MAP_13A[fieldKey];
                        if (!field || !isAccountFieldVisible(field, account)) {
                          return null;
                        }

                        return (
                          <DynamicFormField
                            key={`${fieldKey}-${account.__rowId || index}`}
                            field={field}
                            value={account?.[fieldKey]}
                            formData={account}
                            rowId={account.__rowId}
                            onChange={value =>
                              updateAccount(index, fieldKey, value)
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
