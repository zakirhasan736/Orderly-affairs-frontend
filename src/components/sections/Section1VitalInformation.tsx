'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  UserCircle,
  Smartphone,
  Mail,
  LockKeyhole,
  Globe,
  ShieldCheck,
  Info,
  IdCard,
} from 'lucide-react';
import { cn } from '@common/ui/utils';
import { DynamicFormField } from '@/components/DynamicFormField';
import { Alert, AlertDescription } from '@/components/common/ui/alert';
import {
  getTopicCardProps,
  useScrollToVaultTopic,
} from '@/utils/vaultTopicNavigation';

import { releaseDeferredAiRoutingDialog, runAiSectionAutofill } from '@/services/aiSectionAutofill';
import {
  createEmptyItemFromFields,
  mergeAiPatchWithDefaults,
  unwrapAiAutofillPatch,
  aiPatchHasValues,
} from '@/utils/aiPatchNormalizer';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import {
  resolveAiUploadedFileForScope,
  useRestoreAiPendingUploadForSection,
} from '@/hooks/useAiUploadedFileResolver';
import { uploadAIDocument } from '@/services/aiDocumentUpload';
import {
  buildUploadedAiFile,
  validateAiDocumentFile,
} from '@/utils/aiDocumentUploadUi';
import { AiDocumentDropZoneInput } from '@/components/ai/AiDocumentDropZoneInput';
import { AI_PENDING_ROUTED_HINT } from '@/utils/aiRoutingUi';
import {
  applySection1AIPatch,
  applySection1SubsectionPatch,
} from '@/utils/applySection1AIPatch';
import { IdentityDocumentCards } from '@/components/IdentityDocumentCards';
import { identityDocumentCardLabel } from '@/utils/identityDocumentFields';
import {
  listUnseenNewFills,
  NEW_FILLS_CHANGED,
  recordNewFill,
} from '@/utils/newFillMarkers';

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
      inputType: 'password',
      helperText:
        'Last 4 digits of SSN or location where full SSN can be found',
    },
    {
      key: 'drivers_license_header',
      label: "Driver's License / State ID",
      type: 'Instructions',
      content: '',
    },
    {
      key: 'drivers_license_number',
      label: "Driver's License Number (DL #)",
      type: 'TextInput',
      helperText: 'License or state ID number as printed on the card',
    },
    {
      key: 'drivers_license_dd_number',
      label: 'DD / Audit Number',
      type: 'TextInput',
      helperText:
        'Document discriminator / audit number (often labeled DD on Texas licenses)',
    },
    {
      key: 'drivers_license_class',
      label: 'License Class',
      type: 'TextInput',
      helperText: 'e.g. Class C, A, B, or M',
    },
    {
      key: 'drivers_license_issue_date',
      label: 'Issue Date',
      type: 'DatePicker',
      helperText: 'Date the license was issued (ISS)',
    },
    {
      key: 'drivers_license_expiration_date',
      label: 'Expiration Date',
      type: 'DatePicker',
      helperText: 'Date the license expires (EXP)',
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

const VITAL_FIELD_MAP = Object.fromEntries(
  SECTION_1.vitalFields.map(field => [field.key, field]),
);

type VitalInfoGroup = {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  iconWrap: string;
  layout: 'grid' | 'pairs' | 'stack';
  fieldKeys?: string[];
  pairs?: Array<{ label: string; keys: [string, string] }>;
};

const VITAL_INFO_GROUPS: VitalInfoGroup[] = [
  {
    key: 'personal',
    title: 'Personal Details',
    subtitle: 'Legal identity your family may need first',
    icon: UserCircle,
    accent: 'from-blue-500/[0.07] to-indigo-500/[0.03]',
    iconWrap: 'bg-blue-500/10 text-blue-600',
    layout: 'grid',
    fieldKeys: [
      'full_legal_name',
      'other_names',
      'date_of_birth',
      'social_security_number',
    ],
  },
  {
    key: 'drivers_license',
    title: "Driver's License / State ID",
    subtitle: 'Numbers and dates printed on your license or ID',
    icon: IdCard,
    accent: 'from-sky-500/[0.07] to-blue-500/[0.03]',
    iconWrap: 'bg-sky-500/10 text-sky-700',
    layout: 'grid',
    fieldKeys: [
      'drivers_license_number',
      'drivers_license_dd_number',
      'drivers_license_class',
      'drivers_license_issue_date',
      'drivers_license_expiration_date',
    ],
  },
  {
    key: 'phone_device',
    title: 'Phone & Device Access',
    subtitle: 'Unlock phones, voicemail, and computers',
    icon: Smartphone,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'grid',
    fieldKeys: [
      'phone_number',
      'phone_password',
      'voicemail_pin',
      'computer_password',
    ],
  },
  {
    key: 'email',
    title: 'Email Accounts',
    subtitle: 'Primary and backup email credentials',
    icon: Mail,
    accent: 'from-cyan-500/[0.07] to-sky-500/[0.03]',
    iconWrap: 'bg-cyan-500/10 text-cyan-700',
    layout: 'pairs',
    pairs: [
      {
        label: 'Primary Email',
        keys: ['primary_email_username', 'primary_email_password'],
      },
      {
        label: 'Secondary Email',
        keys: ['secondary_email_username', 'secondary_email_password'],
      },
    ],
  },
  {
    key: 'secure_locations',
    title: 'Secure Locations',
    subtitle: 'Safes, lockboxes, and where to find keys',
    icon: LockKeyhole,
    accent: 'from-amber-500/[0.07] to-orange-500/[0.03]',
    iconWrap: 'bg-amber-500/10 text-amber-700',
    layout: 'grid',
    fieldKeys: ['safe_code', 'safe_location', 'safe_keys'],
  },
  {
    key: 'digital_ids',
    title: 'Digital IDs & Accounts',
    subtitle: 'Google, Apple, and other core sign-ins',
    icon: Globe,
    accent: 'from-emerald-500/[0.07] to-teal-500/[0.03]',
    iconWrap: 'bg-emerald-500/10 text-emerald-700',
    layout: 'pairs',
    pairs: [
      {
        label: 'Google ID',
        keys: ['google_id_username', 'google_id_password'],
      },
      {
        label: 'Apple ID',
        keys: ['apple_id_username', 'apple_id_password'],
      },
    ],
  },
  {
    key: 'security',
    title: 'Security Questions & PINs',
    subtitle: 'Shared answers and frequently used PINs',
    icon: ShieldCheck,
    accent: 'from-rose-500/[0.07] to-pink-500/[0.03]',
    iconWrap: 'bg-rose-500/10 text-rose-700',
    layout: 'stack',
    fieldKeys: ['security_question_answers', 'frequent_pins'],
  },
];

/* ------------------------------------------------------------------ */
/* TYPES                                                              */
/* ------------------------------------------------------------------ */

type Section1Subsection =
  | 'vital_info'
  | 'executor_trustee'
  | 'additional_contacts';

type ContactSubsection = Exclude<Section1Subsection, 'vital_info'>;

type UploadScope = 'full' | 'vital_info' | `${ContactSubsection}:${number}`;

type UploadedAIFile = {
  file_id: string;
  mime_type: string;
  expires_at?: string;
  file_name?: string;
  uploaded_at?: number;
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
   * Dashboard may pass "1A" / "1B" (legacy "1C" still accepted).
   * This component also supports direct keys:
   * "vital_info", "executor_trustee", "additional_contacts".
   */
  activeSubsection?: string | null;
  activeTopicId?: string | null;

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

  if (
    activeSubsection === '1B' ||
    activeSubsection === '1C' ||
    activeSubsection === 'next_of_kin'
  ) {
    return 'contacts';
  }

  if (
    activeSubsection === 'vital_info' ||
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
  activeTopicId = null,
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

  const latestUploadRef = useRef<Record<string, UploadedAIFile>>({});

  const aiRouting = useOptionalAiDocumentRouting();

  const [newFills, setNewFills] = useState(() => listUnseenNewFills());
  useEffect(() => {
    const refresh = () => setNewFills(listUnseenNewFills());
    window.addEventListener(NEW_FILLS_CHANGED, refresh);
    return () => window.removeEventListener(NEW_FILLS_CHANGED, refresh);
  }, []);

  useRestoreAiPendingUploadForSection({
    sectionId: '1',
    setUploadedFiles,
    latestUploadRef,
  });

  const active = normalizeActiveSubsection(activeSubsection);
  const vitalInfo = data.vital_info || {};
  const identityDocuments = Array.isArray(data.identity_documents)
    ? data.identity_documents
    : [];

  const showVitalInfo = !active || active === 'vital_info';

  const contactGroupsToRender =
    !active || active === 'contacts'
      ? SECTION_1.contactGroups
      : SECTION_1.contactGroups.filter(group => group.key === active);

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const getUploadedFileForScope = (scope: UploadScope) => {
    const pendingFile =
      aiRouting?.getPendingFileForSection('1', String(scope)) ?? null;

    return resolveAiUploadedFileForScope(scope, uploadedFiles, latestUploadRef, pendingFile);
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

  const contactTopicWatchKey =
    identityDocuments.length +
    getGroupArray('executor_trustee').length +
    getGroupArray('additional_contacts').length;

  useScrollToVaultTopic(activeTopicId, contactTopicWatchKey);

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

  const getContactItemLabel = (
    group: (typeof SECTION_1.contactGroups)[number],
    item: Record<string, unknown>,
    index: number,
  ) => {
    const labelFields = ['contact_name', 'role_title'];

    const detail = labelFields
      .map(field => String(item?.[field] ?? '').trim())
      .filter(Boolean)
      .join(' · ');

    if (detail) {
      return `${group.title} · ${detail}`;
    }

    return `${group.title} #${index + 1}`;
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

  const handleDocumentUpload = async (file?: File | null,
    scope: UploadScope = 'full',
    runAutofill?: () => void | Promise<void>,
  ) => {
    try {
      if (!file) return;

      setAiError('');
      setAiNotice('');

            const validationError = validateAiDocumentFile(file);
      if (validationError) {
        setAiError(validationError);
        return;
      }

      setUploadingScope(scope as UploadScope);

      const uploaded = await uploadAIDocument(file, { section: '1' });

      const uploadedRecord: UploadedAIFile = buildUploadedAiFile(uploaded, file, {
        sectionId: '1',
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

      const json = await runAiSectionAutofill({
        sectionKey: 'vital_information',
        sectionId: '1',
        file_id: uploadedFile.file_id,
        subsection,
        uploadScope: String(scope),
        aiRouting,
        });

      if (!json) return;

      if ((json as { identity_skipped?: boolean }).identity_skipped) {
        setAiNotice(
          'Skipped this ID fill. Upload again if you want to choose where it belongs.',
        );
        return;
      }

      if ((json as { identity_routed?: boolean }).identity_routed) {
        setAiNotice(
          json.document_summary ||
            'Saved this ID under Legal Documents (family identity) instead of Vital Information.',
        );
        return;
      }

      const patch = unwrapAiAutofillPatch(json?.result);

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

      if (!aiPatchHasValues(patch)) {
        setAiError(
          'AI read the document but found no fillable fields for this section. Try a clearer document or another section.',
        );
        return;
      }

      const nextData =
        subsection === 'vital_info'
          ? applySection1SubsectionPatch(data, 'vital_info', patch)
          : applySection1AIPatch(data, patch);

      onChange(nextData);

      const identityCards = Array.isArray(nextData?.identity_documents)
        ? nextData.identity_documents
        : [];
      const priorCount = Array.isArray(data?.identity_documents)
        ? data.identity_documents.length
        : 0;
      identityCards.slice(priorCount).forEach((card: Record<string, unknown>, offset: number) => {
        const index = priorCount + offset;
        recordNewFill({
          sectionId: '1',
          subsectionId: '1A',
          topicGroupKey: 'identity_documents',
          index,
          label: identityDocumentCardLabel(card, index, 'owner'),
        });
      });

      setAiNotice(
        subsection === 'vital_info'
          ? 'AI filled 1A Vital Information. Please review the fields.'
          : 'AI filled Section 1. Please review all fields.',
      );
    } catch (err: any) {
      setAiError(err?.message || 'AI autofill failed');
    } finally {
      setAiLoadingScope(null);
      releaseDeferredAiRoutingDialog(aiRouting);
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
    const highlightUpload =
      aiRouting?.shouldHighlightUpload('1', String(scope)) ?? false;

    return (
      <div
        data-ai-upload-zone={highlightUpload ? 'highlight' : undefined}
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

        {highlightUpload && (
          <div className="relative rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
            {AI_PENDING_ROUTED_HINT}
          </div>
        )}

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
            data-ai-autofill-trigger
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
          <AiDocumentDropZoneInput
            onFile={uploaded => handleDocumentUpload(uploaded, scope, onAutofill)}
            disabled={isAnyAIActionRunning}
            showSupportedHint
            sectionId="1"
            className={[
              'group flex cursor-pointer flex-col items-center justify-center gap-2',
              'rounded-xl border border-slate-200 bg-white/80 px-4 py-3.5 text-center',
              'transition hover:border-indigo-300 hover:bg-indigo-50/50',
              compact
                ? 'md:flex-row md:justify-start md:py-3 md:text-left'
                : '',
              isAnyAIActionRunning ? 'pointer-events-none opacity-60' : '',
            ].join(' ')}
            iconClassName="text-slate-500 group-hover:text-indigo-600"
            uploadTitle="Drag and drop or click to upload PDF, TXT, PNG, JPG, JPEG, or WEBP"
            uploadSubtitle="Maximum file size 15MB"
          />
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

  const renderVitalField = (fieldKey: string) => {
    const field = VITAL_FIELD_MAP[fieldKey];
    if (!field) return null;

    const rawValue = vitalInfo[field.key];
    let safeValue: any = rawValue;
    if (
      rawValue !== null &&
      rawValue !== undefined &&
      typeof rawValue === 'object' &&
      !Array.isArray(rawValue) &&
      !('files' in rawValue) &&
      !('text' in rawValue)
    ) {
      const record = rawValue as Record<string, unknown>;
      safeValue =
        record.label ??
        record.name ??
        record.value ??
        record.text ??
        record.title ??
        '';
    }

    if (
      field.type === 'Dropdown' &&
      Array.isArray((field as { options?: string[] }).options) &&
      safeValue &&
      !(field as { options?: string[] }).options!.includes(String(safeValue))
    ) {
      // Keep value visible but avoid Radix Select crash on unknown option
      safeValue = String(safeValue);
    }

    return (
      <DynamicFormField
        key={field.key}
        field={field}
        value={safeValue ?? ''}
        onChange={(value: any) => updateVital(field.key, value)}
        className="space-y-2"
      />
    );
  };

  const renderVitalGroupFields = (group: VitalInfoGroup) => {
    if (group.layout === 'pairs' && group.pairs) {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          {group.pairs.map(pair => (
            <div
              key={pair.label}
              className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm"
            >
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {pair.label}
              </p>
              <div className="space-y-4">{pair.keys.map(renderVitalField)}</div>
            </div>
          ))}
        </div>
      );
    }

    if (group.layout === 'stack' && group.fieldKeys) {
      return (
        <div className="space-y-4">{group.fieldKeys.map(renderVitalField)}</div>
      );
    }

    const fullWidthFields = new Set([
      'full_legal_name',
      'social_security_number',
      'safe_location',
    ]);

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {group.fieldKeys?.map(fieldKey => (
          <div
            key={fieldKey}
            className={cn(
              fullWidthFields.has(fieldKey) && 'md:col-span-2',
            )}
          >
            {renderVitalField(fieldKey)}
          </div>
        ))}
      </div>
    );
  };

  const overviewField = VITAL_FIELD_MAP.vital_info_instructions;

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
            title: 'Auto-fill all of Section 1 from one document',
            description:
              'Best when one file covers the whole section (vital information and all contact groups). This fills every subsection in Section 1 at once.',
            buttonLabel: 'Auto-fill entire Section 1',
            onAutofill: () => handleAutofill('full'),
          })}
        </CardContent>
      </Card>

      {showVitalInfo && (
        <Card
          id="subsection-1A"
          className="overflow-hidden border-slate-200/80 shadow-sm"
        >
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 via-white to-indigo-50/60 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl tracking-tight text-slate-900">
                  Vital Information
                </CardTitle>
                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  Grouped essentials so you can fill personal, device, email, and
                  security details without scrolling through one long form.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 self-start rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                AES-256-GCM encrypted at rest
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.05),transparent_36%)] p-4 sm:p-6">
            {overviewField?.content && (
              <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <Info className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {overviewField.label}
                  </p>
                  <p className="text-sm leading-6 text-slate-600">
                    {overviewField.content}
                  </p>
                </div>
              </div>
            )}

            {renderUploader({
              scope: 'vital_info',
              title: 'Auto-fill Vital Information only',
              description:
                'Use this for documents that cover just this subsection — personal details, device access, email accounts, safe locations, digital IDs, and security notes. It does not fill other contact groups.',
              buttonLabel: 'Auto-fill Vital Information (1A only)',
              onAutofill: () => handleAutofill('vital_info'),
            })}

            <div className="grid gap-5 xl:grid-cols-2">
              {VITAL_INFO_GROUPS.map(group => {
                const Icon = group.icon;

                return (
                  <section
                    key={group.key}
                    className={cn(
                      'overflow-hidden rounded-[24px] border border-slate-200/80 bg-gradient-to-br shadow-sm',
                      group.accent,
                      group.layout === 'stack' && 'xl:col-span-2',
                    )}
                  >
                    <div className="border-b border-white/60 bg-white/50 px-5 py-4 backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                            group.iconWrap,
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-slate-900">
                            {group.title}
                          </h3>
                          <p className="mt-0.5 text-sm text-slate-600">
                            {group.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="px-3 py-5">{renderVitalGroupFields(group)}</div>
                  </section>
                );
              })}
            </div>

            <div className="xl:col-span-2">
              <IdentityDocumentCards
                mode="owner"
                items={identityDocuments}
                onChange={next =>
                  onChange({ ...data, identity_documents: next })
                }
                subsectionId="1A"
                topicGroupKey="identity_documents"
                activeTopicId={activeTopicId}
                sectionId="1"
                newFills={newFills}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {contactGroupsToRender.length > 0 && (
        <Card id="subsection-1B" className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Key Contacts</CardTitle>
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
                      data-ai-autofill-trigger
                      onClick={() => addGroupItem(group.key, group.fields)}
                      className="rounded-xl"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                  </div>

                  {items.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-center text-sm text-slate-500">
                      None added yet — tap <span className="font-semibold text-slate-700">Add</span>, then upload a document inside that form.
                    </div>
                  )}

                  {items.map((item: any, index: number) => {
                    const itemScope = `${groupKey}:${index}` as UploadScope;
                    const itemLabel = getContactItemLabel(group, item, index);
                    const topicProps = getTopicCardProps(
                      '1B',
                      index,
                      activeTopicId,
                      groupKey,
                    );

                    return (
                      <Card
                        key={`${group.key}-${index}`}
                        id={topicProps.id}
                        className={topicProps.className}
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
