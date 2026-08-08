'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@common/ui/utils';
import {
  listUnseenNewFills,
  NEW_FILLS_CHANGED,
  type NewFillMarker,
} from '@/utils/newFillMarkers';
import { getAiSectionLabel } from '@/utils/aiSectionRegistry';

type OverviewRecentlyFilledProps = {
  onOpenFill: (marker: NewFillMarker) => void;
  className?: string;
};

/**
 * Above-the-fold jump list for AI fills — chip strip first so users do not
 * hunt the long vault nav after leaving overview uploads.
 */
export function OverviewRecentlyFilled({
  onOpenFill,
  className,
}: OverviewRecentlyFilledProps) {
  const [fills, setFills] = useState<NewFillMarker[]>(() =>
    listUnseenNewFills(),
  );

  useEffect(() => {
    const refresh = () => setFills(listUnseenNewFills());
    window.addEventListener(NEW_FILLS_CHANGED, refresh);
    return () => window.removeEventListener(NEW_FILLS_CHANGED, refresh);
  }, []);

  if (!fills.length) return null;

  const visible = fills.slice(0, 10);

  return (
    <section
      id="overview-recently-filled"
      className={cn(
        'overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-white shadow-sm ring-1 ring-amber-100/80',
        className,
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-amber-100/90 px-4 py-3.5 sm:px-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600" />
            <h2 className="text-[17px] font-semibold text-[#213D59]">
              New in your vault
            </h2>
            <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[12px] font-bold text-white">
              {fills.length === 1
                ? '1 new document'
                : `${fills.length} new documents`}
            </span>
          </div>
          <p className="mt-1.5 text-[13.5px] leading-snug text-slate-600">
            Tap any item below to jump straight to that filled card — no hunting
            through the long list.
          </p>
        </div>
      </div>

      {/* Horizontal chips — always visible without scrolling the page list */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3.5 sm:px-5">
        {visible.map(marker => (
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
        {visible.map(marker => (
          <li key={marker.id}>
            <button
              type="button"
              onClick={() => onOpenFill(marker)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-amber-50/80 sm:px-5"
            >
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-semibold text-slate-900">
                  {marker.label}
                </span>
                <span className="mt-0.5 block truncate text-[13px] text-slate-600">
                  {getAiSectionLabel(marker.sectionId)}
                  {marker.subsectionId ? ` · ${marker.subsectionId}` : ''}
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-[13px] font-bold text-white">
                Open
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
