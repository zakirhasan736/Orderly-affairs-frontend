'use client';

import React, { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@common/ui/utils';
import { SchemaFieldControl } from '@/components/vault-prototype/SchemaFieldControl';
import {
  schemaFieldPreview,
  schemaValueIsFilled,
} from '@/vault-prototype/schemaFieldPreview';
import { fieldViewKey, type SchemaField, type SchemaSub } from '@/vault-prototype/types';
import { useOptionalDashboardAiBatch } from '@/contexts/DashboardAiBatchContext';

type NotesTab = 'details' | 'connections' | 'files' | 'notes' | 'reminders';

const TABS: Array<{ id: NotesTab; label: string }> = [
  { id: 'details', label: 'Details' },
  { id: 'connections', label: 'Connections' },
  { id: 'files', label: 'Files' },
  { id: 'notes', label: 'Notes' },
  { id: 'reminders', label: 'Reminders' },
];

const DETAIL_KEYS = [
  'created_date',
  'creators',
  'recipients',
  'title',
  'document_type',
] as const;

const REMINDER_KEYS = [
  'reminder_on',
  'reminder_date',
  'reminder_cadence',
  'reminder_note',
] as const;

function fieldByStore(sub: SchemaSub, store: string): SchemaField | undefined {
  return sub.fields.find(field => fieldViewKey(field) === store);
}

function AddableFieldRow({
  field,
  values,
  setValues,
  disabled,
  sectionId,
  editingKey,
  setEditingKey,
  addLabel = 'Add',
}: {
  field: SchemaField;
  values: Record<string, unknown>;
  setValues: (next: Record<string, unknown>) => void;
  disabled?: boolean;
  sectionId: string;
  editingKey: string | null;
  setEditingKey: (key: string | null) => void;
  addLabel?: string;
}) {
  const batch = useOptionalDashboardAiBatch();
  const key = fieldViewKey(field);
  const filled = schemaValueIsFilled(values[key]);
  const editing = editingKey === key;
  const preview = schemaFieldPreview(field, values[key]);

  const closeEditor = () => setEditingKey(null);

  return (
    <div className="border-b border-[#E4EAF0] py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <p className="pt-0.5 text-[13.5px] font-semibold text-[#213D59]">{field.k}</p>
        {!editing ? (
          filled ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setEditingKey(key)}
              className="shrink-0 text-[13px] font-semibold text-[#619FCE] hover:text-[#2E7FAD]"
            >
              Edit
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setEditingKey(key)}
              className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-[#619FCE] hover:text-[#2E7FAD]"
            >
              {addLabel === '+ Add' ? <Plus className="h-3.5 w-3.5" /> : null}
              {addLabel}
            </button>
          )
        ) : null}
      </div>
      {!editing && filled ? (
        <p className="mt-1 text-[14px] text-[#213D59]">{preview}</p>
      ) : null}
      {editing ? (
        <div className="mt-2 space-y-2">
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
          <button
            type="button"
            onClick={closeEditor}
            className="text-[12.5px] font-semibold text-[#619FCE] hover:text-[#2E7FAD]"
          >
            Done
          </button>
        </div>
      ) : null}
    </div>
  );
}

function NoteBodyField({
  field,
  values,
  setValues,
  disabled,
}: {
  field: SchemaField;
  values: Record<string, unknown>;
  setValues: (next: Record<string, unknown>) => void;
  disabled?: boolean;
}) {
  const key = fieldViewKey(field);
  return (
    <textarea
      id={key}
      disabled={disabled}
      value={String(values[key] || '')}
      placeholder={field.ph || 'Click here to start writing'}
      onChange={event => setValues({ ...values, [key]: event.target.value })}
      className="min-h-[220px] w-full resize-y rounded-[16px] border border-[#E4EAF0] bg-white px-4 py-4 text-[15px] leading-relaxed text-[#213D59] outline-none placeholder:text-[#9AA4AE] focus:border-[#3EB1E5] focus:shadow-[0_0_0_3px_rgba(62,177,229,.14)]"
    />
  );
}

function FilesPanel({
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
  const inputRef = useRef<HTMLInputElement>(null);
  const key = fieldViewKey(field);
  const [dragging, setDragging] = useState(false);

  const attach = (file: File) => {
    setValues({
      ...values,
      [key]: {
        text: file.name,
        files: [{ name: file.name, type: file.type, size: file.size }],
      },
    });
    batch?.enqueueFiles([file], { sectionId, source: 'section' });
  };

  const filled = schemaValueIsFilled(values[key]);
  const preview = schemaFieldPreview(field, values[key]);

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'rounded-[14px] border border-dashed px-4 py-8 text-center transition',
          disabled
            ? 'border-[#E4EAF0] opacity-60'
            : dragging
              ? 'cursor-pointer border-[#3EB1E5] bg-[#EAF6FD]'
              : 'cursor-pointer border-[#C5D4E0] bg-[#F6F8FA] hover:border-[#619FCE]',
        )}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragEnter={event => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={event => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={event => {
          event.preventDefault();
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          setDragging(false);
        }}
        onDrop={event => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) attach(file);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          disabled={disabled}
          accept=".pdf,.txt,.png,.jpg,.jpeg,.webp,.heic,application/pdf,text/plain,image/png,image/jpeg,image/webp,image/heic"
          onChange={event => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) attach(file);
          }}
        />
        <p className="text-[14px] text-[#7A8794]">
          Drag files here or{' '}
          <span className="font-semibold text-[#619FCE]">Browse files</span>
        </p>
      </div>
      {filled ? (
        <div className="flex items-center justify-between rounded-[12px] border border-[#E4EAF0] bg-white px-3 py-2.5">
          <div>
            <p className="text-[12px] font-semibold text-[#6A7481]">Attached</p>
            <p className="mt-0.5 text-[14px] font-semibold text-[#213D59]">{preview}</p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="text-[13px] font-semibold text-[#619FCE] hover:text-[#2E7FAD]"
          >
            Replace
          </button>
        </div>
      ) : null}
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
  const [activeTab, setActiveTab] = useState<NotesTab>('details');
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const body = fieldByStore(sub, 'body');
  const connections = fieldByStore(sub, 'connections');
  const fileField = fieldByStore(sub, 'files');

  const renderFieldRows = (
    stores: readonly string[],
    addLabel: 'Add' | '+ Add' = 'Add',
  ) =>
    stores.map(store => {
      const field = fieldByStore(sub, store);
      if (!field) return null;
      return (
        <AddableFieldRow
          key={store}
          field={field}
          values={values}
          setValues={setValues}
          disabled={disabled}
          sectionId={sectionId}
          editingKey={editingKey}
          setEditingKey={setEditingKey}
          addLabel={addLabel}
        />
      );
    });

  return (
    <div className="space-y-4">
      <div className="flex w-full max-w-full gap-1.5 overflow-x-auto rounded-full border border-[#E4EAF0] bg-white p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setEditingKey(null);
            }}
            className={cn(
              'min-h-9 shrink-0 rounded-full px-3.5 text-[13px] font-semibold transition md:h-8 md:min-h-8',
              activeTab === tab.id
                ? 'bg-[#EAF6FD] text-[#213D59]'
                : 'text-[#7A8794] hover:text-[#213D59]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'details' ? (
        <div className="space-y-4">
          {body ? (
            <NoteBodyField
              field={body}
              values={values}
              setValues={setValues}
              disabled={disabled}
            />
          ) : null}
          <div>
            <h3 className="mb-1 text-[15px] font-bold text-[#213D59]">Details</h3>
            <div className="rounded-[14px] border border-[#E4EAF0] bg-white px-3">
              {renderFieldRows(DETAIL_KEYS)}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'connections' ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-[#213D59]">Connections</h3>
          </div>
          <div className="rounded-[14px] border border-[#E4EAF0] bg-white px-3">
            {connections ? (
              <AddableFieldRow
                field={connections}
                values={values}
                setValues={setValues}
                disabled={disabled}
                sectionId={sectionId}
                editingKey={editingKey}
                setEditingKey={setEditingKey}
                addLabel="+ Add"
              />
            ) : (
              <p className="py-4 text-[13.5px] text-[#7A8794]">
                Link people, accounts, or vault sections this note relates to.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === 'files' ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-[#213D59]">Files</h3>
          </div>
          {fileField ? (
            <FilesPanel
              field={fileField}
              values={values}
              setValues={setValues}
              disabled={disabled}
              sectionId={sectionId}
            />
          ) : null}
        </div>
      ) : null}

      {activeTab === 'notes' ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-[#213D59]">Notes</h3>
          </div>
          {body ? (
            <NoteBodyField
              field={body}
              values={values}
              setValues={setValues}
              disabled={disabled}
            />
          ) : null}
        </div>
      ) : null}

      {activeTab === 'reminders' ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-[#213D59]">Reminders</h3>
          </div>
          <div className="rounded-[14px] border border-[#E4EAF0] bg-white px-3">
            {renderFieldRows(REMINDER_KEYS, '+ Add')}
          </div>
        </div>
      ) : null}
    </div>
  );
}
