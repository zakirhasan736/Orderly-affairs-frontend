'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { cn } from '@common/ui/utils';
import {
  getSubsectionProgress,
  getTopicItemProgress,
  listIncompleteFields,
  type SectionProgress,
} from '@/utils/sectionCompletion';
import {
  IncompleteFieldsFillDialog,
  type FillGapsTarget,
} from '@/components/vault/IncompleteFieldsFillDialog';

type VaultFillProgressChipProps = {
  sectionId: string;
  subsectionId: string;
  /** Topic / repeatable item index */
  itemIndex?: number;
  groupId?: string;
  title: string;
  sectionData: Record<string, unknown> | undefined;
  onApplySectionData: (next: Record<string, unknown>) => void;
  className?: string;
  /** Smaller chip for dense topic headers */
  compact?: boolean;
};

function ProgressRing({
  percent,
  complete,
  size = 28,
}: {
  percent: number;
  complete: boolean;
  size?: number;
}) {
  if (complete) {
    return (
      <CheckCircle2
        className="shrink-0 text-emerald-600"
        style={{ width: size, height: size }}
      />
    );
  }
  if (percent <= 0) {
    return (
      <Circle
        className="shrink-0 text-slate-300"
        style={{ width: size, height: size }}
      />
    );
  }

  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`${percent}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#213D59"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[9px] font-bold tabular-nums text-[#213D59]">
        {percent}
      </span>
    </span>
  );
}

export function VaultFillProgressChip({
  sectionId,
  subsectionId,
  itemIndex,
  groupId,
  title,
  sectionData,
  onApplySectionData,
  className,
  compact = false,
}: VaultFillProgressChipProps) {
  const [open, setOpen] = useState(false);

  const progress: SectionProgress = useMemo(() => {
    if (typeof itemIndex === 'number' || groupId) {
      return getTopicItemProgress(
        sectionId,
        subsectionId,
        itemIndex ?? 0,
        sectionData,
        groupId,
      );
    }
    return getSubsectionProgress(sectionId, subsectionId, sectionData);
  }, [sectionId, subsectionId, itemIndex, groupId, sectionData]);

  const emptyCount = useMemo(
    () =>
      listIncompleteFields(sectionId, subsectionId, sectionData, {
        itemIndex,
        groupId,
      }).length,
    [sectionId, subsectionId, sectionData, itemIndex, groupId],
  );

  const target: FillGapsTarget = {
    sectionId,
    subsectionId,
    itemIndex,
    groupId,
    title,
    sectionData,
    onApplySectionData,
  };

  return (
    <>
      <div
        className={cn(
          'inline-flex items-center gap-1.5',
          className,
        )}
      >
        <ProgressRing
          percent={progress.percent}
          complete={progress.complete}
          size={compact ? 24 : 28}
        />
        {!progress.complete && emptyCount > 0 ? (
          <button
            type="button"
            onClick={event => {
              event.stopPropagation();
              setOpen(true);
            }}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border border-[#213D59]/20 bg-[#e7eef7] font-semibold text-[#213D59] transition hover:bg-[#dce6f2]',
              compact
                ? 'px-2 py-0.5 text-[10px]'
                : 'px-2.5 py-1 text-[11px]',
            )}
            title="Quick fill — still empty or this whole area"
          >
            <Sparkles className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            Fill {emptyCount}
          </button>
        ) : progress.complete ? (
          <span
            className={cn(
              'font-semibold text-emerald-700',
              compact ? 'text-[10px]' : 'text-[11px]',
            )}
          >
            Done
          </span>
        ) : (
          <span
            className={cn(
              'tabular-nums text-slate-500',
              compact ? 'text-[10px]' : 'text-[11px]',
            )}
          >
            {progress.percent}%
          </span>
        )}
      </div>

      <IncompleteFieldsFillDialog
        open={open}
        onOpenChange={setOpen}
        target={open ? target : null}
      />
    </>
  );
}

/** Compact % only (sidebar). */
export function VaultProgressPercentMark({
  percent,
  complete,
  className,
}: {
  percent: number;
  complete: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold tabular-nums',
        complete
          ? 'bg-emerald-500/20 text-emerald-100'
          : percent > 0
            ? 'bg-white/15 text-white'
            : 'bg-white/10 text-white/50',
        className,
      )}
      aria-label={complete ? 'Complete' : `${percent}% complete`}
    >
      {complete ? '✓' : `${percent}%`}
    </span>
  );
}
