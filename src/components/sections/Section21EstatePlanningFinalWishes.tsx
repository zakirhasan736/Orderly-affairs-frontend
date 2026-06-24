'use client';

import React, {useEffect, useState, useRef } from 'react';
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
  Baby,
  CheckCircle2,
  Church,
  FileText,
  HeartHandshake,
  HeartPulse,
  Info,
  Landmark,
  Loader2,
  Scale,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserCheck,
  Users,
} from 'lucide-react';
import { cn } from '@common/ui/utils';

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
  type UploadedAIFile,
  validateAiDocumentFile,
} from '@/utils/aiDocumentUploadUi';

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

type SubsectionId = '21A' | '21B' | '21C';

const FIELD_MAP_21A = Object.fromEntries(
  SECTION_21A_FIELDS.map(field => [field.key, field]),
);
const FIELD_MAP_21B = Object.fromEntries(
  SECTION_21B_FIELDS.map(field => [field.key, field]),
);
const FIELD_MAP_21C = Object.fromEntries(
  SECTION_21C_FIELDS.map(field => [field.key, field]),
);

type FieldGroup = {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  iconWrap: string;
  layout: 'grid' | 'stack';
  fieldKeys: string[];
};

const SECTION_21A_GROUPS: FieldGroup[] = [
  {
    key: 'will_testament',
    title: 'Will & Testament',
    subtitle: 'Location, executor details, and estate attorney',
    icon: ScrollText,
    accent: 'from-blue-500/[0.07] to-indigo-500/[0.03]',
    iconWrap: 'bg-blue-500/10 text-blue-600',
    layout: 'grid',
    fieldKeys: [
      'will_location',
      'will_date',
      'executor_info',
      'alternate_executor',
      'will_attorney',
    ],
  },
  {
    key: 'trust_documents',
    title: 'Trust Documents',
    subtitle: 'Trusts, trustees, and trust attorney contacts',
    icon: Landmark,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'grid',
    fieldKeys: [
      'trust_info',
      'trustee_info',
      'successor_trustee',
      'trust_attorney',
    ],
  },
  {
    key: 'power_of_attorney',
    title: 'Powers of Attorney',
    subtitle: 'Financial and medical decision authority',
    icon: Scale,
    accent: 'from-cyan-500/[0.07] to-sky-500/[0.03]',
    iconWrap: 'bg-cyan-500/10 text-cyan-700',
    layout: 'grid',
    fieldKeys: ['financial_poa', 'medical_poa'],
  },
  {
    key: 'healthcare_directives',
    title: 'Healthcare Directives',
    subtitle: 'Living wills, DNR orders, and donation wishes',
    icon: HeartPulse,
    accent: 'from-rose-500/[0.07] to-pink-500/[0.03]',
    iconWrap: 'bg-rose-500/10 text-rose-700',
    layout: 'grid',
    fieldKeys: ['living_will', 'dnr_orders', 'organ_donation'],
  },
  {
    key: 'beneficiary_info',
    title: 'Beneficiary Information',
    subtitle: 'Primary, contingent, and special bequests',
    icon: Users,
    accent: 'from-emerald-500/[0.07] to-teal-500/[0.03]',
    iconWrap: 'bg-emerald-500/10 text-emerald-700',
    layout: 'stack',
    fieldKeys: [
      'primary_beneficiaries',
      'contingent_beneficiaries',
      'special_bequests',
      'charitable_bequests',
    ],
  },
];

const SECTION_21B_GROUPS: FieldGroup[] = [
  {
    key: 'funeral_preferences',
    title: 'Funeral / Memorial Preferences',
    subtitle: 'Service type, location, and officiant details',
    icon: Church,
    accent: 'from-rose-500/[0.07] to-pink-500/[0.03]',
    iconWrap: 'bg-rose-500/10 text-rose-700',
    layout: 'grid',
    fieldKeys: [
      'funeral_type',
      'funeral_type_other',
      'service_location',
      'funeral_home',
      'clergy_officiant',
      'service_preferences',
    ],
  },
  {
    key: 'disposition_preferences',
    title: 'Body Disposition Preferences',
    subtitle: 'Burial, cremation, or donation arrangements',
    icon: HeartHandshake,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'grid',
    fieldKeys: [
      'disposition_type',
      'disposition_type_other',
      'burial_location',
      'cremation_preferences',
      'body_donation_info',
    ],
  },
  {
    key: 'memorial_preferences',
    title: 'Memorial Preferences',
    subtitle: 'Headstone, donations, and special requests',
    icon: FileText,
    accent: 'from-amber-500/[0.07] to-orange-500/[0.03]',
    iconWrap: 'bg-amber-500/10 text-amber-700',
    layout: 'stack',
    fieldKeys: ['headstone_marker', 'memorial_donations', 'special_requests'],
  },
  {
    key: 'obituary_information',
    title: 'Obituary Information',
    subtitle: 'Details and photo for your obituary',
    icon: ScrollText,
    accent: 'from-blue-500/[0.07] to-indigo-500/[0.03]',
    iconWrap: 'bg-blue-500/10 text-blue-600',
    layout: 'grid',
    fieldKeys: ['obituary_details', 'photo_for_obituary'],
  },
  {
    key: 'prepaid_arrangements',
    title: 'Prepaid Arrangements',
    subtitle: 'Funeral contracts, plots, and insurance',
    icon: ShieldCheck,
    accent: 'from-emerald-500/[0.07] to-teal-500/[0.03]',
    iconWrap: 'bg-emerald-500/10 text-emerald-700',
    layout: 'grid',
    fieldKeys: ['prepaid_funeral', 'cemetery_plot', 'funeral_insurance'],
  },
];

const SECTION_21C_GROUPS: FieldGroup[] = [
  {
    key: 'minor_children',
    title: 'Minor Children Information',
    subtitle: 'Names, birthdates, and current ages',
    icon: Baby,
    accent: 'from-blue-500/[0.07] to-indigo-500/[0.03]',
    iconWrap: 'bg-blue-500/10 text-blue-600',
    layout: 'stack',
    fieldKeys: ['minor_children_info'],
  },
  {
    key: 'primary_guardian',
    title: 'Primary Guardian',
    subtitle: 'First choice to care for your children',
    icon: UserCheck,
    accent: 'from-emerald-500/[0.07] to-teal-500/[0.03]',
    iconWrap: 'bg-emerald-500/10 text-emerald-700',
    layout: 'grid',
    fieldKeys: [
      'primary_guardian_name',
      'primary_guardian_relationship',
      'primary_guardian_contact',
      'primary_guardian_consent',
    ],
  },
  {
    key: 'alternate_guardian',
    title: 'Alternate Guardian',
    subtitle: 'Backup guardian if primary cannot serve',
    icon: UserCheck,
    accent: 'from-cyan-500/[0.07] to-sky-500/[0.03]',
    iconWrap: 'bg-cyan-500/10 text-cyan-700',
    layout: 'grid',
    fieldKeys: [
      'alternate_guardian_name',
      'alternate_guardian_relationship',
      'alternate_guardian_contact',
      'alternate_guardian_consent',
    ],
  },
  {
    key: 'guardian_instructions',
    title: 'Instructions for Guardians',
    subtitle: 'Values, education, health, and activities',
    icon: HeartHandshake,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'stack',
    fieldKeys: [
      'parenting_philosophy',
      'education_preferences',
      'religious_preferences',
      'healthcare_instructions',
      'special_needs',
      'extracurricular_activities',
      'relationship_maintenance',
    ],
  },
  {
    key: 'financial_provisions',
    title: 'Financial Provisions',
    subtitle: 'Trusts, insurance, and education funding',
    icon: Landmark,
    accent: 'from-amber-500/[0.07] to-orange-500/[0.03]',
    iconWrap: 'bg-amber-500/10 text-amber-700',
    layout: 'stack',
    fieldKeys: [
      'trust_arrangements',
      'life_insurance',
      'education_funding',
      'guardian_compensation',
    ],
  },
  {
    key: 'legal_documents',
    title: 'Legal Documentation',
    subtitle: 'Wills, letters, custody, and attorney contacts',
    icon: Scale,
    accent: 'from-rose-500/[0.07] to-pink-500/[0.03]',
    iconWrap: 'bg-rose-500/10 text-rose-700',
    layout: 'grid',
    fieldKeys: [
      'guardianship_will',
      'guardian_letters',
      'custody_agreements',
      'guardianship_attorney',
    ],
  },
  {
    key: 'exclusions',
    title: 'Exclusions',
    subtitle: 'People you do not want as guardians',
    icon: ShieldCheck,
    accent: 'from-slate-500/[0.07] to-slate-400/[0.03]',
    iconWrap: 'bg-slate-500/10 text-slate-700',
    layout: 'stack',
    fieldKeys: ['excluded_persons'],
  },
  {
    key: 'emergency_contacts',
    title: 'Emergency Contacts',
    subtitle: 'Temporary care, school, and medical authorization',
    icon: Users,
    accent: 'from-indigo-500/[0.07] to-blue-500/[0.03]',
    iconWrap: 'bg-indigo-500/10 text-indigo-700',
    layout: 'stack',
    fieldKeys: ['temporary_caregivers', 'school_contacts', 'medical_contacts'],
  },
];

const SUBSECTION_GROUPS: Record<SubsectionId, FieldGroup[]> = {
  '21A': SECTION_21A_GROUPS,
  '21B': SECTION_21B_GROUPS,
  '21C': SECTION_21C_GROUPS,
};

const SUBSECTION_FIELD_MAP: Record<SubsectionId, Record<string, any>> = {
  '21A': FIELD_MAP_21A,
  '21B': FIELD_MAP_21B,
  '21C': FIELD_MAP_21C,
};

const SUBSECTION_OVERVIEW_KEY: Record<SubsectionId, string> = {
  '21A': 'estate_planning_instructions',
  '21B': 'final_arrangements_instructions',
  '21C': 'guardianship_instructions',
};

const SUBSECTION_SUBTITLE: Record<SubsectionId, string> = {
  '21A':
    'Grouped legal documents so you can fill wills, trusts, powers of attorney, and beneficiary details without scrolling through one long form.',
  '21B':
    'Grouped final wishes for services, disposition, memorials, and prepaid arrangements in an easy mobile-friendly layout.',
  '21C':
    'Grouped guardianship choices, care instructions, financial provisions, and emergency contacts for your children.',
};

/* ============================================================
   TYPES / HELPERS
============================================================ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  activeSubsection?: string | null;
  activeTopicId?: string | null;
}

type UploadScope = '21A-full' | '21B-full' | '21C-full';

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

  const latestUploadRef = useRef<Record<string, UploadedAIFile>>({});

  const aiRouting = useOptionalAiDocumentRouting();

  useRestoreAiPendingUploadForSection({
    sectionId: '21',
    setUploadedFiles,
    latestUploadRef,
  });

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
    const pendingFile =
      aiRouting?.getPendingFileForSection('21', String(scope)) ?? null;

    return resolveAiUploadedFileForScope(scope, uploadedFiles, latestUploadRef, pendingFile);
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
    runAutofill?: () => void | Promise<void>,
  ) => {
    try {
      if (!file || !scope) return;

      setAiError('');
      setAiNotice('');

      const validationError = validateAiDocumentFile(file);
      if (validationError) {
        setAiError(validationError);
        return;
      }

      setUploadingScope(scope);

      const uploaded = await uploadAIDocument(file);

      const uploadedRecord: UploadedAIFile = {
        file_id: uploaded.file_id,
        mime_type: uploaded.mime_type,
        expires_at: uploaded.expires_at,
      };

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

      const json = await runAiSectionAutofill({
        sectionKey: 'estate_planning_final_wishes',
        sectionId: '21',
        file_id: uploadedFile.file_id,
        subsection,
        uploadScope: String(scope),
        aiRouting,
        });

      if (!json) return;

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
      releaseDeferredAiRoutingDialog(aiRouting);
    }
  };

  const renderUploader = (subsection: SubsectionId) => {
    const config = SECTION_CONFIG[subsection];
    const scope = `${subsection}-full` as UploadScope;

    return (
      <SectionAiDocumentUploader
        title={config.uploadTitle}
        description={config.uploadDescription}
        buttonLabel={config.buttonLabel}
        uploadLabel="Drag and drop or click to upload document"
        tone={{
          wrapper: config.tone.wrapper,
          glowOne: config.tone.glowOne,
          glowTwo: config.tone.glowTwo,
          icon: config.tone.icon,
          uploadBox: config.tone.uploadBox,
        }}
        disabled={isAnyAIActionRunning}
        isUploading={uploadingScope === scope}
        isReading={aiLoadingScope === scope}
        uploadedMimeType={getUploadedFileForScope(scope)?.mime_type}
      highlightUpload={aiRouting?.shouldHighlightUpload('21', String(scope)) ?? false}
        onUpload={file =>
          handleDocumentUpload(file, scope, () => handleAutofill(subsection))
        }
        onAutofill={() => handleAutofill(subsection)}
      />
    );
  };

  const isFullWidthField = (field: any) =>
    field?.type === 'TextArea' ||
    field?.type === 'RadioButtons' ||
    field?.type === 'Instructions';

  const renderGroupField = (
    sectionId: SubsectionId,
    fieldKey: string,
    sectionData: Record<string, any>,
  ) => {
    const field = SUBSECTION_FIELD_MAP[sectionId][fieldKey];
    if (!field || field.type === 'Instructions') return null;

    return (
      <DynamicFormField
        key={field.key}
        field={field}
        value={sectionData?.[field.key]}
        formData={sectionData}
        onChange={value => updateField(sectionId, field.key, value)}
        className="space-y-2"
      />
    );
  };

  const renderGroupFields = (
    sectionId: SubsectionId,
    group: FieldGroup,
    sectionData: Record<string, any>,
  ) => {
    if (group.layout === 'stack') {
      return (
        <div className="space-y-4">
          {group.fieldKeys.map(fieldKey =>
            renderGroupField(sectionId, fieldKey, sectionData),
          )}
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {group.fieldKeys.map(fieldKey => {
          const field = SUBSECTION_FIELD_MAP[sectionId][fieldKey];
          if (!field || field.type === 'Instructions') return null;

          return (
            <div
              key={fieldKey}
              className={cn(isFullWidthField(field) && 'md:col-span-2')}
            >
              {renderGroupField(sectionId, fieldKey, sectionData)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSection = (id: SubsectionId) => {
    const config = SECTION_CONFIG[id];
    const show = !activeSubsection || activeSubsection === id;
    if (!show) return null;

    const sectionData = data[id] || {};
    const overviewField =
      SUBSECTION_FIELD_MAP[id][SUBSECTION_OVERVIEW_KEY[id]];
    const groups = SUBSECTION_GROUPS[id];

    return (
      <div
        id={`subsection-${id}`}
        className={cn(
          'rounded-3xl',
          activeSubsection === id && 'border border-primary p-1',
        )}
      >
        <Card className="overflow-hidden border-slate-200/80 shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 via-white to-indigo-50/60 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl tracking-tight text-slate-900">
                  {id}. {config.title}
                </CardTitle>
                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  {SUBSECTION_SUBTITLE[id]}
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

            {renderUploader(id)}

            <div className="grid gap-5 xl:grid-cols-2">
              {groups.map(group => {
                const GroupIcon = group.icon;

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
                          <GroupIcon className="h-5 w-5" />
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

                    <div className="px-3 py-5">
                      {renderGroupFields(id, group, sectionData)}
                    </div>
                  </section>
                );
              })}
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
