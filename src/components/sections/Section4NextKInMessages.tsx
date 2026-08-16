'use client';

import React from 'react';
import { MessageCircleHeart } from 'lucide-react';
import { DynamicFormField } from '@/components/DynamicFormField';

const SECTION_4A = {
  id: '4A',
  title: 'Personal Messages',
  fields: [
    {
      key: 'letters_data',
      label: 'Letters and Messages',
      type: 'LettersToNextOfKin',
    },
  ],
};

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  isActive?: boolean;
  fullFormData?: any;
  messagesClearNonce?: number;
}

export default function Section4NextOfKinMessages({
  data = {},
  onChange = () => {},
  fullFormData,
  messagesClearNonce = 0,
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
    <div id="subsection-4A" className="space-y-4">
      <div className="flex gap-3 rounded-[16px] border border-[#CFE6F5] bg-[#EAF6FD] px-4 py-3.5 text-[13.5px] text-[#213D59] max-md:rounded-[14px]">
        <MessageCircleHeart className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Private messages stay held until the moment you choose. Write a letter,
          record video or audio, then set delivery for a date, a milestone, or
          after your Vault unlocks.
        </p>
      </div>

      {SECTION_4A.fields.map(field => (
        <DynamicFormField
          key={field.key}
          field={field}
          value={subsectionData[field.key]}
          formData={fullFormData}
          onChange={value => updateSubsection(field.key, value)}
          lettersClearNonce={messagesClearNonce}
        />
      ))}
    </div>
  );
}
