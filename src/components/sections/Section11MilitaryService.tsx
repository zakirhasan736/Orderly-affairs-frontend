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

const SECTION_11A = {
  subsectionId: '11A',
  title: 'Military Service Record',
  itemLabel: 'Service Period',
  fields: [
    {
      key: 'branch_of_service',
      label: 'Branch of Service',
      type: 'Dropdown',
      options: [
        'Army',
        'Navy',
        'Air Force',
        'Marines',
        'Coast Guard',
        'Space Force',
        'National Guard',
        'Reserves',
        'Other',
      ],
      helperText: 'Which branch of the military you served in',
    },
    {
      key: 'branch_of_service_other',
      label: 'Please specify other branch of service',
      type: 'TextInput',
      helperText: 'Please describe the specific branch or service',
      conditionalDisplay: {
        field: 'branch_of_service',
        value: 'Other',
      },
    },
    {
      key: 'service_dates',
      label: 'Service Dates',
      type: 'TextInput',
      helperText: 'Start and end dates of service (e.g., 1985–1989)',
    },
    {
      key: 'rank_achieved',
      label: 'Highest Rank Achieved',
      type: 'TextInput',
      helperText: 'Final rank or pay grade attained',
    },
    {
      key: 'military_occupational_specialty',
      label: 'Military Occupational Specialty (MOS)',
      type: 'TextInput',
      helperText: 'Your job or specialty code in the military',
    },
    {
      key: 'deployments',
      label: 'Deployments / Stations',
      type: 'TextArea',
      helperText: 'Locations where you were stationed or deployed',
    },
    {
      key: 'combat_service',
      label: 'Combat Service',
      type: 'RadioButtons',
      options: ['Yes', 'No'],
      helperText: 'Did you serve in a combat zone?',
    },
    {
      key: 'awards_decorations',
      label: 'Awards & Decorations',
      type: 'TextArea',
      helperText: 'Military awards, medals, ribbons, or commendations received',
    },
    {
      key: 'discharge_type',
      label: 'Type of Discharge',
      type: 'Dropdown',
      options: [
        'Honorable',
        'General (Under Honorable Conditions)',
        'Other Than Honorable',
        'Bad Conduct',
        'Dishonorable',
        'Medical',
      ],
      helperText: 'Type of military discharge received',
    },
    {
      key: 'va_benefits',
      label: 'VA Benefits Information',
      type: 'TextArea',
      helperText:
        'Current VA benefits, disability ratings, or services you receive',
    },
    {
      key: 'military_documents',
      label: 'Military Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload DD-214, service records, discharge papers, or note their location',
    },
    {
      key: 'burial_preferences',
      label: 'Military Burial Preferences',
      type: 'TextArea',
      helperText:
        'Preferences for military funeral honors or burial in national cemetery',
    },
    {
      key: 'veteran_contacts',
      label: 'Veteran Organization Contacts',
      type: 'TextInputWithUpload',
      helperText:
        'VFW, American Legion, or other veteran organization contacts',
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

type UploadScope = 'full' | `service:${number}`;

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

export default function Section11MilitaryService({
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

  const servicePeriods: any[] = Array.isArray(data['11A']) ? data['11A'] : [];
  const show11A = !activeSubsection || activeSubsection === '11A';

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const createEmptyServicePeriod = () => {
    return Object.fromEntries(SECTION_11A.fields.map(field => [field.key, '']));
  };

  const updateServicePeriods = (next: any[]) => {
    onChange({
      ...data,
      '11A': next,
    });
  };

  const addServicePeriod = () => {
    updateServicePeriods([...servicePeriods, createEmptyServicePeriod()]);
  };

  const updateServicePeriod = (index: number, key: string, value: any) => {
    const next = [...servicePeriods];

    next[index] = {
      ...(next[index] || {}),
      [key]: value,
    };

    updateServicePeriods(next);
  };

  const removeServicePeriod = (index: number) => {
    updateServicePeriods(
      servicePeriods.filter((_, itemIndex) => itemIndex !== index),
    );
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

  const normalizeServicePeriodPatch = (patch: any) => {
    return {
      ...createEmptyServicePeriod(),
      ...cleanPatchObject(patch),
    };
  };

  const extractServicePeriodArrayFromPatch = (patch: any) => {
    const rawServicePeriods = patch?.['11A'];

    if (Array.isArray(rawServicePeriods)) {
      return rawServicePeriods
        .map(item => normalizeServicePeriodPatch(item))
        .filter(item => {
          return Object.values(item).some(value => value !== '');
        });
    }

    if (rawServicePeriods && typeof rawServicePeriods === 'object') {
      const item = normalizeServicePeriodPatch(rawServicePeriods);

      return Object.values(item).some(value => value !== '') ? [item] : [];
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
    serviceIndex?: number,
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
        section: 'military_service',
        file_id: uploadedFile.file_id,
        subsection: '11A',

      });

      const patch = json?.result?.patch ?? {};
      const extractedServicePeriods = extractServicePeriodArrayFromPatch(patch);

      if (extractedServicePeriods.length === 0) {
        setAiError(
          'AI could not find military service information in this document.',
        );
        return;
      }

      if (typeof serviceIndex === 'number') {
        const firstServicePeriod = cleanPatchObject(extractedServicePeriods[0]);
        const next = [...servicePeriods];

        next[serviceIndex] = {
          ...(next[serviceIndex] || createEmptyServicePeriod()),
          ...firstServicePeriod,
        };

        updateServicePeriods(next);

        setAiNotice(
          `AI filled ${SECTION_11A.itemLabel} #${serviceIndex + 1}. Please review the fields.`,
        );

        return;
      }

      updateServicePeriods([...servicePeriods, ...extractedServicePeriods]);

      setAiNotice(
        extractedServicePeriods.length === 1
          ? 'AI added 1 military service record. Please review the fields.'
          : `AI added ${extractedServicePeriods.length} military service records. Please review the fields.`,
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
          'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-indigo-50/50',
          'p-4 shadow-sm transition-all duration-200',
          'hover:border-indigo-300 hover:shadow-md',
          compact ? 'space-y-3' : 'space-y-4',
        ].join(' ')}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-100/70 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-blue-100/70 blur-2xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              ) : uploadedFile ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <UploadCloud className="h-5 w-5 text-indigo-600" />
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
              'transition hover:border-indigo-300 hover:bg-indigo-50/50',
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

            <UploadCloud className="h-5 w-5 text-slate-500 group-hover:text-indigo-600" />

            <div>
              <p className="text-sm font-medium text-slate-800">
                Click to upload military service document
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

  if (!show11A) return null;

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
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-indigo-50/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              11A. {SECTION_11A.title}
            </CardTitle>

            <Button
              type="button"
              size="sm"
              onClick={addServicePeriod}
              className="rounded-xl"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add {SECTION_11A.itemLabel}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 p-5">
          {/* {renderUploader({
            scope: 'full',
            title: 'Upload document for multiple military service records',
            description:
              'Use this if one document contains one or more military service records, DD-214 details, VA benefit letters, discharge papers, deployments, awards, or veteran contacts. AI will add extracted service records as new cards.',
            buttonLabel: 'Extract Service Records',
            onAutofill: () => handleAutofill('full'),
          })} */}

          {servicePeriods.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <ShieldCheck className="h-5 w-5 text-slate-500" />
              </div>

              <p className="font-medium text-slate-800">
                No military service records added yet.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Click “Add Service Period” to create a blank card, or upload a
                military service document above and let AI create the card.
              </p>
            </div>
          )}

          {servicePeriods.map((item, index) => {
            const itemScope = `service:${index}` as UploadScope;
            const itemLabel = `${SECTION_11A.itemLabel} #${index + 1}`;

            return (
              <Card
                key={`${itemScope}-${index}`}
                className="overflow-hidden border-slate-200 shadow-sm"
              >
                <div className="flex flex-col gap-3 border-b bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <strong className="text-slate-900">{itemLabel}</strong>

                    <p className="text-sm text-slate-500">
                      Upload a DD-214, discharge paper, VA benefit letter,
                      service record, award certificate, veteran ID, or burial
                      benefit document to autofill only this card.
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeServicePeriod(index)}
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
                    description: `This will autofill only ${itemLabel}. It will not overwrite other military service cards.`,
                    buttonLabel: `Auto-fill ${itemLabel}`,
                    compact: true,
                    onAutofill: () => handleAutofill(itemScope, index),
                  })}

                  <div className="grid gap-4 md:grid-cols-2">
                    {SECTION_11A.fields.map(field => (
                      <DynamicFormField
                        key={field.key}
                        field={field}
                        value={item?.[field.key]}
                        formData={item}
                        onChange={value =>
                          updateServicePeriod(index, field.key, value)
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
