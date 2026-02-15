import React from 'react';
import { Textarea } from '@common/ui/textarea';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`min-h-[300px] resize-none ${className}`}
      rows={15}
    />
  );
}