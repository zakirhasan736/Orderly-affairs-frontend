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

/* ------------------------------------------------------------------ */
/* CONFIG — HARD WIRED (from your JSON)                                */
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
      helperText: 'Secondary email address (if applicable)',
    },
    {
      key: 'secondary_email_password',
      label: 'Secondary Email Password',
      type: 'TextInput',
      inputType: 'password',
      helperText: 'Password for secondary email account (if applicable)',
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
        'If you use common answers to security questions (e.g., "mother\'s maiden name" or "first car"), you can list them here or write: "See Password Manager" or "Ask [Name]."',
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
            'How this person relates to you (professional, family, friend, etc.)',
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
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  activeSubsection?: string | null;
}

export default function Section1VitalInformation({
  data = {},
  onChange = () => {},
  activeSubsection,
}: Props) {

  /* -------------------- NORMALIZED STATE -------------------- */

  const vitalInfo = data.vital_info || {};

  const updateVital = (key: string, value: any) => {
    onChange({
      ...data,
      vital_info: {
        ...vitalInfo,
        [key]: value,
      },
    });
  };

  const getGroupArray = (key: string) =>
    Array.isArray(data[key]) ? data[key] : [];

  const updateGroup = (key: string, value: any[]) => {
    onChange({ ...data, [key]: value });
  };

  const addGroupItem = (groupKey: string, fields: any[]) => {
    const newItem = Object.fromEntries(fields.map(f => [f.key, '']));
    updateGroup(groupKey, [...getGroupArray(groupKey), newItem]);
  };

  const updateGroupItem = (groupKey: string, index: number, fieldKey: string, value: any) => {
    const items = [...getGroupArray(groupKey)];
    items[index] = { ...items[index], [fieldKey]: value };
    updateGroup(groupKey, items);
  };

  const removeGroupItem = (groupKey: string, index: number) => {
    updateGroup(groupKey, getGroupArray(groupKey).filter((_, i) => i !== index));
  };



  return (
    <div className="space-y-8">

      {/* ====================== 1A — VITAL INFO ====================== */}
      {/* {show1A && ( */}
        <Card id="subsection-1A">
          <CardHeader>
            <CardTitle>1A. Vital Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {SECTION_1.vitalFields.map(field => (
              <DynamicFormField
                key={field.key}
                field={field}
                value={vitalInfo[field.key]}
                onChange={v => updateVital(field.key, v)}
              />
            ))}
          </CardContent>
        </Card>
      {/* )} */}

      {/* ====================== 1C — CONTACTS ====================== */}
      {/* {show1C && ( */}
        <Card id="subsection-1C">
          <CardHeader>
            <CardTitle>1C. Key Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {SECTION_1.contactGroups.map(group => (
              <div key={group.key} className="space-y-4">
                <div className="flex justify-between">
                  <h3 className="font-semibold">{group.title}</h3>
                  <Button size="sm" onClick={() => addGroupItem(group.key, group.fields)}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>

                {getGroupArray(group.key).map((item, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex justify-between mb-4">
                      <strong>{group.title} #{i + 1}</strong>
                      <Button size="sm" variant="destructive" onClick={() => removeGroupItem(group.key, i)}>
                        <Minus className="h-4 w-4 mr-1" /> Remove
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {group.fields.map(field => (
                        <DynamicFormField
                          key={field.key}
                          field={field}
                          value={item[field.key]}
                          onChange={v => updateGroupItem(group.key, i, field.key, v)}
                        />
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      {/* )} */}

    </div>
  );
}