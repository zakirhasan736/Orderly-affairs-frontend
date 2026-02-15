'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { DynamicFormField } from '@/components/DynamicFormField';

interface Props {
  data: {
    next_of_kin_letter_data?: any;
  };
  onChange: (data: any) => void;
}

/**
 * SECTION 3
 * Letters to Next of Kin
 *
 * Manual, static layout
 * No dynamic subsections
 * No repeatables
 * Same pattern as Section 1 intro
 */

export default function Section3NextOfKinLetter({
  data = {},
  onChange = () => {},
}: Props) {
  const update = (value: any) => {
    onChange({
      ...data,
      next_of_kin_letter_data: value,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        {/* ================= HEADER ================= */}
        <CardHeader>
          <CardTitle>Letters to Next of Kin</CardTitle>
        </CardHeader>

        {/* ================= CONTENT ================= */}
        <CardContent className="space-y-8">
          {/* Instructions */}
          <DynamicFormField
            field={{
              key: 'letter_instructions',
              label: 'Letter to Next of Kin Instructions',
              type: 'Instructions',
              content:
                'This section creates an important introductory letter for your designated next of kin. The letter explains how to access and use your Orderly Affairs Kit.\n\nInformation automatically populates from your Access Management section to create a personalized letter with login credentials and access details.\n\nThis letter serves as the first point of contact for your next of kin when they need to manage your affairs.',
            }}
            value={null}
            onChange={() => {}}
          />

          {/* Letter Editor */}
          <DynamicFormField
            field={{
              key: 'next_of_kin_letter_data',
              label: 'Letter to Next of Kin',
              type: 'NextOfKinLetter',
              helperText:
                'Create and customize the introductory letter for your next of kin with auto-populated access information.',
            }}
            value={data.next_of_kin_letter_data}
            onChange={update}
            formData={data}
          />
        </CardContent>
      </Card>
    </div>
  );
}
