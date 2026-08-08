'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ClipboardList, Eye, Sparkles, X } from 'lucide-react';
import { cn } from '@common/ui/utils';
import {
  listAllNewFills,
  listUnseenNewFills,
  NEW_FILLS_CHANGED,
  unmarkSectionFillsSeen,
  type NewFillMarker,
} from '@/utils/newFillMarkers';
import { getAiSectionLabel } from '@/utils/aiSectionRegistry';
import { useVaultFillGaps } from '@/components/vault/VaultFillGapsContext';
import { VAULT_NAVIGATION } from '@/utils/vaultNavigation';

const FRESH_MS = 2 * 60 * 1000;

type OverviewRecentlyFilledProps = {
  onOpenFill: (marker: NewFillMarker) => void;
  className?: string;
};

/**
 * One-view “New in your vault” hub — Just saved coach + chips so users
 * (often 50+) do not hunt the sidebar for New markers.
 */
export function OverviewRecentlyFilled({
  onOpenFill,
  className,
}: OverviewRecentlyFilledProps) {
  const fillGaps = useVaultFillGaps();
  const [tick, setTick] = useState(0);
  const [coachDismissed, setCoachDismissed] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setTick(value => value + 1);
      setCoachDismissed(false);
    };
    window.addEventListener(NEW_FILLS_CHANGED, refresh);
    return () => window.removeEventListener(NEW_FILLS_CHANGED, refresh);
  }, []);

  const unseen = useMemo(() => {
    void tick;
    return listUnseenNewFills();
  }, [tick]);

  const recent = useMemo(() => {
    void tick;
    return listAllNewFills().slice(0, 12);
  }, [tick]);

  if (!recent.length) return null;

  const featured = unseen[0] || recent[0];
  const isFresh =
    Boolean(featured) && Date.now() - featured.createdAt < FRESH_MS;
  const showCoach =
    Boolean(featured) &&
    !coachDismissed &&
    (unseen.length > 0 || isFresh);

  const visibleUnseen = unseen.slice(0, 10);
  const display = visibleUnseen.length ? visibleUnseen : recent.slice(0, 8);

  const whereLine = (marker: NewFillMarker) => {
    const section =
      getAiSectionLabel(marker.sectionId) || `Section ${marker.sectionId}`;
    return marker.label ? `${section} · ${marker.label}` : section;
  };

  const openReviewFields = (marker: NewFillMarker) => {
    const section = VAULT_NAVIGATION.find(s => s.id === marker.sectionId);
    const subsectionId =
      marker.subsectionId || section?.subsections?.[0]?.id || null;
    if (!subsectionId || !fillGaps) {
      onOpenFill(marker);
      return;
    }
    const title =
      marker.label ||
      getAiSectionLabel(marker.sectionId) ||
      `Section ${marker.sectionId}`;
    fillGaps.openFillGaps({
      sectionId: marker.sectionId,
      subsectionId,
      itemIndex: typeof marker.index === 'number' ? marker.index : undefined,
      groupId: marker.topicGroupKey,
      title,
      initialTab: 'empty',
    });
  };

  const reviveAndOpen = (marker: NewFillMarker) => {
    unmarkSectionFillsSeen(marker.sectionId);
    onOpenFill(marker);
  };

  return (
    <section
      id="overview-recently-filled"
      data-tour="tour-new-data-hub"
      className={cn(
        'overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-white shadow-sm ring-1 ring-amber-100/80',
        className,
      )}
    >
      {showCoach && featured ? (
        <div
          className={cn(
            'animate-in fade-in slide-in-from-top-2 border-b border-amber-200/80 bg-gradient-to-r from-amber-100/90 via-amber-50 to-white px-4 py-4 duration-500 sm:px-5',
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </span>
                <h2 className="text-[18px] font-bold tracking-tight text-[#213D59]">
                  Just saved — open here
                </h2>
              </div>
              <p className="mt-2 max-w-2xl text-[14px] leading-snug text-slate-700">
                Your new data is on{' '}
                <span className="font-semibold text-slate-900">
                  {whereLine(featured)}
                </span>
                . Stay on the Dashboard, or jump straight to the card.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCoachDismissed(true)}
              className="rounded-full p-1.5 text-slate-500 transition hover:bg-white/80 hover:text-slate-800"
              aria-label="Dismiss Just saved coach"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onOpenFill(featured)}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2.5 text-[14px] font-bold text-white shadow-sm transition hover:bg-amber-600"
            >
              Open
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => openReviewFields(featured)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#213D59]/25 bg-white px-4 py-2.5 text-[14px] font-semibold text-[#213D59] shadow-sm transition hover:bg-[#eef3f9]"
            >
              <ClipboardList className="h-4 w-4" />
              Review fields
            </button>
            <button
              type="button"
              onClick={() => setCoachDismissed(true)}
              className="inline-flex items-center rounded-full px-3.5 py-2.5 text-[13px] font-medium text-slate-600 underline-offset-2 transition hover:bg-white/70 hover:text-slate-900 hover:underline"
            >
              I’ll do this later
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-amber-100/90 px-4 py-3.5 sm:px-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <h2 className="text-[17px] font-semibold text-[#213D59]">
                New data — one place
              </h2>
              <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[12px] font-bold text-white">
                {unseen.length > 0
                  ? unseen.length === 1
                    ? '1 new to review'
                    : `${unseen.length} new to review`
                  : `${recent.length} recent`}
              </span>
            </div>
            <p className="mt-1.5 max-w-2xl text-[13.5px] leading-snug text-slate-600">
              Tap <span className="font-semibold">Open</span> to jump to the
              card, or <span className="font-semibold">Review fields</span> for
              the empty / already-filled popup — even if you skipped it earlier.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto px-4 py-3.5 sm:px-5">
        {display.map(marker => (
          <button
            key={`chip-${marker.id}`}
            type="button"
            onClick={() => onOpenFill(marker)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-amber-300 bg-white px-3.5 py-2.5 text-left shadow-sm transition hover:border-amber-400 hover:bg-amber-50"
          >
            <span className="max-w-[11rem] truncate text-[14px] font-semibold text-slate-900 sm:max-w-[16rem]">
              {marker.label}
            </span>
            <span className="shrink-0 text-[12px] font-bold text-amber-800">
              Open
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-amber-700" />
          </button>
        ))}
      </div>

      <ul className="divide-y divide-amber-100/80 border-t border-amber-100/80">
        {display.map(marker => {
          const isSeen = Boolean(marker.seenAt);
          return (
            <li key={marker.id}>
              <div className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <button
                  type="button"
                  onClick={() => onOpenFill(marker)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-[15px] font-semibold text-slate-900">
                    {marker.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] text-slate-600">
                    {getAiSectionLabel(marker.sectionId)}
                    {marker.subsectionId ? ` · ${marker.subsectionId}` : ''}
                    {isSeen ? ' · opened before' : ' · new'}
                  </span>
                </button>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openReviewFields(marker)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#213D59]/20 bg-white px-3 py-1.5 text-[13px] font-semibold text-[#213D59] transition hover:bg-[#eef3f9]"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Review fields
                  </button>
                  {isSeen ? (
                    <button
                      type="button"
                      onClick={() => reviveAndOpen(marker)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-[13px] font-semibold text-amber-900 transition hover:bg-amber-100"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Show New again
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenFill(marker)}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-[13px] font-bold text-white"
                    >
                      Open
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
