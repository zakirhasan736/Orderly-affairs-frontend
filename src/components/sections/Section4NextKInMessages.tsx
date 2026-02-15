'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/common/ui/card';
import { DynamicFormField } from '@/components/DynamicFormField';

/* ------------------------------------------------------------------ */
/* CONFIG — matches JSON exactly                                       */
/* ------------------------------------------------------------------ */

const SECTION_4A = {
  id: '4A',
  title: 'Personal Messages',
  fields: [
    {
      key: 'letters_instructions',
      label: 'Messages to loved ones and friends Instructions',
      type: 'Instructions',
      content:
        'This section allows you to create personal messages for your loved ones that can be delivered at specific times or upon your passing. You can write heartfelt letters, record video messages, or create audio recordings. Each message can be customized with delivery triggers - either on a specific date (like an anniversary or birthday) or upon your death.\n\nTypes of Messages You Can Create:\n• Written Letters: Traditional heartfelt letters with rich text formatting\n• Video Messages: Personal video recordings with your voice and presence\n• Audio Messages: Voice recordings for a more intimate, personal touch\n\nDelivery Options:\n• Upon Death: Messages delivered when you pass away\n• Specific Dates: Messages delivered on special occasions, anniversaries, birthdays\n\nThis feature helps ensure your loved ones receive your guidance, love, and final words exactly when they need them most.',
    },
    {
      key: 'letters_data',
      label: 'Letters and Messages',
      type: 'LettersToNextOfKin',
      helperText:
        'Create and manage personal letters, video messages, and audio recordings for your loved ones',
    },
  ],
};

/* ------------------------------------------------------------------ */
/* PROPS                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  isActive?: boolean;
  fullFormData?: any;
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function Section4NextOfKinMessages({
  data = {},
  onChange = () => {},
  isActive = false,
  fullFormData,
}: Props) {
  const subsectionData = data['4A'] || {};

  const updateSubsection = (key: string, value: any) => {
    onChange({
      ...data,
      '4A': {
        ...subsectionData,
        [key]: value,
      },
    });
  };

  return (
    <Card
      id="subsection-4A"
      className={isActive ? 'ring-2 ring-primary/50 bg-primary/5' : ''}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[16px]">
          <span className="text-sm text-muted-foreground">{SECTION_4A.id}</span>
          {SECTION_4A.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        {SECTION_4A.fields.map(field => (
          <DynamicFormField
            key={field.key}
            field={field}
            value={subsectionData[field.key]}
            formData={fullFormData}
            onChange={value => updateSubsection(field.key, value)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
