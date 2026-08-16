'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Plus } from 'lucide-react';
import { cn } from '@common/ui/utils';
import { fieldViewKey, type SchemaField, type SchemaSub } from '@/vault-prototype/types';
import { SchemaFieldControl } from '@/components/vault-prototype/SchemaFieldControl';
import { VaultDetailDrawer } from '@/components/vault-prototype/VaultDetailDrawer';
import { SchemaIcon } from '@/vault-prototype/icons';
import { useOptionalDashboardAiBatch } from '@/contexts/DashboardAiBatchContext';
import {
  partitionSchemaFields,
  schemaFieldPreview,
  schemaValueIsFilled,
} from '@/vault-prototype/schemaFieldPreview';
import {
  layoutSchemaFields,
  schemaFieldIsHalf,
} from '@/vault-prototype/fieldLayout';

export type FillEmptyFieldsTarget = {
  title: string;
  iconName?: string;
  sub: SchemaSub;
  values: Record<string, unknown>;
  onSave: (next: Record<string, unknown>) => void;
  sectionId: string;
  disabled?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  target: FillEmptyFieldsTarget | null;
};

export function FillEmptyFieldsSheet({ open, onClose, target }: Props) {
  const batch = useOptionalDashboardAiBatch();
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [showFilled, setShowFilled] = useState(false);
  const [revealMasked, setRevealMasked] = useState<Record<string, boolean>>({});
  /** Originally empty keys the user finished with Done + a value. */
  const [movedToFilled, setMovedToFilled] = useState<Set<string>>(new Set());
  const [openedEmptyKeys, setOpenedEmptyKeys] = useState<Set<string>>(
    new Set(),
  );

  const originalParts = useMemo(
    () => partitionSchemaFields(target?.sub.fields || [], target?.values || {}),
    [target],
  );

  useEffect(() => {
    if (!open || !target) {
      setDraft({});
      setEditingKey(null);
      setShowFilled(false);
      setRevealMasked({});
      setMovedToFilled(new Set());
      setOpenedEmptyKeys(new Set());
      return;
    }
    setDraft({ ...target.values });
    const { empty } = partitionSchemaFields(target.sub.fields, target.values);
    setShowFilled(empty.length === 0);
    setMovedToFilled(new Set());
    setOpenedEmptyKeys(new Set());
    setEditingKey(null);
  }, [open, target]);

  const emptyFields = useMemo(() => {
    const visible = originalParts.empty.filter(field => {
      const key = fieldViewKey(field);
      if (editingKey === key || openedEmptyKeys.has(key)) return true;
      return !movedToFilled.has(key);
    });
    return layoutSchemaFields(visible);
  }, [originalParts.empty, movedToFilled, editingKey, openedEmptyKeys]);

  const filledFields = useMemo(() => {
    const extras = originalParts.empty.filter(field => {
      const key = fieldViewKey(field);
      if (editingKey === key || openedEmptyKeys.has(key)) return false;
      return movedToFilled.has(key);
    });
    return layoutSchemaFields([...originalParts.filled, ...extras]);
  }, [originalParts.empty, originalParts.filled, movedToFilled, editingKey, openedEmptyKeys]);

  const filledCount = filledFields.length;
  const total = target?.sub.fields.length || 0;

  const openField = (key: string) => {
    setEditingKey(key);
    setOpenedEmptyKeys(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const openAllEmpty = () => {
    const keys = originalParts.empty
      .map(field => fieldViewKey(field))
      .filter(key => !movedToFilled.has(key));
    setOpenedEmptyKeys(new Set(keys));
    setEditingKey(keys[0] || null);
  };

  const finishField = (key: string) => {
    setOpenedEmptyKeys(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    setMovedToFilled(prev => {
      const next = new Set(prev);
      if (schemaValueIsFilled(draft[key])) next.add(key);
      else next.delete(key);
      return next;
    });
    setEditingKey(current => (current === key ? null : current));
  };

  const save = () => {
    if (!target || target.disabled) return;
    target.onSave(draft);
    onClose();
  };

  const cellClass = (field: SchemaField, expanded: boolean) =>
    cn(
      'min-w-0 rounded-[12px] border border-[#E4EAF0] bg-white p-2.5',
      expanded && 'border-[#3EB1E5]/50 bg-[#EAF6FD]/30',
      schemaFieldIsHalf(field)
        ? 'col-span-2 sm:col-span-1'
        : 'col-span-2',
    );

  const renderEditor = (field: SchemaField) => {
    const key = fieldViewKey(field);
    return (
      <div className="mt-2">
        <SchemaFieldControl
          field={field}
          compact
          hideLabel
          disabled={target?.disabled}
          value={draft[key]}
          onChange={value => setDraft(prev => ({ ...prev, [key]: value }))}
          onFilePicked={file =>
            target
              ? batch?.enqueueFiles([file], {
                  sectionId: target.sectionId,
                  source: 'section',
                })
              : undefined
          }
        />
        {field.t === 'masked' && schemaValueIsFilled(draft[key]) ? (
          <button
            type="button"
            className="mt-1 text-[12px] font-semibold text-[#2E7FAD]"
            onClick={() =>
              setRevealMasked(prev => ({ ...prev, [key]: !prev[key] }))
            }
          >
            {revealMasked[key] ? 'Hide' : 'Show'}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => finishField(key)}
          className="mt-2 inline-flex h-8 items-center gap-1 rounded-full bg-[#213D59] px-3 text-[12px] font-semibold text-white"
        >
          <Check className="h-3.5 w-3.5" />
          Done
        </button>
      </div>
    );
  };

  const renderEmptyRow = (field: SchemaField) => {
    const key = fieldViewKey(field);
    const openInput = editingKey === key || openedEmptyKeys.has(key);
    return (
      <div key={key} className={cellClass(field, openInput)}>
        <div className="flex min-h-9 items-start gap-2">
          <p className="min-w-0 flex-1 text-[12.5px] font-semibold leading-snug text-[#6A7481]">
            {field.k}
          </p>
          {openInput ? (
            <span className="shrink-0 text-[11px] font-semibold text-[#2E7FAD]">
              Writing…
            </span>
          ) : (
            <button
              type="button"
              disabled={target?.disabled}
              onClick={() => openField(key)}
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-[#1F9D6B] px-2.5 text-[12px] font-semibold text-white hover:bg-[#18875C]"
              aria-label={`Add ${field.k}`}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          )}
        </div>
        {openInput ? renderEditor(field) : null}
      </div>
    );
  };

  const renderFilledRow = (field: SchemaField) => {
    const key = fieldViewKey(field);
    const editing = editingKey === key;
    const preview = schemaFieldPreview(field, draft[key], {
      revealMasked: revealMasked[key],
    });
    return (
      <div key={key} className={cellClass(field, editing)}>
        <div className="flex min-h-9 items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold text-[#6A7481]">{field.k}</p>
            {!editing ? (
              <p className="mt-0.5 truncate text-[14px] font-semibold text-[#213D59]">
                {preview || '—'}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={target?.disabled}
            onClick={() => setEditingKey(key)}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-[#E4EAF0] bg-white px-2.5 text-[12px] font-semibold text-[#213D59] hover:bg-[#EAF6FD]"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        </div>
        {editing ? renderEditor(field) : null}
      </div>
    );
  };

  const remainingEmpty = emptyFields.length;

  return (
    <VaultDetailDrawer
      open={open}
      wide
      title={target?.title || 'Fill empty fields'}
      subtitle={
        total
          ? `${filledCount} of ${total} filled${
              remainingEmpty ? ` · ${remainingEmpty} still empty` : ''
            }`
          : undefined
      }
      icon={
        target?.iconName ? (
          <SchemaIcon name={target.iconName} className="h-5 w-5" />
        ) : undefined
      }
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#E4EAF0] bg-white px-4 text-[14px] font-semibold text-[#213D59] sm:h-10 sm:min-h-10"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={target?.disabled}
            onClick={save}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3EB1E5] px-5 text-[14px] font-semibold text-white sm:ml-auto sm:h-10 sm:min-h-10 hover:bg-[#2E7FAD]"
          >
            Save filled fields
          </button>
        </>
      }
    >
      {!target ? null : (
        <div className="space-y-4">
          <p className="text-[13.5px] leading-relaxed text-[#7A8794]">
            Tap + Add to open a field. Keep typing in that box — it stays here
            until you press Done.
          </p>

          {emptyFields.length > 0 ? (
            <section>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-[13px] font-bold text-[#213D59]">
                  Empty fields
                </h4>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#FDF4E4] px-2 py-0.5 text-[11px] font-bold text-[#B4761A]">
                    {remainingEmpty} to fill
                  </span>
                  {remainingEmpty > 1 ? (
                    <button
                      type="button"
                      disabled={target.disabled}
                      onClick={openAllEmpty}
                      className="inline-flex h-8 items-center gap-1 rounded-full border border-[#3EB1E5]/50 bg-[#EAF6FD] px-2.5 text-[12px] font-semibold text-[#213D59]"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#3EB1E5]" />
                      Open all empty
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {emptyFields.map(renderEmptyRow)}
              </div>
            </section>
          ) : (
            <p className="rounded-[12px] border border-[#E8F6F0] bg-[#E8F6F0] px-3 py-2.5 text-[13.5px] font-semibold text-[#1F9D6B]">
              Every field in this area has a value.
            </p>
          )}

          {filledFields.length > 0 ? (
            <section>
              <button
                type="button"
                onClick={() => setShowFilled(openNow => !openNow)}
                className="mb-1 flex w-full items-center justify-between"
              >
                <h4 className="text-[13px] font-bold text-[#213D59]">
                  Already filled
                </h4>
                <span className="text-[12px] font-semibold text-[#2E7FAD]">
                  {showFilled ? 'Hide' : `Show ${filledFields.length}`}
                </span>
              </button>
              {showFilled ? (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {filledFields.map(renderFilledRow)}
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      )}
    </VaultDetailDrawer>
  );
}
