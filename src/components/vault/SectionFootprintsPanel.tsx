'use client';

import React, { useMemo } from 'react';
import { Clock3, Footprints, UserRound } from 'lucide-react';
import { useGetSectionFootprintsQuery } from '@/services/authApi';
import { formConfig } from '@/config/formConfig';
import { cn } from '@common/ui/utils';

function sectionTitle(sectionId: string): string {
  for (const chunk of formConfig.chunks) {
    for (const section of chunk.sections) {
      if (section.id === sectionId) return section.title;
      const parent = sectionId.replace(/[A-Za-z].*$/, '');
      if (section.id === parent) return section.title;
    }
  }
  return `Section ${sectionId}`;
}

function formatWhen(value?: string) {
  if (!value) return 'Unknown time';
  try {
    return new Date(value).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

/**
 * Owner audit trail — who last updated vehicles, insurance, etc.
 */
export function SectionFootprintsPanel({
  className,
}: {
  className?: string;
}) {
  const { data, isLoading, isError } = useGetSectionFootprintsQuery({
    limit: 40,
  });

  const latest = useMemo(() => data?.latest || [], [data?.latest]);
  const history = useMemo(() => data?.history || [], [data?.history]);

  return (
    <section
      className={cn(
        'overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]',
        className,
      )}
    >
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#00305C] text-white">
            <Footprints className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">
              Activity footprints
            </h3>
            <p className="mt-0.5 text-sm text-slate-500">
              See which family member last updated Vehicles, Insurance, or any
              other area — including document uploads.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading activity…</p>
        ) : isError ? (
          <p className="text-sm text-rose-600">
            Couldn’t load footprints. Try again shortly.
          </p>
        ) : (
          <>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Latest by section
              </p>
              {latest.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center text-sm text-slate-500">
                  No section updates recorded yet. When you or a family member
                  save changes, they’ll appear here.
                </p>
              ) : (
                <ul className="space-y-2">
                  {latest.slice(0, 12).map(item => (
                    <li
                      key={`${item.section_id}-${item.updated_at}`}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-3.5 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {sectionTitle(String(item.section_id))}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <UserRound className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {item.actor?.full_name || 'Unknown'}
                            {item.actor?.portal_role_label
                              ? ` · ${item.actor.portal_role_label}`
                              : item.actor?.role === 'owner'
                                ? ' · Owner'
                                : ''}
                          </span>
                        </p>
                      </div>
                      <p className="shrink-0 text-[11px] font-medium text-slate-400">
                        {formatWhen(item.updated_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {history.length > 0 ? (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Recent history
                </p>
                <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {history.slice(0, 20).map(item => (
                    <li
                      key={item.id}
                      className="flex items-start gap-2 rounded-xl px-1 py-1.5 text-sm"
                    >
                      <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-800">
                          <span className="font-semibold">
                            {item.actor?.full_name || 'Someone'}
                          </span>{' '}
                          updated{' '}
                          <span className="font-medium">
                            {sectionTitle(String(item.section_id))}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {formatWhen(item.created_at)}
                          {item.actor?.portal_role_label
                            ? ` · ${item.actor.portal_role_label}`
                            : ''}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
