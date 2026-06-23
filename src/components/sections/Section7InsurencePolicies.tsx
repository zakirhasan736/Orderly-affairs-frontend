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
} from 'lucide-react';
import { DynamicFormField } from '@/components/DynamicFormField';
import { Alert, AlertDescription } from '@/components/common/ui/alert';

import { autofillSectionFromDocument } from '@/services/aiAutofill';
import { uploadAIDocument } from '@/services/aiDocumentUpload';
import { SectionAiDocumentUploader } from '@/components/ai/SectionAiDocumentUploader';
import {
  type UploadedAIFile,
  validateAiDocumentFile,
} from '@/utils/aiDocumentUploadUi';
import {
  getTopicCardProps,
  useScrollToVaultTopic,
} from '@/utils/vaultTopicNavigation';
import { useAiMultiItemAutofill } from '@/hooks/useAiMultiItemAutofill';

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
}

type UploadScope = 'full' | `policy:${number}`;



/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function Section7InsurancePolicies({
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

  const policies: any[] = Array.isArray(data['7A']) ? data['7A'] : [];
  const show7A = !activeSubsection || activeSubsection === '7A';

  useScrollToVaultTopic(activeTopicId, policies.length);

  const isAnyAIActionRunning = uploadingScope !== null || aiLoadingScope !== null;

  const createEmptyPolicy = () => {
    return Object.fromEntries(SECTION_7A.fields.map(field => [field.key, '']));
  };

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

  const removePolicy = (index: number) => {
    updatePolicies(policies.filter((_, itemIndex) => itemIndex !== index));
  };

  const multiItemAutofill = useAiMultiItemAutofill({
    itemLabel: SECTION_7A.itemLabel,
    createEmpty: createEmptyPolicy,
    getCurrentItems: () => policies,
    setItems: updatePolicies,
    setAiNotice,
    describeFields: ['policy_type', 'insurance_company', 'provider'],
  });

  const getUploadedFileForScope = (scope: UploadScope) => {
    return latestUploadRef.current[String(scope)] ?? uploadedFiles[scope] ?? null;
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

  const normalizePolicyPatch = (patch: any) => {
    return {
      ...createEmptyPolicy(),
      ...cleanPatchObject(patch),
    };
  };

  const extractPolicyArrayFromPatch = (patch: any) => {
    const rawPolicies = patch?.['7A'];

    if (Array.isArray(rawPolicies)) {
      return rawPolicies
        .map(policy => normalizePolicyPatch(policy))
        .filter(policy => {
          return Object.values(policy).some(value => value !== '');
        });
    }

    if (rawPolicies && typeof rawPolicies === 'object') {
      const policy = normalizePolicyPatch(rawPolicies);

      return Object.values(policy).some(value => value !== '')
        ? [policy]
        : [];
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

      const uploadedRecord: UploadedAIFile = {
        file_id: uploaded.file_id,
        mime_type: uploaded.mime_type,
        expires_at: uploaded.expires_at,
      };

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

      const json = await autofillSectionFromDocument({
        section: 'insurance_policies',
        file_id: uploadedFile.file_id,
        subsection: '7A',

      });

      const patch = json?.result?.patch ?? {};
      const extractedPolicies = extractPolicyArrayFromPatch(patch);

      if (
        !multiItemAutofill.processExtraction(extractedPolicies, policyIndex, {
          setAiError,
          setAiNotice,
          emptyError:
            'AI could not find insurance policy information in this document.',
        })
      ) {
        return;
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
      uploadedMimeType={getUploadedFileForScope(scope)?.mime_type}
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
              'Use for insurance declarations, cards, or statements that may list multiple policies. AI can create separate policy cards for each.',
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