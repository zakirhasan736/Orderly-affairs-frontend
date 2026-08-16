import React from 'react';
import { cn } from '@common/ui/utils';
import { LEGAL_DISCLAIMER } from './copy';

export function LegalDisclaimer({
  variant = 'callout',
  className,
}: {
  variant?: 'callout' | 'footer';
  className?: string;
}) {
  if (variant === 'footer') {
    return (
      <p
        className={cn(
          'border-t border-[#E4EAF0] pt-4 text-[13px] leading-[1.55] text-[#6A7481]',
          className,
        )}
      >
        {LEGAL_DISCLAIMER}
      </p>
    );
  }

  return (
    <aside
      className={cn(
        'rounded-[16px] border border-[#E4EAF0] bg-white px-4 py-4 text-[15px] leading-[1.55] text-[#213D59] shadow-[0_1px_2px_rgba(33,61,89,0.06)]',
        className,
      )}
      role="note"
    >
      <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#7A8794]">
        Legal notice
      </p>
      <p className="mt-1.5">{LEGAL_DISCLAIMER}</p>
    </aside>
  );
}
