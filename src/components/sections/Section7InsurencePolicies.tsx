'use client';

import React, { useMemo, useRef, useState } from 'react';
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
} from 'lucide-react';
import { DynamicFormField } from '@/components/DynamicFormField';
import { Alert, AlertDescription } from '@/components/common/ui/alert';

import { releaseDeferredAiRoutingDialog, runAiSectionAutofill } from '@/services/aiSectionAutofill';
import {
  createEmptyItemFromFields,
  mergeAiPatchWithDefaults,
  unwrapAiAutofillPatch,
} from '@/utils/aiPatchNormalizer';
import { normalizeUploadField } from '@/utils/sectionUploadFields';
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
import { insurancePoliciesAreDuplicates, collapseInsurancePolicies } from '@/utils/aiItemDedup';

/* ------------------------------------------------------------------ */
/* CONFIG                                                              */
/* ------------------------------------------------------------------ */

const SECTION_7A = {
  subsectionId: '7A',
  title: 'Insurance Policies',
  itemLabel: 'Policy',
  fields: [
    {
      key: 'policy_type',
      label: 'Type of Policy',
      type: 'Dropdown',
      options: [
        'Life',
        'Homeowner/Renter',
        'Vehicle',
        'Health',
        'Medical/Dental',
        'Medicaid Supplements',
        'Long Term Care',
        'Disability',
        'Job Loss',
        'Umbrella',
        'Annuity',
        'Bank/Loan',
        'Mortgage',
        'Credit',
        'Other',
      ],
      required: true,
    },
    {
      key: 'policy_type_other',
      label: 'Please specify other policy type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of insurance policy',
      conditionalDisplay: { field: 'policy_type', value: 'Other' },
    },
    {
      key: 'policy_documents_life',
      label: 'Life Insurance Policy Documents',
      type: 'TextInputWithUpload',
      conditionalDisplay: { field: 'policy_type', value: 'Life' },
      helperText:
        'Upload your life insurance policy documents, beneficiary information, or take photos of policy cards and statements.',
    },
    {
      key: 'policy_company',
      label: 'Insurance Company',
      type: 'TextInput',
      helperText: 'Name of the insurance company',
    },
    {
      key: 'policy_number',
      label: 'Policy Number',
      type: 'TextInputWithUpload',
      helperText:
        'Enter the policy number or upload a photo of the policy showing the number',
    },
    {
      key: 'policy_expiry',
      label: 'Policy Expiry Date',
      type: 'DatePicker',
      helperText:
        'Policy end date, valid through, or the last date of the policy period',
    },
    {
      key: 'coverage_amount',
      label: 'Coverage Amount',
      type: 'TextInput',
      helperText: 'Coverage amount or benefit value',
    },
    {
      key: 'beneficiaries',
      label: 'Beneficiaries',
      type: 'TextArea',
      helperText: 'List of beneficiaries and their percentages',
    },
    {
      key: 'policy_contact',
      label: 'Policy Contact Information',
      type: 'TextInputWithUpload',
      helperText:
        'Agent contact info, customer service numbers, or upload business cards',
    },
    {
      key: 'premium_info',
      label: 'Premium Information',
      type: 'TextArea',
      helperText: 'Premium amount, payment schedule, and payment method',
    },
    {
      key: 'policy_documents',
      label: 'Policy Documents',
      type: 'TextInputWithUpload',
      helperText: 'Upload policy documents, statements, or cards',
    },
    {
      key: 'notes',
      label: 'Additional Notes',
      type: 'TextArea',
      helperText: 'Any other important information about this policy',
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
  ownerEmail?: string;
  ownerName?: string;
  accessPeople?: Array<{
    email?: string;
    full_name?: string;
    immediate_access?: boolean;
  }>;
}

type ReminderRecipientOption = {
  email: string;
  label: string;
  role: 'owner' | 'access';
};

type UploadScope = 'full' | `policy:${number}`;



/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function Section7InsurancePolicies({
  data = {},
  onChange = () => {},
  activeSubsection,
  activeTopicId,
  ownerEmail = '',
  ownerName = 'Owner',
  accessPeople = [],
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
    sectionId: '7',
    setUploadedFiles,
    latestUploadRef,
  });

  const policies: any[] = Array.isArray(data['7A']) ? data['7A'] : [];
  const show7A = !activeSubsection || activeSubsection === '7A';

  const reminderRecipientOptions = useMemo(() => {
    const options: ReminderRecipientOption[] = [];
    const owner = (ownerEmail || '').trim().toLowerCase();
    if (owner) {
      options.push({
        email: owner,
        label: ownerName?.trim()
          ? `${ownerName.trim()} (Owner)`
          : 'Owner (you)',
        role: 'owner',
      });
    }

    (accessPeople || []).forEach(person => {
      const email = (person.email || '').trim().toLowerCase();
      if (!email || email === owner) return;
      const name = (person.full_name || '').trim() || email;
      options.push({
        email,
        label: name,
        role: 'access',
      });
    });

    return options;
  }, [ownerEmail, ownerName, accessPeople]);

  useScrollToVaultTopic(activeTopicId, policies.length);

  const isAnyAIActionRunning = uploadingScope !== null || aiLoadingScope !== null;

  const createEmptyPolicy = () => createEmptyItemFromFields(SECTION_7A.fields);

  const updatePolicies = (next: any[]) => {
    onChange({
      ...data,
      '7A': next,
    });
  };

  const addPolicy = () => {
    updatePolicies([...policies, createEmptyPolicy()]);
  };

  const updatePolicy = (index: number, key: string, value: any) => {
    const next = [...policies];

    next[index] = {
      ...(next[index] || {}),
      [key]: value,
    };

    updatePolicies(next);
  };

  const getSelectedReminderEmails = (policy: any): string[] => {
    const raw = policy?.reminder_recipients;
    if (raw === undefined || raw === null) {
      return reminderRecipientOptions.map(option => option.email);
    }
    if (!Array.isArray(raw)) {
      return reminderRecipientOptions.map(option => option.email);
    }
    return raw
      .map((email: unknown) =>
        typeof email === 'string' ? email.trim().toLowerCase() : '',
      )
      .filter(Boolean);
  };

  const toggleReminderRecipient = (
    policyIndex: number,
    email: string,
    checked: boolean,
  ) => {
    const policy = policies[policyIndex] || {};
    const allEmails = reminderRecipientOptions.map(option => option.email);
    const current = new Set(getSelectedReminderEmails(policy));

    if (checked) current.add(email);
    else current.delete(email);

    // Persist explicit list so deselect-all is respected (empty array).
    // When everything is selected, store null (= default all).
    const nextSelected = allEmails.filter(item => current.has(item));
    updatePolicy(
      policyIndex,
      'reminder_recipients',
      nextSelected.length === allEmails.length ? null : nextSelected,
    );
  };

  const removePolicy = (index: number) => {
    updatePolicies(policies.filter((_, itemIndex) => itemIndex !== index));
  };

  const multiItemAutofill = useAiMultiItemAutofill({
    itemLabel: SECTION_7A.itemLabel,
    createEmpty: createEmptyPolicy,
    getCurrentItems: () => policies,
    setItems: updatePolicies,
    setAiNotice,
    describeFields: [
      'policy_type',
      'policy_company',
      'insurance_company',
      'policy_number',
      'provider',
    ],
    isDuplicate: insurancePoliciesAreDuplicates,
    conflictMode: 'ask',
    onFlowComplete: () => releaseDeferredAiRoutingDialog(aiRouting),
  });

  const getUploadedFileForScope = (scope: UploadScope) => {
    const pendingFile =
      aiRouting?.getPendingFileForSection('7', String(scope)) ?? null;

    return resolveAiUploadedFileForScope(scope, uploadedFiles, latestUploadRef, pendingFile);
  };

  const UPLOAD_POLICY_KEYS = new Set(
    SECTION_7A.fields
      .filter(field => field.type === 'TextInputWithUpload')
      .map(field => field.key),
  );

  const cleanPatchObject = (patch: any) => {
    if (!patch || typeof patch !== 'object') return {};

    const asFieldValue = (key: string, value: unknown): unknown => {
      if (value === null || value === undefined) return value;
      if (UPLOAD_POLICY_KEYS.has(key)) {
        return normalizeUploadField(value);
      }
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
      }
      if (Array.isArray(value)) return value;
      if (typeof value === 'object') {
        const record = value as Record<string, unknown>;
        if ('files' in record || 'text' in record) return normalizeUploadField(value);
        for (const nestedKey of ['label', 'name', 'value', 'text', 'title', 'type']) {
          if (typeof record[nestedKey] === 'string') return record[nestedKey];
        }
        return '';
      }
      return value;
    };

    const companyAliases = ['insurance_company', 'provider', 'carrier', 'company'];
    const normalized: Record<string, unknown> = {};

    Object.entries(patch).forEach(([key, value]) => {
      const mappedKey =
        companyAliases.includes(key) && !patch.policy_company
          ? 'policy_company'
          : key;
      const nextValue = asFieldValue(mappedKey, value);
      if (nextValue === null || nextValue === undefined || nextValue === '') return;
      if (Array.isArray(nextValue) && nextValue.length === 0) return;
      normalized[mappedKey] = nextValue;
    });

    return normalized;
  };

  const normalizePolicyPatch = (patch: any) =>
    mergeAiPatchWithDefaults(
      cleanPatchObject(patch),
      SECTION_7A.fields,
      createEmptyPolicy,
    );

  const extractPolicyArrayFromPatch = (patch: any) => {
    const policyHasData = (policy: Record<string, unknown>) =>
      Object.entries(policy).some(([key, value]) => {
        if (key === '__rowId' || key === 'reminder_recipients') return false;
        if (value === null || value === undefined || value === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        if (
          value &&
          typeof value === 'object' &&
          ('text' in value || 'files' in value)
        ) {
          const upload = value as { text?: string; files?: unknown[] };
          return Boolean(
            (typeof upload.text === 'string' && upload.text.trim()) ||
              (Array.isArray(upload.files) && upload.files.length > 0),
          );
        }
        return true;
      });

    const rawPolicies = patch?.['7A'];

    if (Array.isArray(rawPolicies)) {
      return collapseInsurancePolicies(
        rawPolicies
          .map(policy => normalizePolicyPatch(policy))
          .filter(policy => policyHasData(policy)),
      );
    }

    if (rawPolicies && typeof rawPolicies === 'object') {
      const policy = normalizePolicyPatch(rawPolicies);
      return policyHasData(policy) ? [policy] : [];
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

      const uploaded = await uploadAIDocument(file, { section: '7' });

      const uploadedRecord: UploadedAIFile = buildUploadedAiFile(uploaded, file, {
        sectionId: '7',
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
    policyIndex?: number,
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
        sectionKey: 'insurance_policies',
        sectionId: '7',
        file_id: uploadedFile.file_id,
        mime_type: uploadedFile.mime_type,
        subsection: '7A',
        uploadScope: String(scope),
        fields: SECTION_7A.fields,
        aiRouting,
        });

      if (!json) return;

      const patch = unwrapAiAutofillPatch(json) ?? json?.result?.patch ?? {};
      const extractedPolicies = extractPolicyArrayFromPatch(patch);

      const disposition = multiItemAutofill.processExtraction(
        extractedPolicies,
        policyIndex,
        {
          setAiError,
          setAiNotice,
          emptyError:
            'AI could not find insurance policy information in this document.',
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
      sectionId="7"
      disabled={isAnyAIActionRunning}
      isUploading={uploadingScope === scope}
      isReading={aiLoadingScope === scope}
      uploadedFile={getUploadedFileForScope(scope)}
      highlightUpload={aiRouting?.shouldHighlightUpload('7', String(scope)) ?? false}
      showOverviewPin={aiRouting?.shouldShowOverviewPin('7') ?? false}
      onUpload={file => handleDocumentUpload(file, scope, onAutofill)}
      onAutofill={onAutofill}
    />
  );

  if (!show7A) return null;

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

      <Card
        id="subsection-7A"
        className="overflow-hidden border-slate-200 shadow-sm"
      >
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-purple-50/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
              7A. {SECTION_7A.title}
            </CardTitle>

            <Button
              type="button"
              size="sm"
              onClick={addPolicy}
              className="rounded-xl"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add {SECTION_7A.itemLabel}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 p-5">
          {renderUploader({
            scope: 'full',
            title: 'Upload document for one or more policies',
            description:
              'New policies are added as separate cards (vehicle, home, bank/loan, etc.). Re-uploading a renewal for the same policy number updates that card’s details and files.',
            buttonLabel: 'Extract Policies',
            onAutofill: () => handleAutofill('full'),
          })}

          {policies.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <ShieldCheck className="h-5 w-5 text-slate-500" />
              </div>

              <p className="font-medium text-slate-800">
                No insurance policies added yet.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Click “Add Policy” to create a blank policy card, or upload an
                insurance document above and let AI create the card.
              </p>
            </div>
          )}

          {policies.map((policy, index) => {
            const itemScope = `policy:${index}` as UploadScope;
            const itemLabel = `${SECTION_7A.itemLabel} #${index + 1}`;
            const topicProps = getTopicCardProps('7A', index, activeTopicId);

            return (
              <Card
                key={`${itemScope}-${index}`}
                id={topicProps.id}
                className={topicProps.className}
              >
                <div className="flex flex-col gap-3 border-b bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <strong className="text-slate-900">{itemLabel}</strong>

                    <p className="text-sm text-slate-500">
                      Upload a policy document, insurance card, declarations
                      page, statement, or beneficiary document to autofill only
                      this policy.
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removePolicy(index)}
                    className="rounded-xl"
                  >
                    <Minus className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                </div>

                <CardContent className="space-y-6 p-5">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#213D59]">
                          Expiry reminder emails
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Sent 10 days, 5 days, 1 day before, and on the policy
                          expiry date. Default: everyone below.
                        </p>
                      </div>
                    </div>

                    {reminderRecipientOptions.length === 0 ? (
                      <p className="mt-3 text-xs text-slate-500">
                        Add your account email and immediate-access people to
                        choose reminder recipients.
                      </p>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {reminderRecipientOptions.map(option => {
                          const selected = getSelectedReminderEmails(
                            policy,
                          ).includes(option.email);
                          return (
                            <label
                              key={option.email}
                              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                                selected
                                  ? 'border-[#213D59]/20 bg-white text-[#213D59]'
                                  : 'border-slate-200 bg-white/60 text-slate-500'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-[#213D59] focus:ring-[#213D59]"
                                checked={selected}
                                onChange={event =>
                                  toggleReminderRecipient(
                                    index,
                                    option.email,
                                    event.target.checked,
                                  )
                                }
                              />
                              <span className="font-medium">{option.label}</span>
                              {option.role === 'access' ? (
                                <span className="text-[10px] uppercase tracking-wide text-slate-400">
                                  Access
                                </span>
                              ) : null}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {renderUploader({
                    scope: itemScope,
                    title: `Upload document for ${itemLabel}`,
                    description: `This will autofill only ${itemLabel}. It will not overwrite other policy cards.`,
                    buttonLabel: `Auto-fill ${itemLabel}`,
                    compact: true,
                    onAutofill: () => handleAutofill(itemScope, index),
                  })}

                  <div className="grid gap-4 md:grid-cols-2">
                    {SECTION_7A.fields.map(field => (
                      <DynamicFormField
                        key={field.key}
                        field={field}
                        value={policy?.[field.key]}
                        formData={policy}
                        onChange={value =>
                          updatePolicy(index, field.key, value)
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
}