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
  GraduationCap,
  Award,
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

import { autofillSectionFromDocument } from '@/services/aiAutofill';
import { uploadAIDocument } from '@/services/aiDocumentUpload';
import {
  getTopicCardProps,
  useScrollToVaultTopic,
} from '@/utils/vaultTopicNavigation';

/* ------------------------------------------------------------------ */
/* CONFIG                                                              */
/* ------------------------------------------------------------------ */

const SECTION_10A = {
  subsectionId: '10A',
  title: 'Educational Background',
  itemLabel: 'Education',
  fields: [
    {
      key: 'institution_name',
      label: 'Institution Name',
      type: 'TextInput',
      helperText: 'Name of school, college, or university',
    },
    {
      key: 'degree_type',
      label: 'Degree / Certification Type',
      type: 'Dropdown',
      options: [
        'High School Diploma',
        'Associate Degree',
        "Bachelor's Degree",
        "Master's Degree",
        'Doctoral Degree',
        'Professional Certification',
        'Trade Certification',
        'Other',
      ],
      helperText: 'Type of degree or certification earned',
    },
    {
      key: 'degree_type_other',
      label: 'Please specify other degree/certification type',
      type: 'TextInput',
      helperText:
        'Please describe the specific type of degree or certification',
      conditionalDisplay: { field: 'degree_type', value: 'Other' },
    },
    {
      key: 'field_of_study',
      label: 'Field of Study',
      type: 'TextInput',
      helperText: 'Major, concentration, or area of study',
    },
    {
      key: 'graduation_year',
      label: 'Graduation Year',
      type: 'TextInput',
      helperText: 'Year graduated or completed',
    },
    {
      key: 'honors_awards',
      label: 'Honors & Awards',
      type: 'TextArea',
      helperText: 'Academic honors, awards, or special recognitions',
    },
    {
      key: 'documents',
      label: 'Educational Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload diplomas, certificates, transcripts, or note their location',
    },
  ],
};

const FIELD_MAP_10A = buildFieldMap(SECTION_10A.fields);

const SECTION_10A_GROUPS: FieldGroup[] = [
  {
    key: 'education_details',
    title: 'Education Details',
    subtitle: 'Institution, degree, field of study, and graduation year',
    icon: GraduationCap,
    accent: 'from-sky-500/[0.07] to-blue-500/[0.03]',
    iconWrap: 'bg-sky-500/10 text-sky-700',
    layout: 'grid',
    fieldKeys: [
      'institution_name',
      'degree_type',
      'degree_type_other',
      'field_of_study',
      'graduation_year',
    ],
  },
  {
    key: 'honors_documents',
    title: 'Honors & Documents',
    subtitle: 'Academic awards and supporting educational records',
    icon: Award,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'stack',
    fieldKeys: ['honors_awards', 'documents'],
  },
];

const SUBSECTION_OVERVIEW = {
  label: 'Educational Background Overview',
  content:
    'Document schools, degrees, certifications, and academic honors so your family has a complete record of your educational achievements. Add one card per institution or credential.',
};

const SUBSECTION_SUBTITLE =
  'Add education records one at a time with grouped details in a clean two-column layout on desktop and mobile.';

/* ------------------------------------------------------------------ */
/* TYPES                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  activeSubsection?: string | null;
  activeTopicId?: string | null;
}

type UploadScope = 'full' | `education:${number}`;

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

export default function Section10EducationAccomplishments({
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

  const educationItems: any[] = Array.isArray(data['10A']) ? data['10A'] : [];
  const show10A = !activeSubsection || activeSubsection === '10A';

  useScrollToVaultTopic(activeTopicId, educationItems.length);

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const createEmptyUploadField = () => ({
    text: '',
    files: [] as unknown[],
    _deleted_files: [] as string[],
  });

  const createEmptyEducation = () => {
    return Object.fromEntries(
      SECTION_10A.fields.map(field => [
        field.key,
        field.type === 'TextInputWithUpload' ? createEmptyUploadField() : '',
      ]),
    );
  };

  const updateEducation = (next: any[]) => {
    onChange({
      ...data,
      '10A': next,
    });
  };

  const addEducation = () => {
    updateEducation([...educationItems, createEmptyEducation()]);
  };

  const updateEducationItem = (index: number, key: string, value: any) => {
    const next = [...educationItems];

    next[index] = {
      ...(next[index] || {}),
      [key]: value,
    };

    updateEducation(next);
  };

  const removeEducation = (index: number) => {
    updateEducation(
      educationItems.filter((_, itemIndex) => itemIndex !== index),
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

  const normalizeEducationPatch = (patch: any) => {
    return {
      ...createEmptyEducation(),
      ...cleanPatchObject(patch),
    };
  };

  const extractEducationArrayFromPatch = (patch: any) => {
    const rawEducationItems = patch?.['10A'];

    if (Array.isArray(rawEducationItems)) {
      return rawEducationItems
        .map(item => normalizeEducationPatch(item))
        .filter(item => {
          return Object.values(item).some(value => value !== '');
        });
    }

    if (rawEducationItems && typeof rawEducationItems === 'object') {
      const item = normalizeEducationPatch(rawEducationItems);

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
    educationIndex?: number,
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
        section: 'education_accomplishments',
        file_id: uploadedFile.file_id,
        subsection: '10A',
      });

      const patch = json?.result?.patch ?? {};
      const extractedEducationItems = extractEducationArrayFromPatch(patch);

      if (extractedEducationItems.length === 0) {
        setAiError(
          'AI could not find education or certification information in this document.',
        );
        return;
      }

      if (typeof educationIndex === 'number') {
        const firstEducationItem = cleanPatchObject(extractedEducationItems[0]);
        const next = [...educationItems];

        next[educationIndex] = {
          ...(next[educationIndex] || createEmptyEducation()),
          ...firstEducationItem,
        };

        updateEducation(next);

        setAiNotice(
          `AI filled ${SECTION_10A.itemLabel} #${educationIndex + 1}. Please review the fields.`,
        );

        return;
      }

      updateEducation([...educationItems, ...extractedEducationItems]);

      setAiNotice(
        extractedEducationItems.length === 1
          ? 'AI added 1 education record. Please review the fields.'
          : `AI added ${extractedEducationItems.length} education records. Please review the fields.`,
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
          'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-sky-50/50',
          'p-4 shadow-sm transition-all duration-200',
          'hover:border-sky-300 hover:shadow-md',
          compact ? 'space-y-3' : 'space-y-4',
        ].join(' ')}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-sky-100/70 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-blue-100/70 blur-2xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
              ) : uploadedFile ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <UploadCloud className="h-5 w-5 text-sky-600" />
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
              'transition hover:border-sky-300 hover:bg-sky-50/50',
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

            <UploadCloud className="h-5 w-5 text-slate-500 group-hover:text-sky-600" />

            <div>
              <p className="text-sm font-medium text-slate-800">
                Click to upload education document
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

  if (!show10A) return null;

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
        id="subsection-10A"
        className={cn(
          'rounded-3xl',
          activeSubsection === '10A' && 'border border-primary p-1',
        )}
      >
        <Card className="overflow-hidden border-slate-200/80 shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 via-white to-indigo-50/60 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl tracking-tight text-slate-900">
                  <GraduationCap className="h-5 w-5 text-sky-600" />
                  10A. {SECTION_10A.title}
                </CardTitle>
                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  {SUBSECTION_SUBTITLE}
                </p>
              </div>

              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                <VaultEncryptedBadge />
                <Button
                  type="button"
                  size="sm"
                  onClick={addEducation}
                  className="rounded-xl"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add {SECTION_10A.itemLabel}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.05),transparent_36%)] p-4 sm:p-6">
            <VaultOverviewBox
              label={SUBSECTION_OVERVIEW.label}
              content={SUBSECTION_OVERVIEW.content}
            />
          {/* {renderUploader({
            scope: 'full',
            title: 'Upload document for multiple education records',
            description:
              'Use this if one document contains one or more schools, degrees, diplomas, certifications, transcripts, or awards. AI will add extracted education records as new cards.',
            buttonLabel: 'Extract Education',
            onAutofill: () => handleAutofill('full'),
          })} */}

          {educationItems.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <GraduationCap className="h-5 w-5 text-slate-500" />
              </div>

              <p className="font-medium text-slate-800">
                No education records added yet.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Click “Add Education” to create a blank card, or upload an
                education document above and let AI create the card.
              </p>
            </div>
          )}

          {educationItems.map((item, index) => {
            const itemScope = `education:${index}` as UploadScope;
            const itemLabel = `${SECTION_10A.itemLabel} #${index + 1}`;
            const topicProps = getTopicCardProps('10A', index, activeTopicId);

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
                      Upload a diploma, certificate, transcript, resume, award,
                      license, or education document to autofill only this card.
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeEducation(index)}
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
                    description: `This will autofill only ${itemLabel}. It will not overwrite other education cards.`,
                    buttonLabel: `Auto-fill ${itemLabel}`,
                    compact: true,
                    onAutofill: () => handleAutofill(itemScope, index),
                  })}

                  <VaultGroupCards
                    groups={SECTION_10A_GROUPS}
                    fieldMap={FIELD_MAP_10A}
                    renderField={fieldKey => (
                      <DynamicFormField
                        key={fieldKey}
                        field={FIELD_MAP_10A[fieldKey]}
                        value={item?.[fieldKey]}
                        formData={item}
                        onChange={value =>
                          updateEducationItem(index, fieldKey, value)
                        }
                        className="space-y-2"
                      />
                    )}
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
