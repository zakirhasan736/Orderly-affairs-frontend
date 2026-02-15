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

const SECTION_7A = {
  subsectionId: '7A',
  title: 'Insurance Policies',
  itemLabel: 'Policy',
  fields: [
    {
      key: 'policy_type',
      label: 'Type of Policy',
      type: 'Dropdown',
      options: [
        'Life',
        'Homeowner/Renter',
        'Vehicle',
        'Health',
        'Medical/Dental',
        'Medicaid Supplements',
        'Long Term Care',
        'Disability',
        'Job Loss',
        'Umbrella',
        'Annuity',
        'Other',
      ],
      required: true,
    },
    {
      key: 'policy_type_other',
      label: 'Please specify other policy type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of insurance policy',
      conditionalDisplay: { field: 'policy_type', value: 'Other' },
    },
    {
      key: 'policy_documents_life',
      label: 'Life Insurance Policy Documents',
      type: 'TextInputWithUpload',
      conditionalDisplay: { field: 'policy_type', value: 'Life' },
      helperText:
        'Upload your life insurance policy documents, beneficiary information, or take photos of policy cards and statements.',
    },
    {
      key: 'policy_company',
      label: 'Insurance Company',
      type: 'TextInput',
      helperText: 'Name of the insurance company',
    },
    {
      key: 'policy_number',
      label: 'Policy Number',
      type: 'TextInputWithUpload',
      helperText:
        'Enter the policy number or upload a photo of the policy showing the number',
    },
    {
      key: 'coverage_amount',
      label: 'Coverage Amount',
      type: 'TextInput',
      helperText: 'Coverage amount or benefit value',
    },
    {
      key: 'beneficiaries',
      label: 'Beneficiaries',
      type: 'TextArea',
      helperText: 'List of beneficiaries and their percentages',
    },
    {
      key: 'policy_contact',
      label: 'Policy Contact Information',
      type: 'TextInputWithUpload',
      helperText:
        'Agent contact info, customer service numbers, or upload business cards',
    },
    {
      key: 'premium_info',
      label: 'Premium Information',
      type: 'TextArea',
      helperText: 'Premium amount, payment schedule, and payment method',
    },
    {
      key: 'policy_documents',
      label: 'Policy Documents',
      type: 'TextInputWithUpload',
      helperText: 'Upload policy documents, statements, or cards',
    },
    {
      key: 'notes',
      label: 'Additional Notes',
      type: 'TextArea',
      helperText: 'Any other important information about this policy',
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

export default function Section7InsurancePolicies({
  data = {},
  onChange = () => {},
  activeSubsection,
}: Props) {
  /* ---------- SAFE ARRAY NORMALIZER ---------- */
  const policies: any[] = Array.isArray(data['7A']) ? data['7A'] : [];

  const updatePolicies = (next: any[]) => {
    onChange({
      ...data,
      '7A': next,
    });
  };

  const addPolicy = () => {
    const emptyPolicy = Object.fromEntries(
      SECTION_7A.fields.map(f => [f.key, '']),
    );
    updatePolicies([...policies, emptyPolicy]);
  };

  const updatePolicy = (index: number, key: string, value: any) => {
    const next = [...policies];
    next[index] = { ...next[index], [key]: value };
    updatePolicies(next);
  };

  const removePolicy = (index: number) => {
    updatePolicies(policies.filter((_, i) => i !== index));
  };

  const show7A = !activeSubsection || activeSubsection === '7A';

  return (
    <div className="space-y-8">
      <div
        id="subsection-7A"
        className={`rounded-3xl ${show7A ? 'border border-primary' : ''}`}
      >
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>7A. {SECTION_7A.title}</CardTitle>
              <Button size="sm" onClick={addPolicy}>
                <Plus className="h-4 w-4 mr-1" />
                Add {SECTION_7A.itemLabel}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {policies.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No insurance policies added yet.
              </div>
            )}

            {policies.map((policy, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <strong>
                    {SECTION_7A.itemLabel} #{index + 1}
                  </strong>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removePolicy(index)}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {SECTION_7A.fields.map(field => (
                    <DynamicFormField
                      key={field.key}
                      field={field}
                      value={policy[field.key]}
                      formData={policy}
                      onChange={value => updatePolicy(index, field.key, value)}
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
