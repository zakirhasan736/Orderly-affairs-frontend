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

const SECTION_11A = {
  subsectionId: '11A',
  title: 'Military Service Record',
  itemLabel: 'Service Period',
  fields: [
    {
      key: 'branch_of_service',
      label: 'Branch of Service',
      type: 'Dropdown',
      options: [
        'Army',
        'Navy',
        'Air Force',
        'Marines',
        'Coast Guard',
        'Space Force',
        'National Guard',
        'Reserves',
        'Other',
      ],
      helperText: 'Which branch of the military you served in',
    },
    {
      key: 'branch_of_service_other',
      label: 'Please specify other branch of service',
      type: 'TextInput',
      helperText: 'Please describe the specific branch or service',
      conditionalDisplay: {
        field: 'branch_of_service',
        value: 'Other',
      },
    },
    {
      key: 'service_dates',
      label: 'Service Dates',
      type: 'TextInput',
      helperText: 'Start and end dates of service (e.g., 1985–1989)',
    },
    {
      key: 'rank_achieved',
      label: 'Highest Rank Achieved',
      type: 'TextInput',
      helperText: 'Final rank or pay grade attained',
    },
    {
      key: 'military_occupational_specialty',
      label: 'Military Occupational Specialty (MOS)',
      type: 'TextInput',
      helperText: 'Your job or specialty code in the military',
    },
    {
      key: 'deployments',
      label: 'Deployments / Stations',
      type: 'TextArea',
      helperText: 'Locations where you were stationed or deployed',
    },
    {
      key: 'combat_service',
      label: 'Combat Service',
      type: 'RadioButtons',
      options: ['Yes', 'No'],
      helperText: 'Did you serve in a combat zone?',
    },
    {
      key: 'awards_decorations',
      label: 'Awards & Decorations',
      type: 'TextArea',
      helperText: 'Military awards, medals, ribbons, or commendations received',
    },
    {
      key: 'discharge_type',
      label: 'Type of Discharge',
      type: 'Dropdown',
      options: [
        'Honorable',
        'General (Under Honorable Conditions)',
        'Other Than Honorable',
        'Bad Conduct',
        'Dishonorable',
        'Medical',
      ],
      helperText: 'Type of military discharge received',
    },
    {
      key: 'va_benefits',
      label: 'VA Benefits Information',
      type: 'TextArea',
      helperText:
        'Current VA benefits, disability ratings, or services you receive',
    },
    {
      key: 'military_documents',
      label: 'Military Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload DD-214, service records, discharge papers, or note their location',
    },
    {
      key: 'burial_preferences',
      label: 'Military Burial Preferences',
      type: 'TextArea',
      helperText:
        'Preferences for military funeral honors or burial in national cemetery',
    },
    {
      key: 'veteran_contacts',
      label: 'Veteran Organization Contacts',
      type: 'TextInputWithUpload',
      helperText:
        'VFW, American Legion, or other veteran organization contacts',
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

export default function Section11MilitaryService({
  data = {},
  onChange = () => {},
  activeSubsection,
}: Props) {
  /* ---------- SAFE ARRAY NORMALIZER ---------- */
  const servicePeriods: any[] = Array.isArray(data['11A']) ? data['11A'] : [];

  const updateServicePeriods = (next: any[]) => {
    onChange({
      ...data,
      '11A': next,
    });
  };

  const addServicePeriod = () => {
    const emptyItem = Object.fromEntries(
      SECTION_11A.fields.map(f => [f.key, '']),
    );
    updateServicePeriods([...servicePeriods, emptyItem]);
  };

  const updateServicePeriod = (index: number, key: string, value: any) => {
    const next = [...servicePeriods];
    next[index] = { ...next[index], [key]: value };
    updateServicePeriods(next);
  };

  const removeServicePeriod = (index: number) => {
    updateServicePeriods(servicePeriods.filter((_, i) => i !== index));
  };

  const show11A = !activeSubsection || activeSubsection === '11A';

  return (
    <div className="space-y-8">
      <div
        id="subsection-11A"
        className={`rounded-3xl ${show11A ? 'border border-primary' : ''}`}
      >
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>11A. {SECTION_11A.title}</CardTitle>
              <Button size="sm" onClick={addServicePeriod}>
                <Plus className="h-4 w-4 mr-1" />
                Add {SECTION_11A.itemLabel}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {servicePeriods.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No military service records added yet.
              </div>
            )}

            {servicePeriods.map((item, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <strong>
                    {SECTION_11A.itemLabel} #{index + 1}
                  </strong>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeServicePeriod(index)}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {SECTION_11A.fields.map(field => (
                    <DynamicFormField
                      key={field.key}
                      field={field}
                      value={item[field.key]}
                      formData={item}
                      onChange={value =>
                        updateServicePeriod(index, field.key, value)
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
