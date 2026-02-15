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

const SECTION_10A = {
  subsectionId: '10A',
  title: 'Educational Background',
  itemLabel: 'Education',
  fields: [
    {
      key: 'institution_name',
      label: 'Institution Name',
      type: 'TextInput',
      helperText: 'Name of school, college, or university',
    },
    {
      key: 'degree_type',
      label: 'Degree / Certification Type',
      type: 'Dropdown',
      options: [
        'High School Diploma',
        'Associate Degree',
        "Bachelor's Degree",
        "Master's Degree",
        'Doctoral Degree',
        'Professional Certification',
        'Trade Certification',
        'Other',
      ],
      helperText: 'Type of degree or certification earned',
    },
    {
      key: 'degree_type_other',
      label: 'Please specify other degree/certification type',
      type: 'TextInput',
      helperText:
        'Please describe the specific type of degree or certification',
      conditionalDisplay: { field: 'degree_type', value: 'Other' },
    },
    {
      key: 'field_of_study',
      label: 'Field of Study',
      type: 'TextInput',
      helperText: 'Major, concentration, or area of study',
    },
    {
      key: 'graduation_year',
      label: 'Graduation Year',
      type: 'TextInput',
      helperText: 'Year graduated or completed',
    },
    {
      key: 'honors_awards',
      label: 'Honors & Awards',
      type: 'TextArea',
      helperText: 'Academic honors, awards, or special recognitions',
    },
    {
      key: 'documents',
      label: 'Educational Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload diplomas, certificates, transcripts, or note their location',
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

export default function Section10EducationAccomplishments({
  data = {},
  onChange = () => {},
  activeSubsection,
}: Props) {
  /* ---------- SAFE ARRAY NORMALIZER ---------- */
  const educationItems: any[] = Array.isArray(data['10A']) ? data['10A'] : [];

  const updateEducation = (next: any[]) => {
    onChange({
      ...data,
      '10A': next,
    });
  };

  const addEducation = () => {
    const emptyItem = Object.fromEntries(
      SECTION_10A.fields.map(f => [f.key, '']),
    );
    updateEducation([...educationItems, emptyItem]);
  };

  const updateEducationItem = (index: number, key: string, value: any) => {
    const next = [...educationItems];
    next[index] = { ...next[index], [key]: value };
    updateEducation(next);
  };

  const removeEducation = (index: number) => {
    updateEducation(educationItems.filter((_, i) => i !== index));
  };

  const show10A = !activeSubsection || activeSubsection === '10A';

  return (
    <div className="space-y-8">
      <div
        id="subsection-10A"
        className={`rounded-3xl ${show10A ? 'border border-primary' : ''}`}
      >
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>10A. {SECTION_10A.title}</CardTitle>
              <Button size="sm" onClick={addEducation}>
                <Plus className="h-4 w-4 mr-1" />
                Add {SECTION_10A.itemLabel}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {educationItems.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No education records added yet.
              </div>
            )}

            {educationItems.map((item, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <strong>
                    {SECTION_10A.itemLabel} #{index + 1}
                  </strong>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeEducation(index)}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {SECTION_10A.fields.map(field => (
                    <DynamicFormField
                      key={field.key}
                      field={field}
                      value={item[field.key]}
                      formData={item}
                      onChange={value =>
                        updateEducationItem(index, field.key, value)
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
