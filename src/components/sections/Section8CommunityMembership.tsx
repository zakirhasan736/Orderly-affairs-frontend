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

const SECTION_8A = {
  subsectionId: '8A',
  title: 'Group Memberships',
  itemLabel: 'Group / Organization',
  fields: [
    {
      key: 'organization_name',
      label: 'Organization Name',
      type: 'TextInput',
      helperText: 'Name of the group, club, or organization',
    },
    {
      key: 'organization_type',
      label: 'Type of Organization',
      type: 'Dropdown',
      options: [
        'Religious/Church',
        'Professional Association',
        'Social Club',
        'Volunteer Organization',
        'Hobby Group',
        'Sports/Recreation',
        'Educational',
        'Political',
        'Other',
      ],
      helperText: 'Category that best describes this organization',
    },
    {
      key: 'organization_type_other',
      label: 'Please specify other organization type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of organization',
      conditionalDisplay: { field: 'organization_type', value: 'Other' },
    },
    {
      key: 'membership_details',
      label: 'Membership Details',
      type: 'TextArea',
      helperText: 'Your role, membership number, or special responsibilities',
    },
    {
      key: 'contact_info',
      label: 'Contact Information',
      type: 'TextInputWithUpload',
      helperText: 'Phone, email, address, or upload contact cards',
    },
    {
      key: 'importance',
      label: 'Importance to Me',
      type: 'TextArea',
      helperText:
        'Why this group is meaningful to you and any special memories',
    },
    {
      key: 'notify_instructions',
      label: 'Notification Instructions',
      type: 'TextArea',
      helperText:
        'Should this organization be notified of your passing? Any special requests?',
    },
    {
      key: 'documents',
      label: 'Related Documents',
      type: 'TextInputWithUpload',
      helperText: 'Membership cards, certificates, or important documents',
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

export default function Section8CommunityMembership({
  data = {},
  onChange = () => {},
  activeSubsection,
}: Props) {
  /* ---------- SAFE ARRAY NORMALIZER ---------- */
  const groups: any[] = Array.isArray(data['8A']) ? data['8A'] : [];

  const updateGroups = (next: any[]) => {
    onChange({
      ...data,
      '8A': next,
    });
  };

  const addGroup = () => {
    const emptyGroup = Object.fromEntries(
      SECTION_8A.fields.map(f => [f.key, '']),
    );
    updateGroups([...groups, emptyGroup]);
  };

  const updateGroup = (index: number, key: string, value: any) => {
    const next = [...groups];
    next[index] = { ...next[index], [key]: value };
    updateGroups(next);
  };

  const removeGroup = (index: number) => {
    updateGroups(groups.filter((_, i) => i !== index));
  };

  const show8A = !activeSubsection || activeSubsection === '8A';

  return (
    <div className="space-y-8">
      <div
        id="subsection-8A"
        className={`rounded-3xl ${show8A ? 'border border-primary' : ''}`}
      >
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>8A. {SECTION_8A.title}</CardTitle>
              <Button size="sm" onClick={addGroup}>
                <Plus className="h-4 w-4 mr-1" />
                Add {SECTION_8A.itemLabel}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {groups.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No group memberships added yet.
              </div>
            )}

            {groups.map((group, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <strong>
                    {SECTION_8A.itemLabel} #{index + 1}
                  </strong>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeGroup(index)}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {SECTION_8A.fields.map(field => (
                    <DynamicFormField
                      key={field.key}
                      field={field}
                      value={group[field.key]}
                      formData={group}
                      onChange={value => updateGroup(index, field.key, value)}
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
