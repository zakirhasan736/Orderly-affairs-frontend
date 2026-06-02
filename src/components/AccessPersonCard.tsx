import React from 'react';
import { Badge } from '@common/ui/badge';
import { Button } from '@common/ui/button';
import {
  CheckCircle2,
  Clock3,
  Copy,
  Edit2,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';

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
  if (!sections || sections.length === 0) return ['Full Kit Access'];
  if (sections.some(section => section.toLowerCase() === 'all')) {
    return ['Full Kit Access'];
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
  const letterReceived = !isImmediate && Boolean(item.nok_letter_received);

  const copyToClipboard = async (text: string, label: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <article className="group relative overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-1 bg-slate-950" />

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-semibold uppercase text-white shadow-sm">
              {name.charAt(0)}
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-slate-950 sm:text-lg">
                {name}
              </h3>
              <p className="mt-1 truncate text-xs font-semibold uppercase tracking-wide text-slate-400">
                {relationship}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge
                  variant={isImmediate ? 'default' : 'outline'}
                  className={
                    isImmediate
                      ? 'rounded-full bg-emerald-600 hover:bg-emerald-600'
                      : 'rounded-full border-amber-200 bg-amber-50 text-amber-700'
                  }
                >
                  {isImmediate ? (
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  ) : (
                    <Clock3 className="mr-1 h-3.5 w-3.5" />
                  )}
                  {isImmediate ? 'Immediate Access' : 'Upon Death'}
                </Badge>

                {letterReceived && (
                  <Badge className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                    NOK Letter Received
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onEdit}
                className="h-10 w-10 rounded-2xl border-slate-200"
                aria-label={`Edit ${name}`}
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
                aria-label={`Delete ${name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ContactTile
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={email || 'No email'}
            onCopy={email ? () => copyToClipboard(email, 'Email') : undefined}
          />
          <ContactTile
            icon={<Phone className="h-4 w-4" />}
            label="Phone"
            value={phone || 'No phone'}
            onCopy={phone ? () => copyToClipboard(phone, 'Phone') : undefined}
          />
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Authorized Areas
              </p>
            </div>

            <Badge variant="outline" className="rounded-full bg-white">
              {item.access_level || 'Access Set'}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {sections.slice(0, 4).map(section => (
              <span
                key={section}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
              >
                {section}
              </span>
            ))}

            {sections.length > 4 && (
              <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-medium text-white">
                +{sections.length - 4} more
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function ContactTile({
  icon,
  label,
  value,
  onCopy,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onCopy?: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          {icon || <UserRound className="h-4 w-4" />}
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="truncate text-sm font-medium text-slate-800">{value}</p>
        </div>
      </div>

      {onCopy && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCopy}
          className="h-8 w-8 shrink-0 rounded-xl"
          aria-label={`Copy ${label}`}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
