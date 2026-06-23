import React from 'react';
import { Letters } from './Letters';

interface LettersToNextOfKinFieldProps {
  value?: any;
  onChange?: (value: any) => void;
  helperText?: string;
  formData?: any;
  clearNonce?: number;
}

export function LettersToNextOfKinField({
  value,
  onChange,
  helperText,
  formData,
  clearNonce,
}: LettersToNextOfKinFieldProps) {
  return (
    <div className="w-full max-w-full sm:px-0" data-field-type="LettersToNextOfKin">
      <div className="w-full max-w-none">
        <Letters
          value={value}
          onChange={onChange}
          isNextOfKin={false}
          formData={formData}
          clearNonce={clearNonce}
          embeddedInSection
        />
      </div>
    </div>
  );
}