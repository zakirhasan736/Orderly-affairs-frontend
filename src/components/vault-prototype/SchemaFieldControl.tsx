'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Paperclip } from 'lucide-react';
import { cn } from '@common/ui/utils';
import { fieldViewKey, type SchemaField } from '@/vault-prototype/types';
import { schemaFieldIsHalf } from '@/vault-prototype/fieldLayout';

type Props = {
  field: SchemaField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  onFilePicked?: (file: File) => void;
  compact?: boolean;
  hideLabel?: boolean;
};

export function SchemaFieldControl({
  field,
  value,
  onChange,
  disabled,
  onFilePicked,
  compact = false,
  hideLabel = false,
}: Props) {
  const slug = fieldViewKey(field);
  const required = Boolean(field.req);
  const docRecord =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as { text?: string; files?: Array<{ name?: string }> })
      : null;
  const text =
    value == null
      ? ''
      : typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : docRecord?.text ||
          docRecord?.files?.[0]?.name ||
          '';
  const [revealed, setRevealed] = useState(false);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  const reveal = () => {
    setRevealed(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setRevealed(false), 30000);
  };

  const label = (
    <label
      htmlFor={slug}
      className={cn(
        'mb-0.5 block font-semibold text-[#6A7481]',
        compact ? 'text-[11px]' : 'mb-1 text-[12px]',
      )}
    >
      {field.k}
      {required ? <span className="text-[#C2442E]"> *</span> : null}
    </label>
  );

  const hint =
    field.hint && !compact ? (
      <p className="mt-1 text-[12px] text-[#7A8794]">{field.hint}</p>
    ) : null;

  const inputClass = cn(
    'w-full rounded-[10px] border border-[#E4EAF0] bg-white px-3 text-[#213D59] outline-none transition focus:border-[#3EB1E5] focus:shadow-[0_0_0_3px_rgba(62,177,229,.14)]',
    compact ? 'h-9 text-[13.5px]' : 'h-11 text-[15px]',
  );

  let control: React.ReactNode = null;

  if (field.t === 'long') {
    control = (
      <textarea
        id={slug}
        disabled={disabled}
        value={text}
        placeholder={field.ph}
        onChange={event => onChange(event.target.value)}
        className={cn(
          'w-full resize-y rounded-[10px] border border-[#E4EAF0] bg-white px-3 py-2 text-[#213D59] outline-none focus:border-[#3EB1E5] focus:shadow-[0_0_0_3px_rgba(62,177,229,.14)]',
          compact ? 'min-h-[52px] text-[13.5px] leading-[1.4]' : 'min-h-[72px] text-[15px] leading-[1.55]',
        )}
      />
    );
  } else if (
    field.t === 'choice' &&
    (field.ui === 'select' ||
      (field.opts || []).length > (compact ? 4 : 8))
  ) {
    const opts = field.opts || [];
    const selected =
      opts.find(option => option === text) ||
      opts.find(option => {
        const a = option.toLowerCase().replace(/[^a-z0-9]+/g, '');
        const b = text.toLowerCase().replace(/[^a-z0-9]+/g, '');
        return a && b && (a === b || a.includes(b) || b.includes(a));
      }) ||
      '';
    control = (
      <select
        id={slug}
        disabled={disabled}
        value={selected}
        onChange={event => onChange(event.target.value)}
        className={inputClass}
      >
        <option value="">{field.ph || 'Select'}</option>
        {opts.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  } else if ((field.t === 'choice' || field.t === 'multi') && (field.opts || []).length) {
    const selected =
      field.t === 'multi'
        ? Array.isArray(value)
          ? (value as string[])
          : []
        : text;
    control = (
      <div
        className={cn(
          'flex flex-wrap',
          compact ? 'gap-1.5' : 'gap-2',
        )}
      >
        {(field.opts || []).map(option => {
            const on =
              field.t === 'multi'
                ? (selected as string[]).includes(option) ||
                  (selected as string[]).some(item => {
                    const a = option.toLowerCase().replace(/[^a-z0-9]+/g, '');
                    const b = String(item).toLowerCase().replace(/[^a-z0-9]+/g, '');
                    return a && b && (a === b || a.includes(b) || b.includes(a));
                  })
                : selected === option ||
                  (() => {
                    const a = option.toLowerCase().replace(/[^a-z0-9]+/g, '');
                    const b = String(selected).toLowerCase().replace(/[^a-z0-9]+/g, '');
                    return Boolean(a && b && (a === b || a.includes(b) || b.includes(a)));
                  })();
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (field.t === 'multi') {
                  const next = new Set(selected as string[]);
                  if (next.has(option)) next.delete(option);
                  else next.add(option);
                  onChange([...next]);
                } else {
                  onChange(option);
                }
              }}
              className={cn(
                'rounded-full border font-semibold',
                compact
                  ? 'min-h-8 px-3 py-1 text-[12px]'
                  : 'min-h-11 px-4 py-2 text-[13.5px]',
                on
                  ? field.t === 'multi'
                    ? 'border-[#619FCE] bg-[#EAF6FD] text-[#213D59]'
                    : 'border-[#213D59] bg-[#213D59] text-white'
                  : 'border-[#E4EAF0] bg-white text-[#414A55] hover:border-[#619FCE]',
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  } else if (field.t === 'toggle') {
    const on = value === true || value === 'yes' || value === 'true';
    control = (
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={disabled}
        onClick={() => onChange(!on)}
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-[11px] border border-[#E4EAF0] bg-white text-left text-[#414A55]',
          compact ? 'min-h-9 px-3 py-1 text-[13px]' : 'min-h-[46px] px-4 py-2 text-[14.5px]',
        )}
      >
        <span className="min-w-0 flex-1 font-medium text-[#213D59]">
          {field.k}
          {required ? <span className="text-[#C2442E]"> *</span> : null}
        </span>
        <span
          className={cn(
            'relative h-[23px] w-10 shrink-0 rounded-full transition-colors',
            on ? 'bg-[#1F9D6B]' : 'bg-[#D7DEE5]',
          )}
        >
          <span
            className={cn(
              'absolute top-[2.5px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-[left]',
              on ? 'left-[19.5px]' : 'left-[2.5px]',
            )}
          />
        </span>
      </button>
    );
  } else if (field.t === 'masked') {
    control = (
      <div className="flex gap-2">
        <input
          id={slug}
          disabled={disabled}
          type={revealed ? 'text' : 'password'}
          value={text}
          placeholder={field.ph}
          onChange={event => onChange(event.target.value)}
          className={cn(inputClass, 'flex-1 font-mono tracking-[0.14em]')}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => (revealed ? setRevealed(false) : reveal())}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-[11px] border px-3 text-[12.5px] font-semibold',
            compact ? 'min-h-9' : 'min-h-12',
            revealed
              ? 'border-[#213D59] bg-[#213D59] text-white'
              : 'border-[#E4EAF0] bg-white text-[#619FCE]',
          )}
        >
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {revealed ? 'Hide' : 'Reveal'}
        </button>
      </div>
    );
  } else if (field.t === 'doc') {
    const labelText = text || 'Attach a file';
    control = (
      <label
        className={cn(
          'flex w-full cursor-pointer items-center gap-3 rounded-[11px] border border-dashed border-[#E4EAF0] bg-[#F6F8FA] text-left hover:border-[#619FCE]',
          compact ? 'px-3 py-2' : 'px-4 py-[13px]',
        )}
      >
        <Paperclip className="h-4 w-4 shrink-0 text-[#619FCE]" />
        <span
          className={cn(
            'min-w-0 flex-1 truncate font-semibold text-[#213D59]',
            compact ? 'text-[13px]' : 'text-[14px]',
          )}
        >
          {labelText}
        </span>
        <span className="ml-auto text-[11.5px] font-semibold text-[#7A8794]">
          PDF, JPG, PNG, HEIC
        </span>
        <input
          type="file"
          className="sr-only"
          disabled={disabled}
          accept=".pdf,.txt,.png,.jpg,.jpeg,.webp,.heic,application/pdf,text/plain,image/png,image/jpeg,image/webp,image/heic"
          onChange={event => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            onChange({
              text: file.name,
              files: [{ name: file.name, type: file.type, size: file.size }],
            });
            onFilePicked?.(file);
          }}
        />
      </label>
    );
  } else {
    const inputMode =
      field.t === 'tel'
        ? 'tel'
        : field.t === 'email'
          ? 'email'
          : field.t === 'num' || field.t === 'date'
            ? 'numeric'
            : field.t === 'money'
              ? 'decimal'
              : field.t === 'url'
                ? 'url'
                : 'text';
    control = (
      <input
        id={slug}
        disabled={disabled}
        type={field.t === 'date' ? 'date' : field.t === 'email' ? 'email' : 'text'}
        inputMode={inputMode}
        value={text}
        placeholder={field.ph}
        onChange={event => onChange(event.target.value)}
        className={cn(inputClass, 'tabular-nums')}
      />
    );
  }

  return (
    <div
      className={schemaFieldIsHalf(field) ? '' : 'col-span-full'}
      title={compact ? field.hint || undefined : undefined}
    >
      {hideLabel || field.t === 'toggle' ? null : label}
      {control}
      {hint}
    </div>
  );
}
