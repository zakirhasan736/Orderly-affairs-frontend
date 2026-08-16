'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Plus, Sparkles, Upload } from 'lucide-react';
import { cn } from '@common/ui/utils';
import { schemaByApiId } from '@/vault-prototype';
import { fieldViewKey, type SchemaSub } from '@/vault-prototype/types';
import { SchemaIcon } from '@/vault-prototype/icons';
import { SchemaFieldControl } from '@/components/vault-prototype/SchemaFieldControl';
import { VaultDetailDrawer } from '@/components/vault-prototype/VaultDetailDrawer';
import { LegalDisclaimer, ProgressBar } from '@/components/vault-ui';
import { SectionActivityStrip } from '@/components/vault/SectionActivityStrip';
import { UploadedDocumentsButton } from '@/components/vault/UploadedDocumentsButton';
import { SectionUpdateRecipientsPicker } from '@/components/vault/SectionUpdateRecipientsPicker';
import { SectionFileDropZone } from '@/components/vault-prototype/SectionFileDropZone';
import { useOptionalDashboardAiBatch } from '@/contexts/DashboardAiBatchContext';
import { fromSchemaView, toSchemaView } from '@/vault-prototype/schemaDataBridge';
import { OPEN_VAULT_SUBSECTION } from '@/vault-prototype/navigate';
import { layoutSchemaFields } from '@/vault-prototype/fieldLayout';
import {
  entryCardTitle,
  entryDrawerTitle,
} from '@/vault-prototype/entryDisplayTitle';

type Props = {
  apiSectionId: string;
  data: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  readOnly?: boolean;
  onUpload?: () => void;
  pendingReviewCount?: number;
  onOpenReview?: () => void;
};

function isFilled(value: unknown): boolean {
  if (value === true) return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return true;
  return false;
}

function subProgress(sub: SchemaSub, bucket: unknown) {
  if (sub.kind === 'entries') {
    const rows = Array.isArray(bucket) ? bucket : [];
    if (!rows.length) {
      const total = sub.fields.length || 1;
      return { count: 0, filled: 0, total, pct: 0 };
    }
    let filled = 0;
    let total = 0;
    for (const row of rows) {
      const record =
        row && typeof row === 'object' && !Array.isArray(row)
          ? (row as Record<string, unknown>)
          : {};
      total += sub.fields.length || 1;
      filled += sub.fields.filter(field => isFilled(record[fieldViewKey(field)])).length;
    }
    return {
      count: rows.length,
      filled,
      total,
      pct: total ? Math.round((filled / total) * 100) : 0,
    };
  }
  const record = (
    bucket && typeof bucket === 'object' && !Array.isArray(bucket) ? bucket : {}
  ) as Record<string, unknown>;
  const total = sub.fields.length || 1;
  const filled = sub.fields.filter(field => isFilled(record[fieldViewKey(field)])).length;
  return { count: filled, filled, total, pct: Math.round((filled / total) * 100) };
}

function plural(word: string, n: number) {
  if (n === 1) return word;
  if (/y$/.test(word) && !/[aeiou]y$/.test(word)) return `${word.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/.test(word)) return `${word}es`;
  return `${word}s`;
}

export function VaultSchemaSection({
  apiSectionId,
  data,
  onChange,
  readOnly,
  onUpload,
  pendingReviewCount = 0,
  onOpenReview,
}: Props) {
  const section = schemaByApiId(apiSectionId);
  const view = useMemo(
    () => toSchemaView(apiSectionId, data),
    [apiSectionId, data],
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'empty' | 'dove'>('all');
  const headerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const autoOpenedFor = useRef<string | null>(null);

  const states = useMemo(() => {
    if (!section) return [];
    return section.subs.map(sub => ({
      sub,
      ...subProgress(sub, view?.[sub.id]),
    }));
  }, [section, view]);

  useEffect(() => {
    autoOpenedFor.current = null;
    setOpenId(null);
  }, [apiSectionId]);

  useEffect(() => {
    const onOpenSub = (event: Event) => {
      const detail = (event as CustomEvent<{ sectionId?: string; subId?: string }>)
        .detail;
      if (!detail?.subId) return;
      if (detail.sectionId && detail.sectionId !== apiSectionId) return;
      setOpenId(detail.subId);
      window.requestAnimationFrame(() => {
        headerRefs.current[detail.subId!]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    };
    window.addEventListener(OPEN_VAULT_SUBSECTION, onOpenSub);
    return () => window.removeEventListener(OPEN_VAULT_SUBSECTION, onOpenSub);
  }, [apiSectionId]);

  useEffect(() => {
    if (autoOpenedFor.current === apiSectionId) return;
    const firstFilled = states.find(item => item.count > 0);
    if (firstFilled) {
      setOpenId(firstFilled.sub.id);
      autoOpenedFor.current = apiSectionId;
    }
  }, [apiSectionId, states]);

  if (!section) return null;

  const filledFields = states.reduce((sum, item) => sum + item.filled, 0);
  const totalFields = states.reduce((sum, item) => sum + item.total, 0);
  const pct = totalFields ? Math.round((filledFields / totalFields) * 100) : 0;
  const emptyCount = states.filter(item => item.pct === 0).length;
  const doveCount = section.subs.filter(sub => sub.dove).length;

  const visible = states.filter(item => {
    if (filter === 'empty') return item.pct === 0;
    if (filter === 'dove') return Boolean(item.sub.dove);
    return true;
  });

  const writeSub = (subId: string, next: unknown) => {
    onChange(fromSchemaView(apiSectionId, data, { ...view, [subId]: next }));
  };

  const toggleOpen = (subId: string, currentlyOpen: boolean) => {
    if (currentlyOpen && openId !== '__all__') {
      setOpenId(null);
      return;
    }
    setOpenId(subId);
    window.requestAnimationFrame(() => {
      headerRefs.current[subId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[22px] border border-[#E4EAF0] bg-white px-7 py-6 max-md:rounded-[14px] max-md:px-4">
        <div className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full bg-[#EAF6FD]" />
        <div className="relative z-[1] flex flex-wrap items-start gap-5">
          <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[14px] bg-[#213D59] text-white">
            <SchemaIcon name={section.icon} className="h-6 w-6" />
          </div>
          <div className="min-w-[220px] flex-1">
            <h1 className="text-[27px] font-bold tracking-[-0.028em] text-[#213D59] max-md:text-[23px]">
              {section.name}
              {section.dove ? (
                <span className="ml-2 inline-flex items-center rounded-full bg-[#EFEAFB] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#6B4EA8]">
                  🕊️ Obituary source
                </span>
              ) : null}
            </h1>
            <p className="mt-1.5 max-w-[620px] text-[14.5px] text-[#7A8794]">{section.desc}</p>
          </div>
          <div className="min-w-[180px]">
            <div className="mb-1.5 flex justify-between text-[12px] font-semibold text-[#7A8794]">
              <span>Section progress</span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <ProgressBar value={pct} size="hero" className="bg-[#E4EAF0]" />
            <p className="mt-2 text-[12px] text-[#7A8794]">
              {emptyCount
                ? `${emptyCount} of ${section.subs.length} subsections empty`
                : `All ${section.subs.length} subsections started`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-[16px] border border-[#E4EAF0] bg-white px-4 py-3 text-[14px] text-[#414A55] max-md:rounded-[14px]">
        <Plus className="mt-0.5 h-4 w-4 shrink-0 text-[#619FCE]" />
        <p>
          <strong className="text-[#213D59]">Every subsection can be filled by hand.</strong>{' '}
          {section.subs.length} subsections,{' '}
          {section.subs.reduce((sum, sub) => sum + sub.fields.length, 0)} fields. Uploading a
          document is a shortcut that fills the same fields, never a requirement.
        </p>
      </div>

      {apiSectionId === '0' ? <LegalDisclaimer variant="callout" /> : null}
      {apiSectionId === '20' || apiSectionId === '21' ? (
        <LegalDisclaimer variant="footer" />
      ) : null}

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex gap-1.5 rounded-full border border-[#E4EAF0] bg-white p-1">
          {(
            [
              ['all', `All (${section.subs.length})`],
              ['empty', `Empty (${emptyCount})`],
              ...(doveCount ? [['dove', `🕊️ Obituary (${doveCount})`] as const] : []),
            ] as Array<[typeof filter, string]>
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={cn(
                'min-h-11 rounded-full px-3.5 text-[13px] font-semibold md:h-8 md:min-h-8',
                filter === id ? 'bg-[#213D59] text-white' : 'text-[#7A8794]',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-full border border-[#E4EAF0] bg-white px-3.5 text-[13px] font-semibold text-[#213D59] md:h-[34px] md:min-h-[34px]"
            onClick={() => setOpenId('__all__')}
          >
            Expand all
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-full border border-[#E4EAF0] bg-white px-3.5 text-[13px] font-semibold text-[#213D59] md:h-[34px] md:min-h-[34px]"
            onClick={() => setOpenId(null)}
          >
            Collapse all
          </button>
          {onOpenReview && pendingReviewCount > 0 ? (
            <button
              type="button"
              onClick={onOpenReview}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#EAF6FD] px-3.5 text-[13px] font-semibold text-[#213D59] ring-1 ring-[#3EB1E5]/60 md:h-[34px] md:min-h-[34px]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#3EB1E5]" />
              Review {pendingReviewCount}{' '}
              {pendingReviewCount === 1 ? 'document' : 'documents'}
            </button>
          ) : null}
          {onUpload ? (
            <button
              type="button"
              onClick={onUpload}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#213D59] px-3.5 text-[13px] font-semibold text-white md:h-[34px] md:min-h-[34px]"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload a document
            </button>
          ) : null}
          <UploadedDocumentsButton
            sectionId={apiSectionId}
            dense
          />
        </div>
      </div>

      <SectionUpdateRecipientsPicker
        sectionId={apiSectionId}
        className="mb-3"
      />

      <div>
        {visible.map(({ sub, count, total, filled }) => {
          const open = openId === '__all__' || openId === sub.id;
          const bucket = view?.[sub.id];
          return (
            <div
              key={sub.id}
              className={cn(
                'mb-3 rounded-[16px] border bg-white max-md:rounded-[14px]',
                open
                  ? 'overflow-visible border-[#619FCE] shadow-[0_2px_8px_rgba(33,61,89,.07)]'
                  : 'overflow-hidden border-[#E4EAF0]',
              )}
            >
              <button
                type="button"
                ref={node => {
                  headerRefs.current[sub.id] = node;
                }}
                onClick={() => toggleOpen(sub.id, open)}
                className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-[#F6F8FA]"
              >
                <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-[#EAF6FD] text-[#213D59]">
                  <SchemaIcon name={section.icon} className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[15.5px] font-bold text-[#213D59]">
                    {sub.name}
                    {sub.dove ? <span title="Obituary source">🕊️</span> : null}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-[#7A8794]">{sub.desc}</span>
                </span>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[11.5px] font-bold',
                    (sub.kind === 'entries' ? filled : count)
                      ? 'bg-[#E8F6F0] text-[#1F9D6B]'
                      : 'bg-[#FDF4E4] text-[#B4761A]',
                  )}
                >
                  {sub.kind === 'entries' && count > 0
                    ? `${count} ${plural(sub.entry || 'item', count)}`
                    : `${filled} of ${total}`}
                </span>
                <ChevronDown
                  className={cn('h-4 w-4 shrink-0 text-[#7A8794] transition', open && 'rotate-180')}
                />
              </button>
              {open ? (
                <div className="border-t border-[#EFF3F7] px-4 pb-4 pt-4">
                  {onOpenReview && pendingReviewCount > 0 && openId === sub.id ? (
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-[#EBD9B4] bg-[#FDF4E4] px-3 py-2">
                      <p className="text-[12.5px] font-semibold text-[#213D59]">
                        Document fill waiting for review
                      </p>
                      <button
                        type="button"
                        onClick={onOpenReview}
                        className="inline-flex h-8 items-center rounded-full bg-[#3EB1E5] px-3 text-[12px] font-semibold text-[#16293C]"
                      >
                        Review
                      </button>
                    </div>
                  ) : null}
                  <SectionActivityStrip
                    sectionId={apiSectionId}
                    subsectionId={sub.id}
                    showRecipients={false}
                  />
                  <SubBody
                    sub={sub}
                    bucket={bucket}
                    disabled={readOnly}
                    onChange={next => writeSub(sub.id, next)}
                    iconName={section.icon}
                    sectionId={apiSectionId}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FieldGrid({
  sub,
  values,
  setValues,
  disabled,
  sectionId,
  compact = false,
}: {
  sub: SchemaSub;
  values: Record<string, unknown>;
  setValues: (next: Record<string, unknown>) => void;
  disabled?: boolean;
  sectionId: string;
  compact?: boolean;
}) {
  const batch = useOptionalDashboardAiBatch();
  const laidOut = layoutSchemaFields(sub.fields);
  return (
    <div
      className={cn(
        'grid grid-cols-2',
        compact ? 'gap-x-2.5 gap-y-2 max-[420px]:grid-cols-1' : 'gap-x-3 gap-y-3 max-sm:grid-cols-1',
      )}
    >
      {laidOut.map(field => {
        const key = fieldViewKey(field);
        return (
          <SchemaFieldControl
            key={`${field.store || ''}:${key}:${field.k}`}
            field={field}
            compact={compact}
            disabled={disabled}
            value={values[key]}
            onChange={value => setValues({ ...values, [key]: value })}
            onFilePicked={file =>
              batch?.enqueueFiles([file], { sectionId, source: 'section' })
            }
          />
        );
      })}
    </div>
  );
}

function SubBody({
  sub,
  bucket,
  disabled,
  onChange,
  iconName,
  sectionId,
}: {
  sub: SchemaSub;
  bucket: unknown;
  disabled?: boolean;
  onChange: (next: unknown) => void;
  iconName: string;
  sectionId: string;
}) {
  const record = (
    bucket && typeof bucket === 'object' && !Array.isArray(bucket) ? bucket : {}
  ) as Record<string, unknown>;
  const rows = Array.isArray(bucket) ? (bucket as Record<string, unknown>[]) : [];
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [mode, setMode] = useState<
    { kind: 'new' } | { kind: 'edit'; index: number } | { kind: 'form' } | null
  >(null);

  const closeDraft = () => {
    setMode(null);
    setDraft({});
  };

  const commitDraft = () => {
    if (!mode) return;
    if (mode.kind === 'form') {
      onChange(draft);
    } else if (mode.kind === 'new') {
      onChange([...rows, draft]);
    } else {
      const copy = rows.slice();
      copy[mode.index] = draft;
      onChange(copy);
    }
    closeDraft();
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
    closeDraft();
  };

  if (sub.kind === 'entries') {
    return (
      <div>
        {rows.length === 0 ? (
          <div className="mb-3 rounded-[11px] border border-[#EBD9B4] bg-[#FDF4E4] px-4 py-4 text-[13.5px] leading-relaxed text-[#8A5A10]">
            No {plural(sub.entry || 'item', 2)} yet. Add the first one below, or upload a document
            and it fills these fields for you.
          </div>
        ) : (
          rows.map((row, index) => {
            const title = entryCardTitle(sub, row, index);
            const total = sub.fields.length || 1;
            const filled = sub.fields.filter(field =>
              isFilled(row[fieldViewKey(field)]),
            ).length;
            return (
              <div
                key={`${sub.id}-${index}`}
                className="mb-2 flex items-center gap-3 rounded-[11px] border border-[#E4EAF0] bg-white px-3.5 py-3"
              >
                <div className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-[#EAF6FD] text-[#213D59]">
                  <SchemaIcon name={iconName} className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-[#213D59]">{title}</p>
                  <p className="text-[12px] text-[#7A8794]">Item {index + 1}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold',
                    filled
                      ? 'bg-[#E8F6F0] text-[#1F9D6B]'
                      : 'bg-[#FDF4E4] text-[#B4761A]',
                  )}
                >
                  {filled} of {total}
                </span>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-full border border-[#E4EAF0] px-3.5 text-[13px] font-semibold text-[#213D59] md:h-[34px] md:min-h-[34px]"
                  onClick={() => {
                    setDraft({ ...row });
                    setMode({ kind: 'edit', index });
                  }}
                >
                  Edit
                </button>
              </div>
            );
          })
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setDraft({});
            setMode({ kind: 'new' });
          }}
          className="mt-2 inline-flex min-h-11 w-full flex-col items-center justify-center rounded-[16px] border-2 border-dashed border-[#E4EAF0] bg-white px-4 py-6 text-[#7A8794] hover:border-[#3EB1E5] hover:bg-[#EAF6FD] hover:text-[#619FCE] max-md:rounded-[14px] md:w-auto md:min-h-[42px] md:flex-row md:gap-1.5 md:rounded-full md:border md:border-solid md:bg-[#213D59] md:py-0 md:text-white md:hover:bg-[#2C4B6B] md:hover:text-white"
        >
          <Plus className="h-4 w-4" />
          <span className="text-[14px] font-semibold">Add {sub.entry || 'item'}</span>
        </button>
        <SectionFileDropZone sectionId={sectionId} disabled={disabled} />

        <VaultDetailDrawer
          open={Boolean(mode)}
          wide
          title={
            mode
              ? entryDrawerTitle(mode.kind === 'edit' ? 'edit' : 'add', sub, draft)
              : `Add ${sub.entry || 'item'}`
          }
          subtitle={
            sub.fields.length
              ? `${
                  sub.fields.filter(field => isFilled(draft[fieldViewKey(field)])).length
                } of ${sub.fields.length} filled`
              : sub.name
          }
          icon={<SchemaIcon name={iconName} className="h-5 w-5" />}
          onClose={closeDraft}
          footer={
            <>
              <button
                type="button"
                onClick={closeDraft}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#E4EAF0] bg-white px-4 text-[14px] font-semibold text-[#213D59] sm:h-10 sm:min-h-10"
              >
                Cancel
              </button>
              {mode?.kind === 'edit' ? (
                <button
                  type="button"
                  onClick={() => removeRow(mode.index)}
                  className="inline-flex min-h-12 items-center justify-center rounded-full px-4 text-[14px] font-semibold text-[#C2442E] sm:h-10 sm:min-h-10"
                >
                  Remove
                </button>
              ) : null}
              <button
                type="button"
                disabled={disabled}
                onClick={commitDraft}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#213D59] px-5 text-[14px] font-semibold text-white sm:ml-auto sm:h-10 sm:min-h-10"
              >
                Save
              </button>
            </>
          }
        >
          <FieldGrid
            sub={sub}
            values={draft}
            setValues={setDraft}
            disabled={disabled}
            sectionId={sectionId}
            compact
          />
        </VaultDetailDrawer>
      </div>
    );
  }

  return (
    <div>
      {(() => {
        const total = sub.fields.length || 1;
        const filled = sub.fields.filter(field =>
          isFilled(record[fieldViewKey(field)]),
        ).length;
        return (
          <div className="mb-2 flex items-center gap-3 rounded-[11px] border border-[#E4EAF0] bg-white px-3.5 py-3">
            <div className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-[#EAF6FD] text-[#213D59]">
              <SchemaIcon name={iconName} className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-[#213D59]">
                {sub.name}
              </p>
              <p className="text-[12px] text-[#7A8794]">
                {filled ? `${filled} of ${total} filled` : 'No details yet'}
              </p>
            </div>
            <button
              type="button"
              disabled={disabled}
              className="inline-flex min-h-11 items-center rounded-full border border-[#E4EAF0] px-3.5 text-[13px] font-semibold text-[#213D59] md:h-[34px] md:min-h-[34px]"
              onClick={() => {
                setDraft({ ...record });
                setMode({ kind: 'form' });
              }}
            >
              {filled ? 'Edit' : 'Add'}
            </button>
          </div>
        );
      })()}
      <SectionFileDropZone sectionId={sectionId} disabled={disabled} />
      <VaultDetailDrawer
        open={mode?.kind === 'form'}
        wide
        title={
          sub.fields.some(field => isFilled(record[fieldViewKey(field)]))
            ? `Edit ${sub.name}`
            : `Add ${sub.name}`
        }
        subtitle={`${
          sub.fields.filter(field => isFilled(draft[fieldViewKey(field)])).length
        } of ${sub.fields.length} filled`}
        icon={<SchemaIcon name={iconName} className="h-5 w-5" />}
        onClose={closeDraft}
        footer={
          <>
            <button
              type="button"
              onClick={closeDraft}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#E4EAF0] bg-white px-4 text-[14px] font-semibold text-[#213D59] sm:h-10 sm:min-h-10"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={commitDraft}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#213D59] px-5 text-[14px] font-semibold text-white sm:ml-auto sm:h-10 sm:min-h-10"
            >
              Save
            </button>
          </>
        }
      >
        <FieldGrid
          sub={sub}
          values={draft}
          setValues={setDraft}
          disabled={disabled}
          sectionId={sectionId}
          compact
        />
      </VaultDetailDrawer>
    </div>
  );
}
