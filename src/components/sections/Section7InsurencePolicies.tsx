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
  ShieldCheck,
} from 'lucide-react';
import { DynamicFormField } from '@/components/DynamicFormField';
import { Alert, AlertDescription } from '@/components/common/ui/alert';

import { autofillSectionFromDocument } from '@/services/aiAutofill';
import { uploadAIDocument } from '@/services/aiDocumentUpload';

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
}

type UploadScope = 'full' | `policy:${number}`;

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

/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function Section7InsurancePolicies({
  data = {},
  onChange = () => {},
  activeSubsection,
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

  const policies: any[] = Array.isArray(data['7A']) ? data['7A'] : [];
  const show7A = !activeSubsection || activeSubsection === '7A';

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

  const getUploadedFileForScope = (scope: UploadScope) => {
    return uploadedFiles[scope] || null;
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

      if (extractedPolicies.length === 0) {
        setAiError('AI could not find insurance policy information in this document.');
        return;
      }

      if (typeof policyIndex === 'number') {
        const firstPolicy = cleanPatchObject(extractedPolicies[0]);
        const next = [...policies];

        next[policyIndex] = {
          ...(next[policyIndex] || createEmptyPolicy()),
          ...firstPolicy,
        };

        updatePolicies(next);

        setAiNotice(
          `AI filled ${SECTION_7A.itemLabel} #${policyIndex + 1}. Please review the fields.`,
        );

        return;
      }

      updatePolicies([...policies, ...extractedPolicies]);

      setAiNotice(
        extractedPolicies.length === 1
          ? 'AI added 1 insurance policy. Please review the fields.'
          : `AI added ${extractedPolicies.length} insurance policies. Please review the fields.`,
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
          'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-purple-50/50',
          'p-4 shadow-sm transition-all duration-200',
          'hover:border-purple-300 hover:shadow-md',
          compact ? 'space-y-3' : 'space-y-4',
        ].join(' ')}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-purple-100/70 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-pink-100/70 blur-2xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              ) : uploadedFile ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <UploadCloud className="h-5 w-5 text-purple-600" />
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
              'transition hover:border-purple-300 hover:bg-purple-50/50',
              compact ? 'md:flex-row md:justify-start md:py-3 md:text-left' : '',
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

            <UploadCloud className="h-5 w-5 text-slate-500 group-hover:text-purple-600" />

            <div>
              <p className="text-sm font-medium text-slate-800">
                Click to upload insurance document
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

  if (!show7A) return null;

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

      <Card className="overflow-hidden border-slate-200 shadow-sm">
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
          {/* {renderUploader({
            scope: 'full',
            title: 'Upload document for multiple insurance policies',
            description:
              'Use this if one document contains one or more policies. AI will add extracted policies as new policy cards.',
            buttonLabel: 'Extract Policies',
            onAutofill: () => handleAutofill('full'),
          })} */}

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

            return (
              <Card
                key={`${itemScope}-${index}`}
                className="overflow-hidden border-slate-200 shadow-sm"
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