'use client';

import React from 'react';
import type { AiExtractedFieldPreview } from '@/utils/aiDocumentRouting';

type Props = {
  fields: AiExtractedFieldPreview[];
  compact?: boolean;
};

export function AiExtractedFieldsPreview({ fields, compact = false }: Props) {
  if (!fields.length) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2 text-sm leading-relaxed text-slate-500">
        Field details will appear when you auto-fill this section.
      </p>
    );
  }

  return (
    <ul
      className={
        compact
          ? 'space-y-1.5'
          : 'max-h-44 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white/80 p-3'
      }
    >
      {fields.map(field => (
        <li
          key={`${field.field_path}-${field.field_label}`}
          className="text-sm leading-relaxed text-slate-700"
        >
          <span className="font-medium text-slate-900">{field.field_label}:</span>{' '}
          <span className="break-words">{field.value}</span>
        </li>
      ))}
    </ul>
  );
}
