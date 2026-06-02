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
  ShieldCheck,
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
  if (!dateString) return 'Upon Death';

  const date = new Date(dateString);

  if (Number.isNaN(date.valueOf())) return dateString;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function truncateText(text?: string, maxLength = 150) {
  if (!text) return 'No preview available yet.';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

function formatSections(value?: string | string[]) {
  if (Array.isArray(value)) {
    if (value.length === 0) return 'Full Kit Access';
    return value.join(', ');
  }

  return value || 'Full Kit Access';
}

export function NOKLetterCard({
  obj,
  onEdit,
  onDelete,
  onView,
}: NOKLetterCardProps) {
  const recipient = obj.letter_to || 'Next of Kin';
  const deliveryText = formatDate(obj.letter_date);

  return (
    <article className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
              <FileText className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <Badge className="mb-2 rounded-full bg-slate-950 text-white hover:bg-slate-950">
                NOK Letter
              </Badge>

              <h3 className="truncate text-base font-semibold text-slate-950 sm:text-lg">
                Letter to {recipient}
              </h3>

              <div className="mt-2 flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  <CalendarClock className="mr-1 h-3.5 w-3.5" />
                  {deliveryText}
                </Badge>

                <Badge variant="outline" className="rounded-full bg-white">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  Ready for NOK
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            {onView && (
              <Button
                type="button"
                size="icon"
                onClick={onView}
                className="h-10 w-10 rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
                aria-label="View NOK letter"
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
                className="h-10 w-10 rounded-2xl border-slate-200"
                aria-label="Edit NOK letter"
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
                className="h-10 w-10 rounded-2xl border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                aria-label="Delete NOK letter"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoTile
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={obj.nok_email || 'No email'}
          />
          <InfoTile
            icon={<Phone className="h-4 w-4" />}
            label="Phone"
            value={obj.nok_phone || 'No phone'}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <MapPin className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">
              Password Card Location
            </p>
          </div>
          <p className="text-sm font-medium leading-6 text-slate-800">
            {obj.password_card_location || 'No location added'}
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Accessible Sections
          </p>
          <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-700">
            {formatSections(obj.accessible_sections)}
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">
            Letter Preview
          </p>
          <p className="mt-2 line-clamp-3 text-sm font-medium italic leading-6 text-slate-700">
            {truncateText(obj.letter_greeting)}
          </p>
        </div>
      </div>
    </article>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}
