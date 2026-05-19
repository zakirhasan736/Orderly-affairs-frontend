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
} from 'lucide-react';
import { DynamicFormField } from '@/components/DynamicFormField';
import { Alert, AlertDescription } from '@/components/common/ui/alert';

import { autofillSectionFromDocument } from '@/services/aiAutofill';
import { uploadAIDocument } from '@/services/aiDocumentUpload';
import {
  applySection1AIPatch,
  applySection1SubsectionPatch,
} from '@/utils/applySection1AIPatch';

/* ------------------------------------------------------------------ */
/* CONFIG                                                              */
/* ------------------------------------------------------------------ */

const SECTION_1 = {
  vitalFields: [
    {
      key: 'vital_info_instructions',
      label: 'Essential Information Overview',
      type: 'Instructions',
      content:
        "This page contains the most essential information your next of kin may need when managing your estate or gaining access to your accounts. If you're not comfortable placing all this information in one place, that's okay. You can note where each piece can be found instead—just make sure your loved one knows how to locate it. Feel free to store this information in your encrypted USB drive.",
    },
    {
      key: 'personal_details_header',
      label: 'Personal Details',
      type: 'Instructions',
      content: '',
    },
    {
      key: 'full_legal_name',
      label: 'Full Legal Name (First, Middle, Last)',
      type: 'TextInput',
      helperText:
        'Your complete legal name as it appears on official documents',
    },
    {
      key: 'other_names',
      label: 'Any Other Names (Maiden, Nickname, etc.)',
      type: 'TextInput',
      helperText: 'Maiden name, nicknames, or other names you may be known by',
    },
    {
      key: 'date_of_birth',
      label: 'Date of Birth',
      type: 'DatePicker',
      helperText: 'Your date of birth',
    },
    {
      key: 'social_security_number',
      label:
        'Social Security Number (last 4 digits or location of your full SSN)',
      type: 'TextInput',
      helperText:
        'Last 4 digits of SSN or location where full SSN can be found',
    },
    {
      key: 'phone_device_header',
      label: 'Phone & Device Access',
      type: 'Instructions',
      content: '',
    },
    {
      key: 'phone_number',
      label: 'Phone Number',
      type: 'TextInput',
      helperText: 'Your primary phone number',
    },
    {
      key: 'phone_password',
      label: 'Phone Password or PIN',
      type: 'TextInput',
      inputType: 'password',
      helperText: 'Password or PIN to unlock your phone',
    },
    {
      key: 'voicemail_pin',
      label: 'Voicemail PIN (if different)',
      type: 'TextInput',
      helperText: 'PIN to access voicemail if different from phone PIN',
    },
    {
      key: 'computer_password',
      label: 'Computer or Laptop Password',
      type: 'TextInput',
      inputType: 'password',
      helperText: 'Password to access your computer or laptop',
    },
    {
      key: 'email_accounts_header',
      label: 'Email Accounts',
      type: 'Instructions',
      content: '',
    },
    {
      key: 'primary_email_username',
      label: 'Primary Email Username/Address',
      type: 'TextInput',
      helperText: 'Your main email address',
    },
    {
      key: 'primary_email_password',
      label: 'Primary Email Password',
      type: 'TextInput',
      inputType: 'password',
      helperText: 'Password for your main email account',
    },
    {
      key: 'secondary_email_username',
      label: 'Secondary Email Username/Address',
      type: 'TextInput',
      helperText: 'Secondary email address if applicable',
    },
    {
      key: 'secondary_email_password',
      label: 'Secondary Email Password',
      type: 'TextInput',
      inputType: 'password',
      helperText: 'Password for secondary email account if applicable',
    },
    {
      key: 'secure_locations_header',
      label: 'Secure Locations',
      type: 'Instructions',
      content: '',
    },
    {
      key: 'safe_code',
      label: 'Code to Safe (if applicable)',
      type: 'TextInput',
      helperText: 'Combination or code for your safe',
    },
    {
      key: 'safe_location',
      label: 'Location of Safe or Lockbox',
      type: 'TextInput',
      helperText: 'Where your safe or lockbox is located',
    },
    {
      key: 'safe_keys',
      label: 'Where to Find the Key(s)',
      type: 'TextInput',
      helperText: 'Location of keys for safe or lockbox',
    },
    {
      key: 'digital_ids_header',
      label: 'Digital IDs & Accounts',
      type: 'Instructions',
      content: '',
    },
    {
      key: 'google_id_username',
      label: 'Google ID Username/Email',
      type: 'TextInput',
      helperText: 'Your Google account email address',
    },
    {
      key: 'google_id_password',
      label: 'Google ID Password',
      type: 'TextInput',
      inputType: 'password',
      helperText: 'Password for your Google account',
    },
    {
      key: 'apple_id_username',
      label: 'Apple ID Username/Email',
      type: 'TextInput',
      helperText: 'Your Apple ID email address',
    },
    {
      key: 'apple_id_password',
      label: 'Apple ID Password',
      type: 'TextInput',
      inputType: 'password',
      helperText: 'Password for your Apple ID account',
    },
    {
      key: 'security_questions_header',
      label: 'Security Questions & PINs',
      type: 'Instructions',
      content:
        'If you use common answers to security questions, you can list them here or write: "See Password Manager" or "Ask [Name]."',
    },
    {
      key: 'security_question_answers',
      label: 'Common Security Question Answers',
      type: 'TextArea',
      helperText: 'Your standard answers to common security questions',
    },
    {
      key: 'frequent_pins',
      label: 'Frequently Used PINs (ATM, voicemail, garage)',
      type: 'TextArea',
      helperText: "List of commonly used PINs and what they're for",
    },
  ],

  contactGroups: [
    {
      key: 'next_of_kin',
      title: 'Next of Kin',
      fields: [
        {
          key: 'contact_name',
          label: 'Full Name',
          type: 'TextInput',
          helperText: 'Full legal name of your next of kin',
          required: true,
        },
        {
          key: 'relationship',
          label: 'Relationship',
          type: 'TextInput',
          helperText: 'e.g., Spouse, Child, Parent, Sibling',
          required: true,
        },
        {
          key: 'phone_number',
          label: 'Phone Number',
          type: 'TextInput',
          helperText: 'Primary phone number for this person',
          required: true,
        },
        {
          key: 'email_address',
          label: 'Email Address',
          type: 'TextInput',
          helperText: 'Email address for this person',
        },
        {
          key: 'mailing_address',
          label: 'Mailing Address',
          type: 'TextArea',
          helperText: 'Complete mailing address for this person',
          required: true,
        },
        {
          key: 'alternate_contact',
          label: 'Alternate Contact Method',
          type: 'TextInput',
          helperText: 'Secondary phone, work number, or other contact method',
        },
        {
          key: 'priority_level',
          label: 'Contact Priority',
          type: 'RadioGroup',
          options: [
            'Primary - Contact First',
            'Secondary - Contact if Primary Unavailable',
            'Emergency Only',
          ],
          helperText: 'When should this person be contacted?',
        },
        {
          key: 'special_instructions',
          label: 'Special Instructions',
          type: 'TextArea',
          helperText:
            'Any specific instructions about contacting this person or their role',
        },
      ],
    },
    {
      key: 'executor_trustee',
      title: 'Executor / Trustee',
      fields: [
        {
          key: 'contact_name',
          label: 'Full Name',
          type: 'TextInput',
          helperText: 'Full legal name of your executor or trustee',
          required: true,
        },
        {
          key: 'role_title',
          label: 'Role',
          type: 'RadioGroup',
          options: [
            'Executor',
            'Trustee',
            'Co-Executor',
            'Co-Trustee',
            'Alternate Executor',
            'Alternate Trustee',
          ],
          helperText: 'What is their official role?',
          required: true,
        },
        {
          key: 'relationship',
          label: 'Relationship',
          type: 'TextInput',
          helperText:
            'e.g., Family Member, Attorney, Friend, Professional Fiduciary',
        },
        {
          key: 'phone_number',
          label: 'Phone Number',
          type: 'TextInput',
          helperText: 'Primary phone number for this person',
          required: true,
        },
        {
          key: 'email_address',
          label: 'Email Address',
          type: 'TextInput',
          helperText: 'Email address for this person',
        },
        {
          key: 'company_organization',
          label: 'Company/Organization',
          type: 'TextInput',
          helperText: 'Law firm, bank, or organization they represent',
        },
        {
          key: 'mailing_address',
          label: 'Mailing Address',
          type: 'TextArea',
          helperText: 'Complete mailing address for this person',
          required: true,
        },
        {
          key: 'services_provided',
          label: 'Services/Responsibilities',
          type: 'TextArea',
          helperText:
            'What services they provide or their specific responsibilities',
        },
        {
          key: 'special_instructions',
          label: 'Special Instructions',
          type: 'TextArea',
          helperText:
            'Any specific instructions about working with this person',
        },
        {
          key: 'contact_documents',
          label: 'Related Documents',
          type: 'TextInputWithUpload',
          helperText:
            'Upload appointment letters, business cards, or other relevant documents',
        },
      ],
    },
    {
      key: 'additional_contacts',
      title: 'Additional Important Contacts',
      fields: [
        {
          key: 'contact_name',
          label: 'Name',
          type: 'TextInput',
          helperText: 'Full name of the contact person',
          required: true,
        },
        {
          key: 'role_title',
          label: 'Role/Title',
          type: 'TextInput',
          helperText:
            'e.g., Attorney, CPA, Funeral Director, Financial Advisor',
          required: true,
        },
        {
          key: 'relationship',
          label: 'Relationship',
          type: 'TextInput',
          helperText:
            'How this person relates to you: professional, family, friend, etc.',
        },
        {
          key: 'phone_number',
          label: 'Phone Number',
          type: 'TextInput',
          helperText: 'Primary phone number for this contact',
        },
        {
          key: 'email_address',
          label: 'Email Address',
          type: 'TextInput',
          helperText: 'Email address for this contact',
        },
        {
          key: 'company_organization',
          label: 'Company/Organization',
          type: 'TextInput',
          helperText: 'Name of their company, firm, or organization',
        },
        {
          key: 'mailing_address',
          label: 'Mailing Address',
          type: 'TextArea',
          helperText: 'Complete mailing address for this contact',
        },
        {
          key: 'priority_level',
          label: 'Priority Level',
          type: 'RadioGroup',
          options: [
            'High - Must Contact Immediately',
            'Medium - Contact Within a Week',
            'Low - Contact When Convenient',
            'Notify Only - For Information',
          ],
          helperText:
            'How urgently should your next of kin contact this person?',
        },
        {
          key: 'services_provided',
          label: 'Services Provided',
          type: 'TextArea',
          helperText:
            "What services they provide or why they're important to contact",
        },
        {
          key: 'special_instructions',
          label: 'Special Instructions',
          type: 'TextArea',
          helperText:
            'Any specific instructions about contacting this person or using their services',
        },
        {
          key: 'contact_documents',
          label: 'Related Documents or Business Cards',
          type: 'TextInputWithUpload',
          helperText:
            'Upload business cards, contracts, or other relevant documents for this contact',
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* TYPES                                                              */
/* ------------------------------------------------------------------ */

type Section1Subsection =
  | 'vital_info'
  | 'next_of_kin'
  | 'executor_trustee'
  | 'additional_contacts';

type ContactSubsection = Exclude<Section1Subsection, 'vital_info'>;

type UploadScope = 'full' | 'vital_info' | `${ContactSubsection}:${number}`;

type UploadedAIFile = {
  file_id: string;
  mime_type: string;
  expires_at?: string;
};

type ContactAutofillTarget = {
  groupKey: ContactSubsection;
  index: number;
  label: string;
};

type NormalizedActiveSubsection = Section1Subsection | 'contacts' | null;

interface Props {
  data?: any;
  onChange?: (data: any) => void;

  /**
   * Dashboard may pass "1A" / "1C".
   * This component also supports direct keys:
   * "vital_info", "next_of_kin", "executor_trustee", "additional_contacts".
   */
  activeSubsection?: string | null;

  /**
   * Optional old parent-level document support.
   * You can leave these unused from Dashboard.
   */
  selectedDocumentUrl?: string | null;
  selectedDocumentMimeType?: string | null;
}

const ALLOWED_UPLOAD_TYPES = [
  'application/pdf',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
];

const MAX_UPLOAD_SIZE = 15 * 1024 * 1024;

const normalizeActiveSubsection = (
  activeSubsection?: string | null,
): NormalizedActiveSubsection => {
  if (!activeSubsection) return null;

  if (activeSubsection === '1A') return 'vital_info';

  if (activeSubsection === '1B' || activeSubsection === '1C') {
    return 'contacts';
  }

  if (
    activeSubsection === 'vital_info' ||
    activeSubsection === 'next_of_kin' ||
    activeSubsection === 'executor_trustee' ||
    activeSubsection === 'additional_contacts'
  ) {
    return activeSubsection;
  }

  return null;
};

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

export default function Section1VitalInformation({
  data = {},
  onChange = () => {},
  activeSubsection = null,
  // selectedDocumentUrl: selectedDocumentUrlFromParent = null,
  // selectedDocumentMimeType: selectedDocumentMimeTypeFromParent = null,
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
  vital_info: null,
});

  const active = normalizeActiveSubsection(activeSubsection);
  const vitalInfo = data.vital_info || {};

  const showVitalInfo = !active || active === 'vital_info';

  const contactGroupsToRender =
    !active || active === 'contacts'
      ? SECTION_1.contactGroups
      : SECTION_1.contactGroups.filter(group => group.key === active);

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const getUploadedFileForScope = (scope: UploadScope) => {
    return uploadedFiles[scope] || null;
  };

  const updateVital = (key: string, value: any) => {
    onChange({
      ...data,
      vital_info: {
        ...vitalInfo,
        [key]: value,
      },
    });
  };

  const getGroupArray = (key: string) => {
    return Array.isArray(data[key]) ? data[key] : [];
  };

  const updateGroup = (key: string, value: any[]) => {
    onChange({
      ...data,
      [key]: value,
    });
  };

  const addGroupItem = (groupKey: string, fields: any[]) => {
    const newItem = Object.fromEntries(fields.map(field => [field.key, '']));

    updateGroup(groupKey, [...getGroupArray(groupKey), newItem]);
  };

  const updateGroupItem = (
    groupKey: string,
    index: number,
    fieldKey: string,
    value: any,
  ) => {
    const items = [...getGroupArray(groupKey)];

    items[index] = {
      ...(items[index] || {}),
      [fieldKey]: value,
    };

    updateGroup(groupKey, items);
  };

  const removeGroupItem = (groupKey: string, index: number) => {
    updateGroup(
      groupKey,
      getGroupArray(groupKey).filter((_: any, itemIndex: number) => {
        return itemIndex !== index;
      }),
    );
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

  const extractSingleContactPatch = (
    patch: any,
    groupKey: ContactSubsection,
  ) => {
    const groupPatch = patch?.[groupKey];

    if (Array.isArray(groupPatch)) {
      return cleanPatchObject(groupPatch[0] || {});
    }

    if (groupPatch && typeof groupPatch === 'object') {
      return cleanPatchObject(groupPatch);
    }

    return {};
  };

  const applyContactItemPatch = (
    groupKey: ContactSubsection,
    index: number,
    itemPatch: any,
  ) => {
    const items = [...getGroupArray(groupKey)];

    items[index] = {
      ...(items[index] || {}),
      ...itemPatch,
    };

    updateGroup(groupKey, items);
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
    contactTarget?: ContactAutofillTarget,
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

      const subsection =
        scope === 'full'
          ? null
          : contactTarget
            ? contactTarget.groupKey
            : 'vital_info';

      const json = await autofillSectionFromDocument({
        section: 'vital_information',
        file_id: uploadedFile.file_id,
        subsection,
      });

      const patch = json?.result?.patch ?? {};

      if (contactTarget) {
        const itemPatch = extractSingleContactPatch(
          patch,
          contactTarget.groupKey,
        );

        if (Object.keys(itemPatch).length === 0) {
          setAiError('AI could not find contact information in this document.');
          return;
        }

        applyContactItemPatch(
          contactTarget.groupKey,
          contactTarget.index,
          itemPatch,
        );

        setAiNotice(
          `AI filled ${contactTarget.label}. Please review the fields.`,
        );

        return;
      }

      const nextData =
        subsection === 'vital_info'
          ? applySection1SubsectionPatch(data, 'vital_info', patch)
          : applySection1AIPatch(data, patch);

      onChange(nextData);

      setAiNotice(
        subsection === 'vital_info'
          ? 'AI filled 1A Vital Information. Please review the fields.'
          : 'AI filled Section 1. Please review all fields.',
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
          'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40',
          'p-4 shadow-sm transition-all duration-200',
          'hover:border-indigo-300 hover:shadow-md',
          compact ? 'space-y-3' : 'space-y-4',
        ].join(' ')}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-100/60 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-cyan-100/60 blur-2xl" />

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
                Click to upload PDF, TXT, PNG, JPG, JPEG, or WEBP
              </p>
              <p className="text-xs text-slate-500">Maximum file size 15MB</p>
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

      <Card className="overflow-hidden hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-indigo-50/60">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            AI Autofill
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5">
          {renderUploader({
            scope: 'full',
            title: 'Upload one document for full Section 1',
            description:
              'Use this only when one document contains information for all Section 1 areas. It can fill vital information and all contact groups together.',
            buttonLabel: 'Auto-fill Section 1',
            onAutofill: () => handleAutofill('full'),
          })}
        </CardContent>
      </Card>

      {showVitalInfo && (
        <Card id="subsection-1A" className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>1A. Vital Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {renderUploader({
              scope: 'vital_info',
              title: 'Upload document for 1A Vital Information',
              description:
                'Use this for personal details, phone/device access, email accounts, safe/lockbox details, digital IDs, security answers, or PIN notes.',
              buttonLabel: 'Auto-fill 1A',
              onAutofill: () => handleAutofill('vital_info'),
            })}

            {SECTION_1.vitalFields.map((field: any) => (
              <DynamicFormField
                key={field.key}
                field={field}
                value={vitalInfo[field.key]}
                onChange={(value: any) => updateVital(field.key, value)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {contactGroupsToRender.length > 0 && (
        <Card id="subsection-1C" className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>1C. Key Contacts</CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            {contactGroupsToRender.map((group: any) => {
              const items = getGroupArray(group.key);
              const groupKey = group.key as ContactSubsection;

              return (
                <div key={group.key} className="space-y-4">
                  <div className="flex flex-col gap-3 rounded-2xl border bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {group.title}
                      </h3>
                      <p className="text-sm text-slate-500">
                        Add one form per person/contact. Each form can upload
                        its own document and autofill only that form.
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addGroupItem(group.key, group.fields)}
                      className="rounded-xl"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add {group.title}
                    </Button>
                  </div>

                  {items.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                        <Plus className="h-5 w-5 text-slate-500" />
                      </div>
                      <p className="font-medium text-slate-800">
                        No {group.title.toLowerCase()} form added yet.
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Click “Add {group.title}” first, then upload a document
                        inside that specific form to autofill it.
                      </p>
                    </div>
                  )}

                  {items.map((item: any, index: number) => {
                    const itemScope = `${groupKey}:${index}` as UploadScope;
                    const itemLabel = `${group.title} #${index + 1}`;

                    return (
                      <Card
                        key={`${group.key}-${index}`}
                        className="overflow-hidden border-slate-200 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 border-b bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <strong className="text-slate-900">
                              {itemLabel}
                            </strong>
                            <p className="text-sm text-slate-500">
                              Upload a document here to autofill only this form.
                            </p>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => removeGroupItem(group.key, index)}
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
                            description: `This will autofill only ${itemLabel}. It will not overwrite other ${group.title.toLowerCase()} forms.`,
                            buttonLabel: `Auto-fill ${itemLabel}`,
                            compact: true,
                            onAutofill: () =>
                              handleAutofill(itemScope, {
                                groupKey,
                                index,
                                label: itemLabel,
                              }),
                          })}

                          <div className="grid gap-4 md:grid-cols-2">
                            {group.fields.map((field: any) => (
                              <DynamicFormField
                                key={field.key}
                                field={field}
                                value={item?.[field.key]}
                                onChange={(value: any) =>
                                  updateGroupItem(
                                    group.key,
                                    index,
                                    field.key,
                                    value,
                                  )
                                }
                              />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
