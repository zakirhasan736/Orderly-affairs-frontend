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
  PiggyBank,
  Users,
  KeyRound,
  TrendingUp,
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
import { useAiMultiItemAutofill } from '@/hooks/useAiMultiItemAutofill';
import { createEmptyItemFromFields } from '@/utils/sectionUploadFields';

/* ------------------------------------------------------------------ */
/* CONFIG                                                              */
/* ------------------------------------------------------------------ */

const SECTION_14A = {
  subsectionId: '14A',
  title: 'Investment Accounts',
  itemLabel: 'Investment Account',
  fields: [
    {
      key: 'account_type',
      label: 'Account Type',
      type: 'Dropdown',
      options: [
        '401(k)',
        '403(b)',
        'IRA - Traditional',
        'IRA - Roth',
        'SEP-IRA',
        'Pension',
        'Brokerage Account',
        'Mutual Fund',
        'Bonds',
        'Stocks',
        'Annuity',
        'Other',
      ],
      helperText: 'Type of investment or retirement account',
    },
    {
      key: 'account_type_other',
      label: 'Please specify other account type',
      type: 'TextInput',
      helperText:
        'Please describe the specific type of investment or retirement account',
      conditionalDisplay: { field: 'account_type', value: 'Other' },
    },
    {
      key: 'financial_institution',
      label: 'Financial Institution',
      type: 'TextInput',
      helperText: 'Company managing this account (e.g., Fidelity, Vanguard)',
    },
    {
      key: 'account_number',
      label: 'Account Number',
      type: 'TextInputWithUpload',
      helperText:
        'Account number or upload a statement showing account details',
    },
    {
      key: 'account_value',
      label: 'Approximate Account Value',
      type: 'TextInput',
      helperText: 'Current approximate value of the account',
    },
    {
      key: 'beneficiaries',
      label: 'Beneficiaries',
      type: 'TextArea',
      helperText: 'Named beneficiaries and their percentages',
    },
    {
      key: 'advisor_contact',
      label: 'Financial Advisor Contact',
      type: 'TextInputWithUpload',
      helperText:
        'Contact information for financial advisor or account manager',
    },
    {
      key: 'employer_connection',
      label: 'Employer Connection',
      type: 'TextArea',
      helperText: 'If employer-sponsored, include company name and HR contact',
    },
    {
      key: 'login_credentials',
      label: 'Online Account Access',
      type: 'TextArea',
      inputType: 'password',
      helperText: 'Username and password for online account access',
    },
    {
      key: 'distribution_instructions',
      label: 'Distribution Instructions',
      type: 'TextArea',
      helperText:
        'Your wishes for distributions or Required Minimum Distributions (RMDs)',
    },
    {
      key: 'account_documents',
      label: 'Account Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload recent statements, beneficiary forms, or plan documents',
    },
  ],
};

const FIELD_MAP_14A = buildFieldMap(SECTION_14A.fields);

const SECTION_14A_GROUPS: FieldGroup[] = [
  {
    key: 'account_basics',
    title: 'Account Basics',
    subtitle: 'Account type, institution, number, and value',
    icon: PiggyBank,
    accent: 'from-teal-500/[0.07] to-emerald-500/[0.03]',
    iconWrap: 'bg-teal-500/10 text-teal-700',
    layout: 'grid',
    fieldKeys: [
      'account_type',
      'account_type_other',
      'financial_institution',
      'account_number',
      'account_value',
    ],
  },
  {
    key: 'beneficiaries_advisor',
    title: 'Beneficiaries & Advisor',
    subtitle: 'Named beneficiaries, advisor contact, and employer link',
    icon: Users,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'stack',
    fieldKeys: ['beneficiaries', 'advisor_contact', 'employer_connection'],
  },
  {
    key: 'access_distribution',
    title: 'Access & Distribution',
    subtitle: 'Online login credentials and distribution wishes',
    icon: KeyRound,
    accent: 'from-blue-500/[0.07] to-indigo-500/[0.03]',
    iconWrap: 'bg-blue-500/10 text-blue-600',
    layout: 'stack',
    fieldKeys: ['login_credentials', 'distribution_instructions'],
  },
  {
    key: 'documents',
    title: 'Documents',
    subtitle: 'Statements, beneficiary forms, and plan documents',
    icon: FileText,
    accent: 'from-slate-500/[0.07] to-gray-500/[0.03]',
    iconWrap: 'bg-slate-500/10 text-slate-600',
    layout: 'grid',
    fieldKeys: ['account_documents'],
  },
];

const SUBSECTION_OVERVIEW = {
  label: 'Investment Accounts Overview',
  content:
    'Document retirement accounts, brokerage accounts, pensions, and other investments so your family can manage and distribute assets. Add one card per account.',
};

const SUBSECTION_SUBTITLE =
  'Add each investment account with grouped basics, beneficiaries, access, and document details in a mobile-friendly layout.';

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

export default function Section14InvestmentAccounts({
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
    sectionId: '14',
    setUploadedFiles,
    latestUploadRef,
  });

  const accounts: any[] = Array.isArray(data['14A']) ? data['14A'] : [];
  const show14A = !activeSubsection || activeSubsection === '14A';

  useScrollToVaultTopic(activeTopicId, accounts.length);

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const createEmptyAccount = () => {
    return {
      ...createEmptyItemFromFields(SECTION_14A.fields),
      __rowId: createRowId(),
    };
  };

  const updateAccounts = (next: any[]) => {
    onChange({
      ...data,
      '14A': next,
    });
  };

  const addAccount = () => {
    updateAccounts([...accounts, createEmptyAccount()]);
  };

  const updateAccount = (index: number, key: string, value: any) => {
    const next = [...accounts];

    next[index] = {
      ...(next[index] || {}),
      [key]: value,
      __rowId: next[index]?.__rowId || createRowId(),
    };

    updateAccounts(next);
  };

  const removeAccount = (index: number) => {
    updateAccounts(accounts.filter((_, itemIndex) => itemIndex !== index));
  };

  const multiItemAutofill = useAiMultiItemAutofill({
    itemLabel: SECTION_14A.itemLabel,
    createEmpty: createEmptyAccount,
    getCurrentItems: () => accounts,
    setItems: updateAccounts,
    setAiNotice,
    describeFields: ['institution', 'account_type', 'account_name'],
    onFlowComplete: () => releaseDeferredAiRoutingDialog(aiRouting),
  });

  const getUploadedFileForScope = (scope: UploadScope) => {
    const pendingFile =
      aiRouting?.getPendingFileForSection('14', String(scope)) ?? null;

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
    mergeAiPatchWithDefaults(patch, SECTION_14A.fields, createEmptyAccount);

  const extractAccountArrayFromPatch = (patch: any) => {
    const rawAccounts = patch?.['14A'];

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
        sectionKey: 'investment_accounts',
        sectionId: '14',
        file_id: uploadedFile.file_id,
        mime_type: uploadedFile.mime_type,
        subsection: '14A',
        uploadScope: String(scope),
        fields: SECTION_14A.fields,
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
            'AI could not find investment account information in this document.',
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
      highlightUpload={aiRouting?.shouldHighlightUpload('14', String(scope)) ?? false}
      onUpload={file => handleDocumentUpload(file, scope, onAutofill)}
      onAutofill={onAutofill}
    />
  );

  if (!show14A) return null;

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
        id="subsection-14A"
        className={`rounded-3xl ${show14A ? 'border border-primary p-1' : ''}`}
      >
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-teal-50/70">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-teal-600" />
                14A. {SECTION_14A.title}
              </CardTitle>

              <Button
                type="button"
                size="sm"
                onClick={addAccount}
                className="rounded-xl"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add {SECTION_14A.itemLabel}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 p-5">
            {/* {renderUploader({
              scope: 'full',
              title: 'Upload document for multiple investment accounts',
              description:
                'Use this if one document contains one or more investment, retirement, brokerage, pension, IRA, annuity, stock, bond, or mutual fund accounts. AI will add extracted accounts as new cards.',
              buttonLabel: 'Extract Investment Accounts',
              onAutofill: () => handleAutofill('full'),
            })} */}

            {accounts.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <PiggyBank className="h-5 w-5 text-slate-500" />
                </div>

                <p className="font-medium text-slate-800">
                  No investment accounts added yet.
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Click “Add Investment Account” to create a blank card, or
                  upload an investment document above and let AI create the
                  card.
                </p>
              </div>
            )}

            {accounts.map((account, index) => {
              const itemScope = `account:${index}` as UploadScope;
              const itemLabel = `${SECTION_14A.itemLabel} #${index + 1}`;
              const topicProps = getTopicCardProps('14A', index, activeTopicId);

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
                        Upload a statement, beneficiary form, plan document,
                        advisor letter, annuity contract, stock certificate, or
                        retirement account document to autofill only this
                        account.
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
                      description: `This will autofill only ${itemLabel}. It will not overwrite other investment account cards.`,
                      buttonLabel: `Auto-fill ${itemLabel}`,
                      compact: true,
                      onAutofill: () => handleAutofill(itemScope, index),
                    })}

                    <div className="grid gap-4 md:grid-cols-2">
                      {SECTION_14A.fields.map(field => (
                        <DynamicFormField
                          key={`${field.key}-${account.__rowId || index}`}
                          field={field}
                          value={account?.[field.key]}
                          formData={account}
                          rowId={account.__rowId}
                          onChange={value =>
                            updateAccount(index, field.key, value)
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
    </div>
  );
}
