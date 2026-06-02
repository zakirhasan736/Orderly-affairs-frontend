import React from 'react';
import { Badge } from '@common/ui/badge';
import { Button } from '@common/ui/button';
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Edit2,
  Eye,
  FileText,
  Mail,
  Mic,
  Play,
  Trash2,
  UserRound,
  Video,
} from 'lucide-react';

interface MessageMedia {
  url?: string;
  type?: string;
  format?: string;
  size?: number;
}

interface MessageData {
  id: string;
  title: string;
  recipient: string;
  recipientEmail: string;
  content: string;
  lastModified: string;
  messageType: 'letter' | 'video' | 'audio';
  deliveryTrigger: string;
  isDelivered: boolean;
  deliveryDate?: string;
  deliveryOccasion?: string;
  audioFile?: { name: string; type: string };
  videoFile?: { name: string; type: string };
  media?: MessageMedia;
  subject?: string;
}

interface MessageCardProps {
  item: MessageData;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onPlay?: () => void;
}

function getTypeConfig(type: MessageData['messageType']) {
  switch (type) {
    case 'video':
      return {
        icon: <Video className="h-5 w-5" />,
        label: 'Video',
        accent: 'bg-rose-50 text-rose-600 ring-rose-100',
        badge: 'border-rose-200 bg-rose-50 text-rose-700',
      };
    case 'audio':
      return {
        icon: <Mic className="h-5 w-5" />,
        label: 'Audio',
        accent: 'bg-blue-50 text-blue-600 ring-blue-100',
        badge: 'border-blue-200 bg-blue-50 text-blue-700',
      };
    default:
      return {
        icon: <FileText className="h-5 w-5" />,
        label: 'Letter',
        accent: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
        badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      };
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (Number.isNaN(date.valueOf())) return dateString;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateString?: string) {
  if (!dateString) return 'Not saved yet';

  const date = new Date(dateString);
  if (Number.isNaN(date.valueOf())) return dateString;

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function stripHtml(value?: string) {
  if (!value) return '';
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncateContent(text?: string, maxLength = 150) {
  const clean = stripHtml(text);
  if (!clean) return 'No content preview added.';
  if (clean.length <= maxLength) return clean;
  return `${clean.substring(0, maxLength)}...`;
}

export function MessageCard({
  item,
  onEdit,
  onDelete,
  onView,
  onPlay,
}: MessageCardProps) {
  const typeConfig = getTypeConfig(item.messageType);
  const deliveryLabel =
    item.deliveryTrigger === 'date'
      ? formatDate(item.deliveryDate) || 'Scheduled date'
      : 'Upon Death';
  const actionLabel = item.messageType === 'letter' ? 'View' : 'Play';

  return (
    <article className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${typeConfig.accent}`}
            >
              {typeConfig.icon}
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={`rounded-full ${typeConfig.badge}`}
                >
                  {typeConfig.label}
                </Badge>

                <Badge
                  variant="outline"
                  className={
                    item.isDelivered
                      ? 'rounded-full border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'rounded-full border-amber-200 bg-amber-50 text-amber-700'
                  }
                >
                  {item.isDelivered ? (
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  ) : (
                    <Clock3 className="mr-1 h-3.5 w-3.5" />
                  )}
                  {item.isDelivered ? 'Delivered' : 'Pending'}
                </Badge>
              </div>

              <h3 className="line-clamp-2 text-base font-semibold text-slate-950 sm:text-lg">
                {item.title || 'Untitled Message'}
              </h3>

              {item.subject && (
                <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">
                  {item.subject}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            {(onView || onPlay) && (
              <Button
                type="button"
                size="icon"
                onClick={onPlay || onView}
                className="h-10 w-10 rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
                aria-label={`${actionLabel} message`}
              >
                {item.messageType === 'letter' ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}

            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onEdit}
                className="h-10 w-10 rounded-2xl border-slate-200"
                aria-label="Edit message"
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
                aria-label="Delete message"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoTile
            icon={<UserRound className="h-4 w-4" />}
            label="Recipient"
            value={item.recipient || 'No recipient'}
          />
          <InfoTile
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={item.recipientEmail || 'No email'}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <CalendarClock className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">
              Delivery
            </p>
          </div>

          <p className="text-sm font-semibold text-slate-900">
            {deliveryLabel}
          </p>

          {item.deliveryOccasion && (
            <p className="mt-1 text-xs font-medium text-slate-500">
              {item.deliveryOccasion}
            </p>
          )}
        </div>

        {item.media?.url ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
            {item.messageType === 'video' ? (
              <video
                controls
                src={item.media.url}
                className="h-44 w-full rounded-xl bg-black object-cover"
              />
            ) : (
              <audio controls src={item.media.url} className="w-full" />
            )}
          </div>
        ) : item.audioFile || item.videoFile ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Attached Media
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {item.audioFile?.name || item.videoFile?.name}
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Preview
            </p>
            <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-slate-700">
              {truncateContent(item.content)}
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="min-w-0 truncate text-xs font-medium text-slate-400">
            Updated {formatDateTime(item.lastModified)}
          </p>

          {(onView || onPlay) && (
            <Button
              type="button"
              variant="outline"
              onClick={onPlay || onView}
              className="h-10 shrink-0 rounded-2xl border-slate-200"
            >
              {item.messageType === 'letter' ? (
                <Eye className="mr-2 h-4 w-4" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {actionLabel}
            </Button>
          )}
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
