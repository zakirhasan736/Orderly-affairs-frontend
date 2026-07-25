'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock3,
  Edit2,
  Mail,
  MoreHorizontal,
  Phone,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@common/ui/utils';

interface AccessPersonData {
  _id?: string;
  id?: string;
  full_name?: string;
  person_name?: string;
  relationship?: string;
  email?: string;
  email_address?: string;
  phone_number?: string;
  access_level?: string;
  authorized_sections?: string[];
  immediate_access?: boolean;
  nok_letter_received?: boolean;
}

interface AccessPersonCardProps {
  item: AccessPersonData;
  onEdit?: () => void;
  onDelete?: () => void;
  showSensitiveInfo?: boolean;
}

function normalizeSections(sections?: string[]) {
  if (!sections || sections.length === 0) return ['Full Access'];
  if (sections.some(section => section.toLowerCase() === 'all')) {
    return ['Full Access'];
  }
  return sections;
}

export function AccessPersonCard({
  item,
  onEdit,
  onDelete,
}: AccessPersonCardProps) {
  const name = item.full_name || item.person_name || 'Unnamed Person';
  const email = item.email || item.email_address || '';
  const phone = item.phone_number || '';
  const relationship = item.relationship || 'Trusted person';
  const sections = normalizeSections(item.authorized_sections);
  const isImmediate = Boolean(item.immediate_access);
  const accessLabel =
    item.access_level?.trim() ||
    (sections[0] === 'Full Vault Access' ? 'Full Access' : sections[0]) ||
    'Full Access';

  const copyToClipboard = async (text: string, label: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <article className="rounded-[20px] border border-[rgba(19,43,38,0.1)] bg-[var(--surface)] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#132b26] text-[15px] font-semibold uppercase text-white">
          {name.charAt(0)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-bold uppercase tracking-wide text-[#132b26] sm:text-base">
                {name}
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">{relationship}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {onEdit ? (
                <button
                  type="button"
                  onClick={onEdit}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-[#132b26]"
                  aria-label={`Edit ${name}`}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              ) : null}
              {onDelete ? (
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Delete ${name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300"
                  aria-label="More"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                isImmediate
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
              )}
            >
              {isImmediate ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Clock3 className="h-3.5 w-3.5" />
              )}
              {isImmediate ? 'Immediate access' : 'Upon death'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              {accessLabel === 'Full Vault Access' ? 'Full Access' : accessLabel}
            </span>
          </div>

          <div className="mt-3 space-y-1.5">
            <button
              type="button"
              onClick={() => email && copyToClipboard(email, 'Email')}
              className="flex w-full items-center gap-2 text-left text-[12px] text-slate-600"
            >
              <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{email || 'No email on file'}</span>
            </button>
            <button
              type="button"
              onClick={() => phone && copyToClipboard(phone, 'Phone')}
              className="flex w-full items-center gap-2 text-left text-[12px] text-slate-600"
            >
              <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{phone || 'No phone on file'}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
