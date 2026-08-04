'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, MessageSquarePlus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  adminListFeedback,
  adminUpdateFeedbackStatus,
  type FeedbackItem,
} from '@/libs/api/feedback';
import { AdminListSkeleton } from '@/components/admin/AdminSkeletons';
import { cn } from '@common/ui/utils';

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const STATUS_OPTIONS = ['open', 'reviewed', 'closed'] as const;

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await adminListFeedback({
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100,
      });
      setItems(data.feedback);
      setLoading(false);
      return data.feedback;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to load feedback';
      setError(msg);
      setLoading(false);
      return [] as FeedbackItem[];
    }
  }, [statusFilter]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const selected = useMemo(
    () => items.find(i => i.id === selectedId) || null,
    [items, selectedId],
  );

  const setStatus = async (
    id: string,
    status: 'open' | 'reviewed' | 'closed',
  ) => {
    try {
      const data = await adminUpdateFeedbackStatus(id, status);
      setItems(prev => prev.map(i => (i.id === id ? data.feedback : i)));
      toast.success(`Marked as ${status}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not update status',
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="oa-admin-notice">
          Product feedback from vault owners · status changes are retained for
          ops review.
        </div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-[#213D59]">
              <MessageSquarePlus className="h-6 w-6" />
              Product feedback
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Ideas and notes owners send from Leave Feedback.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(['open', 'reviewed', 'closed', 'all'] as const).map(key => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium capitalize',
                statusFilter === key
                  ? 'border-[#213D59] bg-[#213D59] text-white'
                  : 'border-slate-200 bg-white text-slate-600',
              )}
            >
              {key}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {loading ? (
              <AdminListSkeleton rows={6} />
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500">
                No feedback yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map(item => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={cn(
                        'w-full px-4 py-3 text-left transition hover:bg-slate-50',
                        selectedId === item.id && 'bg-[#213D59]/[0.05]',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[#213D59]">
                          {item.category}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatTime(item.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-800">
                        {item.subject || item.message}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-slate-500">
                        {item.owner_email || 'Unknown owner'} · {item.status}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            {!selected ? (
              <p className="py-16 text-center text-sm text-slate-500">
                Select a submission to read the full note.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#213D59]">
                      {selected.category}
                      {selected.rating ? ` · ${selected.rating}/5` : ''}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">
                      {selected.subject || 'Untitled feedback'}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {selected.owner_email} · {formatTime(selected.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => void setStatus(selected.id, status)}
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize',
                          selected.status === status
                            ? 'border-[#213D59] bg-[#213D59] text-white'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                  {selected.message}
                </p>

                {selected.page_path && (
                  <p className="text-xs text-slate-500">
                    Page: {selected.page_path}
                  </p>
                )}

                {selected.attachments?.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Attachments
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {selected.attachments.map((att, i) => (
                        <a
                          key={`${att.url}-${i}`}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group relative block overflow-hidden rounded-lg border border-slate-200"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={att.url}
                            alt={att.name || 'Attachment'}
                            className="h-28 w-40 object-cover"
                          />
                          <span className="absolute bottom-1 right-1 rounded bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100">
                            <ExternalLink className="h-3 w-3" />
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
