'use client';

import React from 'react';
import { Badge } from '@common/ui/badge';
import { Button } from '@common/ui/button';
import {
  CalendarClock,
  Edit2,
  Eye,
  FileText,
  Mail,
  MapPin,
  Phone,
  Trash2,
} from 'lucide-react';

interface NOKLetterData {
  letter_to?: string;
  nok_email?: string;
  nok_phone?: string;
  password_card_location?: string;
  accessible_sections?: string | string[];
  letter_date?: string | null;
  letter_greeting?: string;
}

interface NOKLetterCardProps {
  obj: NOKLetterData;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

function formatDate(dateString?: string | null) {
  if (!dateString) return 'Upon death';
  const date = new Date(dateString);
  if (Number.isNaN(date.valueOf())) return dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function truncateText(text?: string, maxLength = 140) {
  if (!text) return 'No letter preview yet.';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}…`;
}

function formatSections(value?: string | string[]) {
  if (Array.isArray(value)) {
    if (value.length === 0) return 'Full kit access';
    return value.join(', ');
  }
  return value || 'Full kit access';
}

export function NOKLetterCard({
  obj,
  onEdit,
  onDelete,
  onView,
}: NOKLetterCardProps) {
  const recipient = obj.letter_to || 'Next of Kin';

  return (
    <article className="rounded-[20px] border border-[rgba(19,43,38,0.1)] bg-[var(--surface)] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#132b26] text-white">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[rgba(19,43,38,0.45)]">
                Next of kin letter
              </p>
              <h3 className="font-serif mt-1 truncate text-base font-normal text-[#132b26]">
                Letter to {recipient}
              </h3>
            </div>
            <div className="flex shrink-0 gap-1.5">
              {onView && (
                <Button
                  type="button"
                  size="icon"
                  onClick={onView}
                  className="h-9 w-9 rounded-lg bg-[#132b26] text-white hover:bg-[#0e1f1c]"
                  aria-label="View letter"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {onEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onEdit}
                  className="h-9 w-9 rounded-lg border-slate-200"
                  aria-label="Edit letter"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onDelete}
                  className="h-9 w-9 rounded-lg border-rose-100 text-rose-600 hover:bg-rose-50"
                  aria-label="Delete letter"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <Badge
            variant="outline"
            className="mt-3 rounded-full border-emerald-200 bg-emerald-50 text-emerald-800"
          >
            <CalendarClock className="mr-1 h-3.5 w-3.5" />
            {formatDate(obj.letter_date)}
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
          <Mail className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{obj.nok_email || 'No email'}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
          <Phone className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{obj.nok_phone || 'No phone'}</span>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <span>
          {obj.password_card_location || 'No password card location added'}
        </span>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Accessible sections
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-slate-700">
          {formatSections(obj.accessible_sections)}
        </p>
      </div>

      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Preview
        </p>
        <p className="mt-1 line-clamp-3 text-sm italic leading-6 text-slate-600">
          {truncateText(obj.letter_greeting)}
        </p>
      </div>
    </article>
  );
}
