'use client';

import React, { useMemo } from 'react';
import { Pin } from 'lucide-react';
import { useGetSectionFootprintsQuery } from '@/services/authApi';
import { getSectionLastUpdated } from '@/utils/sectionLastUpdated';
import { cn } from '@common/ui/utils';

function formatWhen(value?: string) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function pickEntry(
  rows: Array<{
    section_id?: string;
    scope_id?: string;
    subsection_id?: string;
    updated_at?: string;
    actor?: {
      full_name?: string;
      email?: string;
      role?: string;
      portal_role_label?: string;
    };
  }>,
  sectionId: string,
  scopeId?: string | null,
) {
  const sid = String(sectionId);
  if (scopeId) {
    const exact = rows.find(
      item =>
        String(item.section_id || '') === sid &&
        String(item.scope_id || '') === String(scopeId),
    );
    if (exact) return exact;

    const subsection = rows.find(
      item =>
        String(item.section_id || '') === sid &&
        (String(item.scope_id || '') === String(scopeId) ||
          String(item.subsection_id || '') === String(scopeId) ||
          String(item.scope_id || '').startsWith(`${scopeId}:`) ||
          String(item.scope_id || '').startsWith(`${scopeId}.`)),
    );
    if (subsection) return subsection;
  }

  return rows.find(item => {
    const id = String(item.section_id || '');
    return id === sid || id.startsWith(sid) || sid.startsWith(id);
  });
}

/**
 * Small pin card: who last updated this vault section / subsection / item.
 */
export function SectionLastUpdatedPin({
  sectionId,
  subsectionId,
  scopeId,
  label = 'Last update',
  className,
  compact = false,
}: {
  sectionId: string;
  /** Subsection id like 5A — falls back to section stamp when missing. */
  subsectionId?: string | null;
  /** Exact scope like 5A:0 or 7A.policy_number */
  scopeId?: string | null;
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const { data } = useGetSectionFootprintsQuery({ limit: 120 });
  const resolvedScope = scopeId || subsectionId || null;

  const entry = useMemo(() => {
    const subsectionRows = data?.latest_subsections || [];
    if (resolvedScope && subsectionRows.length) {
      const fromSub = pickEntry(subsectionRows, sectionId, resolvedScope);
      if (fromSub?.actor) return fromSub;
    }
    return pickEntry(data?.latest || [], sectionId, null);
  }, [data?.latest, data?.latest_subsections, resolvedScope, sectionId]);

  const localWhen = getSectionLastUpdated(sectionId);
  const when = formatWhen(entry?.updated_at || localWhen || undefined);
  if (!entry?.actor && !when) return null;

  const who =
    entry?.actor?.full_name ||
    entry?.actor?.email ||
    entry?.actor?.portal_role_label ||
    'Owner';
  const role =
    entry?.actor?.role === 'owner'
      ? 'Owner'
      : entry?.actor?.portal_role_label ||
        (entry?.actor?.role ? 'Collaborator' : 'Owner');
  const scopeHint = resolvedScope
    ? String(resolvedScope).split(':')[0]
    : '';

  return (
    <div
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/90 px-2 py-1 text-left',
        compact && 'px-2 py-0.5',
        className,
      )}
      title={`Last updated by ${who}${scopeHint ? ` · ${scopeHint}` : ''}`}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-[#213D59] text-white',
          compact ? 'h-5 w-5' : 'h-6 w-6',
        )}
      >
        <Pin className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-semibold text-[#213D59]">
          {compact
            ? `${who}${when ? ` · ${when}` : ''}`
            : `${label} · ${who}`}
        </span>
        {compact ? null : (
          <span className="mt-0.5 block truncate text-[10px] text-[#7A8794]">
            {role}
            {scopeHint ? ` · ${scopeHint}` : ''}
            {when ? ` · ${when}` : ''}
          </span>
        )}
      </span>
    </div>
  );
}
