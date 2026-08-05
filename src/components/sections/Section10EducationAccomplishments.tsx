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

import { releaseDeferredAiRoutingDialog, runAiSectionAutofill } from '@/services/aiSectionAutofill';
import {
  createEmptyItemFromFields,
  mergeAiPatchWithDefaults,
} from '@/utils/aiPatchNormalizer';
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
import { educationEntriesAreDuplicates } from '@/utils/aiItemDedup';

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

  const latestUploadRef = useRef<Record<string, UploadedAIFile>>({});

  const aiRouting = useOptionalAiDocumentRouting();

  useRestoreAiPendingUploadForSection({
    sectionId: '10',
    setUploadedFiles,
    latestUploadRef,
  });

  const educationItems: any[] = Array.isArray(data['10A'])
    ? data['10A']
    : data['10A'] && typeof data['10A'] === 'object'
      ? [data['10A']]
      : [];
  const show10A = !activeSubsection || activeSubsection === '10A';

  useScrollToVaultTopic(activeTopicId, educationItems.length);

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const createEmptyUploadField = () => ({
    text: '',
    files: [] as unknown[],
    _deleted_files: [] as string[],
  });

  const createEmptyEducation = () => createEmptyItemFromFields(SECTION_10A.fields);

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
    updateEducation(educationItems.filter((_, itemIndex) => itemIndex !== index));
  };

  const multiItemAutofill = useAiMultiItemAutofill({
    itemLabel: SECTION_10A.itemLabel,
    createEmpty: createEmptyEducation,
    getCurrentItems: () => educationItems,
    setItems: updateEducation,
    setAiNotice,
    describeFields: ['institution_name', 'degree_type', 'graduation_year'],
    isDuplicate: educationEntriesAreDuplicates,
    conflictMode: 'ask',
    onFlowComplete: () => releaseDeferredAiRoutingDialog(aiRouting),
  });

  const getUploadedFileForScope = (scope: UploadScope) => {
    const pendingFile =
      aiRouting?.getPendingFileForSection('10', String(scope)) ?? null;

    return resolveAiUploadedFileForScope(scope, uploadedFiles, latestUploadRef, pendingFile);
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

  const normalizeEducationPatch = (patch: any) =>
    mergeAiPatchWithDefaults(patch, SECTION_10A.fields, createEmptyEducation);

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

      const uploaded = await uploadAIDocument(file, { section: '10' });

      const uploadedRecord: UploadedAIFile = buildUploadedAiFile(uploaded, file, {
        sectionId: '10',
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

      const json = await runAiSectionAutofill({
        sectionKey: 'education_accomplishments',
        sectionId: '10',
        file_id: uploadedFile.file_id,
        mime_type: uploadedFile.mime_type,
        subsection: '10A',
        uploadScope: String(scope),
        fields: SECTION_10A.fields,
        aiRouting,
        });

      if (!json) return;

      const patch = json?.result?.patch ?? {};
      const extractedEducationItems = extractEducationArrayFromPatch(patch);

      const disposition = multiItemAutofill.processExtraction(
        extractedEducationItems,
        educationIndex,
        {
          setAiError,
          setAiNotice,
          emptyError:
            'AI could not find education information in this document.',
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
      highlightUpload={aiRouting?.shouldHighlightUpload('10', String(scope)) ?? false}
      onUpload={file => handleDocumentUpload(file, scope, onAutofill)}
      onAutofill={onAutofill}
    />
  );

  if (!show10A) return null;

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
            const itemLabel = getItemDisplayLabel(
              '10',
              '10A',
              item || {},
              index,
              SECTION_10A.itemLabel,
            );
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
