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
  KeyRound,
} from 'lucide-react';
import { DynamicFormField } from '@/components/DynamicFormField';
import { Alert, AlertDescription } from '@/components/common/ui/alert';

import { autofillSectionFromDocument } from '@/services/aiAutofill';
import { uploadAIDocument } from '@/services/aiDocumentUpload';
import {
  getTopicCardProps,
  useScrollToVaultTopic,
} from '@/utils/vaultTopicNavigation';
import { createEmptyItemFromFields } from '@/utils/sectionUploadFields';

/* ------------------------------------------------------------------ */
/* CONFIG                                                              */
/* ------------------------------------------------------------------ */

const SECTION_13A = {
  subsectionId: '13A',
  title: 'Online Accounts',
  itemLabel: 'Online Account',
  fields: [
    {
      key: 'account_type',
      label: 'Account Type',
      type: 'Dropdown',
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
      helperText: 'Category of online account',
    },
    {
      key: 'account_type_other',
      label: 'Please specify other account type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of online account',
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

  const accounts: any[] = Array.isArray(data['13A']) ? data['13A'] : [];
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

  const normalizeAccountPatch = (patch: any) => {
    return {
      ...createEmptyAccount(),
      ...cleanPatchObject(patch),
    };
  };

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

  const handleDocumentUpload = async (
    file?: File | null,
    scope: UploadScope = 'full',
  ) => {
    try {
      if (!file) return;

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

      const json = await autofillSectionFromDocument({
        section: 'passwords_online_accounts',
        file_id: uploadedFile.file_id,
        subsection: '13A',
      });

      const patch = json?.result?.patch ?? {};
      const extractedAccounts = extractAccountArrayFromPatch(patch);

      if (extractedAccounts.length === 0) {
        setAiError(
          'AI could not find online account information in this document.',
        );
        return;
      }

      if (typeof accountIndex === 'number') {
        const firstAccount = cleanPatchObject(extractedAccounts[0]);
        const next = [...accounts];

        next[accountIndex] = {
          ...(next[accountIndex] || createEmptyAccount()),
          ...firstAccount,
          __rowId: next[accountIndex]?.__rowId || createRowId(),
        };

        updateAccounts(next);

        setAiNotice(
          `AI filled ${SECTION_13A.itemLabel} #${accountIndex + 1}. Please review the fields.`,
        );

        return;
      }

      updateAccounts([...accounts, ...extractedAccounts]);

      setAiNotice(
        extractedAccounts.length === 1
          ? 'AI added 1 online account. Please review the fields.'
          : `AI added ${extractedAccounts.length} online accounts. Please review the fields.`,
      );
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
    onAutofill,
    compact = false,
  }: {
    scope: UploadScope;
    title: string;
    description: string;
    buttonLabel?: string;
    onAutofill: () => void;
    compact?: boolean;
  }) => {
    const uploadedFile = getUploadedFileForScope(scope);
    const isUploading = uploadingScope === scope;
    const isReading = aiLoadingScope === scope;

    return (
      <div
        className={[
          'relative overflow-hidden rounded-2xl border border-dashed',
          'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-violet-50/50',
          'p-4 shadow-sm transition-all duration-200',
          'hover:border-violet-300 hover:shadow-md',
          compact ? 'space-y-3' : 'space-y-4',
        ].join(' ')}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-100/70 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-fuchsia-100/70 blur-2xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
              ) : uploadedFile ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <UploadCloud className="h-5 w-5 text-violet-600" />
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
              'group flex cursor-pointer flex-col items-center justify-center gap-2',
              'rounded-xl border border-slate-200 bg-white/80 px-4 py-5 text-center',
              'transition hover:border-violet-300 hover:bg-violet-50/50',
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

            <UploadCloud className="h-5 w-5 text-slate-500 group-hover:text-violet-600" />

            <div>
              <p className="text-sm font-medium text-slate-800">
                Click to upload account document
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

  if (!show13A) return null;

  return (
    <div className="space-y-8">
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-violet-600" />
                13A. {SECTION_13A.title}
              </CardTitle>

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
          </CardHeader>

          <CardContent className="space-y-8 p-5">
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
                  Click “Add Online Account” to create a blank card, or upload
                  an account document above and let AI create the card.
                </p>
              </div>
            )}

            {accounts.map((account, index) => {
              const itemScope = `account:${index}` as UploadScope;
              const itemLabel = `${SECTION_13A.itemLabel} #${index + 1}`;
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

                    <div className="grid gap-4 md:grid-cols-2">
                      {SECTION_13A.fields.map(field => (
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
