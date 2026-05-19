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
  HeartHandshake,
} from 'lucide-react';
import { DynamicFormField } from '@/components/DynamicFormField';
import { Alert, AlertDescription } from '@/components/common/ui/alert';

import { autofillSectionFromDocument } from '@/services/aiAutofill';
import { uploadAIDocument } from '@/services/aiDocumentUpload';

/* ------------------------------------------------------------------ */
/* CONFIG                                                              */
/* ------------------------------------------------------------------ */

const SECTION_9A = {
  subsectionId: '9A',
  title: 'Charitable Contributions',
  itemLabel: 'Charity / Cause',
  fields: [
    {
      key: 'charity_name',
      label: 'Charity / Organization Name',
      type: 'TextInput',
      helperText: 'Name of the charitable organization',
    },
    {
      key: 'cause_type',
      label: 'Type of Cause',
      type: 'Dropdown',
      options: [
        'Religious',
        'Educational',
        'Medical/Health',
        'Environmental',
        'Animal Welfare',
        'Community Services',
        'Arts & Culture',
        'International Aid',
        'Veterans',
        'Other',
      ],
      helperText: 'Category of charitable cause',
    },
    {
      key: 'cause_type_other',
      label: 'Please specify other cause type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of charitable cause',
      conditionalDisplay: { field: 'cause_type', value: 'Other' },
    },
    {
      key: 'contribution_type',
      label: 'Type of Contribution',
      type: 'RadioButtons',
      options: [
        'Regular Ongoing Donations',
        'Annual Contribution',
        'Occasional Giving',
        'Planned in Will/Trust',
        'Other',
      ],
      helperText: 'How you contribute to this organization',
    },
    {
      key: 'contribution_type_other',
      label: 'Please specify other contribution type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of contribution',
      conditionalDisplay: { field: 'contribution_type', value: 'Other' },
    },
    {
      key: 'contribution_amount',
      label: 'Contribution Amount',
      type: 'TextInput',
      helperText: 'Amount and frequency (e.g., $50/month, $500/year)',
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      type: 'TextArea',
      helperText:
        'How payments are made (automatic withdrawal, check, online, etc.)',
    },
    {
      key: 'account_info',
      label: 'Account / Donor Information',
      type: 'TextInputWithUpload',
      helperText:
        'Donor ID, account numbers, or login information for online giving',
    },
    {
      key: 'contact_details',
      label: 'Charity Contact Information',
      type: 'TextInputWithUpload',
      helperText: 'Phone, email, address, or upload contact information',
    },
    {
      key: 'special_instructions',
      label: 'Special Instructions',
      type: 'TextArea',
      helperText:
        'Instructions for continuing, modifying, or discontinuing donations',
    },
    {
      key: 'will_trust_provision',
      label: 'Will / Trust Provision',
      type: 'TextArea',
      helperText: 'If included in will or trust, note the provision details',
    },
    {
      key: 'tax_documents',
      label: 'Tax Documents',
      type: 'TextInputWithUpload',
      helperText: 'Upload donation receipts or tax-related documents',
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

type UploadScope = 'full' | `charity:${number}`;

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

export default function Section9CharitableGiving({
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

  const charities: any[] = Array.isArray(data['9A']) ? data['9A'] : [];
  const show9A = !activeSubsection || activeSubsection === '9A';

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const createEmptyCharity = () => {
    return Object.fromEntries(SECTION_9A.fields.map(field => [field.key, '']));
  };

  const updateCharities = (next: any[]) => {
    onChange({
      ...data,
      '9A': next,
    });
  };

  const addCharity = () => {
    updateCharities([...charities, createEmptyCharity()]);
  };

  const updateCharity = (index: number, key: string, value: any) => {
    const next = [...charities];

    next[index] = {
      ...(next[index] || {}),
      [key]: value,
    };

    updateCharities(next);
  };

  const removeCharity = (index: number) => {
    updateCharities(charities.filter((_, itemIndex) => itemIndex !== index));
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

  const normalizeCharityPatch = (patch: any) => {
    return {
      ...createEmptyCharity(),
      ...cleanPatchObject(patch),
    };
  };

  const extractCharityArrayFromPatch = (patch: any) => {
    const rawCharities = patch?.['9A'];

    if (Array.isArray(rawCharities)) {
      return rawCharities
        .map(charity => normalizeCharityPatch(charity))
        .filter(charity => {
          return Object.values(charity).some(value => value !== '');
        });
    }

    if (rawCharities && typeof rawCharities === 'object') {
      const charity = normalizeCharityPatch(rawCharities);

      return Object.values(charity).some(value => value !== '')
        ? [charity]
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
    charityIndex?: number,
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
        section: 'charitable_giving',
        file_id: uploadedFile.file_id,
        subsection: '9A',
      });

      const patch = json?.result?.patch ?? {};
      const extractedCharities = extractCharityArrayFromPatch(patch);

      if (extractedCharities.length === 0) {
        setAiError(
          'AI could not find charitable giving information in this document.',
        );
        return;
      }

      if (typeof charityIndex === 'number') {
        const firstCharity = cleanPatchObject(extractedCharities[0]);
        const next = [...charities];

        next[charityIndex] = {
          ...(next[charityIndex] || createEmptyCharity()),
          ...firstCharity,
        };

        updateCharities(next);

        setAiNotice(
          `AI filled ${SECTION_9A.itemLabel} #${charityIndex + 1}. Please review the fields.`,
        );

        return;
      }

      updateCharities([...charities, ...extractedCharities]);

      setAiNotice(
        extractedCharities.length === 1
          ? 'AI added 1 charitable contribution. Please review the fields.'
          : `AI added ${extractedCharities.length} charitable contributions. Please review the fields.`,
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
          'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-rose-50/50',
          'p-4 shadow-sm transition-all duration-200',
          'hover:border-rose-300 hover:shadow-md',
          compact ? 'space-y-3' : 'space-y-4',
        ].join(' ')}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-rose-100/70 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-pink-100/70 blur-2xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-rose-600" />
              ) : uploadedFile ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <UploadCloud className="h-5 w-5 text-rose-600" />
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
              'transition hover:border-rose-300 hover:bg-rose-50/50',
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

            <UploadCloud className="h-5 w-5 text-slate-500 group-hover:text-rose-600" />

            <div>
              <p className="text-sm font-medium text-slate-800">
                Click to upload charitable giving document
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

  if (!show9A) return null;

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
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-rose-50/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-rose-600" />
              9A. {SECTION_9A.title}
            </CardTitle>

            <Button
              type="button"
              size="sm"
              onClick={addCharity}
              className="rounded-xl"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add {SECTION_9A.itemLabel}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 p-5">
          {/* {renderUploader({
            scope: 'full',
            title: 'Upload document for multiple charitable contributions',
            description:
              'Use this if one document contains one or more charities, causes, donation records, giving statements, or planned charitable gifts. AI will add extracted charities as new cards.',
            buttonLabel: 'Extract Contributions',
            onAutofill: () => handleAutofill('full'),
          })} */}

          {charities.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <HeartHandshake className="h-5 w-5 text-slate-500" />
              </div>

              <p className="font-medium text-slate-800">
                No charitable contributions added yet.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Click “Add Charity / Cause” to create a blank card, or upload a
                charitable giving document above and let AI create the card.
              </p>
            </div>
          )}

          {charities.map((charity, index) => {
            const itemScope = `charity:${index}` as UploadScope;
            const itemLabel = `${SECTION_9A.itemLabel} #${index + 1}`;

            return (
              <Card
                key={`${itemScope}-${index}`}
                className="overflow-hidden border-slate-200 shadow-sm"
              >
                <div className="flex flex-col gap-3 border-b bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <strong className="text-slate-900">{itemLabel}</strong>

                    <p className="text-sm text-slate-500">
                      Upload a donation receipt, giving statement, charity
                      letter, planned giving document, donor account note, or
                      tax receipt to autofill only this card.
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeCharity(index)}
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
                    description: `This will autofill only ${itemLabel}. It will not overwrite other charitable giving cards.`,
                    buttonLabel: `Auto-fill ${itemLabel}`,
                    compact: true,
                    onAutofill: () => handleAutofill(itemScope, index),
                  })}

                  <div className="grid gap-4 md:grid-cols-2">
                    {SECTION_9A.fields.map(field => (
                      <DynamicFormField
                        key={field.key}
                        field={field}
                        value={charity?.[field.key]}
                        formData={charity}
                        onChange={value =>
                          updateCharity(index, field.key, value)
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
