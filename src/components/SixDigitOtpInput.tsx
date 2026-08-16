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
      className={cn('flex w-full gap-2.5', className)}
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
                      className="h-15 w-full min-w-0 flex-1 rounded-[12px] border border-[#cfd8d4] bg-white text-center text-[24px] font-medium shadow-none transition focus:border-[#2B5A8C] focus:outline-none focus:ring-0 focus:shadow-[0_0_0_3px_#EAF6FD] disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ height: 60, fontFamily: "ui-monospace, 'IBM Plex Mono', monospace" }}
        />
      ))}
    </div>
  );
}
