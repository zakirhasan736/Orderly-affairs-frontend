'use client';

import React from 'react';
import { SchemaFieldControl } from '@/components/vault-prototype/SchemaFieldControl';
import { fieldViewKey, type SchemaField, type SchemaSub } from '@/vault-prototype/types';
import { useOptionalDashboardAiBatch } from '@/contexts/DashboardAiBatchContext';

function fieldByStore(sub: SchemaSub, store: string): SchemaField | undefined {
  return sub.fields.find(field => fieldViewKey(field) === store);
}

function DetailRow({
  field,
  values,
  setValues,
  disabled,
  sectionId,
}: {
  field: SchemaField;
  values: Record<string, unknown>;
  setValues: (next: Record<string, unknown>) => void;
  disabled?: boolean;
  sectionId: string;
}) {
  const batch = useOptionalDashboardAiBatch();
  const key = fieldViewKey(field);
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#E4EAF0] py-3 last:border-b-0">
      <p className="pt-2 text-[13.5px] font-semibold text-[#213D59]">{field.k}</p>
      <div className="min-w-0 flex-1 max-w-[70%]">
        <SchemaFieldControl
          field={field}
          compact
          hideLabel
          disabled={disabled}
          value={values[key]}
          onChange={value => setValues({ ...values, [key]: value })}
          onFilePicked={file =>
            batch?.enqueueFiles([file], { sectionId, source: 'section' })
          }
        />
      </div>
    </div>
  );
}

export function FamilyNotesEditor({
  sub,
  values,
  setValues,
  disabled,
  sectionId,
}: {
  sub: SchemaSub;
  values: Record<string, unknown>;
  setValues: (next: Record<string, unknown>) => void;
  disabled?: boolean;
  sectionId: string;
}) {
  const batch = useOptionalDashboardAiBatch();
  const title = fieldByStore(sub, 'title');
  const body = fieldByStore(sub, 'body');
  const detailKeys = [
    'created_date',
    'creators',
    'recipients',
    'document_type',
    'connections',
  ];
  const fileField = fieldByStore(sub, 'files');
  const reminderKeys = [
    'reminder_on',
    'reminder_date',
    'reminder_cadence',
    'reminder_note',
  ];

  return (
    <div className="space-y-5">
      {title ? (
        <SchemaFieldControl
          field={title}
          disabled={disabled}
          value={values[fieldViewKey(title)]}
          onChange={value => setValues({ ...values, [fieldViewKey(title)]: value })}
        />
      ) : null}

      {body ? (
        <textarea
          id={fieldViewKey(body)}
          disabled={disabled}
          value={String(values[fieldViewKey(body)] || '')}
          placeholder={body.ph || 'Click here to start writing'}
          onChange={event =>
            setValues({ ...values, [fieldViewKey(body)]: event.target.value })
          }
          className="min-h-[180px] w-full resize-y rounded-[16px] border border-[#E4EAF0] bg-white px-4 py-3 text-[15px] leading-relaxed text-[#213D59] outline-none placeholder:text-[#9AA4AE] focus:border-[#3EB1E5] focus:shadow-[0_0_0_3px_rgba(62,177,229,.14)]"
        />
      ) : null}

      <div>
        <h3 className="mb-1 text-[15px] font-bold text-[#213D59]">Details</h3>
        <div className="rounded-[14px] border border-[#E4EAF0] bg-white px-3">
          {detailKeys.map(store => {
            const field = fieldByStore(sub, store);
            if (!field) return null;
            return (
              <DetailRow
                key={store}
                field={field}
                values={values}
                setValues={setValues}
                disabled={disabled}
                sectionId={sectionId}
              />
            );
          })}
        </div>
      </div>

      {fileField ? (
        <div>
          <h3 className="mb-1 text-[15px] font-bold text-[#213D59]">Files</h3>
          <div className="rounded-[14px] border border-dashed border-[#C5D4E0] bg-[#F6F8FA] p-3">
            <SchemaFieldControl
              field={fileField}
              disabled={disabled}
              value={values[fieldViewKey(fileField)]}
              onChange={value =>
                setValues({ ...values, [fieldViewKey(fileField)]: value })
              }
              onFilePicked={file =>
                batch?.enqueueFiles([file], { sectionId, source: 'section' })
              }
            />
          </div>
        </div>
      ) : null}

      <div>
        <h3 className="mb-1 text-[15px] font-bold text-[#213D59]">Reminders</h3>
        <div className="rounded-[14px] border border-[#E4EAF0] bg-white px-3">
          {reminderKeys.map(store => {
            const field = fieldByStore(sub, store);
            if (!field) return null;
            return (
              <DetailRow
                key={store}
                field={field}
                values={values}
                setValues={setValues}
                disabled={disabled}
                sectionId={sectionId}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
