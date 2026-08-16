'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Check,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Landmark,
  Pencil,
  Plus,
  Shield,
} from 'lucide-react';
import { cn } from '@common/ui/utils';
import { fieldShouldMask } from '@/utils/sensitiveFields';

export type AiReviewDetailField = {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  sensitive?: boolean;
  hint?: string;
  labelEditable?: boolean;
  sectionId?: string;
  sectionTitle?: string;
  badge?: string;
  onLabelChange?: (label: string) => void;
  onChange: (value: string) => void;
};

type Props = {
  fields: AiReviewDetailField[];
  emptyMessage?: string;
  onAddField?: () => void;
  addFieldLabel?: string;
  className?: string;
  /** Split filled vs empty into HTML-style section areas. */
  splitEmpty?: boolean;
  /** Expand this section accordion when matched-section cards change. */
  focusSectionId?: string;
};

const ENTITY_KEYS = new Set([
  'bank_name',
  'institution',
  'financial_institution',
  'employer_name',
  'company_name',
  'insurance_company',
  'policy_company',
  'school_name',
]);

const ACCOUNT_KEYS = new Set([
  'account_type',
  'account_nickname',
  'account_name',
]);

const IDENTIFIER_KEYS = new Set([
  'account_number',
  'routing_number',
  'vin',
  'policy_number',
  'member_id',
  'group_number',
  'ssn',
]);

const REMINDER_KEYS = new Set([
  'cd_maturity_date',
  'last_statement_date',
  'renewal_date',
  'expiration_date',
  'expiry_date',
  'policy_end',
  'due_date',
]);

function fieldKeyFromId(id: string) {
  return String(id || '')
    .replace(/-\d+$/, '')
    .toLowerCase();
}

function EntityIcon({ fieldKey }: { fieldKey: string }) {
  if (fieldKey.includes('insur') || fieldKey.includes('policy')) {
    return <Shield className="h-4 w-4" />;
  }
  if (fieldKey.includes('employ') || fieldKey.includes('company')) {
    return <Building2 className="h-4 w-4" />;
  }
  return <Landmark className="h-4 w-4" />;
}

/**
 * Review rows: filled values as readable text, empty rows as Add.
 */
export function AiReviewDetailFields({
  fields,
  emptyMessage = 'No fields yet. Add a number from the document.',
  onAddField,
  addFieldLabel = 'Add a number from the document',
  className,
  splitEmpty = false,
  focusSectionId,
}: Props) {
  const [addingEmpty, setAddingEmpty] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    {},
  );

  const grouped = useMemo(() => {
    const entities: AiReviewDetailField[] = [];
    const accounts: AiReviewDetailField[] = [];
    const identifiers: AiReviewDetailField[] = [];
    const reminders: AiReviewDetailField[] = [];
    const rest: AiReviewDetailField[] = [];
    fields.forEach(field => {
      const key = fieldKeyFromId(field.id);
      if (ENTITY_KEYS.has(key)) entities.push(field);
      else if (ACCOUNT_KEYS.has(key)) accounts.push(field);
      else if (IDENTIFIER_KEYS.has(key)) identifiers.push(field);
      else if (REMINDER_KEYS.has(key)) reminders.push(field);
      else rest.push(field);
    });
    return { entities, accounts, identifiers, reminders, rest };
  }, [fields]);

  const renderValue = (field: AiReviewDetailField) => {
    const empty = !String(field.value || '').trim();
    const showInput =
      (!empty && Boolean(editing[field.id])) ||
      (empty && Boolean(addingEmpty[field.id]));
    const sensitive =
      field.sensitive ??
      fieldShouldMask({ key: field.id, label: field.label });
    const showPlain = !sensitive || Boolean(revealed[field.id]);

    if (!showInput && empty) {
      return (
        <button
          type="button"
          className="text-[14px] font-semibold text-[#2E7FAD] hover:underline"
          onClick={() =>
            setAddingEmpty(prev => ({ ...prev, [field.id]: true }))
          }
        >
          Add
        </button>
      );
    }

    if (!showInput && !empty) {
      return (
        <div className="flex min-w-0 items-center justify-end gap-0.5">
          <button
            type="button"
            className="min-w-0 truncate text-right text-[13.5px] font-semibold text-[#213D59] hover:text-[#2E7FAD]"
            onClick={() =>
              setEditing(prev => ({ ...prev, [field.id]: true }))
            }
          >
            {showPlain ? field.value : '••••••••'}
          </button>
          {sensitive ? (
            <button
              type="button"
              className="rounded-md p-1 text-[#7A8794] hover:text-[#213D59]"
              onClick={() =>
                setRevealed(prev => ({
                  ...prev,
                  [field.id]: !prev[field.id],
                }))
              }
              aria-label={showPlain ? 'Hide value' : 'Show value'}
            >
              {showPlain ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-md p-1 text-[#7A8794] hover:text-[#213D59]"
            onClick={() => {
              void navigator.clipboard?.writeText(field.value);
              setCopiedId(field.id);
              window.setTimeout(() => setCopiedId(null), 1200);
            }}
            aria-label="Copy value"
          >
            {copiedId === field.id ? (
              <Check className="h-3.5 w-3.5 text-[#1F9D6B]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            className="rounded-md p-1 text-[#2E7FAD] hover:bg-[#EAF6FD]"
            onClick={() =>
              setEditing(prev => ({ ...prev, [field.id]: true }))
            }
            aria-label={`Edit ${field.label}`}
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div className="relative w-full max-w-[18rem] sm:max-w-none">
        <input
          type={showPlain ? 'text' : 'password'}
          value={field.value}
          autoFocus
          onChange={event => field.onChange(event.target.value)}
          onBlur={() => {
            if (String(field.value || '').trim()) {
              setEditing(prev => ({ ...prev, [field.id]: false }));
            }
          }}
          placeholder={
            field.placeholder || 'Type the value from the document'
          }
          autoComplete="off"
          className={cn(
            'h-9 w-full rounded-lg border border-[#E4EAF0] bg-[#F6F8FA] px-2.5 text-[13.5px] font-semibold text-[#213D59] outline-none ring-[#2E7FAD]/25 focus:bg-white focus:ring-2',
            sensitive ? 'pr-10' : '',
          )}
        />
        {sensitive ? (
          <button
            type="button"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#7A8794] hover:text-[#213D59]"
            onClick={() =>
              setRevealed(prev => ({
                ...prev,
                [field.id]: !prev[field.id],
              }))
            }
            aria-label={showPlain ? 'Hide value' : 'Show value'}
          >
            {showPlain ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
        ) : null}
      </div>
    );
  };

  const renderRow = (field: AiReviewDetailField) => (
    <li
      key={field.id}
      className="flex flex-col items-stretch gap-1 py-2 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between min-[480px]:gap-2 min-[480px]:py-1.5"
    >
      <div className="min-w-0 flex-1">
        {field.labelEditable ? (
          <input
            value={field.label}
            onChange={event => field.onLabelChange?.(event.target.value)}
            className="w-full bg-transparent text-[13px] font-medium text-[#6A7481] outline-none"
            placeholder="Field name"
          />
        ) : (
          <p className="text-[13px] font-medium text-[#6A7481]">
            {field.label}
            {field.label.endsWith(':') ? '' : ':'}
            {field.badge ? (
              <span
                className={cn(
                  'ml-1.5 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                  field.badge === 'New data' || field.badge === 'Updated'
                    ? 'bg-[#EAF6FD] text-[#2E7FAD]'
                    : field.badge === 'Already on file'
                      ? 'bg-[#E8F6F0] text-[#1F9D6B]'
                      : 'bg-[#F6F8FA] text-[#7A8794]',
                )}
              >
                {field.badge}
              </span>
            ) : null}
          </p>
        )}
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-start min-[480px]:flex-[1.15] min-[480px]:justify-end">
        {renderValue(field)}
      </div>
    </li>
  );

  const filledFields = fields.filter(field => String(field.value || '').trim());
  const emptyFields = fields.filter(field => !String(field.value || '').trim());

  const sectionGroups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<
      string,
      {
        id: string;
        title: string;
        filled: AiReviewDetailField[];
        empty: AiReviewDetailField[];
      }
    >();
    fields.forEach(field => {
      const id = field.sectionId || field.sectionTitle || '_';
      if (!map.has(id)) {
        order.push(id);
        map.set(id, {
          id,
          title: field.sectionTitle || 'This section',
          filled: [],
          empty: [],
        });
      }
      const group = map.get(id)!;
      if (String(field.value || '').trim()) group.filled.push(field);
      else group.empty.push(field);
    });
    return order.map(id => map.get(id)!);
  }, [fields]);

  useEffect(() => {
    if (!sectionGroups.length) return;
    setOpenSections(prev => {
      const next = { ...prev };
      let changed = false;
      sectionGroups.forEach((group, index) => {
        if (next[group.id] === undefined) {
          next[group.id] = index === 0;
          changed = true;
        }
      });
      if (focusSectionId && next[focusSectionId] !== true) {
        next[focusSectionId] = true;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [sectionGroups, focusSectionId]);

  const addFieldButton = onAddField ? (
    <button
      type="button"
      onClick={onAddField}
      className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2E7FAD] hover:underline"
    >
      <Plus className="h-3.5 w-3.5" />
      {addFieldLabel}
    </button>
  ) : null;

  const renderSplitLists = (
    filled: AiReviewDetailField[],
    empty: AiReviewDetailField[],
  ) => (
    <>
      {filled.length ? (
        <>
          <p className="mb-0.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#7A8794]">
            From the document
          </p>
          <ul className="divide-y divide-[#E4EAF0]">{filled.map(renderRow)}</ul>
        </>
      ) : null}
      {empty.length ? (
        <>
          <p
            className={cn(
              'mb-0.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#7A8794]',
              filled.length ? 'mt-3' : '',
            )}
          >
            Still empty
          </p>
          <ul className="divide-y divide-[#E4EAF0]">{empty.map(renderRow)}</ul>
        </>
      ) : null}
    </>
  );

  if (fields.length === 0) {
    return (
      <div className={className}>
        <p className="rounded-[11px] border border-dashed border-[#E4EAF0] px-3 py-3 text-sm text-[#7A8794]">
          {emptyMessage}
        </p>
        {onAddField ? (
          <button
            type="button"
            onClick={onAddField}
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2E7FAD] hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            {addFieldLabel}
          </button>
        ) : null}
      </div>
    );
  }

  if (splitEmpty) {
    const useAccordions =
      sectionGroups.length > 1 ||
      Boolean(sectionGroups[0]?.title && sectionGroups[0].id !== '_');

    return (
      <div className={className}>
        {useAccordions ? (
          <div className="divide-y divide-[#E4EAF0]">
            {sectionGroups.map(group => {
              const open = Boolean(openSections[group.id]);
              const total = group.filled.length + group.empty.length;
              return (
                <div key={group.id} className="py-1">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSections(prev => ({
                        ...prev,
                        [group.id]: !prev[group.id],
                      }))
                    }
                    className="flex w-full items-center gap-2 rounded-lg px-0.5 py-1.5 text-left hover:bg-[#F6F8FA]"
                    aria-expanded={open}
                  >
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-[#7A8794] transition',
                        !open && '-rotate-90',
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[#213D59]">
                      {group.title}
                    </span>
                    <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[#7A8794]">
                      {group.filled.length} of {total} filled
                      {group.empty.length
                        ? ` · ${group.empty.length} empty`
                        : ''}
                    </span>
                  </button>
                  {open ? (
                    <div className="pb-1.5 pl-6">
                      {renderSplitLists(group.filled, group.empty)}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          renderSplitLists(filledFields, emptyFields)
        )}
        {addFieldButton}
      </div>
    );
  }

  const accountTitle =
    grouped.accounts.find(item => item.value)?.value ||
    grouped.accounts[0]?.value ||
    '';
  const entity = grouped.entities[0];

  const groupedBody = (
    <>
      {entity ? (
        <div className="mb-1 flex items-center justify-between gap-3 border-b border-[#E4EAF0] py-3">
          <div>
            <p className="text-[13px] font-medium text-[#6A7481]">
              Associated {entity.label.replace(/name$/i, '').trim() || 'account'}
            </p>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF6FD] text-[#213D59]">
              <EntityIcon fieldKey={fieldKeyFromId(entity.id)} />
            </span>
            <div className="min-w-0 text-right sm:text-left">
              {addingEmpty[entity.id] || editing[entity.id] ? (
                renderValue(entity)
              ) : entity.value ? (
                <p className="truncate text-[14px] font-semibold text-[#213D59]">
                  {entity.value}
                </p>
              ) : (
                <button
                  type="button"
                  className="text-[14px] font-semibold text-[#2E7FAD] hover:underline"
                  onClick={() =>
                    setAddingEmpty(prev => ({ ...prev, [entity.id]: true }))
                  }
                >
                  Add
                </button>
              )}
              {accountTitle ? (
                <p className="truncate text-[12px] text-[#7A8794]">
                  {accountTitle}
                </p>
              ) : grouped.accounts[0] ? (
                <button
                  type="button"
                  className="text-[12px] font-semibold text-[#2E7FAD] hover:underline"
                  onClick={() =>
                    setAddingEmpty(prev => ({
                      ...prev,
                      [grouped.accounts[0].id]: true,
                    }))
                  }
                >
                  Add type
                </button>
              ) : null}
            </div>
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F6F0] text-[#1F9D6B] hover:bg-[#d8f0e6]"
              onClick={() =>
                setEditing(prev => ({ ...prev, [entity.id]: true }))
              }
              aria-label="Edit associated account"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {grouped.identifiers.length ? (
        <div className="border-b border-[#E4EAF0] py-2">
          <p className="pb-1 text-[13px] font-medium text-[#6A7481]">
            Account identifier
          </p>
          <ul>{grouped.identifiers.map(renderRow)}</ul>
        </div>
      ) : null}

      <ul className="divide-y divide-[#E4EAF0]">
        {grouped.rest.map(renderRow)}
        {grouped.accounts.slice(entity ? 1 : 0).map(renderRow)}
      </ul>

      {grouped.reminders.length ? (
        <div className="mt-3 border-t border-[#E4EAF0] pt-3">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[15px] font-semibold text-[#213D59]">
              Reminders
            </p>
            {onAddField ? (
              <button
                type="button"
                onClick={onAddField}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2E7FAD] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            ) : null}
          </div>
          <ul className="divide-y divide-[#E4EAF0]">
            {grouped.reminders.map(renderRow)}
          </ul>
        </div>
      ) : null}
    </>
  );

  return (
    <div className={className}>
      {groupedBody}
      {onAddField ? (
        <button
          type="button"
          onClick={onAddField}
          className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2E7FAD] hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          {addFieldLabel}
        </button>
      ) : null}
    </div>
  );
}
