'use client';

import { AiUploadedAttachmentList } from '@/components/ai/AiUploadedAttachmentList';
import React, {useEffect, useState, useRef } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/common/ui/card';
import { Button } from '@/components/common/ui/button';
import { Alert, AlertDescription } from '@/components/common/ui/alert';
import { DynamicFormField } from '@/components/DynamicFormField';
import {
  Baby,
  Bell,
  Bone,
  CheckCircle2,
  Dna,
  FileHeart,
  FileText,
  Gem,
  HeartHandshake,
  Loader2,
  Minus,
  PawPrint,
  Plus,
  Scale,
  Sparkles,
  TreePine,
  UploadCloud,
  User,
  Users,
  Heart,
} from 'lucide-react';

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
import {
  buildUploadedAiFile,
  validateAiDocumentFile,
} from '@/utils/aiDocumentUploadUi';
import { AiDocumentDropZoneInput } from '@/components/ai/AiDocumentDropZoneInput';
import { AI_PENDING_ROUTED_HINT } from '@/utils/aiRoutingUi';
import {
  buildFieldMap,
  FieldGroup,
  getInstructionOverview,
  VaultEncryptedBadge,
  VaultGroupCards,
  VaultOverviewBox,
} from '@/utils/vaultGroupedFields';
import {
  getTopicCardProps,
  useScrollToVaultTopic,
} from '@/utils/vaultTopicNavigation';

/* ============================================================
   CONFIG — 17A
============================================================ */

const SECTION_17A = {
  subsectionId: '17A',
  title: 'Ancestry & Family Tree',
  itemLabel: 'Ancestry Record',
  fields: [
    {
      key: 'family_tree_overview',
      label: 'Family Tree Overview',
      type: 'TextArea',
      helperText:
        'Brief overview of your family lineage, including parents, grandparents, and any known ancestry',
    },
    {
      key: 'genealogy_research',
      label: 'Genealogy Research',
      type: 'TextArea',
      helperText:
        "Any genealogy research you've done, interesting family history discoveries, or family stories passed down",
    },
    {
      key: 'ancestral_origins',
      label: 'Ancestral Origins',
      type: 'TextArea',
      helperText:
        'Countries or regions where your family originated, immigration stories, or cultural heritage information',
    },
    {
      key: 'family_stories',
      label: 'Family Stories & Traditions',
      type: 'TextArea',
      helperText:
        'Important family stories, traditions, or oral history that should be preserved',
    },
    {
      key: 'genealogy_contacts',
      label: 'Genealogy Contacts',
      type: 'TextArea',
      helperText:
        "Contact information for relatives who have family history knowledge or genealogy researchers you've worked with",
    },
    {
      key: 'documents_section',
      label: 'Family Documents & Research',
      type: 'Instructions',
      content:
        'Upload any family tree documents, genealogy research, DNA test results, or historical family records.',
    },
    {
      key: 'family_records',
      label: 'Family Records',
      type: 'TextInputWithUpload',
      helperText:
        'Upload family tree documents, birth certificates, marriage records, or other genealogy documents',
    },
    {
      key: 'dna_testing',
      label: 'DNA Testing Results',
      type: 'TextInputWithUpload',
      helperText:
        'Results from ancestry DNA testing or genetic genealogy services',
    },
  ],
};

/* ============================================================
   REPEATABLE SECTION FACTORY
============================================================ */

const createRepeatableSection = (
  subsectionId: '17B' | '17C' | '17D' | '17E' | '17F' | '17G',
  title: string,
  itemLabel: string,
  fields: any[],
) => ({ subsectionId, title, itemLabel, fields });

/* ============================================================
   CONFIG — 17B–17G
============================================================ */

const SECTION_17B = createRepeatableSection(
  '17B',
  'Family Members',
  'Family Member',
  [
    {
      key: 'person_name',
      label: 'Name',
      type: 'TextInput',
      helperText: 'Full name of family member',
    },
    {
      key: 'relationship',
      label: 'Relationship',
      type: 'Dropdown',
      options: [
        'Spouse/Partner',
        'Child',
        'Parent',
        'Sibling',
        'Grandparent',
        'Grandchild',
        'In-Law',
        'Niece/Nephew',
        'Aunt/Uncle',
        'Cousin',
        'Other Family',
      ],
      helperText: 'How this person is related to you',
    },
    {
      key: 'contact_info',
      label: 'Contact Information',
      type: 'TextArea',
      helperText: 'Phone numbers, email addresses, and current address',
    },
    {
      key: 'birthdate',
      label: 'Birth Date',
      type: 'DatePicker',
      helperText: 'Their date of birth',
    },
    {
      key: 'importance',
      label: 'Relationship Importance',
      type: 'TextArea',
      helperText:
        'Why this person is important to you, special memories, or what you want your family to know about this relationship',
    },
    {
      key: 'notify_instructions',
      label: 'Notification Instructions',
      type: 'RadioButtons',
      options: [
        'Notify Immediately',
        'Notify Within a Week',
        'Notify When Convenient',
        'Do Not Notify',
      ],
      helperText: 'How urgently should this person be contacted?',
    },
    {
      key: 'special_considerations',
      label: 'Special Considerations',
      type: 'TextArea',
      helperText:
        'Any special circumstances, health issues, or considerations when contacting this person',
    },
    {
      key: 'photos_mementos',
      label: 'Photos or Mementos',
      type: 'TextInputWithUpload',
      helperText:
        'Upload photos or documents related to this person or note where special items for them are located',
    },
  ],
);

const SECTION_17C = createRepeatableSection('17C', 'Dependents', 'Dependent', [
  {
    key: 'dependent_name',
    label: 'Name',
    type: 'TextInput',
    helperText: 'Full name of the person who depends on you',
  },
  {
    key: 'relationship',
    label: 'Relationship',
    type: 'Dropdown',
    options: [
      'Child',
      'Stepchild',
      'Adopted Child',
      'Parent',
      'Stepparent',
      'Grandparent',
      'Grandchild',
      'Spouse/Partner',
      'Sibling',
      'Other Family Member',
      'Non-Family Dependent',
    ],
    helperText: 'Your relationship to this dependent',
  },
  {
    key: 'birthdate',
    label: 'Birth Date',
    type: 'DatePicker',
    helperText: 'Their date of birth',
  },
  {
    key: 'dependency_type',
    label: 'Type of Dependency',
    type: 'Dropdown',
    options: [
      'Financial Support',
      'Physical Care',
      'Medical Care',
      'Legal Guardianship',
      'Emotional Support',
      'Multiple Types',
    ],
    helperText: 'Primary way this person depends on you',
  },
  {
    key: 'support_details',
    label: 'Support Details',
    type: 'TextArea',
    helperText:
      'Specific details about the support you provide (amount, frequency, type of care, etc.)',
  },
  {
    key: 'backup_caregivers',
    label: 'Backup Caregivers',
    type: 'TextArea',
    helperText:
      'Names and contact information of people who could provide care in your absence',
  },
  {
    key: 'special_needs',
    label: 'Special Needs or Conditions',
    type: 'TextArea',
    helperText:
      'Any medical conditions, disabilities, or special requirements that need ongoing attention',
  },
  {
    key: 'future_care_plans',
    label: 'Future Care Plans',
    type: 'TextArea',
    helperText:
      'Your wishes for their care if you become unable to provide support',
  },
  {
    key: 'dependency_documents',
    label: 'Dependency Documentation',
    type: 'Instructions',
    content:
      'Upload any legal documents related to this dependency relationship.',
  },
  {
    key: 'legal_documents',
    label: 'Legal Documents',
    type: 'TextInputWithUpload',
    helperText:
      'Upload guardianship papers, custody agreements, or other legal documents related to this dependency',
  },
  {
    key: 'financial_accounts',
    label: 'Related Financial Accounts',
    type: 'TextArea',
    helperText:
      'Any bank accounts, trusts, or financial arrangements set up for this dependent',
  },
]);

const SECTION_17D = createRepeatableSection('17D', 'Close Friends', 'Friend', [
  {
    key: 'friend_name',
    label: 'Name',
    type: 'TextInput',
    helperText: 'Full name of your friend',
  },
  {
    key: 'friendship_type',
    label: 'Type of Friendship',
    type: 'Dropdown',
    options: [
      'Best Friend',
      'Close Friend',
      'Work Friend',
      'Childhood Friend',
      'School Friend',
      'Neighbor',
      'Activity Partner',
      'Other',
    ],
    helperText: 'How you would describe this friendship',
  },
  {
    key: 'friendship_type_other',
    label: 'Please specify other friendship type',
    type: 'TextInput',
    helperText: 'Please describe the specific type of friendship',
    conditionalDisplay: { field: 'friendship_type', value: 'Other' },
  },
  {
    key: 'contact_info',
    label: 'Contact Information',
    type: 'TextArea',
    helperText: 'Phone numbers, email addresses, and current address',
  },
  {
    key: 'how_we_met',
    label: 'How We Met',
    type: 'TextArea',
    helperText: 'How and when you became friends',
  },
  {
    key: 'friendship_significance',
    label: 'Friendship Significance',
    type: 'TextArea',
    helperText:
      'What this friendship means to you, shared experiences, or why this person is special',
  },
  {
    key: 'notify_instructions',
    label: 'Notification Instructions',
    type: 'RadioButtons',
    options: [
      'Notify Immediately',
      'Notify Within a Week',
      'Notify When Convenient',
      'Do Not Notify',
    ],
    helperText: 'How urgently should this person be contacted?',
  },
  {
    key: 'shared_memories',
    label: 'Shared Memories',
    type: 'TextArea',
    helperText: 'Special memories, inside jokes, or stories you want preserved',
  },
  {
    key: 'photos_mementos',
    label: 'Photos or Mementos',
    type: 'TextInputWithUpload',
    helperText: 'Upload photos or documents related to this friendship',
  },
]);

const SECTION_17E = createRepeatableSection(
  '17E',
  'Important Relationships',
  'Important Person',
  [
    {
      key: 'person_name',
      label: 'Name',
      type: 'TextInput',
      helperText: 'Full name of this important person',
    },
    {
      key: 'relationship_type',
      label: 'Relationship Type',
      type: 'Dropdown',
      options: [
        'Mentor',
        'Student/Mentee',
        'Caregiver',
        'Former Partner',
        'Godparent/Godchild',
        'Family Friend',
        'Neighbor',
        'Professional Contact',
        'Spiritual Guide',
        'Other',
      ],
      helperText: 'How you would describe this relationship',
    },
    {
      key: 'relationship_type_other',
      label: 'Please specify other relationship type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of relationship',
      conditionalDisplay: { field: 'relationship_type', value: 'Other' },
    },
    {
      key: 'contact_info',
      label: 'Contact Information',
      type: 'TextArea',
      helperText: 'Phone numbers, email addresses, and current address',
    },
    {
      key: 'relationship_significance',
      label: 'Relationship Significance',
      type: 'TextArea',
      helperText:
        'Why this person is important to you and what your family should know about this relationship',
    },
    {
      key: 'notify_instructions',
      label: 'Notification Instructions',
      type: 'RadioButtons',
      options: [
        'Notify Immediately',
        'Notify Within a Week',
        'Notify When Convenient',
        'Do Not Notify',
      ],
      helperText: 'How urgently should this person be contacted?',
    },
    {
      key: 'special_notes',
      label: 'Special Notes',
      type: 'TextArea',
      helperText:
        'Any special information, messages, or considerations regarding this person',
    },
    {
      key: 'relationship_documents',
      label: 'Related Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload photos, letters, or documents related to this relationship',
    },
  ],
);

const SECTION_17F = createRepeatableSection(
  '17F',
  'Memorabilia & Sentimental Items',
  'Sentimental Item',
  [
    {
      key: 'item_name',
      label: 'Item Name/Description',
      type: 'TextInput',
      helperText: 'Name or brief description of the sentimental item',
    },
    {
      key: 'item_type',
      label: 'Type of Item',
      type: 'Dropdown',
      options: [
        'Family Heirloom',
        'Photo Album',
        'Jewelry',
        'Artwork',
        'Books/Documents',
        'Clothing/Textiles',
        'Furniture',
        'Religious/Spiritual Items',
        'Military Memorabilia',
        'Childhood Keepsakes',
        'Letters/Correspondence',
        'Other',
      ],
      helperText: 'Category that best describes this item',
    },
    {
      key: 'item_type_other',
      label: 'Please specify other item type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of sentimental item',
      conditionalDisplay: { field: 'item_type', value: 'Other' },
    },
    {
      key: 'sentimental_value',
      label: 'Sentimental Value & Story',
      type: 'TextArea',
      helperText:
        'Why this item is special to you, its history, and what it means to your family',
    },
    {
      key: 'current_location',
      label: 'Current Location',
      type: 'TextInput',
      helperText: 'Where this item is currently stored or displayed',
    },
    {
      key: 'intended_recipient',
      label: 'Intended Recipient',
      type: 'TextInput',
      helperText: 'Who you would like to inherit or receive this item',
    },
    {
      key: 'care_instructions',
      label: 'Care Instructions',
      type: 'TextArea',
      helperText:
        'Any special care, handling, or storage instructions for this item',
    },
    {
      key: 'estimated_value',
      label: 'Estimated Value',
      type: 'TextInput',
      helperText:
        'Approximate monetary value if known (for insurance purposes)',
    },
    {
      key: 'item_documentation',
      label: 'Item Documentation',
      type: 'Instructions',
      content:
        'Upload photos and any documentation related to this sentimental item.',
    },
    {
      key: 'documentation',
      label: 'Photos or Documentation',
      type: 'TextInputWithUpload',
      helperText:
        'Upload photos of the item or any documentation about its history or value',
    },
  ],
);

const SECTION_17G = createRepeatableSection(
  '17G',
  'Pet Care & Records',
  'Pet',
  [
    {
      key: 'pet_name',
      label: 'Pet Name',
      type: 'TextInput',
      helperText: "Your pet's name",
    },
    {
      key: 'pet_type',
      label: 'Type of Pet',
      type: 'Dropdown',
      options: [
        'Dog',
        'Cat',
        'Bird',
        'Fish',
        'Rabbit',
        'Hamster/Guinea Pig',
        'Reptile',
        'Horse',
        'Farm Animal',
        'Exotic Pet',
        'Other',
      ],
      helperText: 'What type of animal your pet is',
    },
    {
      key: 'pet_type_other',
      label: 'Please specify other pet type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of pet',
      conditionalDisplay: { field: 'pet_type', value: 'Other' },
    },
    {
      key: 'breed_age',
      label: 'Breed & Age',
      type: 'TextInput',
      helperText: "Pet's breed and approximate age or birth date",
    },
    {
      key: 'veterinarian',
      label: 'Veterinarian',
      type: 'TextArea',
      helperText: "Name, address, and phone number of your pet's veterinarian",
    },
    {
      key: 'medical_history',
      label: 'Medical History',
      type: 'TextArea',
      helperText:
        'Any ongoing medical conditions, medications, or special health needs',
    },
    {
      key: 'feeding_care',
      label: 'Feeding & Care Instructions',
      type: 'TextArea',
      helperText:
        'Daily care routine, feeding schedule, favorite foods, exercise needs, and behavioral notes',
    },
    {
      key: 'emergency_contact',
      label: 'Emergency Pet Contact',
      type: 'TextArea',
      helperText:
        'Contact information for someone who could care for your pet in an emergency',
    },
    {
      key: 'long_term_care',
      label: 'Long-term Care Plans',
      type: 'TextArea',
      helperText:
        "Your wishes for your pet's care if you become unable to care for them",
    },
    {
      key: 'pet_supplies',
      label: 'Pet Supplies & Equipment',
      type: 'TextArea',
      helperText:
        'Location of pet supplies, equipment, and any special items your pet needs',
    },
    {
      key: 'registration_microchip',
      label: 'Registration & Microchip',
      type: 'TextArea',
      helperText:
        'Registration numbers, microchip information, or license details',
    },
    {
      key: 'pet_documentation',
      label: 'Pet Records & Documentation',
      type: 'Instructions',
      content:
        'Upload veterinary records, vaccination certificates, and photos of your pet.',
    },
    {
      key: 'veterinary_records',
      label: 'Veterinary Records',
      type: 'TextInputWithUpload',
      helperText:
        'Upload vaccination records, medical records, or photos of your pet',
    },
  ],
);

const REPEATABLE_SECTIONS = [
  SECTION_17B,
  SECTION_17C,
  SECTION_17D,
  SECTION_17E,
  SECTION_17F,
  SECTION_17G,
];

type SubsectionId = '17A' | '17B' | '17C' | '17D' | '17E' | '17F' | '17G';

/* ============================================================
   FIELD GROUPS
============================================================ */

const SECTION_17A_GROUPS: FieldGroup[] = [
  {
    key: 'family_heritage',
    title: 'Family Heritage',
    subtitle: 'Lineage, origins, stories, and genealogy contacts',
    icon: TreePine,
    accent: 'from-emerald-500/[0.07] to-teal-500/[0.03]',
    iconWrap: 'bg-emerald-500/10 text-emerald-700',
    layout: 'stack',
    fieldKeys: [
      'family_tree_overview',
      'genealogy_research',
      'ancestral_origins',
      'family_stories',
      'genealogy_contacts',
    ],
  },
  {
    key: 'records_dna',
    title: 'Records & DNA',
    subtitle: 'Family documents and genetic genealogy results',
    icon: Dna,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'grid',
    fieldKeys: ['family_records', 'dna_testing'],
  },
];

const SECTION_17B_GROUPS: FieldGroup[] = [
  {
    key: 'identity_contact',
    title: 'Identity & Contact',
    subtitle: 'Name, relationship, birth date, and contact details',
    icon: User,
    accent: 'from-emerald-500/[0.07] to-teal-500/[0.03]',
    iconWrap: 'bg-emerald-500/10 text-emerald-700',
    layout: 'grid',
    fieldKeys: ['person_name', 'relationship', 'birthdate', 'contact_info'],
  },
  {
    key: 'relationship_notification',
    title: 'Relationship & Notification',
    subtitle: 'Why they matter and how urgently to contact them',
    icon: Bell,
    accent: 'from-amber-500/[0.07] to-orange-500/[0.03]',
    iconWrap: 'bg-amber-500/10 text-amber-700',
    layout: 'stack',
    fieldKeys: ['importance', 'notify_instructions', 'special_considerations'],
  },
  {
    key: 'photos_mementos',
    title: 'Photos & Mementos',
    subtitle: 'Images and keepsakes related to this family member',
    icon: FileHeart,
    accent: 'from-rose-500/[0.07] to-pink-500/[0.03]',
    iconWrap: 'bg-rose-500/10 text-rose-700',
    layout: 'grid',
    fieldKeys: ['photos_mementos'],
  },
];

const SECTION_17C_GROUPS: FieldGroup[] = [
  {
    key: 'dependent_profile',
    title: 'Dependent Profile',
    subtitle: 'Who they are and how they depend on you',
    icon: Baby,
    accent: 'from-amber-500/[0.07] to-orange-500/[0.03]',
    iconWrap: 'bg-amber-500/10 text-amber-700',
    layout: 'grid',
    fieldKeys: ['dependent_name', 'relationship', 'birthdate', 'dependency_type'],
  },
  {
    key: 'care_support',
    title: 'Care & Support',
    subtitle: 'Support provided, backup caregivers, and future plans',
    icon: Heart,
    accent: 'from-rose-500/[0.07] to-pink-500/[0.03]',
    iconWrap: 'bg-rose-500/10 text-rose-700',
    layout: 'stack',
    fieldKeys: [
      'support_details',
      'backup_caregivers',
      'special_needs',
      'future_care_plans',
    ],
  },
  {
    key: 'legal_financial',
    title: 'Legal & Financial',
    subtitle: 'Guardianship documents and related accounts',
    icon: Scale,
    accent: 'from-indigo-500/[0.07] to-blue-500/[0.03]',
    iconWrap: 'bg-indigo-500/10 text-indigo-700',
    layout: 'grid',
    fieldKeys: ['legal_documents', 'financial_accounts'],
  },
];

const SECTION_17D_GROUPS: FieldGroup[] = [
  {
    key: 'friend_profile',
    title: 'Friend Profile',
    subtitle: 'Name, friendship type, and contact information',
    icon: HeartHandshake,
    accent: 'from-rose-500/[0.07] to-pink-500/[0.03]',
    iconWrap: 'bg-rose-500/10 text-rose-700',
    layout: 'grid',
    fieldKeys: [
      'friend_name',
      'friendship_type',
      'friendship_type_other',
      'contact_info',
    ],
  },
  {
    key: 'friendship_story',
    title: 'Friendship Story',
    subtitle: 'How you met, what the friendship means, and shared memories',
    icon: Sparkles,
    accent: 'from-fuchsia-500/[0.07] to-pink-500/[0.03]',
    iconWrap: 'bg-fuchsia-500/10 text-fuchsia-700',
    layout: 'stack',
    fieldKeys: ['how_we_met', 'friendship_significance', 'shared_memories'],
  },
  {
    key: 'notification_mementos',
    title: 'Notification & Mementos',
    subtitle: 'Contact urgency and photos from this friendship',
    icon: Bell,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'grid',
    fieldKeys: ['notify_instructions', 'photos_mementos'],
  },
];

const SECTION_17E_GROUPS: FieldGroup[] = [
  {
    key: 'person_profile',
    title: 'Person Profile',
    subtitle: 'Name, relationship type, and contact details',
    icon: User,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'grid',
    fieldKeys: [
      'person_name',
      'relationship_type',
      'relationship_type_other',
      'contact_info',
    ],
  },
  {
    key: 'relationship_details',
    title: 'Relationship Details',
    subtitle: 'Significance, notification preferences, and special notes',
    icon: FileHeart,
    accent: 'from-indigo-500/[0.07] to-blue-500/[0.03]',
    iconWrap: 'bg-indigo-500/10 text-indigo-700',
    layout: 'stack',
    fieldKeys: [
      'relationship_significance',
      'notify_instructions',
      'special_notes',
    ],
  },
  {
    key: 'related_documents',
    title: 'Related Documents',
    subtitle: 'Photos, letters, and documents for this relationship',
    icon: FileText,
    accent: 'from-cyan-500/[0.07] to-sky-500/[0.03]',
    iconWrap: 'bg-cyan-500/10 text-cyan-700',
    layout: 'grid',
    fieldKeys: ['relationship_documents'],
  },
];

const SECTION_17F_GROUPS: FieldGroup[] = [
  {
    key: 'item_basics',
    title: 'Item Basics',
    subtitle: 'Name, type, location, and estimated value',
    icon: Gem,
    accent: 'from-fuchsia-500/[0.07] to-pink-500/[0.03]',
    iconWrap: 'bg-fuchsia-500/10 text-fuchsia-700',
    layout: 'grid',
    fieldKeys: [
      'item_name',
      'item_type',
      'item_type_other',
      'current_location',
      'estimated_value',
    ],
  },
  {
    key: 'story_legacy',
    title: 'Story & Legacy',
    subtitle: 'Sentimental value, intended recipient, and care instructions',
    icon: Heart,
    accent: 'from-rose-500/[0.07] to-pink-500/[0.03]',
    iconWrap: 'bg-rose-500/10 text-rose-700',
    layout: 'stack',
    fieldKeys: ['sentimental_value', 'intended_recipient', 'care_instructions'],
  },
  {
    key: 'documentation',
    title: 'Documentation',
    subtitle: 'Photos and records for this sentimental item',
    icon: FileText,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'grid',
    fieldKeys: ['documentation'],
  },
];

const SECTION_17G_GROUPS: FieldGroup[] = [
  {
    key: 'pet_profile',
    title: 'Pet Profile',
    subtitle: 'Name, type, breed, and age',
    icon: PawPrint,
    accent: 'from-cyan-500/[0.07] to-sky-500/[0.03]',
    iconWrap: 'bg-cyan-500/10 text-cyan-700',
    layout: 'grid',
    fieldKeys: ['pet_name', 'pet_type', 'pet_type_other', 'breed_age'],
  },
  {
    key: 'health_daily_care',
    title: 'Health & Daily Care',
    subtitle: 'Veterinarian, medical history, feeding, and supplies',
    icon: Bone,
    accent: 'from-emerald-500/[0.07] to-teal-500/[0.03]',
    iconWrap: 'bg-emerald-500/10 text-emerald-700',
    layout: 'stack',
    fieldKeys: [
      'veterinarian',
      'medical_history',
      'feeding_care',
      'pet_supplies',
    ],
  },
  {
    key: 'emergency_registration',
    title: 'Emergency & Registration',
    subtitle: 'Emergency contacts, long-term care, and microchip details',
    icon: Bell,
    accent: 'from-amber-500/[0.07] to-orange-500/[0.03]',
    iconWrap: 'bg-amber-500/10 text-amber-700',
    layout: 'grid',
    fieldKeys: ['emergency_contact', 'long_term_care', 'registration_microchip'],
  },
  {
    key: 'veterinary_records',
    title: 'Veterinary Records',
    subtitle: 'Vaccination records, medical files, and pet photos',
    icon: FileText,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'grid',
    fieldKeys: ['veterinary_records'],
  },
];

const SUBSECTION_GROUPS: Record<SubsectionId, FieldGroup[]> = {
  '17A': SECTION_17A_GROUPS,
  '17B': SECTION_17B_GROUPS,
  '17C': SECTION_17C_GROUPS,
  '17D': SECTION_17D_GROUPS,
  '17E': SECTION_17E_GROUPS,
  '17F': SECTION_17F_GROUPS,
  '17G': SECTION_17G_GROUPS,
};

const SUBSECTION_FIELD_MAP: Record<SubsectionId, Record<string, any>> = {
  '17A': buildFieldMap(SECTION_17A.fields),
  '17B': buildFieldMap(SECTION_17B.fields),
  '17C': buildFieldMap(SECTION_17C.fields),
  '17D': buildFieldMap(SECTION_17D.fields),
  '17E': buildFieldMap(SECTION_17E.fields),
  '17F': buildFieldMap(SECTION_17F.fields),
  '17G': buildFieldMap(SECTION_17G.fields),
};

const SUBSECTION_SUBTITLE: Record<SubsectionId, string> = {
  '17A':
    'Document your ancestry, family heritage, genealogy research, and DNA records in grouped cards.',
  '17B':
    'Add family members one at a time with identity, notification, and memento details.',
  '17C':
    'Record dependents who rely on you for care, support, or guardianship.',
  '17D':
    'Capture close friends your loved ones should know about and how to reach them.',
  '17E':
    'Document mentors, caregivers, and other important people beyond immediate family.',
  '17F':
    'Preserve sentimental items with their stories, recipients, and care instructions.',
  '17G':
    'Keep pet care instructions, veterinary contacts, and records in one place.',
};

const INSTRUCTION_OVERVIEW_KEYS: Partial<Record<SubsectionId, string>> = {
  '17A': 'documents_section',
  '17C': 'dependency_documents',
  '17F': 'item_documentation',
  '17G': 'pet_documentation',
};

const SUBSECTION_OVERVIEW: Partial<
  Record<SubsectionId, { label: string; content: string }>
> = {
  '17B': {
    label: 'Family Members Overview',
    content:
      'Add each family member your loved ones should contact. Include relationship details, notification preferences, and any photos or mementos.',
  },
  '17D': {
    label: 'Close Friends Overview',
    content:
      'Document close friends who should be notified, along with the stories and memories that matter to you.',
  },
  '17E': {
    label: 'Important Relationships Overview',
    content:
      'Record mentors, caregivers, former partners, and other important people your family should know about.',
  },
};

const getSubsectionOverview = (
  subsection: SubsectionId,
  fields?: any[],
): { label: string; content: string } | null => {
  const instructionKey = INSTRUCTION_OVERVIEW_KEYS[subsection];
  if (instructionKey && fields) {
    return getInstructionOverview(fields, instructionKey);
  }
  return SUBSECTION_OVERVIEW[subsection] ?? null;
};

/* ============================================================
   TYPES / CONFIG
============================================================ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  activeSubsection?: string | null;
  activeTopicId?: string | null;
}

type UploadedAIFile = {
  file_id: string;
  mime_type: string;
  expires_at?: string;
  file_name?: string;
  uploaded_at?: number;
};

const ALLOWED_UPLOAD_TYPES = [
  'application/pdf',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
];

const MAX_UPLOAD_SIZE = 15 * 1024 * 1024;

const SUBSECTION_UI: Record<
  SubsectionId,
  {
    title: string;
    icon: React.ElementType;
    tone: {
      wrapper: string;
      icon: string;
      uploadBox: string;
      glowOne: string;
      glowTwo: string;
      header: string;
    };
    uploadTitle: string;
    uploadDescription: string;
    buttonLabel: string;
    emptyError: string;
    successMessage: string;
  }
> = {
  '17A': {
    title: 'Ancestry & Family Tree',
    icon: Users,
    tone: {
      wrapper:
        'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 hover:border-blue-300',
      icon: 'text-blue-600',
      uploadBox: 'hover:border-blue-300 hover:bg-blue-50/50',
      glowOne: 'bg-blue-100/70',
      glowTwo: 'bg-sky-100/70',
      header: 'from-slate-50 to-blue-50/70',
    },
    uploadTitle: 'Upload family tree or genealogy document',
    uploadDescription:
      'Upload family tree records, genealogy research, DNA results, ancestry notes, family stories, or historical family records. AI will fill ancestry fields.',
    buttonLabel: 'Auto-fill Ancestry',
    emptyError:
      'AI could not find ancestry or family tree information in this file.',
    successMessage:
      'AI filled ancestry and family tree fields. Please review the results.',
  },
  '17B': {
    title: 'Family Members',
    icon: Heart,
    tone: {
      wrapper:
        'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 hover:border-emerald-300',
      icon: 'text-emerald-600',
      uploadBox: 'hover:border-emerald-300 hover:bg-emerald-50/50',
      glowOne: 'bg-emerald-100/70',
      glowTwo: 'bg-green-100/70',
      header: 'from-slate-50 to-emerald-50/70',
    },
    uploadTitle: 'Upload family member document for this card',
    uploadDescription:
      'Upload a contact note, family record, photo note, letter, or family member information. AI will fill only this family member card.',
    buttonLabel: 'Auto-fill This Member',
    emptyError: 'AI could not find family member information in this file.',
    successMessage:
      'AI filled this family member card. Please review the results.',
  },
  '17C': {
    title: 'Dependents',
    icon: Baby,
    tone: {
      wrapper:
        'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-amber-50/60 hover:border-amber-300',
      icon: 'text-amber-600',
      uploadBox: 'hover:border-amber-300 hover:bg-amber-50/50',
      glowOne: 'bg-amber-100/70',
      glowTwo: 'bg-orange-100/70',
      header: 'from-slate-50 to-amber-50/70',
    },
    uploadTitle: 'Upload dependent document for this card',
    uploadDescription:
      'Upload guardianship papers, custody documents, care notes, support details, medical information, or dependent records. AI will fill only this dependent card.',
    buttonLabel: 'Auto-fill This Dependent',
    emptyError: 'AI could not find dependent information in this file.',
    successMessage: 'AI filled this dependent card. Please review the results.',
  },
  '17D': {
    title: 'Close Friends',
    icon: HeartHandshake,
    tone: {
      wrapper:
        'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-rose-50/60 hover:border-rose-300',
      icon: 'text-rose-600',
      uploadBox: 'hover:border-rose-300 hover:bg-rose-50/50',
      glowOne: 'bg-rose-100/70',
      glowTwo: 'bg-pink-100/70',
      header: 'from-slate-50 to-rose-50/70',
    },
    uploadTitle: 'Upload friend document for this card',
    uploadDescription:
      'Upload a contact note, friendship story, letter, photo note, or memory document. AI will fill only this friend card.',
    buttonLabel: 'Auto-fill This Friend',
    emptyError: 'AI could not find close friend information in this file.',
    successMessage: 'AI filled this friend card. Please review the results.',
  },
  '17E': {
    title: 'Important Relationships',
    icon: FileHeart,
    tone: {
      wrapper:
        'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-violet-50/60 hover:border-violet-300',
      icon: 'text-violet-600',
      uploadBox: 'hover:border-violet-300 hover:bg-violet-50/50',
      glowOne: 'bg-violet-100/70',
      glowTwo: 'bg-purple-100/70',
      header: 'from-slate-50 to-violet-50/70',
    },
    uploadTitle: 'Upload relationship document for this card',
    uploadDescription:
      'Upload a letter, contact note, relationship story, photo note, or important person document. AI will fill only this important relationship card.',
    buttonLabel: 'Auto-fill This Person',
    emptyError:
      'AI could not find important relationship information in this file.',
    successMessage:
      'AI filled this important relationship card. Please review the results.',
  },
  '17F': {
    title: 'Memorabilia & Sentimental Items',
    icon: Gem,
    tone: {
      wrapper:
        'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-fuchsia-50/60 hover:border-fuchsia-300',
      icon: 'text-fuchsia-600',
      uploadBox: 'hover:border-fuchsia-300 hover:bg-fuchsia-50/50',
      glowOne: 'bg-fuchsia-100/70',
      glowTwo: 'bg-pink-100/70',
      header: 'from-slate-50 to-fuchsia-50/70',
    },
    uploadTitle: 'Upload sentimental item document for this card',
    uploadDescription:
      'Upload a photo, appraisal, inventory note, item story, receipt, certificate, or documentation. AI will fill only this sentimental item card.',
    buttonLabel: 'Auto-fill This Item',
    emptyError: 'AI could not find sentimental item information in this file.',
    successMessage:
      'AI filled this sentimental item card. Please review the results.',
  },
  '17G': {
    title: 'Pet Care & Records',
    icon: Bone,
    tone: {
      wrapper:
        'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-cyan-50/60 hover:border-cyan-300',
      icon: 'text-cyan-600',
      uploadBox: 'hover:border-cyan-300 hover:bg-cyan-50/50',
      glowOne: 'bg-cyan-100/70',
      glowTwo: 'bg-sky-100/70',
      header: 'from-slate-50 to-cyan-50/70',
    },
    uploadTitle: 'Upload pet record for this card',
    uploadDescription:
      'Upload veterinary records, vaccination certificates, microchip registration, pet photos, or pet care instructions. AI will fill only this pet card.',
    buttonLabel: 'Auto-fill This Pet',
    emptyError: 'AI could not find pet care information in this file.',
    successMessage: 'AI filled this pet card. Please review the results.',
  },
};

/* ============================================================
   HELPERS
============================================================ */

const createRowId = () => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getReadableFileType = (mimeType?: string) => {
  if (!mimeType) return 'Document';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'text/plain') return 'Text';
  if (mimeType.includes('image')) return 'Image';
  return mimeType;
};

const getSafeObject = (value: any) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  return {};
};

const cleanPatchObject = (patch: any) => {
  if (!patch || typeof patch !== 'object') return {};

  return Object.fromEntries(
    Object.entries(patch).filter(([key, value]) => {
      if (key === '__rowId') return false;
      if (key.endsWith('_instructions')) return false;
      if (key.endsWith('_header')) return false;
      if (key.endsWith('_section')) return false;
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

/* ============================================================
   COMPONENT
============================================================ */

export default function Section17FamilyTreasuredConnections({
  data = {},
  onChange = () => {},
  activeSubsection,
  activeTopicId,
}: Props) {
  const [aiNotice, setAiNotice] = useState('');
  const [aiError, setAiError] = useState('');

  const [uploadingScope, setUploadingScope] = useState<string | null>(null);
  const [aiLoadingScope, setAiLoadingScope] = useState<string | null>(null);

  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, UploadedAIFile | null>
  >({});

  const latestUploadRef = useRef<Record<string, UploadedAIFile>>({});

  const aiRouting = useOptionalAiDocumentRouting();

  useRestoreAiPendingUploadForSection({
    sectionId: '17',
    setUploadedFiles,
    latestUploadRef,
  });

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  useScrollToVaultTopic(activeTopicId, JSON.stringify(data));

  useEffect(() => {
    const next = { ...data };
    let changed = false;

    if (
      !next['17A'] ||
      typeof next['17A'] !== 'object' ||
      Array.isArray(next['17A'])
    ) {
      next['17A'] = {};
      changed = true;
    }

    (['17B', '17C', '17D', '17E', '17F', '17G'] as SubsectionId[]).forEach(
      id => {
        if (!Array.isArray(next[id])) {
          next[id] = [];
          changed = true;
          return;
        }

        const withRowIds = next[id].map((item: any) => {
          if (item?.__rowId) return item;

          changed = true;

          return {
            __rowId: createRowId(),
            ...(item || {}),
          };
        });

        next[id] = withRowIds;
      },
    );

    if (changed) {
      onChange(next);
    }

    // Initialize once only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSubsection = (key: SubsectionId, value: any) => {
    onChange({
      ...data,
      [key]: value,
    });
  };

  const updateObjectField = (
    subsection: SubsectionId,
    key: string,
    value: any,
  ) => {
    const current = getSafeObject(data[subsection]);

    updateSubsection(subsection, {
      ...current,
      [key]: value,
    });
  };

  const updateObjectWithPatch = (subsection: SubsectionId, patch: any) => {
    const current = getSafeObject(data[subsection]);

    updateSubsection(subsection, {
      ...current,
      ...patch,
    });
  };

  const getItems = (subsection: SubsectionId) => {
    return Array.isArray(data[subsection]) ? data[subsection] : [];
  };

  const makeEmptyItem = (fields: any[]) => ({
    __rowId: createRowId(),
    ...Object.fromEntries(fields.map(field => [field.key, ''])),
  });

  const addItem = (section: any) => {
    const subsection = section.subsectionId as SubsectionId;
    const items = getItems(subsection);

    updateSubsection(subsection, [...items, makeEmptyItem(section.fields)]);
  };

  const updateItem = (
    subsection: SubsectionId,
    index: number,
    key: string,
    value: any,
  ) => {
    const items = getItems(subsection);
    const next = [...items];

    next[index] = {
      ...(next[index] || {}),
      [key]: value,
      __rowId: next[index]?.__rowId || createRowId(),
    };

    updateSubsection(subsection, next);
  };

  const updateItemWithPatch = (
    subsection: SubsectionId,
    index: number,
    patch: any,
  ) => {
    const items = getItems(subsection);
    const next = [...items];

    next[index] = {
      ...(next[index] || {}),
      ...patch,
      __rowId: next[index]?.__rowId || createRowId(),
    };

    updateSubsection(subsection, next);
  };

  const removeItem = (subsection: SubsectionId, index: number) => {
    const items = getItems(subsection);

    updateSubsection(
      subsection,
      items.filter((_: any, itemIndex: number) => itemIndex !== index),
    );
  };

  const getUploadedFileForScope = (scope: string) => {
    const pendingFile =
      aiRouting?.getPendingFileForSection('17', String(scope)) ?? null;

    return resolveAiUploadedFileForScope(scope, uploadedFiles, latestUploadRef, pendingFile);
  };

  const handleDocumentUpload = async (file?: File | null, scope?: string, runAutofill?: () => void | Promise<void>) => {
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

      const uploaded = await uploadAIDocument(file, { section: '17' });

      const uploadedRecord: UploadedAIFile = buildUploadedAiFile(uploaded, file, {
        sectionId: '17',
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

  const handleAutofill = async ({
    subsection,
    scope,
    itemIndex,
  }: {
    subsection: SubsectionId;
    scope: string;
    itemIndex?: number;
  }) => {
    const config = SUBSECTION_UI[subsection];

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
        sectionKey: 'family_treasured_connections',
        sectionId: '17',
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

      if (subsection === '17A') {
        updateObjectWithPatch('17A', extracted);
      } else {
        if (typeof itemIndex !== 'number') {
          setAiError('Please select a card to autofill.');
          return;
        }

        updateItemWithPatch(subsection, itemIndex, extracted);
      }

      setAiNotice(config.successMessage);
    } catch (err: any) {
      setAiError(err?.message || 'AI autofill failed');
    } finally {
      setAiLoadingScope(null);
      releaseDeferredAiRoutingDialog(aiRouting);
    }
  };

  const renderUploader = ({
    subsection,
    scope,
    itemIndex,
  }: {
    subsection: SubsectionId;
    scope: string;
    itemIndex?: number;
  }) => {
    const config = SUBSECTION_UI[subsection];
    const uploadedFile = getUploadedFileForScope(scope);
    const isUploading = uploadingScope === scope;
    const isReading = aiLoadingScope === scope;
    const highlightUpload =
      aiRouting?.shouldHighlightUpload('17', String(scope)) ?? false;
    const tone = config.tone;

    return (
      <div
        data-ai-upload-zone={highlightUpload ? 'highlight' : undefined}
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

        {highlightUpload && (
          <div className="relative rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
            {AI_PENDING_ROUTED_HINT}
          </div>
        )}

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
            data-ai-autofill-trigger
            onClick={() => handleAutofill({ subsection, scope, itemIndex })}
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
          <AiDocumentDropZoneInput
            onFile={uploaded =>
        handleDocumentUpload(uploaded, scope, () =>
          handleAutofill({ subsection, scope, itemIndex }),
        )}
            disabled={isAnyAIActionRunning}
            showSupportedHint
            className={[
              'group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-3.5 text-center transition',
              tone.uploadBox,
              isAnyAIActionRunning ? 'pointer-events-none opacity-60' : '',
            ].join(' ')}
            iconClassName={tone.icon}
          />
        </div>

        <AiUploadedAttachmentList file={uploadedFile} />

        {isUploading && (
          <div className="relative flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading document…
          </div>
        )}
      </div>
    );
  };

  const render17A = () => {
    const show = !activeSubsection || activeSubsection === '17A';
    const sectionData = getSafeObject(data['17A']);
    const config = SUBSECTION_UI['17A'];
    const Icon = config.icon;

    return (
      <div
        id="subsection-17A"
        className={`rounded-3xl ${show ? 'border border-primary p-1' : ''}`}
      >
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader
            className={`border-b bg-gradient-to-r ${config.tone.header}`}
          >
            <CardTitle className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${config.tone.icon}`} />
              17A. {SECTION_17A.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 p-5">
            {renderUploader({
              subsection: '17A',
              scope: '17A-full',
            })}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {SECTION_17A.fields.map(field => (
                <DynamicFormField
                  key={field.key}
                  field={field}
                  value={sectionData?.[field.key]}
                  formData={sectionData}
                  onChange={value => updateObjectField('17A', field.key, value)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRepeatable = (section: any) => {
    const subsection = section.subsectionId as SubsectionId;
    const show = !activeSubsection || activeSubsection === subsection;
    const items = getItems(subsection);
    const config = SUBSECTION_UI[subsection];
    const Icon = config.icon;

    return (
      <div
        key={subsection}
        id={`subsection-${subsection}`}
        className={`rounded-3xl ${show ? 'border border-primary p-1' : ''}`}
      >
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader
            className={`border-b bg-gradient-to-r ${config.tone.header}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${config.tone.icon}`} />
                {subsection}. {section.title}
              </CardTitle>

              <Button
                type="button"
                size="sm"
            data-ai-autofill-trigger
            onClick={() => addItem(section)}
                className="w-auto rounded-xl sm:w-auto"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add {section.itemLabel}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-5">
            {items.length === 0 && (
              <div className="rounded-2xl border border-dashed bg-slate-50 px-4 py-8 text-center">
                <p className="text-sm font-medium text-slate-700">
                  No {section.itemLabel.toLowerCase()} added yet.
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Add a card first, then upload a document to autofill that
                  specific card.
                </p>

                <Button
                  type="button"
                  size="sm"
            data-ai-autofill-trigger
            onClick={() => addItem(section)}
                  className="mt-4 rounded-xl"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add {section.itemLabel}
                </Button>
              </div>
            )}

            {items.map((item: any, index: number) => {
              const rowId = item?.__rowId || `${subsection}-${index}`;
              const scope = `${subsection}-${rowId}`;
              const topicProps = getTopicCardProps(
                subsection,
                index,
                activeTopicId,
              );

              return (
                <Card
                  key={rowId}
                  id={topicProps.id}
                  className={topicProps.className}
                >
                  <CardHeader className="border-b bg-slate-50/70">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {section.itemLabel} #{index + 1}
                        </p>

                        <p className="text-sm text-slate-500">
                          Upload a document here to autofill only this card.
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeItem(subsection, index)}
                        className="w-auto rounded-xl sm:w-auto"
                      >
                        <Minus className="mr-1 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 p-5">
                    {renderUploader({
                      subsection,
                      scope,
                      itemIndex: index,
                    })}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {section.fields.map((field: any) => (
                        <DynamicFormField
                          key={`${field.key}-${rowId}`}
                          field={field}
                          value={item?.[field.key]}
                          formData={item}
                          rowId={rowId}
                          onChange={(value: any) =>
                            updateItem(subsection, index, field.key, value)
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

      {render17A()}

      {REPEATABLE_SECTIONS.map(renderRepeatable)}
    </div>
  );
}
