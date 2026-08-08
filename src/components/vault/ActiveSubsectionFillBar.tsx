'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Sparkles } from 'lucide-react';
import {
  getSubsectionProgress,
  getTopicItemProgress,
  listAreaFields,
  listIncompleteFields,
} from '@/utils/sectionCompletion';
import { useVaultFillGaps } from '@/components/vault/VaultFillGapsContext';
import {
  formatVaultSubsectionTitle,
  VAULT_NAVIGATION,
} from '@/utils/vaultNavigation';
import { cn } from '@common/ui/utils';
import {
  listAllNewFills,
  NEW_FILLS_CHANGED,
  type NewFillMarker,
} from '@/utils/newFillMarkers';

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

const JUST_FILLED_MS = 2 * 60 * 1000;

function markerMatchesCard(
  item: NewFillMarker,
  match: {
    sectionId: string;
    subsectionId: string;
    topicGroupKey?: string;
    index?: number;
  },
) {
  if (item.sectionId !== match.sectionId) return false;
  if (item.subsectionId !== match.subsectionId) return false;
  if (
    match.topicGroupKey != null &&
    match.index != null &&
    item.topicGroupKey === match.topicGroupKey &&
    item.index === match.index
  ) {
    return true;
  }
  if (match.index != null && item.index === match.index) return true;
  if (match.index == null) return true;
  return false;
}

type ActiveSubsectionFillBarProps = {
  sectionId: string;
  subsectionId: string | null;
  topicId?: string | null;
  sectionData: Record<string, unknown> | undefined;
  className?: string;
};

/**
 * Sticky bar on every section page. Always offers Review fields (empty +
 * already filled tabs) so users can reopen the popup after Skip / Close.
 */
export function ActiveSubsectionFillBar({
  sectionId,
  subsectionId,
  topicId,
  sectionData,
  className,
}: ActiveSubsectionFillBarProps) {
  const fillGaps = useVaultFillGaps();
  const [fillTick, setFillTick] = useState(0);

  useEffect(() => {
    const refresh = () => setFillTick(value => value + 1);
    window.addEventListener(NEW_FILLS_CHANGED, refresh);
    return () => window.removeEventListener(NEW_FILLS_CHANGED, refresh);
  }, []);

  const justFilled = useMemo(() => {
    void fillTick;
    if (!subsectionId) return false;
    const topicRef = parseTopicRef(topicId);
    const now = Date.now();
    return listAllNewFills().some(item => {
      const fresh = now - item.createdAt < JUST_FILLED_MS;
      if (item.seenAt && !fresh) return false;
      return markerMatchesCard(item, {
        sectionId,
        subsectionId,
        topicGroupKey: topicRef.groupId,
        index: topicRef.itemIndex,
      });
    });
  }, [fillTick, sectionId, subsectionId, topicId]);

  const meta = useMemo(() => {
    if (!subsectionId) return null;
    const section = VAULT_NAVIGATION.find(s => s.id === sectionId);
    const subsection = section?.subsections?.find(s => s.id === subsectionId);
    const topicRef = parseTopicRef(topicId);
    const hasTopic = typeof topicRef.itemIndex === 'number' && Boolean(topicId);

    let itemIndex = hasTopic ? topicRef.itemIndex : undefined;
    let groupId = topicRef.groupId;
    let title = subsection
      ? formatVaultSubsectionTitle(sectionId, subsection)
      : 'Subsection';

    const bucket = sectionData?.[subsectionId];
    if (!hasTopic && Array.isArray(bucket)) {
      for (let i = 0; i < bucket.length; i += 1) {
        const itemProgress = getTopicItemProgress(
          sectionId,
          subsectionId,
          i,
          sectionData,
        );
        if (!itemProgress.complete && itemProgress.total > 0) {
          itemIndex = i;
          title = `${title} · Item ${i + 1}`;
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
    const area = listAreaFields(sectionId, subsectionId, sectionData, {
      itemIndex,
      groupId,
    });

    if (hasTopic) {
      title = `${title} · Item ${(topicRef.itemIndex ?? 0) + 1}`;
    }

    return {
      progress,
      emptyCount: empty.length,
      areaCount: area.length,
      title,
      itemIndex,
      groupId,
    };
  }, [sectionId, subsectionId, topicId, sectionData]);

  if (!subsectionId || !meta || meta.areaCount <= 0) return null;

  const openDialog = (initialTab: 'empty' | 'area') => {
    fillGaps?.openFillGaps({
      sectionId,
      subsectionId,
      itemIndex: meta.itemIndex,
      groupId: meta.groupId,
      title: meta.title,
      initialTab,
    });
  };

  return (
    <div
      data-tour="tour-fill-empty-bar"
      className={cn(
        'sticky top-0 z-30 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#213D59]/15 bg-white/95 px-3.5 py-2.5 shadow-sm backdrop-blur-md',
        meta.emptyCount > 0 || justFilled
          ? 'border-amber-200 bg-amber-50/90'
          : undefined,
        className,
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-[#213D59]">
          {meta.title}
        </p>
        <p className="text-[12px] text-slate-600">
          {meta.progress.percent}% complete
          {meta.emptyCount > 0
            ? ` · ${meta.emptyCount} empty field${meta.emptyCount === 1 ? '' : 's'}`
            : ' · all fields have values'}
        </p>
        {justFilled ? (
          <p className="mt-0.5 text-[12px] font-semibold leading-snug text-amber-800">
            This card was just filled — Review fields
          </p>
        ) : (
          <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
            Use Review fields anytime — empty blanks, already filled values, or
            after you skipped the popup.
          </p>
        )}
      </div>

      {fillGaps ? (
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            data-tour="tour-review-fields-action"
            onClick={() => openDialog(meta.emptyCount > 0 ? 'empty' : 'area')}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#213D59]/25 bg-white px-3.5 py-2 text-[12px] font-semibold text-[#213D59] shadow-sm transition hover:bg-[#eef3f9]"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Review fields
          </button>
          {meta.emptyCount > 0 ? (
            <button
              type="button"
              data-tour="tour-fill-empty-action"
              onClick={() => openDialog('empty')}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#213D59] px-3.5 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#00305C]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Quick fill
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
