'use client';

import React from 'react';
import { cn } from '@common/ui/utils';

interface SixDigitOtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  idPrefix?: string;
  className?: string;
}

export function SixDigitOtpInput({
  value,
  onChange,
  disabled = false,
  idPrefix = 'otp',
  className,
}: SixDigitOtpInputProps) {
  const digits = Array.from({ length: 6 }, (_, index) => value[index] || '');

  const handleChange = (digit: string, index: number) => {
    const cleaned = digit.replace(/\D/g, '').slice(-1);
    const next = value.padEnd(6, ' ').split('');
    next[index] = cleaned;
    onChange(next.join('').replace(/\s/g, '').slice(0, 6));

    if (cleaned && index < 5) {
      document.getElementById(`${idPrefix}-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      document.getElementById(`${idPrefix}-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, 5);
    document.getElementById(`${idPrefix}-${focusIndex}`)?.focus();
  };

  return (
    <div
      className={cn('flex justify-center gap-2', className)}
      onPaste={handlePaste}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          id={`${idPrefix}-${index}`}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={event => handleChange(event.target.value, index)}
          onKeyDown={event => handleKeyDown(event, index)}
          className="h-12 w-10 rounded-xl border border-input bg-background text-center text-lg font-semibold shadow-sm transition focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:w-11"
        />
      ))}
    </div>
  );
}
