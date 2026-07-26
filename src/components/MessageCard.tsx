'use client';

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
import { toPlayableMediaUrl } from '@/utils/mediaPlayback';
import { isImageMedia } from '@/utils/mediaUpload';

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
        badge: 'border-rose-200 bg-rose-50 text-rose-700',
      };
    case 'audio':
      return {
        icon: <Mic className="h-5 w-5" />,
        label: 'Audio',
        badge: 'border-sky-200 bg-sky-50 text-sky-700',
      };
    default:
      return {
        icon: <FileText className="h-5 w-5" />,
        label: 'Letter',
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

function truncateContent(text?: string, maxLength = 140) {
  const clean = stripHtml(text);
  if (!clean) return 'No content preview added.';
  if (clean.length <= maxLength) return clean;
  return `${clean.substring(0, maxLength)}…`;
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
      : 'Upon death';
  const actionLabel = item.messageType === 'letter' ? 'View' : 'Play';

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#213D59] text-white">
          {typeConfig.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap gap-1.5">
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

              <h3 className="line-clamp-2 text-base font-semibold text-slate-900">
                {item.title || 'Untitled Message'}
              </h3>
              {item.subject && (
                <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                  {item.subject}
                </p>
              )}
            </div>

            <div className="flex shrink-0 gap-1.5">
              {(onView || onPlay) && (
                <Button
                  type="button"
                  size="icon"
                  onClick={onPlay || onView}
                  className="h-9 w-9 rounded-lg bg-[#213D59] text-white hover:bg-[#00305C]"
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
                  className="h-9 w-9 rounded-lg border-slate-200"
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
                  className="h-9 w-9 rounded-lg border-rose-100 text-rose-600 hover:bg-rose-50"
                  aria-label="Delete message"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
          <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{item.recipient || 'No recipient'}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
          <Mail className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{item.recipientEmail || 'No email'}</span>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800">{deliveryLabel}</p>
          {item.deliveryOccasion && (
            <p className="mt-0.5 text-xs text-slate-500">
              {item.deliveryOccasion}
            </p>
          )}
        </div>
      </div>

      {item.media?.url ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-2.5">
          {item.messageType === 'video' ? (
            isImageMedia(item.media) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.media.url}
                alt=""
                className="h-40 w-full rounded-lg object-cover"
              />
            ) : (
              <video
                controls
                playsInline
                preload="metadata"
                src={toPlayableMediaUrl(item.media.url, 'video')}
                className="h-40 w-full rounded-lg bg-black object-cover"
              />
            )
          ) : (
            <audio
              controls
              playsInline
              preload="metadata"
              src={toPlayableMediaUrl(item.media.url, 'audio')}
              className="w-full"
            />
          )}
        </div>
      ) : item.audioFile || item.videoFile ? (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Attached media
          </p>
          <p className="mt-1 text-sm text-slate-800">
            {item.audioFile?.name || item.videoFile?.name}
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Preview
          </p>
          <p className="mt-1 line-clamp-3 text-sm italic leading-6 text-slate-600">
            {truncateContent(item.content)}
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <p className="min-w-0 truncate text-xs text-slate-400">
          Updated {formatDateTime(item.lastModified)}
        </p>
        {(onView || onPlay) && (
          <Button
            type="button"
            variant="outline"
            onClick={onPlay || onView}
            className="h-9 shrink-0 rounded-lg border-slate-200"
          >
            {item.messageType === 'letter' ? (
              <Eye className="mr-1.5 h-4 w-4" />
            ) : (
              <Play className="mr-1.5 h-4 w-4" />
            )}
            {actionLabel}
          </Button>
        )}
      </div>
    </article>
  );
}
