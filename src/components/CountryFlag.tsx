'use client';

import React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';

import { cn } from '@common/ui/utils';

type FlagComponent = React.ComponentType<{
  title?: string;
  className?: string;
}>;

const FLAG_COMPONENTS = Flags as Record<string, FlagComponent>;

function emojiFlag(code: string) {
  if (!code || code.length !== 2) return '🌐';

  return code
    .toUpperCase()
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

interface CountryFlagProps {
  code: string;
  className?: string;
  title?: string;
}

export function CountryFlag({ code, className, title }: CountryFlagProps) {
  const FlagComponent = FLAG_COMPONENTS[code.toUpperCase()];

  if (!FlagComponent) {
    return (
      <span
        className={cn('inline-flex text-base leading-none', className)}
        aria-hidden
      >
        {emojiFlag(code)}
      </span>
    );
  }

  return (
    <FlagComponent
      title={title || code}
      className={cn(
        'h-4 w-6 shrink-0 overflow-hidden rounded-[3px] shadow-sm ring-1 ring-black/5',
        className,
      )}
    />
  );
}
