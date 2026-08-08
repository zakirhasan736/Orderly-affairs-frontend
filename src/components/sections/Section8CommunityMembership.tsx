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
  UsersRound,
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
import { getItemDisplayLabel } from '@/utils/dynamicVaultTopics';
import { useAiMultiItemAutofill } from '@/hooks/useAiMultiItemAutofill';
import { namedItemsAreDuplicates } from '@/utils/aiItemDedup';

/* ------------------------------------------------------------------ */
/* CONFIG                                                              */
/* ------------------------------------------------------------------ */

const SECTION_8A = {
  subsectionId: '8A',
  title: 'Group Memberships',
  itemLabel: 'Group / Organization',
  fields: [
    {
      key: 'organization_name',
      label: 'Organization Name',
      type: 'TextInput',
      helperText: 'Name of the group, club, or organization',
    },
    {
      key: 'organization_type',
      label: 'Type of Organization',
      type: 'Dropdown',
      options: [
        'Religious/Church',
        'Professional Association',
        'Social Club',
        'Volunteer Organization',
        'Hobby Group',
        'Sports/Recreation',
        'Educational',
        'Political',
        'Other',
      ],
      helperText: 'Category that best describes this organization',
    },
    {
      key: 'organization_type_other',
      label: 'Please specify other organization type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of organization',
      conditionalDisplay: { field: 'organization_type', value: 'Other' },
    },
    {
      key: 'membership_details',
      label: 'Membership Details',
      type: 'TextArea',
      helperText: 'Your role, membership number, or special responsibilities',
    },
    {
      key: 'renewal_date',
      label: 'Membership Renewal Date',
      type: 'DatePicker',
      helperText:
        'When dues or membership renew — reminder emails at 10, 5, 1 days and on the day',
    },
    {
      key: 'contact_info',
      label: 'Contact Information',
      type: 'TextInputWithUpload',
      helperText: 'Phone, email, address, or upload contact cards',
    },
    {
      key: 'importance',
      label: 'Importance to Me',
      type: 'TextArea',
      helperText:
        'Why this group is meaningful to you and any special memories',
    },
    {
      key: 'notify_instructions',
      label: 'Notification Instructions',
      type: 'TextArea',
      helperText:
        'Should this organization be notified of your passing? Any special requests?',
    },
    {
      key: 'documents',
      label: 'Related Documents',
      type: 'TextInputWithUpload',
      helperText: 'Membership cards, certificates, or important documents',
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

type UploadScope = 'full' | `group:${number}`;



/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function Section8CommunityMembership({
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
    sectionId: '8',
    setUploadedFiles,
    latestUploadRef,
  });

  const groups: any[] = Array.isArray(data['8A'])
    ? data['8A']
    : data['8A'] && typeof data['8A'] === 'object'
      ? [data['8A']]
      : [];
  const show8A = !activeSubsection || activeSubsection === '8A';

  useScrollToVaultTopic(activeTopicId, groups.length);

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const createEmptyUploadField = () => ({
    text: '',
    files: [] as unknown[],
    _deleted_files: [] as string[],
  });

  const createEmptyGroup = () => createEmptyItemFromFields(SECTION_8A.fields);

  const updateGroups = (next: any[]) => {
    onChange({
      ...data,
      '8A': next,
    });
  };

  const addGroup = () => {
    updateGroups([...groups, createEmptyGroup()]);
  };

  const updateGroup = (index: number, key: string, value: any) => {
    const next = [...groups];

    next[index] = {
      ...(next[index] || {}),
      [key]: value,
    };

    updateGroups(next);
  };

  const removeGroup = (index: number) => {
    updateGroups(groups.filter((_, itemIndex) => itemIndex !== index));
  };

  const multiItemAutofill = useAiMultiItemAutofill({
    itemLabel: SECTION_8A.itemLabel,
    createEmpty: createEmptyGroup,
    getCurrentItems: () => groups,
    setItems: updateGroups,
    setAiNotice,
    describeFields: ['organization_name', 'group_name', 'name'],
    isDuplicate: (a, b) =>
      namedItemsAreDuplicates(a, b, [
        'organization_name',
        'group_name',
        'name',
      ]),
    conflictMode: 'ask',
    onFlowComplete: () => releaseDeferredAiRoutingDialog(aiRouting),
  });

  const getUploadedFileForScope = (scope: UploadScope) => {
    const pendingFile =
      aiRouting?.getPendingFileForSection('8', String(scope)) ?? null;

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

  const normalizeGroupPatch = (patch: any) =>
    mergeAiPatchWithDefaults(patch, SECTION_8A.fields, createEmptyGroup);

  const extractGroupArrayFromPatch = (patch: any) => {
    const rawGroups = patch?.['8A'];

    if (Array.isArray(rawGroups)) {
      return rawGroups
        .map(group => normalizeGroupPatch(group))
        .filter(group => {
          return Object.values(group).some(value => value !== '');
        });
    }

    if (rawGroups && typeof rawGroups === 'object') {
      const group = normalizeGroupPatch(rawGroups);

      return Object.values(group).some(value => value !== '') ? [group] : [];
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

      const uploaded = await uploadAIDocument(file, { section: '8' });

      const uploadedRecord: UploadedAIFile = buildUploadedAiFile(uploaded, file, {
        sectionId: '8',
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
    groupIndex?: number,
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
        sectionKey: 'community_memberships',
        sectionId: '8',
        file_id: uploadedFile.file_id,
        mime_type: uploadedFile.mime_type,
        subsection: '8A',
        uploadScope: String(scope),
        fields: SECTION_8A.fields,
        aiRouting,
        });

      if (!json) return;

     const patch = json?.result?.patch ?? {};
      const extractedGroups = extractGroupArrayFromPatch(patch);

      const disposition = multiItemAutofill.processExtraction(
        extractedGroups,
        groupIndex,
        {
          setAiError,
          setAiNotice,
          emptyError:
            'AI could not find group membership information in this document.',
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
      highlightUpload={aiRouting?.shouldHighlightUpload('8', String(scope)) ?? false}
      onUpload={file => handleDocumentUpload(file, scope, onAutofill)}
      onAutofill={onAutofill}
    />
  );

  if (!show8A) return null;

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
        id="subsection-8A"
        className="overflow-hidden border-slate-200 shadow-sm"
      >
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-orange-50/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-orange-600" />
              {SECTION_8A.title}
            </CardTitle>

            <Button
              type="button"
              size="sm"
              onClick={addGroup}
              className="rounded-xl"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add {SECTION_8A.itemLabel}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 p-5">
          {/* {renderUploader({
            scope: 'full',
            title: 'Upload document for multiple memberships',
            description:
              'Use this if one document contains one or more group memberships. AI will add extracted organizations as new cards.',
            buttonLabel: 'Extract Memberships',
            onAutofill: () => handleAutofill('full'),
          })} */}

          {groups.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <UsersRound className="h-5 w-5 text-slate-500" />
              </div>

              <p className="font-medium text-slate-800">
                No group memberships added yet.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Click “Add Group / Organization” to create a blank card, or
                upload a membership document above and let AI create the card.
              </p>
            </div>
          )}

          {groups.map((group, index) => {
            const itemScope = `group:${index}` as UploadScope;
            const itemLabel = getItemDisplayLabel(
              '8',
              '8A',
              group || {},
              index,
              SECTION_8A.itemLabel,
            );
            const topicProps = getTopicCardProps('8A', index, activeTopicId);

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
                      Upload a membership card, certificate, association record,
                      contact card, letter, or screenshot to autofill only this
                      organization.
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeGroup(index)}
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
                    description: `This will autofill only ${itemLabel}. It will not overwrite other membership cards.`,
                    buttonLabel: `Auto-fill ${itemLabel}`,
                    compact: true,
                    onAutofill: () => handleAutofill(itemScope, index),
                  })}

                  <div className="grid gap-4 md:grid-cols-2">
                    {SECTION_8A.fields.map(field => (
                      <DynamicFormField
                        key={field.key}
                        field={field}
                        value={group?.[field.key]}
                        formData={group}
                        onChange={value => updateGroup(index, field.key, value)}
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
