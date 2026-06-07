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
  UsersRound,
  Heart,
  Bell,
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

const FIELD_MAP_8A = buildFieldMap(SECTION_8A.fields);

const SECTION_8A_GROUPS: FieldGroup[] = [
  {
    key: 'organization_basics',
    title: 'Organization Basics',
    subtitle: 'Name and type of group or organization',
    icon: UsersRound,
    accent: 'from-blue-500/[0.07] to-indigo-500/[0.03]',
    iconWrap: 'bg-blue-500/10 text-blue-600',
    layout: 'grid',
    fieldKeys: [
      'organization_name',
      'organization_type',
      'organization_type_other',
    ],
  },
  {
    key: 'membership_details',
    title: 'Membership Details',
    subtitle: 'Role, contact info, and personal significance',
    icon: Heart,
    accent: 'from-rose-500/[0.07] to-pink-500/[0.03]',
    iconWrap: 'bg-rose-500/10 text-rose-700',
    layout: 'stack',
    fieldKeys: ['membership_details', 'contact_info', 'importance'],
  },
  {
    key: 'notifications_documents',
    title: 'Notifications & Documents',
    subtitle: 'Notification wishes and membership records',
    icon: Bell,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'grid',
    fieldKeys: ['notify_instructions', 'documents'],
  },
];

const SUBSECTION_OVERVIEW = {
  label: 'Community Memberships Overview',
  content:
    'Document clubs, religious groups, volunteer organizations, and other communities that matter to you. Add one card per organization with contact details and notification preferences.',
};

const SUBSECTION_SUBTITLE =
  'Add each group membership with grouped details in a clean two-column layout on desktop and mobile.';

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

  const groups: any[] = Array.isArray(data['8A']) ? data['8A'] : [];
  const show8A = !activeSubsection || activeSubsection === '8A';

  useScrollToVaultTopic(activeTopicId, groups.length);

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const createEmptyUploadField = () => ({
    text: '',
    files: [] as unknown[],
    _deleted_files: [] as string[],
  });

  const createEmptyGroup = () => {
    return Object.fromEntries(
      SECTION_8A.fields.map(field => [
        field.key,
        field.type === 'TextInputWithUpload' ? createEmptyUploadField() : '',
      ]),
    );
  };

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

  const normalizeGroupPatch = (patch: any) => {
    return {
      ...createEmptyGroup(),
      ...cleanPatchObject(patch),
    };
  };

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

      const json = await autofillSectionFromDocument({
        section: 'community_memberships',
        file_id: uploadedFile.file_id,
        subsection: '8A',
      });

     const patch = json?.result?.patch ?? {};
      const extractedGroups = extractGroupArrayFromPatch(patch);

      if (extractedGroups.length === 0) {
        setAiError(
          'AI could not find group membership information in this document.',
        );
        return;
      }

      if (typeof groupIndex === 'number') {
        const firstGroup = cleanPatchObject(extractedGroups[0]);
        const next = [...groups];

        next[groupIndex] = {
          ...(next[groupIndex] || createEmptyGroup()),
          ...firstGroup,
        };

        updateGroups(next);

        setAiNotice(
          `AI filled ${SECTION_8A.itemLabel} #${groupIndex + 1}. Please review the fields.`,
        );

        return;
      }

      updateGroups([...groups, ...extractedGroups]);

      setAiNotice(
        extractedGroups.length === 1
          ? 'AI added 1 group membership. Please review the fields.'
          : `AI added ${extractedGroups.length} group memberships. Please review the fields.`,
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
          'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-orange-50/50',
          'p-4 shadow-sm transition-all duration-200',
          'hover:border-orange-300 hover:shadow-md',
          compact ? 'space-y-3' : 'space-y-4',
        ].join(' ')}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-100/70 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-amber-100/70 blur-2xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
              ) : uploadedFile ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <UploadCloud className="h-5 w-5 text-orange-600" />
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
              'transition hover:border-orange-300 hover:bg-orange-50/50',
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

            <UploadCloud className="h-5 w-5 text-slate-500 group-hover:text-orange-600" />

            <div>
              <p className="text-sm font-medium text-slate-800">
                Click to upload membership document
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

  if (!show8A) return null;

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
        id="subsection-8A"
        className={cn(
          'rounded-3xl',
          activeSubsection === '8A' && 'border border-primary p-1',
        )}
      >
        <Card className="overflow-hidden border-slate-200/80 shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 via-white to-indigo-50/60 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl tracking-tight text-slate-900">
                  <UsersRound className="h-5 w-5 text-orange-600" />
                  8A. {SECTION_8A.title}
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
                  onClick={addGroup}
                  className="rounded-xl"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add {SECTION_8A.itemLabel}
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
            const itemLabel = `${SECTION_8A.itemLabel} #${index + 1}`;
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

                  <VaultGroupCards
                    groups={SECTION_8A_GROUPS}
                    fieldMap={FIELD_MAP_8A}
                    renderField={fieldKey => (
                      <DynamicFormField
                        key={fieldKey}
                        field={FIELD_MAP_8A[fieldKey]}
                        value={group?.[fieldKey]}
                        formData={group}
                        onChange={value => updateGroup(index, fieldKey, value)}
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
