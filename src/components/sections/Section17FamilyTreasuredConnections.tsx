'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/common/ui/card';
import { Button } from '@/components/common/ui/button';
import { Plus, Minus } from 'lucide-react';
import { DynamicFormField } from '@/components/DynamicFormField';

/* ============================================================
   CONFIG — 17A (NON-REPEATABLE)
============================================================ */

const SECTION_17A = {
  subsectionId: '17A',
  title: 'Ancestry & Family Tree',
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
  subsectionId: string,
  title: string,
  itemLabel: string,
  fields: any[],
) => ({ subsectionId, title, itemLabel, fields });

/* ============================================================
   CONFIG — 17B–17G
============================================================ */

const SECTIONS = [
  createRepeatableSection('17B', 'Family Members', 'Family Member', [
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
  ]),

  createRepeatableSection('17C', 'Dependents', 'Dependent', [
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
  ]),

  createRepeatableSection('17D', 'Close Friends', 'Friend', [
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
      helperText:
        'Special memories, inside jokes, or stories you want preserved',
    },
    {
      key: 'photos_mementos',
      label: 'Photos or Mementos',
      type: 'TextInputWithUpload',
      helperText: 'Upload photos or documents related to this friendship',
    },
  ]),
  createRepeatableSection(
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
  ),
  createRepeatableSection(
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
  ),
  createRepeatableSection('17G', 'Pet Care & Records', 'Pet', [
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
  ]),
];

/* ============================================================
   COMPONENT
============================================================ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  activeSubsection?: string | null;
}

export default function Section17FamilyTreasuredConnections({
  data = {},
  onChange = () => {},
  activeSubsection,
}: Props) {
  const update = (key: string, value: any) =>
    onChange({ ...data, [key]: value });

  /* -------------------- 17A -------------------- */

  const show17A = !activeSubsection || activeSubsection === '17A';

  /* -------------------- REPEATABLE -------------------- */

  const renderRepeatable = (section: any) => {
    const show = !activeSubsection || activeSubsection === section.subsectionId;

    const items = Array.isArray(data[section.subsectionId])
      ? data[section.subsectionId]
      : [];

    const addItem = () =>
      update(section.subsectionId, [
        ...items,
        Object.fromEntries(section.fields.map((f: any) => [f.key, ''])),
      ]);

    const updateItem = (i: number, key: string, val: any) => {
      const next = [...items];
      next[i] = { ...next[i], [key]: val };
      update(section.subsectionId, next);
    };

    const removeItem = (i: number) =>
      update(
        section.subsectionId,
        items.filter((_: any, idx: number) => idx !== i),
      );

    return (
      <div
        key={section.subsectionId}
        id={`subsection-${section.subsectionId}`}
        className={`rounded-3xl ${show ? 'border border-primary' : ''}`}
      >
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>
              {section.subsectionId}. {section.title}
            </CardTitle>
            <Button size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> Add {section.itemLabel}
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {items.map((item: any, i: number) => (
              <Card key={i} className="p-6">
                <div className="flex justify-between mb-4">
                  <strong>
                    {section.itemLabel} #{i + 1}
                  </strong>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeItem(i)}
                  >
                    <Minus className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {section.fields.map((field: any) => (
                    <DynamicFormField
                      key={field.key}
                      field={field}
                      value={item[field.key]}
                      formData={item}
                      onChange={(v: any) => updateItem(i, field.key, v)}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* ====================== 17A ====================== */}
      <div
        id="subsection-17A"
        className={`rounded-3xl ${show17A ? 'border border-primary' : ''}`}
      >
        <Card>
          <CardHeader>
            <CardTitle>17A. {SECTION_17A.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            {SECTION_17A.fields.map(field => (
              <DynamicFormField
                key={field.key}
                field={field}
                value={data['17A']?.[field.key]}
                formData={data['17A']}
                onChange={v =>
                  update('17A', { ...data['17A'], [field.key]: v })
                }
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {SECTIONS.map(renderRepeatable)}
    </div>
  );
}
