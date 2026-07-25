'use client';

import React from 'react';
import { cn } from '@common/ui/utils';
import { BRAND_LOGO } from '@/constants/brand';

interface Props {
  role: 'owner' | 'nextkin';
  firstName?: string;
  onStart: () => void;
  onSkip: () => void;
}

export const WelcomeModal: React.FC<Props> = ({
  role,
  firstName,
  onStart,
  onSkip,
}) => {
  const greetingName = (firstName || '').trim() || 'there';

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-[rgba(19,43,38,0.45)] p-4 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-tour-title"
        className={cn(
          'w-full max-w-[min(100%,34rem)] rounded-[18px] bg-white p-6 sm:p-[30px]',
          'shadow-[0_24px_60px_rgba(19,43,38,0.3)]',
        )}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white ring-1 ring-[#132b26]/12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND_LOGO}
            alt=""
            width={28}
            height={28}
            className="h-[78%] w-[78%] object-contain"
          />
        </div>

        <h2
          id="welcome-tour-title"
          className="mt-5 mb-0 font-[family-name:var(--font-family-serif)] text-[clamp(1.5rem,4vw,1.875rem)] font-normal leading-[1.2] text-[#132b26]"
        >
          Welcome, {greetingName}.
        </h2>

        <p className="mt-3.5 mb-0 text-[15px] leading-[1.65] text-pretty text-[#5c6b66]">
          {role === 'owner'
            ? 'We’ll walk you through your overview, how to upload documents so AI can auto-fill sections, and the important places for people, letters, and messages.'
            : 'We’ll show you the areas you’re authorized to open, and how to find letters and instructions left for you.'}
        </p>

        <div
          className="mt-[22px] mb-5 flex gap-1.5"
          aria-hidden
        >
          <span className="h-1 w-[22px] rounded-sm bg-[#132b26]" />
          <span className="h-1 w-[22px] rounded-sm bg-[#e4e6e1]" />
          <span className="h-1 w-[22px] rounded-sm bg-[#e4e6e1]" />
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onSkip}
            className="h-11 rounded-[22px] border border-[#e4e6e1] bg-white px-[18px] text-[13px] font-medium text-[#132b26] transition hover:bg-[#f7f6f2]"
          >
            Skip the tour
          </button>
          <button
            type="button"
            onClick={onStart}
            className="h-11 rounded-[22px] border-0 bg-[#132b26] px-5 text-[13px] font-medium text-white transition hover:bg-[#2e7d6e]"
          >
            Show me around (2 min)
          </button>
        </div>
      </div>
    </div>
  );
};
