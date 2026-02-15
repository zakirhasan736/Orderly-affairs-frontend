import React from 'react';
import { Letters } from './Letters';

interface LettersToNextOfKinFieldProps {
  value?: any;
  onChange?: (value: any) => void;
  helperText?: string;
  formData?: any;
}

export function LettersToNextOfKinField({ value, onChange, helperText, formData }: LettersToNextOfKinFieldProps) {
  return (
    <div className="w-full max-w-none" data-field-type="LettersToNextOfKin">
      <div className="w-full max-w-none">
        <Letters
          value={value}
          onChange={onChange}
          isNextOfKin={false}
          formData={formData}
        />
      </div>
    </div>
  );
}