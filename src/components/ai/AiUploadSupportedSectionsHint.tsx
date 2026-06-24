'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@common/ui/utils';
import {
  AI_SUPPORTED_UPLOAD_CATEGORIES,
  AI_UPLOAD_DETECTION_HINT,
} from '@/utils/aiRoutingUi';
import { AI_MOBILE_CHIP_ROW } from '@/utils/aiMobileUi';

type Props = {
  compact?: boolean;
  className?: string;
};

const CHIP_LABELS: Record<(typeof AI_SUPPORTED_UPLOAD_CATEGORIES)[number], string> =
  {
    'Personal Information': 'Personal',
    'Employment & Income': 'Employment',
    'Education History': 'Education',
    'Insurance & Vehicles': 'Insurance',
    'Banking & Investments': 'Banking',
    Healthcare: 'Healthcare',
    'Legal Documents': 'Legal',
    'Assets & Estate Planning': 'Assets',
  };

export function AiUploadSupportedSectionsHint({
  compact = false,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'text-left',
        compact
          ? 'mt-1.5'
          : 'rounded-xl border border-slate-100/80 bg-slate-50/50 px-2.5 py-2 sm:rounded-lg',
        className,
      )}
    >
      <p className="flex items-start gap-1.5 text-[11px] leading-snug text-slate-500 sm:items-center">
        <Sparkles
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500 sm:mt-0"
          aria-hidden
        />
        <span>{AI_UPLOAD_DETECTION_HINT}</span>
      </p>

      <div
        className={cn(AI_MOBILE_CHIP_ROW, 'mt-1.5')}
        aria-label="Supported document types"
      >
        {AI_SUPPORTED_UPLOAD_CATEGORIES.map(category => (
          <span
            key={category}
            title={category}
            className="inline-flex shrink-0 items-center rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium leading-none text-slate-600 ring-1 ring-slate-200/80 sm:rounded-md sm:px-1.5 sm:py-0.5 sm:text-[10px]"
          >
            {CHIP_LABELS[category]}
          </span>
        ))}
      </div>
    </div>
  );
}
