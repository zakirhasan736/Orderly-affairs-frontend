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

const SECTION_9A = {
  subsectionId: '9A',
  title: 'Charitable Contributions',
  itemLabel: 'Charity / Cause',
  fields: [
    {
      key: 'charity_name',
      label: 'Charity / Organization Name',
      type: 'TextInput',
      helperText: 'Name of the charitable organization',
    },
    {
      key: 'cause_type',
      label: 'Type of Cause',
      type: 'Dropdown',
      options: [
        'Religious',
        'Educational',
        'Medical/Health',
        'Environmental',
        'Animal Welfare',
        'Community Services',
        'Arts & Culture',
        'International Aid',
        'Veterans',
        'Other',
      ],
      helperText: 'Category of charitable cause',
    },
    {
      key: 'cause_type_other',
      label: 'Please specify other cause type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of charitable cause',
      conditionalDisplay: { field: 'cause_type', value: 'Other' },
    },
    {
      key: 'contribution_type',
      label: 'Type of Contribution',
      type: 'RadioButtons',
      options: [
        'Regular Ongoing Donations',
        'Annual Contribution',
        'Occasional Giving',
        'Planned in Will/Trust',
        'Other',
      ],
      helperText: 'How you contribute to this organization',
    },
    {
      key: 'contribution_type_other',
      label: 'Please specify other contribution type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of contribution',
      conditionalDisplay: { field: 'contribution_type', value: 'Other' },
    },
    {
      key: 'contribution_amount',
      label: 'Contribution Amount',
      type: 'TextInput',
      helperText: 'Amount and frequency (e.g., $50/month, $500/year)',
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      type: 'TextArea',
      helperText:
        'How payments are made (automatic withdrawal, check, online, etc.)',
    },
    {
      key: 'account_info',
      label: 'Account / Donor Information',
      type: 'TextInputWithUpload',
      helperText:
        'Donor ID, account numbers, or login information for online giving',
    },
    {
      key: 'contact_details',
      label: 'Charity Contact Information',
      type: 'TextInputWithUpload',
      helperText: 'Phone, email, address, or upload contact information',
    },
    {
      key: 'special_instructions',
      label: 'Special Instructions',
      type: 'TextArea',
      helperText:
        'Instructions for continuing, modifying, or discontinuing donations',
    },
    {
      key: 'will_trust_provision',
      label: 'Will / Trust Provision',
      type: 'TextArea',
      helperText: 'If included in will or trust, note the provision details',
    },
    {
      key: 'tax_documents',
      label: 'Tax Documents',
      type: 'TextInputWithUpload',
      helperText: 'Upload donation receipts or tax-related documents',
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

export default function Section9CharitableGiving({
  data = {},
  onChange = () => {},
  activeSubsection,
}: Props) {
  /* ---------- SAFE ARRAY NORMALIZER ---------- */
  const charities: any[] = Array.isArray(data['9A']) ? data['9A'] : [];

  const updateCharities = (next: any[]) => {
    onChange({
      ...data,
      '9A': next,
    });
  };

  const addCharity = () => {
    const emptyCharity = Object.fromEntries(
      SECTION_9A.fields.map(f => [f.key, '']),
    );
    updateCharities([...charities, emptyCharity]);
  };

  const updateCharity = (index: number, key: string, value: any) => {
    const next = [...charities];
    next[index] = { ...next[index], [key]: value };
    updateCharities(next);
  };

  const removeCharity = (index: number) => {
    updateCharities(charities.filter((_, i) => i !== index));
  };

  const show9A = !activeSubsection || activeSubsection === '9A';

  return (
    <div className="space-y-8">
      <div
        id="subsection-9A"
        className={`rounded-3xl ${show9A ? 'border border-primary' : ''}`}
      >
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>9A. {SECTION_9A.title}</CardTitle>
              <Button size="sm" onClick={addCharity}>
                <Plus className="h-4 w-4 mr-1" />
                Add {SECTION_9A.itemLabel}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {charities.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No charitable contributions added yet.
              </div>
            )}

            {charities.map((charity, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <strong>
                    {SECTION_9A.itemLabel} #{index + 1}
                  </strong>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeCharity(index)}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {SECTION_9A.fields.map(field => (
                    <DynamicFormField
                      key={field.key}
                      field={field}
                      value={charity[field.key]}
                      formData={charity}
                      onChange={value => updateCharity(index, field.key, value)}
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
