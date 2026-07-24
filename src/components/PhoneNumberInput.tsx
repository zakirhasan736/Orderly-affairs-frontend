'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';

import { Button } from '@common/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@common/ui/command';
import { Label } from '@common/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@common/ui/popover';
import { cn } from '@common/ui/utils';
import { CountryFlag } from '@/components/CountryFlag';
import {
  PHONE_COUNTRIES,
  PREFERRED_PHONE_COUNTRIES,
  buildE164PhoneNumber,
  detectDefaultCountryCode,
  extractDigits,
  formatNationalDigits,
  getCountryByCode,
  getNationalNumberPlaceholder,
  getPhoneValidationError,
  isValidPhoneForCountry,
  parsePhoneNumber,
  processNationalNumberInput,
  type PhoneCountry,
} from '@/utils/phoneCountries';

interface PhoneNumberInputProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  numberPlaceholder?: string;
  helperText?: string;
  showValidation?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

function CountryPicker({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (countryCode: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedCountry = getCountryByCode(value);

  const preferredCodes = useMemo(
    () => new Set(PREFERRED_PHONE_COUNTRIES.map(country => country.code)),
    [],
  );

  const otherCountries = useMemo(
    () => PHONE_COUNTRIES.filter(country => !preferredCodes.has(country.code)),
    [preferredCodes],
  );

  const renderCountryItem = (country: PhoneCountry) => (
    <CommandItem
      key={country.code}
      value={`${country.name} ${country.dial} ${country.code}`}
      onSelect={() => {
        onChange(country.code);
        setOpen(false);
      }}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2.5">
        <CountryFlag code={country.code} />
        <span className="font-medium">{country.dial}</span>
        <span className="truncate text-muted-foreground">{country.name}</span>
      </span>
      <Check
        className={cn(
          'ml-2 h-4 w-4 shrink-0',
          value === country.code ? 'opacity-100' : 'opacity-0',
        )}
      />
    </CommandItem>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label={`Country code ${selectedCountry.dial}`}
          disabled={disabled}
          className={cn(
            'flex h-full max-w-24 w-full shrink-0 items-center gap-2 border-0 bg-transparent px-3 text-left transition-colors',
            'hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          <CountryFlag code={selectedCountry.code} className="h-[18px] w-[27px]" />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {selectedCountry.dial}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[min(100vw-2rem,420px)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country or code..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>

            <CommandGroup heading="Popular">
              {PREFERRED_PHONE_COUNTRIES.map(renderCountryItem)}
            </CommandGroup>

            <CommandGroup heading="All countries">
              {otherCountries.map(renderCountryItem)}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function PhoneNumberInput({
  value = '',
  onChange,
  disabled = false,
  className,
  label = 'Mobile Number',
  numberPlaceholder,
  helperText = 'You will receive a text message to verify your account. Message & data rates may apply.',
  showValidation = false,
  onValidationChange,
}: PhoneNumberInputProps) {
  const parsed = useMemo(() => parsePhoneNumber(value), [value]);
  const defaultCountryRef = useRef<string>(detectDefaultCountryCode());
  const lastEmittedValueRef = useRef(value);
  const numberInputRef = useRef<HTMLInputElement>(null);

  const [countryCode, setCountryCode] = useState<string>(
    value ? parsed.countryCode : defaultCountryRef.current,
  );
  const [nationalNumber, setNationalNumber] = useState(parsed.nationalNumber);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (value === lastEmittedValueRef.current) return;

    const nextParsed = parsePhoneNumber(value);
    setCountryCode(nextParsed.countryCode);
    setNationalNumber(nextParsed.nationalNumber);
    lastEmittedValueRef.current = value;
  }, [value]);

  const resolvedPlaceholder =
    numberPlaceholder || getNationalNumberPlaceholder(countryCode);
  const validationError = getPhoneValidationError(countryCode, nationalNumber);
  const isValid = isValidPhoneForCountry(countryCode, nationalNumber);
  const hasNumber = Boolean(extractDigits(nationalNumber));
  const shouldShowError =
    Boolean(validationError) &&
    (showValidation || (touched && hasNumber));

  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  const emitChange = (nextCountryCode: string, nextNationalNumber: string) => {
    const nextValue = buildE164PhoneNumber(nextCountryCode, nextNationalNumber);
    lastEmittedValueRef.current = nextValue;
    onChange(nextValue);
  };

  const handleNationalNumberChange = (rawInput: string) => {
    const processed = processNationalNumberInput(rawInput, countryCode);

    setNationalNumber(processed.nationalNumber);
    setCountryCode(processed.countryCode);
    emitChange(processed.countryCode, processed.nationalNumber);
  };

  const handleNumberKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ];

    if (allowedKeys.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    if (/^\d$/.test(event.key)) return;

    event.preventDefault();
  };

  const handleCountryChange = (nextCountryCode: string) => {
    setCountryCode(nextCountryCode);

    const reformatted = formatNationalDigits(
      extractDigits(nationalNumber),
      nextCountryCode,
    );
    setNationalNumber(reformatted);
    emitChange(nextCountryCode, reformatted);
    numberInputRef.current?.focus();
  };

  const handleClear = () => {
    setNationalNumber('');
    setTouched(false);
    emitChange(countryCode, '');
    numberInputRef.current?.focus();
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label ? (
        <Label className="text-sm font-medium text-foreground">{label}</Label>
      ) : null}

      <div
        className={cn(
          'flex h-12 items-stretch overflow-hidden rounded-xl border bg-background transition-[color,box-shadow]',
          'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
          shouldShowError &&
            'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <CountryPicker
          value={countryCode}
          disabled={disabled}
          onChange={handleCountryChange}
        />

        <div className="w-px shrink-0 self-stretch bg-border" aria-hidden />

        <input
          ref={numberInputRef}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          disabled={disabled}
          value={nationalNumber}
          onChange={event => handleNationalNumberChange(event.target.value)}
          onKeyDown={handleNumberKeyDown}
          onBlur={() => setTouched(true)}
          onPaste={event => {
            const pasted = event.clipboardData.getData('text');
            if (!pasted) return;
            event.preventDefault();
            handleNationalNumberChange(pasted);
          }}
          placeholder={resolvedPlaceholder}
          aria-invalid={shouldShowError}
          pattern="[0-9]*"
          className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-base"
        />

        {hasNumber && !disabled ? (
          <div className="flex shrink-0 items-center pr-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Clear phone number"
              onClick={handleClear}
              className="h-7 w-7 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>

      {shouldShowError ? (
        <p className="text-xs leading-5 text-destructive">{validationError}</p>
      ) : helperText ? (
        <p className="text-xs leading-5 text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}

export function useDefaultPhoneCountryCode() {
  return detectDefaultCountryCode();
}

export {
  getPhoneValidationError,
  isValidE164PhoneNumber,
  isValidPhoneForCountry,
} from '@/utils/phoneCountries';
