'use client';

import React, { useState } from 'react';
import { Cake, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@common/ui/utils';
import type { SpecialDayKind, SpecialDayPref } from '@/utils/notificationPreferences';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatDay(item: SpecialDayPref) {
  const month = MONTHS[(item.month || 1) - 1] || 'January';
  return `${month} ${item.day}`;
}

export function SpecialDaysSettings({
  days,
  enabled,
  onChange,
}: {
  days: SpecialDayPref[];
  enabled: boolean;
  onChange: (next: {
    specialDaysEnabled?: boolean;
    specialDays?: SpecialDayPref[];
  }) => Promise<void> | void;
}) {
  const [label, setLabel] = useState('');
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [kind, setKind] = useState<SpecialDayKind>('custom');

  const addDay = () => {
    const nextLabel =
      label.trim() ||
      (kind === 'birthday'
        ? 'Birthday'
        : kind === 'anniversary'
          ? 'Anniversary'
          : 'Special day');
    const exists = days.some(
      item => item.kind === kind && item.month === month && item.day === day,
    );
    if (exists) {
      toast.message('That day is already on the list');
      return;
    }
    void onChange({
      specialDays: [
        ...days,
        {
          kind,
          month,
          day,
          label: nextLabel,
          enabled: true,
          source: 'owner',
        },
      ],
    });
    setLabel('');
  };

  const remove = (index: number) => {
    void onChange({
      specialDays: days.filter((_, i) => i !== index),
    });
  };

  const toggleItem = (index: number) => {
    void onChange({
      specialDays: days.map((item, i) =>
        i === index ? { ...item, enabled: !item.enabled } : item,
      ),
    });
  };

  return (
    <div className="rounded-2xl border border-[#E4EAF0] bg-white px-3.5 py-3.5 sm:px-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
            enabled
              ? 'bg-[#213D59] text-white shadow-sm'
              : 'bg-white text-[#213D59] ring-1 ring-[#E4EAF0]',
          )}
        >
          <Cake className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-[#213D59] sm:text-[15px]">
            Birthday and special-day wishes
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-slate-500 sm:text-[13px]">
            On the day, we email you a wish. Immediate-access next of kin and
            family get a reminder a week ahead, and again on the day, so they
            can arrange something and wish you.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => void onChange({ specialDaysEnabled: !enabled })}
          className={cn(
            'relative h-8 w-[3.25rem] shrink-0 rounded-full transition',
            enabled ? 'bg-[#213D59]' : 'bg-[#C9D4DE]',
          )}
        >
          <span
            className={cn(
              'absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition',
              enabled && 'translate-x-[1.35rem]',
            )}
          />
        </button>
      </div>

      {enabled ? (
        <>
          <ul className="mt-3 space-y-2">
            {days.length ? (
              days.map((item, index) => (
                <li
                  key={`${item.kind}-${item.month}-${item.day}-${index}`}
                  className="flex items-center gap-3 rounded-[12px] border border-[#E4EAF0] bg-[#F6F8FA] px-3 py-2.5"
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[#C9D4DE] accent-[#213D59]"
                      checked={item.enabled}
                      onChange={() => toggleItem(index)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-semibold text-[#213D59]">
                        {item.label}
                      </span>
                      <span className="block text-[12px] text-[#7A8794]">
                        {formatDay(item)}
                        {item.source === 'vault' ? ' · from Vital Information' : ''}
                      </span>
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="grid h-8 w-8 place-items-center rounded-full text-[#7A8794] hover:bg-white hover:text-[#C2442E]"
                    aria-label={`Remove ${item.label}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))
            ) : (
              <li className="rounded-[12px] border border-dashed border-[#E4EAF0] px-3 py-2.5 text-[12px] text-[#7A8794]">
                Birthday is filled from Vital Information when that date is
                saved. Add an anniversary or another day below.
              </li>
            )}
          </ul>

          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_7.5rem_5.5rem_auto]">
            <input
              value={label}
              onChange={event => setLabel(event.target.value)}
              placeholder={
                kind === 'anniversary' ? 'Wedding anniversary' : 'Label (optional)'
              }
              className="h-10 rounded-xl border border-[#E4EAF0] bg-white px-3 text-[13px] text-[#213D59]"
            />
            <select
              value={month}
              onChange={event => setMonth(Number(event.target.value))}
              className="h-10 rounded-xl border border-[#E4EAF0] bg-white px-2 text-[13px] text-[#213D59]"
            >
              {MONTHS.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={day}
              onChange={event => setDay(Number(event.target.value))}
              className="h-10 rounded-xl border border-[#E4EAF0] bg-white px-2 text-[13px] text-[#213D59]"
            >
              {Array.from({ length: 31 }, (_, index) => index + 1).map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addDay}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#213D59] px-3 text-[12px] font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(['birthday', 'anniversary', 'custom'] as SpecialDayKind[]).map(
              value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setKind(value)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize',
                    kind === value
                      ? 'bg-[#213D59] text-white'
                      : 'bg-[#EFF3F7] text-[#6A7481]',
                  )}
                >
                  {value}
                </button>
              ),
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
