'use client';

import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import {
  getSubsectionProgress,
  getTopicItemProgress,
  listIncompleteFields,
} from '@/utils/sectionCompletion';
import { useVaultFillGaps } from '@/components/vault/VaultFillGapsContext';
import { VAULT_NAVIGATION } from '@/utils/vaultNavigation';
import { cn } from '@common/ui/utils';

function parseTopicRef(topicId: string | null | undefined): {
  itemIndex?: number;
  groupId?: string;
} {
  if (!topicId) return {};
  const parts = String(topicId).split(':');
  if (parts.length >= 3) {
    return { groupId: parts[1], itemIndex: Number(parts[2]) || 0 };
  }
  if (parts.length === 2) {
    return { itemIndex: Number(parts[1]) || 0 };
  }
  return {};
}

type ActiveSubsectionFillBarProps = {
  sectionId: string;
  subsectionId: string | null;
  topicId?: string | null;
  sectionData: Record<string, unknown> | undefined;
  className?: string;
};

/**
 * Sticky smart bar on every section page: shows subsection / topic % and
 * opens the fill-empty-fields popup so owners don't hunt for blanks.
 */
export function ActiveSubsectionFillBar({
  sectionId,
  subsectionId,
  topicId,
  sectionData,
  className,
}: ActiveSubsectionFillBarProps) {
  const fillGaps = useVaultFillGaps();

  const meta = useMemo(() => {
    if (!subsectionId) return null;
    const section = VAULT_NAVIGATION.find(s => s.id === sectionId);
    const subsection = section?.subsections?.find(s => s.id === subsectionId);
    const topicRef = parseTopicRef(topicId);
    const hasTopic = typeof topicRef.itemIndex === 'number' && Boolean(topicId);

    let itemIndex = hasTopic ? topicRef.itemIndex : undefined;
    let groupId = topicRef.groupId;
    let title = `${subsectionId}. ${subsection?.title || 'Subsection'}`;

    const bucket = sectionData?.[subsectionId];
    if (!hasTopic && Array.isArray(bucket)) {
      // Point Fill Empty at the first incomplete card in this subsection.
      for (let i = 0; i < bucket.length; i += 1) {
        const itemProgress = getTopicItemProgress(
          sectionId,
          subsectionId,
          i,
          sectionData,
        );
        if (!itemProgress.complete && itemProgress.total > 0) {
          itemIndex = i;
          title = `${subsectionId} · Item ${i + 1}`;
          break;
        }
      }
    }

    const progress =
      typeof itemIndex === 'number'
        ? getTopicItemProgress(
            sectionId,
            subsectionId,
            itemIndex,
            sectionData,
            groupId,
          )
        : getSubsectionProgress(sectionId, subsectionId, sectionData);

    const empty = listIncompleteFields(sectionId, subsectionId, sectionData, {
      itemIndex,
      groupId,
    });

    if (hasTopic) {
      title = `${subsectionId} · Item ${(topicRef.itemIndex ?? 0) + 1}`;
    }

    return {
      progress,
      emptyCount: empty.length,
      title,
      itemIndex,
      groupId,
    };
  }, [sectionId, subsectionId, topicId, sectionData]);

  if (!subsectionId || !meta || meta.progress.total <= 0) return null;
  if (meta.progress.complete) return null;

  return (
    <div
      data-tour="tour-fill-empty-bar"
      className={cn(
        'sticky top-0 z-30 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#213D59]/15 bg-white/95 px-3.5 py-2.5 shadow-sm backdrop-blur-md',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-[12px] font-semibold text-[#213D59]">
          {meta.title}
        </p>
        <p className="text-[11px] text-slate-500">
          {meta.progress.percent}% complete
          {meta.emptyCount > 0
            ? ` · ${meta.emptyCount} empty field${meta.emptyCount === 1 ? '' : 's'}`
            : ''}
        </p>
        {meta.emptyCount > 0 ? (
          <p className="mt-0.5 text-[10.5px] leading-snug text-slate-400">
            After a document fill, use this to finish only the blanks.
          </p>
        ) : null}
      </div>

      {meta.emptyCount > 0 && fillGaps ? (
        <button
          type="button"
          data-tour="tour-fill-empty-action"
          onClick={() =>
            fillGaps.openFillGaps({
              sectionId,
              subsectionId,
              itemIndex: meta.itemIndex,
              groupId: meta.groupId,
              title: meta.title,
            })
          }
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#213D59] px-3.5 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#00305C]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Quick fill
        </button>
      ) : null}
    </div>
  );
}
