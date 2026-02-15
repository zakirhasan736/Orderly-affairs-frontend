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
/* CONFIG — 15A (NON-REPEATABLE)                                       */
/* ------------------------------------------------------------------ */

const SECTION_15A = {
  subsectionId: '15A',
  title: 'Health Insurance & Medical Information',
  fields: [
    {
      key: 'health_overview_instructions',
      label: 'Health Information Overview',
      type: 'Instructions',
      content:
        'This section helps document your health information, medical providers, and insurance details so your next of kin can manage your healthcare needs and make informed decisions.',
    },
    {
      key: 'primary_health_insurance',
      label: 'Primary Health Insurance',
      type: 'TextInputWithUpload',
      helperText:
        'Primary insurance company, policy number, group number, and cards',
    },
    {
      key: 'secondary_health_insurance',
      label: 'Secondary Health Insurance',
      type: 'TextInputWithUpload',
      helperText: 'Secondary or supplemental insurance information',
    },
    {
      key: 'medicare_medicaid',
      label: 'Medicare / Medicaid Information',
      type: 'TextInputWithUpload',
      helperText:
        'Medicare or Medicaid numbers, cards, and supplement information',
    },
    {
      key: 'medical_conditions_header',
      label: 'Current Medical Conditions',
      type: 'Instructions',
      content: 'Document your current health conditions and medical history',
    },
    {
      key: 'current_conditions',
      label: 'Current Medical Conditions',
      type: 'TextArea',
    },
    {
      key: 'allergies',
      label: 'Allergies',
      type: 'TextArea',
    },
    {
      key: 'current_medications',
      label: 'Current Medications',
      type: 'TextInputWithUpload',
    },
    {
      key: 'medical_devices',
      label: 'Medical Devices / Equipment',
      type: 'TextArea',
    },
    {
      key: 'emergency_contacts_header',
      label: 'Emergency Medical Contacts',
      type: 'Instructions',
      content: 'Important contacts for medical emergencies',
    },
    {
      key: 'emergency_contact_1',
      label: 'Emergency Contact 1',
      type: 'TextInput',
    },
    {
      key: 'emergency_contact_2',
      label: 'Emergency Contact 2',
      type: 'TextInput',
    },
    {
      key: 'medical_power_of_attorney',
      label: 'Medical Power of Attorney',
      type: 'TextInputWithUpload',
    },
  ],
};

/* ------------------------------------------------------------------ */
/* CONFIG — 15B (REPEATABLE)                                           */
/* ------------------------------------------------------------------ */

const SECTION_15B = {
  subsectionId: '15B',
  title: 'Healthcare Providers',
  itemLabel: 'Healthcare Provider',
  fields: [
    {
      key: 'provider_name',
      label: 'Provider / Practice Name',
      type: 'TextInput',
    },
    {
      key: 'specialty',
      label: 'Specialty',
      type: 'Dropdown',
      options: [
        'Primary Care Physician',
        'Cardiologist',
        'Dermatologist',
        'Dentist',
        'Optometrist/Ophthalmologist',
        'Neurologist',
        'Orthopedist',
        'Gynecologist',
        'Urologist',
        'Psychiatrist/Psychologist',
        'Pharmacy',
        'Physical Therapy',
        'Chiropractor',
        'Other Specialist',
      ],
    },
    {
      key: 'doctor_name',
      label: 'Doctor / Provider Name',
      type: 'TextInput',
    },
    {
      key: 'contact_info',
      label: 'Contact Information',
      type: 'TextInputWithUpload',
    },
    {
      key: 'patient_id',
      label: 'Patient ID / Account Number',
      type: 'TextInput',
    },
    {
      key: 'frequency',
      label: 'Visit Frequency',
      type: 'TextInput',
    },
    {
      key: 'last_visit',
      label: 'Last Visit Date',
      type: 'DatePicker',
    },
    {
      key: 'conditions_treated',
      label: 'Conditions Treated',
      type: 'TextArea',
    },
    {
      key: 'insurance_accepted',
      label: 'Insurance Information',
      type: 'TextArea',
    },
    {
      key: 'portal_access',
      label: 'Patient Portal Access',
      type: 'TextArea',
    },
    {
      key: 'important_notes',
      label: 'Important Notes',
      type: 'TextArea',
    },
  ],
};

/* ------------------------------------------------------------------ */
/* PROPS                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  activeSubsection?: string | null;
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function Section15HealthInformation({
  data = {},
  onChange = () => {},
  activeSubsection,
}: Props) {
  /* ---------- 15A DATA ---------- */
  const section15A = data['15A'] || {};

  const update15A = (key: string, value: any) => {
    onChange({
      ...data,
      '15A': {
        ...section15A,
        [key]: value,
      },
    });
  };

  /* ---------- 15B DATA ---------- */
  const providers: any[] = Array.isArray(data['15B']) ? data['15B'] : [];

  const updateProviders = (next: any[]) => {
    onChange({
      ...data,
      '15B': next,
    });
  };

  const addProvider = () => {
    const emptyProvider = Object.fromEntries(
      SECTION_15B.fields.map(f => [f.key, '']),
    );
    updateProviders([...providers, emptyProvider]);
  };

  const updateProvider = (index: number, key: string, value: any) => {
    const next = [...providers];
    next[index] = { ...next[index], [key]: value };
    updateProviders(next);
  };

  const removeProvider = (index: number) => {
    updateProviders(providers.filter((_, i) => i !== index));
  };

  const show15A = !activeSubsection || activeSubsection === '15A';
  const show15B = !activeSubsection || activeSubsection === '15B';

  /* ------------------------------------------------------------------ */
  /* RENDER                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="space-y-10">
      {/* ====================== 15A ====================== */}
      <div
        id="subsection-15A"
        className={`rounded-3xl ${show15A ? 'border border-primary' : ''}`}
      >
        <Card>
          <CardHeader>
            <CardTitle>15A. {SECTION_15A.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {SECTION_15A.fields.map(field => (
              <DynamicFormField
                key={field.key}
                field={field}
                value={section15A[field.key]}
                formData={section15A}
                onChange={value => update15A(field.key, value)}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ====================== 15B ====================== */}
      <div
        id="subsection-15B"
        className={`rounded-3xl ${show15B ? 'border border-primary' : ''}`}
      >
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>15B. {SECTION_15B.title}</CardTitle>
              <Button size="sm" onClick={addProvider}>
                <Plus className="h-4 w-4 mr-1" />
                Add {SECTION_15B.itemLabel}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {providers.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No healthcare providers added yet.
              </div>
            )}

            {providers.map((provider, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <strong>
                    {SECTION_15B.itemLabel} #{index + 1}
                  </strong>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeProvider(index)}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {SECTION_15B.fields.map(field => (
                    <DynamicFormField
                      key={field.key}
                      field={field}
                      value={provider[field.key]}
                      formData={provider}
                      onChange={value =>
                        updateProvider(index, field.key, value)
                      }
                    />
                  ))}
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
