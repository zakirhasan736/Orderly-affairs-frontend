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
  HeartHandshake,
} from 'lucide-react';
import { DynamicFormField } from '@/components/DynamicFormField';
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
import { useAiMultiItemAutofill } from '@/hooks/useAiMultiItemAutofill';
import { namedItemsAreDuplicates } from '@/utils/aiItemDedup';

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
  activeTopicId?: string | null;
}

type UploadScope = 'full' | `charity:${number}`;



/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function Section9CharitableGiving({
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
    sectionId: '9',
    setUploadedFiles,
    latestUploadRef,
  });

  const charities: any[] = Array.isArray(data['9A'])
    ? data['9A']
    : data['9A'] && typeof data['9A'] === 'object'
      ? [data['9A']]
      : [];
  const show9A = !activeSubsection || activeSubsection === '9A';

  useScrollToVaultTopic(activeTopicId, charities.length);

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

const UPLOAD_FIELD_KEYS = new Set([
  'account_info',
  'contact_details',
  'tax_documents',
]);

const createEmptyUploadField = () => ({
  text: '',
  files: [] as unknown[],
  _deleted_files: [] as string[],
});

const createEmptyCharity = () => createEmptyItemFromFields(SECTION_9A.fields);

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

  const multiItemAutofill = useAiMultiItemAutofill({
    itemLabel: SECTION_9A.itemLabel,
    createEmpty: createEmptyCharity,
    getCurrentItems: () => charities,
    setItems: updateCharities,
    setAiNotice,
    describeFields: ['charity_name', 'organization_name', 'name'],
    isDuplicate: (a, b) =>
      namedItemsAreDuplicates(a, b, [
        'charity_name',
        'organization_name',
        'name',
      ]),
    conflictMode: 'ask',
    onFlowComplete: () => releaseDeferredAiRoutingDialog(aiRouting),
  });

  const getUploadedFileForScope = (scope: UploadScope) => {
    const pendingFile =
      aiRouting?.getPendingFileForSection('9', String(scope)) ?? null;

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

  const normalizeCharityPatch = (patch: any) =>
    mergeAiPatchWithDefaults(patch, SECTION_9A.fields, createEmptyCharity);

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

      const uploaded = await uploadAIDocument(file, { section: '9' });

      const uploadedRecord: UploadedAIFile = buildUploadedAiFile(uploaded, file, {
        sectionId: '9',
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

      const json = await runAiSectionAutofill({
        sectionKey: 'charitable_giving',
        sectionId: '9',
        file_id: uploadedFile.file_id,
        mime_type: uploadedFile.mime_type,
        subsection: '9A',
        uploadScope: String(scope),
        fields: SECTION_9A.fields,
        aiRouting,
        });

      if (!json) return;

      const patch = json?.result?.patch ?? {};
      const extractedCharities = extractCharityArrayFromPatch(patch);

      const disposition = multiItemAutofill.processExtraction(
        extractedCharities,
        charityIndex,
        {
          setAiError,
          setAiNotice,
          emptyError:
            'AI could not find charitable giving information in this document.',
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
      highlightUpload={aiRouting?.shouldHighlightUpload('9', String(scope)) ?? false}
      onUpload={file => handleDocumentUpload(file, scope, onAutofill)}
      onAutofill={onAutofill}
    />
  );

  if (!show9A) return null;

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
        id="subsection-9A"
        className="overflow-hidden border-slate-200 shadow-sm"
      >
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
            const topicProps = getTopicCardProps('9A', index, activeTopicId);

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
