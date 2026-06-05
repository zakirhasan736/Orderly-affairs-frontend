'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/common/ui/card';
import { DynamicFormField } from '@/components/DynamicFormField';
import { Button } from '@/components/common/ui/button';
import { Alert, AlertDescription } from '@/components/common/ui/alert';
import {
  CheckCircle2,
  FileText,
  HeartHandshake,
  Loader2,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react';

import { autofillSectionFromDocument } from '@/services/aiAutofill';
import { uploadAIDocument } from '@/services/aiDocumentUpload';

/* ============================================================
   FIELD CONFIGS (STATIC)
============================================================ */

const SECTION_21A_FIELDS = [
  {
    key: 'estate_planning_instructions',
    label: 'Estate Planning Overview',
    type: 'Instructions',
    content:
      'Document your estate planning documents and end-of-life wishes to ensure your loved ones can honor your intentions and manage your affairs properly. This section helps organize critical legal documents including wills, trusts, powers of attorney, and healthcare directives, along with your personal wishes for ceremonies and final arrangements.',
  },
  {
    key: 'will_testament_header',
    label: 'Will & Testament',
    type: 'Instructions',
    content: 'Your will is the foundational document for estate planning',
  },
  {
    key: 'will_location',
    label: 'Will Location',
    type: 'TextInputWithUpload',
    helperText:
      'Where your original will is stored and upload a copy if desired',
  },
  {
    key: 'will_date',
    label: 'Will Date',
    type: 'DatePicker',
    helperText: 'Date your current will was signed',
  },
  {
    key: 'executor_info',
    label: 'Executor Information',
    type: 'TextArea',
    helperText: 'Name and contact information of your executor(s)',
  },
  {
    key: 'alternate_executor',
    label: 'Alternate Executor',
    type: 'TextArea',
    helperText: 'Name and contact information of alternate executor',
  },
  {
    key: 'will_attorney',
    label: 'Estate Attorney',
    type: 'TextInputWithUpload',
    helperText: 'Contact information for the attorney who prepared your will',
  },
  {
    key: 'trust_documents_header',
    label: 'Trust Documents',
    type: 'Instructions',
    content: 'If you have established any trusts as part of your estate plan',
  },
  {
    key: 'trust_info',
    label: 'Trust Information',
    type: 'TextInputWithUpload',
    helperText:
      'Upload trust documents or note their location, include trust names and types',
  },
  {
    key: 'trustee_info',
    label: 'Trustee Information',
    type: 'TextArea',
    helperText: 'Names and contact information of current trustees',
  },
  {
    key: 'successor_trustee',
    label: 'Successor Trustee',
    type: 'TextArea',
    helperText: 'Names and contact information of successor trustees',
  },
  {
    key: 'trust_attorney',
    label: 'Trust Attorney',
    type: 'TextInputWithUpload',
    helperText: 'Contact information for attorney who prepared trust documents',
  },
  {
    key: 'power_of_attorney_header',
    label: 'Powers of Attorney',
    type: 'Instructions',
    content: 'Documents that allow others to act on your behalf',
  },
  {
    key: 'financial_poa',
    label: 'Financial Power of Attorney',
    type: 'TextInputWithUpload',
    helperText:
      "Upload financial POA or note location, include agent's contact information",
  },
  {
    key: 'medical_poa',
    label: 'Medical Power of Attorney',
    type: 'TextInputWithUpload',
    helperText:
      "Upload medical POA or note location, include agent's contact information",
  },
  {
    key: 'healthcare_directives_header',
    label: 'Healthcare Directives',
    type: 'Instructions',
    content: 'Documents expressing your healthcare wishes',
  },
  {
    key: 'living_will',
    label: 'Living Will/Advance Directive',
    type: 'TextInputWithUpload',
    helperText: 'Upload living will or advance directive documents',
  },
  {
    key: 'dnr_orders',
    label: 'DNR Orders',
    type: 'TextInputWithUpload',
    helperText: 'Do Not Resuscitate orders or similar medical directives',
  },
  {
    key: 'organ_donation',
    label: 'Organ Donation Instructions',
    type: 'TextArea',
    helperText: 'Your wishes regarding organ and tissue donation',
  },
  {
    key: 'beneficiary_info_header',
    label: 'Beneficiary Information',
    type: 'Instructions',
    content: 'Summary of your major beneficiaries and inheritance instructions',
  },
  {
    key: 'primary_beneficiaries',
    label: 'Primary Beneficiaries',
    type: 'TextArea',
    helperText: 'Names and contact information of your primary beneficiaries',
  },
  {
    key: 'contingent_beneficiaries',
    label: 'Contingent Beneficiaries',
    type: 'TextArea',
    helperText:
      'Names and contact information of contingent/alternate beneficiaries',
  },
  {
    key: 'special_bequests',
    label: 'Special Bequests',
    type: 'TextArea',
    helperText: 'Specific items or amounts left to particular people',
  },
  {
    key: 'charitable_bequests',
    label: 'Charitable Bequests',
    type: 'TextArea',
    helperText: 'Donations or bequests to charitable organizations',
  },
];

const SECTION_21B_FIELDS = [
  {
    key: 'final_arrangements_instructions',
    label: 'Final Arrangements Overview',
    type: 'Instructions',
    content:
      'Having this information organized will provide peace of mind and clear guidance for your family during difficult times. These are your personal wishes and preferences for your final arrangements.',
  },
  {
    key: 'funeral_preferences_header',
    label: 'Funeral/Memorial Preferences',
    type: 'Instructions',
    content: 'Your preferences for funeral or memorial services',
  },
  {
    key: 'funeral_type',
    label: 'Type of Service',
    type: 'RadioButtons',
    options: [
      'Traditional Funeral',
      'Memorial Service',
      'Celebration of Life',
      'No Service',
      'Other',
    ],
    helperText: 'Your preference for the type of service',
  },
  {
    key: 'funeral_type_other',
    label: 'Please specify other type of service',
    type: 'TextArea',
    helperText: 'Please describe the specific type of service you prefer',
    conditionalDisplay: { field: 'funeral_type', value: 'Other' },
  },
  {
    key: 'service_location',
    label: 'Service Location',
    type: 'TextArea',
    helperText:
      "Where you'd like the service held (church, funeral home, specific location)",
  },
  {
    key: 'funeral_home',
    label: 'Preferred Funeral Home',
    type: 'TextInputWithUpload',
    helperText: 'Contact information for preferred funeral home or mortuary',
  },
  {
    key: 'clergy_officiant',
    label: 'Clergy/Officiant',
    type: 'TextInputWithUpload',
    helperText:
      'Contact information for preferred clergy or person to officiate',
  },
  {
    key: 'service_preferences',
    label: 'Service Preferences',
    type: 'TextArea',
    helperText:
      'Specific requests for music, readings, flowers, or other service elements',
  },
  {
    key: 'disposition_preferences_header',
    label: 'Body Disposition Preferences',
    type: 'Instructions',
    content: 'Your wishes for the disposition of your body',
  },
  {
    key: 'disposition_type',
    label: 'Disposition Preference',
    type: 'RadioButtons',
    options: ['Burial', 'Cremation', 'Donation to Science', 'Other'],
    helperText: 'Your preference for body disposition',
  },
  {
    key: 'disposition_type_other',
    label: 'Please specify other disposition preference',
    type: 'TextArea',
    helperText: 'Please describe your specific body disposition preference',
    conditionalDisplay: { field: 'disposition_type', value: 'Other' },
  },
  {
    key: 'burial_location',
    label: 'Burial Location',
    type: 'TextInputWithUpload',
    helperText: 'Specific cemetery, plot information, or upload cemetery deeds',
    conditionalDisplay: { field: 'disposition_type', value: 'Burial' },
  },
  {
    key: 'cremation_preferences',
    label: 'Cremation Preferences',
    type: 'TextArea',
    helperText: 'Wishes for ashes (burial, scattering, kept by family, etc.)',
    conditionalDisplay: { field: 'disposition_type', value: 'Cremation' },
  },
  {
    key: 'body_donation_info',
    label: 'Body Donation Information',
    type: 'TextInputWithUpload',
    helperText: 'Information about donation arrangements',
    conditionalDisplay: {
      field: 'disposition_type',
      value: 'Donation to Science',
    },
  },
  {
    key: 'memorial_preferences_header',
    label: 'Memorial Preferences',
    type: 'Instructions',
    content: 'Your preferences for memorials and remembrances',
  },
  {
    key: 'headstone_marker',
    label: 'Headstone/Marker Preferences',
    type: 'TextArea',
    helperText: 'Preferences for headstone, marker, or memorial inscription',
  },
  {
    key: 'memorial_donations',
    label: 'Memorial Donations',
    type: 'TextArea',
    helperText: 'Charities where memorial donations should be directed',
  },
  {
    key: 'special_requests',
    label: 'Special Requests',
    type: 'TextArea',
    helperText:
      'Any other special requests or wishes for your final arrangements',
  },
  {
    key: 'obituary_information_header',
    label: 'Obituary Information',
    type: 'Instructions',
    content: 'Information to help write your obituary',
  },
  {
    key: 'obituary_details',
    label: 'Obituary Details',
    type: 'TextArea',
    helperText:
      "Key information you'd like included in your obituary (achievements, family, interests)",
  },
  {
    key: 'photo_for_obituary',
    label: 'Photo for Obituary',
    type: 'TextInputWithUpload',
    helperText: 'Upload preferred photo for obituary or note location',
  },
  {
    key: 'prepaid_arrangements_header',
    label: 'Prepaid Arrangements',
    type: 'Instructions',
    content: 'Information about any prepaid funeral or burial arrangements',
  },
  {
    key: 'prepaid_funeral',
    label: 'Prepaid Funeral Arrangements',
    type: 'TextInputWithUpload',
    helperText:
      'Information about prepaid funeral arrangements and upload contracts',
  },
  {
    key: 'cemetery_plot',
    label: 'Cemetery Plot Ownership',
    type: 'TextInputWithUpload',
    helperText: 'Information about owned cemetery plots and upload deeds',
  },
  {
    key: 'funeral_insurance',
    label: 'Funeral Insurance',
    type: 'TextInputWithUpload',
    helperText: 'Information about funeral or burial insurance policies',
  },
];

const SECTION_21C_FIELDS = [
  {
    key: 'guardianship_instructions',
    label: 'Guardianship Overview',
    type: 'Instructions',
    content:
      "If you have minor children, it's essential to designate guardians who will care for them if something happens to you and your spouse/partner. This section helps organize your guardianship preferences and instructions for the care of your children.",
  },
  {
    key: 'minor_children_header',
    label: 'Minor Children Information',
    type: 'Instructions',
    content:
      'Information about your minor children who would need guardianship',
  },
  {
    key: 'minor_children_info',
    label: 'Minor Children Details',
    type: 'TextArea',
    helperText: 'Names, birthdates, and current ages of your minor children',
  },
  {
    key: 'primary_guardian_header',
    label: 'Primary Guardian',
    type: 'Instructions',
    content: 'Your first choice for guardian of your minor children',
  },
  {
    key: 'primary_guardian_name',
    label: 'Primary Guardian Name',
    type: 'TextInput',
    helperText: 'Full legal name of your chosen primary guardian',
  },
  {
    key: 'primary_guardian_relationship',
    label: 'Relationship to Children',
    type: 'TextInput',
    helperText: 'How this person is related to you or your children',
  },
  {
    key: 'primary_guardian_contact',
    label: 'Primary Guardian Contact',
    type: 'TextInputWithUpload',
    helperText: 'Complete contact information for primary guardian',
  },
  {
    key: 'primary_guardian_consent',
    label: 'Guardian Consent Status',
    type: 'RadioButtons',
    options: [
      'Agreed to serve',
      'Needs to be asked',
      'Verbal agreement only',
      'Written agreement',
    ],
    helperText: 'Has this person formally agreed to serve as guardian?',
  },
  {
    key: 'alternate_guardian_header',
    label: 'Alternate Guardian',
    type: 'Instructions',
    content: 'Your second choice if the primary guardian cannot serve',
  },
  {
    key: 'alternate_guardian_name',
    label: 'Alternate Guardian Name',
    type: 'TextInput',
    helperText: 'Full legal name of your alternate guardian choice',
  },
  {
    key: 'alternate_guardian_relationship',
    label: 'Relationship to Children',
    type: 'TextInput',
    helperText: 'How this person is related to you or your children',
  },
  {
    key: 'alternate_guardian_contact',
    label: 'Alternate Guardian Contact',
    type: 'TextInputWithUpload',
    helperText: 'Complete contact information for alternate guardian',
  },
  {
    key: 'alternate_guardian_consent',
    label: 'Guardian Consent Status',
    type: 'RadioButtons',
    options: [
      'Agreed to serve',
      'Needs to be asked',
      'Verbal agreement only',
      'Written agreement',
    ],
    helperText:
      'Has this person formally agreed to serve as alternate guardian?',
  },
  {
    key: 'guardian_instructions_header',
    label: 'Instructions for Guardians',
    type: 'Instructions',
    content: "Important information and preferences for your children's care",
  },
  {
    key: 'parenting_philosophy',
    label: 'Parenting Philosophy & Values',
    type: 'TextArea',
    helperText:
      'Your core values and approach to raising your children that you want guardians to follow',
  },
  {
    key: 'education_preferences',
    label: 'Education Preferences',
    type: 'TextArea',
    helperText:
      'Schools, educational philosophy, special programs, or educational goals for each child',
  },
  {
    key: 'religious_preferences',
    label: 'Religious/Spiritual Guidance',
    type: 'TextArea',
    helperText:
      'Religious or spiritual upbringing preferences for your children',
  },
  {
    key: 'healthcare_instructions',
    label: 'Healthcare Instructions',
    type: 'TextArea',
    helperText:
      'Medical history, regular doctors, medications, allergies, and healthcare preferences',
  },
  {
    key: 'special_needs',
    label: 'Special Needs or Considerations',
    type: 'TextArea',
    helperText:
      'Any special needs, learning differences, behavioral considerations, or therapy requirements',
  },
  {
    key: 'extracurricular_activities',
    label: 'Activities & Interests',
    type: 'TextArea',
    helperText:
      'Sports, hobbies, music, and other activities each child enjoys or participates in',
  },
  {
    key: 'relationship_maintenance',
    label: 'Family Relationships',
    type: 'TextArea',
    helperText:
      'Important family relationships to maintain, grandparents, extended family, close friends',
  },
  {
    key: 'financial_provisions_header',
    label: 'Financial Provisions',
    type: 'Instructions',
    content: "Financial arrangements for your children's care",
  },
  {
    key: 'trust_arrangements',
    label: 'Trust Arrangements',
    type: 'TextInputWithUpload',
    helperText:
      'Information about trusts established for children, upload trust documents',
  },
  {
    key: 'life_insurance',
    label: 'Life Insurance Beneficiaries',
    type: 'TextArea',
    helperText:
      'Life insurance policies naming children as beneficiaries and guardian instructions',
  },
  {
    key: 'education_funding',
    label: 'Education Funding',
    type: 'TextArea',
    helperText:
      'College savings accounts, education funds, or specific education funding instructions',
  },
  {
    key: 'guardian_compensation',
    label: 'Guardian Compensation',
    type: 'TextArea',
    helperText:
      'Any provisions for compensating guardians for their care of your children',
  },
  {
    key: 'legal_documents_header',
    label: 'Legal Documentation',
    type: 'Instructions',
    content: 'Legal documents related to guardianship',
  },
  {
    key: 'guardianship_will',
    label: 'Will with Guardian Designation',
    type: 'TextInputWithUpload',
    helperText: 'Upload current will that names guardians or note location',
  },
  {
    key: 'guardian_letters',
    label: 'Letters to Guardians',
    type: 'TextInputWithUpload',
    helperText: 'Personal letters or detailed instructions for guardians',
  },
  {
    key: 'custody_agreements',
    label: 'Custody Agreements',
    type: 'TextInputWithUpload',
    helperText:
      'If applicable, existing custody agreements that may affect guardianship',
  },
  {
    key: 'guardianship_attorney',
    label: 'Family Law Attorney',
    type: 'TextInputWithUpload',
    helperText:
      'Attorney who prepared guardianship documents or can assist with guardianship matters',
  },
  {
    key: 'excluded_guardians_header',
    label: 'Exclusions',
    type: 'Instructions',
    content: 'People you do NOT want to serve as guardians',
  },
  {
    key: 'excluded_persons',
    label: 'Persons to Exclude',
    type: 'TextArea',
    helperText:
      'Names of people you specifically do NOT want as guardians and reasons why',
  },
  {
    key: 'emergency_contacts_header',
    label: 'Emergency Contacts',
    type: 'Instructions',
    content: 'Additional important contacts for your children',
  },
  {
    key: 'temporary_caregivers',
    label: 'Temporary Caregivers',
    type: 'TextArea',
    helperText:
      'People authorized for short-term care (babysitters, relatives, family friends)',
  },
  {
    key: 'school_contacts',
    label: 'School Emergency Contacts',
    type: 'TextArea',
    helperText:
      'People authorized to pick up children from school or make school decisions',
  },
  {
    key: 'medical_contacts',
    label: 'Medical Authorization',
    type: 'TextArea',
    helperText:
      'People authorized to make emergency medical decisions if parents unavailable',
  },
];

/* ============================================================
   TYPES / HELPERS
============================================================ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  activeSubsection?: string | null;
  activeTopicId?: string | null;
}

type SubsectionId = '21A' | '21B' | '21C';
type UploadScope = '21A-full' | '21B-full' | '21C-full';

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

const SECTION_CONFIG: Record<
  SubsectionId,
  {
    title: string;
    fields: any[];
    icon: React.ElementType;
    tone: {
      header: string;
      wrapper: string;
      icon: string;
      uploadBox: string;
      glowOne: string;
      glowTwo: string;
    };
    uploadTitle: string;
    uploadDescription: string;
    buttonLabel: string;
    emptyError: string;
    successMessage: string;
  }
> = {
  '21A': {
    title: 'Estate Planning Documents',
    fields: SECTION_21A_FIELDS,
    icon: ScrollText,
    tone: {
      header: 'to-blue-50/70',
      wrapper:
        'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 hover:border-blue-300',
      icon: 'text-blue-600',
      uploadBox: 'hover:border-blue-300 hover:bg-blue-50/50',
      glowOne: 'bg-blue-100/70',
      glowTwo: 'bg-sky-100/70',
    },
    uploadTitle: 'Upload estate planning document',
    uploadDescription:
      'Upload a will, trust, power of attorney, medical POA, living will, DNR, beneficiary summary, or estate attorney document. AI will fill the matching estate planning fields.',
    buttonLabel: 'Auto-fill Estate Planning',
    emptyError:
      'AI could not find estate planning document information in this file.',
    successMessage:
      'AI filled estate planning document fields. Please review the results.',
  },
  '21B': {
    title: 'Final Arrangements & Wishes',
    fields: SECTION_21B_FIELDS,
    icon: HeartHandshake,
    tone: {
      header: 'to-rose-50/70',
      wrapper:
        'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-rose-50/60 hover:border-rose-300',
      icon: 'text-rose-600',
      uploadBox: 'hover:border-rose-300 hover:bg-rose-50/50',
      glowOne: 'bg-rose-100/70',
      glowTwo: 'bg-pink-100/70',
    },
    uploadTitle: 'Upload final arrangements document',
    uploadDescription:
      'Upload funeral wishes, prepaid funeral contracts, cemetery plot deeds, memorial instructions, obituary notes, organ donation wishes, or final arrangement documents. AI will fill the matching fields.',
    buttonLabel: 'Auto-fill Final Wishes',
    emptyError:
      'AI could not find final arrangement or funeral wish information in this file.',
    successMessage:
      'AI filled final arrangement and wishes fields. Please review the results.',
  },
  '21C': {
    title: 'Guardianship Arrangements',
    fields: SECTION_21C_FIELDS,
    icon: ShieldCheck,
    tone: {
      header: 'to-emerald-50/70',
      wrapper:
        'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 hover:border-emerald-300',
      icon: 'text-emerald-600',
      uploadBox: 'hover:border-emerald-300 hover:bg-emerald-50/50',
      glowOne: 'bg-emerald-100/70',
      glowTwo: 'bg-green-100/70',
    },
    uploadTitle: 'Upload guardianship document',
    uploadDescription:
      'Upload guardianship instructions, custody agreements, will sections naming guardians, child care notes, letters to guardians, or family law attorney documents. AI will fill the matching guardianship fields.',
    buttonLabel: 'Auto-fill Guardianship',
    emptyError:
      'AI could not find guardianship arrangement information in this file.',
    successMessage:
      'AI filled guardianship arrangement fields. Please review the results.',
  },
};

const getReadableFileType = (mimeType?: string) => {
  if (!mimeType) return 'Document';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'text/plain') return 'Text';
  if (mimeType.includes('image')) return 'Image';
  return mimeType;
};

/* ============================================================
   COMPONENT
============================================================ */

export default function Section21EstatePlanningFinalWishes({
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
  >({});

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  useEffect(() => {
    const next = { ...data };
    let changed = false;

    (['21A', '21B', '21C'] as SubsectionId[]).forEach(id => {
      if (!next[id]) {
        next[id] = {};
        changed = true;
      }
    });

    if (changed) {
      onChange(next);
    }

    // Initialize once only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getUploadedFileForScope = (scope: UploadScope) => {
    return uploadedFiles[scope] || null;
  };

  const updateField = (sectionId: SubsectionId, key: string, value: any) => {
    onChange({
      ...data,
      [sectionId]: {
        ...(data[sectionId] || {}),
        [key]: value,
      },
    });
  };

  const updateSectionWithPatch = (sectionId: SubsectionId, patch: any) => {
    onChange({
      ...data,
      [sectionId]: {
        ...(data[sectionId] || {}),
        ...patch,
      },
    });
  };

  const cleanPatchObject = (patch: any) => {
    if (!patch || typeof patch !== 'object') return {};

    return Object.fromEntries(
      Object.entries(patch).filter(([key, value]) => {
        if (key === '__rowId') return false;
        if (key.endsWith('_instructions')) return false;
        if (key.endsWith('_header')) return false;
        if (value === null || value === undefined || value === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      }),
    );
  };

  const extractObjectFromPatch = (subsection: SubsectionId, patch: any) => {
    const raw = patch?.[subsection];

    if (Array.isArray(raw)) {
      return cleanPatchObject(raw[0] || {});
    }

    if (raw && typeof raw === 'object') {
      return cleanPatchObject(raw);
    }

    return {};
  };

  const handleDocumentUpload = async (
    file?: File | null,
    scope?: UploadScope,
  ) => {
    try {
      if (!file || !scope) return;

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

  const handleAutofill = async (subsection: SubsectionId) => {
    const scope = `${subsection}-full` as UploadScope;
    const config = SECTION_CONFIG[subsection];

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
        section: 'estate_planning_final_wishes',
        file_id: uploadedFile.file_id,
        subsection,
      });

      const patch = json?.result?.patch ?? {};
      const extracted = extractObjectFromPatch(subsection, patch);

      if (Object.keys(extracted).length === 0) {
        setAiError(config.emptyError);
        return;
      }

      updateSectionWithPatch(subsection, extracted);
      setAiNotice(config.successMessage);
    } catch (err: any) {
      setAiError(err?.message || 'AI autofill failed');
    } finally {
      setAiLoadingScope(null);
    }
  };

  const renderUploader = (subsection: SubsectionId) => {
    const config = SECTION_CONFIG[subsection];
    const scope = `${subsection}-full` as UploadScope;
    const uploadedFile = getUploadedFileForScope(scope);
    const isUploading = uploadingScope === scope;
    const isReading = aiLoadingScope === scope;
    const tone = config.tone;

    return (
      <div
        className={[
          'relative overflow-hidden rounded-2xl border border-dashed p-4 shadow-sm transition-all duration-200 hover:shadow-md',
          tone.wrapper,
          'space-y-4',
        ].join(' ')}
      >
        <div
          className={[
            'pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl',
            tone.glowOne,
          ].join(' ')}
        />

        <div
          className={[
            'pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full blur-2xl',
            tone.glowTwo,
          ].join(' ')}
        />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              {isUploading ? (
                <Loader2 className={`h-5 w-5 animate-spin ${tone.icon}`} />
              ) : uploadedFile ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <UploadCloud className={`h-5 w-5 ${tone.icon}`} />
              )}
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-slate-900">
                {config.uploadTitle}
              </p>

              <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                {config.uploadDescription}
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => handleAutofill(subsection)}
            disabled={isAnyAIActionRunning || !uploadedFile}
            className="shrink-0 rounded-xl"
          >
            {isReading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}

            {isReading ? 'Reading…' : config.buttonLabel}
          </Button>
        </div>

        <div className="relative grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <label
            className={[
              'group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-5 text-center transition',
              tone.uploadBox,
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

            <UploadCloud className={`h-5 w-5 ${tone.icon}`} />

            <div>
              <p className="text-sm font-medium text-slate-800">
                Click to upload document
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

  const renderSection = (id: SubsectionId) => {
    const config = SECTION_CONFIG[id];
    const show = !activeSubsection || activeSubsection === id;
    const sectionData = data[id] || {};
    const Icon = config.icon;

    return (
      <div
        id={`subsection-${id}`}
        className={`rounded-3xl ${show ? 'border border-primary p-1' : ''}`}
      >
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader
            className={[
              'border-b bg-gradient-to-r from-slate-50',
              config.tone.header,
            ].join(' ')}
          >
            <CardTitle className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${config.tone.icon}`} />
              {id}. {config.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 p-5">
            {renderUploader(id)}

            <div className="grid grid-cols-1 gap-4">
              {config.fields.map(field => (
                <DynamicFormField
                  key={field.key}
                  field={field}
                  value={sectionData?.[field.key]}
                  formData={sectionData}
                  onChange={value => updateField(id, field.key, value)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-10">
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

      {renderSection('21A')}
      {renderSection('21B')}
      {renderSection('21C')}
    </div>
  );
}
