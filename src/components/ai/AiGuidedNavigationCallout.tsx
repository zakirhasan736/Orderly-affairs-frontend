'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  AI_GUIDED_NAVIGATION_EVENT,
  type AiGuidedNavigationDetail,
} from '@/utils/aiRoutingUi';
import { AI_MOBILE_GUIDED_CALLOUT } from '@/utils/aiMobileUi';

export function AiGuidedNavigationCallout() {
  const [callout, setCallout] = useState<AiGuidedNavigationDetail | null>(null);

  useEffect(() => {
    const handleGuided = (event: Event) => {
      const detail = (event as CustomEvent<AiGuidedNavigationDetail>).detail;
      if (!detail?.sectionLabel) return;

      setCallout(detail);

      window.setTimeout(() => {
        setCallout(null);
      }, detail.durationMs ?? 4500);
    };

    window.addEventListener(AI_GUIDED_NAVIGATION_EVENT, handleGuided);
    return () => {
      window.removeEventListener(AI_GUIDED_NAVIGATION_EVENT, handleGuided);
    };
  }, []);

  if (!callout) {
    return null;
  }

  return (
    <div className={AI_MOBILE_GUIDED_CALLOUT}>
      <div className="animate-in fade-in slide-in-from-bottom-3 flex w-full items-center gap-3 rounded-2xl border border-indigo-200 bg-white/95 px-4 py-3 shadow-xl shadow-indigo-100/80 backdrop-blur-sm duration-300 sm:max-w-md sm:slide-in-from-top-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50">
          <ArrowRight className="h-5 w-5 animate-pulse text-indigo-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
            Taking you to
          </p>
          <p className="truncate text-sm font-semibold text-slate-900">
            {callout.sectionLabel}
          </p>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-indigo-100">
            <div className="h-full w-full origin-left animate-[shrinkbar_4.5s_linear_forwards] bg-indigo-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
