import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/mobile/examples';

export type PhoneCountry = {
  code: CountryCode;
  name: string;
  dial: string;
  flag: string;
};

const PREFERRED_COUNTRY_CODES: CountryCode[] = [
  'US',
  'CA',
  'GB',
  'AU',
  'BD',
  'IN',
  'PK',
  'DE',
  'FR',
  'AE',
  'SA',
  'SG',
  'MY',
  'PH',
  'NG',
  'ZA',
  'BR',
  'MX',
  'JP',
  'CN',
];

function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return '🌐';

  return code
    .toUpperCase()
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

function buildPhoneCountries(): PhoneCountry[] {
  let displayNames: Intl.DisplayNames | null = null;

  try {
    displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    displayNames = null;
  }

  return getCountries()
    .map(code => ({
      code,
      name: displayNames?.of(code) || code,
      dial: `+${getCountryCallingCode(code)}`,
      flag: countryCodeToFlag(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const PHONE_COUNTRIES = buildPhoneCountries();

const PHONE_COUNTRY_MAP = new Map(
  PHONE_COUNTRIES.map(country => [country.code, country]),
);

export function getCountryByCode(code: string): PhoneCountry {
  return (
    PHONE_COUNTRY_MAP.get(code as CountryCode) ||
    PHONE_COUNTRIES.find(country => country.code === 'US') ||
    PHONE_COUNTRIES[0]
  );
}

export const PREFERRED_PHONE_COUNTRIES = PREFERRED_COUNTRY_CODES.map(code =>
  getCountryByCode(code),
).filter(Boolean);

function isSupportedCountry(code: string | undefined): code is CountryCode {
  return Boolean(code && PHONE_COUNTRY_MAP.has(code as CountryCode));
}

export function detectDefaultCountryCode(): CountryCode {
  if (typeof navigator === 'undefined') return 'US';

  try {
    const locale = navigator.language || 'en-US';
    const region = new Intl.Locale(locale).maximize().region;
    if (isSupportedCountry(region)) {
      return region;
    }
  } catch {
    // ignore unsupported locale parsing
  }

  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const timeZoneCountryMap: Record<string, CountryCode> = {
      'America/New_York': 'US',
      'America/Chicago': 'US',
      'America/Denver': 'US',
      'America/Los_Angeles': 'US',
      'America/Phoenix': 'US',
      'America/Toronto': 'CA',
      'America/Vancouver': 'CA',
      'Europe/London': 'GB',
      'Europe/Dublin': 'IE',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'Europe/Madrid': 'ES',
      'Europe/Rome': 'IT',
      'Europe/Amsterdam': 'NL',
      'Europe/Brussels': 'BE',
      'Europe/Zurich': 'CH',
      'Europe/Stockholm': 'SE',
      'Europe/Oslo': 'NO',
      'Europe/Copenhagen': 'DK',
      'Europe/Helsinki': 'FI',
      'Europe/Athens': 'GR',
      'Asia/Dhaka': 'BD',
      'Asia/Kolkata': 'IN',
      'Asia/Karachi': 'PK',
      'Asia/Singapore': 'SG',
      'Asia/Kuala_Lumpur': 'MY',
      'Asia/Manila': 'PH',
      'Asia/Tokyo': 'JP',
      'Asia/Seoul': 'KR',
      'Asia/Shanghai': 'CN',
      'Asia/Hong_Kong': 'HK',
      'Asia/Taipei': 'TW',
      'Asia/Dubai': 'AE',
      'Asia/Riyadh': 'SA',
      'Australia/Sydney': 'AU',
      'Pacific/Auckland': 'NZ',
      'America/Sao_Paulo': 'BR',
      'America/Mexico_City': 'MX',
      'Africa/Johannesburg': 'ZA',
      'Africa/Lagos': 'NG',
      'Africa/Nairobi': 'KE',
      'Africa/Cairo': 'EG',
    };

    const mapped = timeZoneCountryMap[timeZone];
    if (isSupportedCountry(mapped)) {
      return mapped;
    }
  } catch {
    // ignore timezone detection failures
  }

  return 'US';
}

function normalizeInternationalInput(input: string) {
  const raw = input.trim();
  if (!raw) return '';

  if (raw.startsWith('00')) {
    return `+${raw.slice(2).replace(/\D/g, '')}`;
  }

  if (raw.startsWith('+')) {
    return `+${raw.slice(1).replace(/\D/g, '')}`;
  }

  const digits = raw.replace(/\D/g, '');
  return digits ? `+${digits}` : '';
}

function parseInternationalNumber(input: string) {
  const normalized = normalizeInternationalInput(input);
  if (!normalized) return null;

  return parsePhoneNumberFromString(normalized);
}

export function formatNationalDigits(
  digits: string,
  countryCode: string,
): string {
  const numeric = digits.replace(/\D/g, '');
  if (!numeric) return '';

  const formatter = new AsYouType(countryCode as CountryCode);
  return formatter.input(numeric);
}

export function extractDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function processNationalNumberInput(
  rawInput: string,
  currentCountryCode: string,
) {
  const currentCountry = (currentCountryCode ||
    detectDefaultCountryCode()) as CountryCode;
  const digits = extractDigits(rawInput);

  if (!digits) {
    return {
      countryCode: currentCountry,
      nationalNumber: '',
    };
  }

  if (digits.length >= 8) {
    const intlParsed = parsePhoneNumberFromString(`+${digits}`);
    if (intlParsed?.country && intlParsed.nationalNumber) {
      const dialCode = getCountryCallingCode(intlParsed.country);

      if (
        digits.startsWith(dialCode) &&
        digits.length > dialCode.length + 3
      ) {
        return {
          countryCode: intlParsed.country,
          nationalNumber: intlParsed.formatNational(),
        };
      }

      if (intlParsed.isValid()) {
        return {
          countryCode: intlParsed.country,
          nationalNumber: intlParsed.formatNational(),
        };
      }
    }
  }

  return {
    countryCode: currentCountry,
    nationalNumber: formatNationalDigits(digits, currentCountry),
  };
}

export function parsePhoneNumber(value?: string | null) {
  const defaultCountry = detectDefaultCountryCode();
  const raw = String(value ?? '').trim();

  if (!raw) {
    return {
      countryCode: defaultCountry,
      nationalNumber: '',
    };
  }

  const parsed =
    parsePhoneNumberFromString(raw) ||
    parsePhoneNumberFromString(raw, defaultCountry) ||
    parseInternationalNumber(raw);

  if (parsed?.country) {
    return {
      countryCode: parsed.country,
      nationalNumber: parsed.formatNational(),
    };
  }

  const digits = raw.replace(/\D/g, '');

  return {
    countryCode: defaultCountry,
    nationalNumber: formatNationalDigits(digits, defaultCountry),
  };
}

export function detectPhoneFromTypedInput(
  input: string,
  currentCountryCode: string,
) {
  return processNationalNumberInput(input, currentCountryCode);
}

export function buildE164PhoneNumber(
  countryCode: string,
  nationalNumber: string,
) {
  const country = countryCode as CountryCode;
  const digits = extractDigits(nationalNumber);

  if (!digits) return '';

  const parsed = parsePhoneNumberFromString(digits, country);
  if (parsed?.number) {
    return parsed.number;
  }

  return `+${getCountryCallingCode(country)}${digits}`;
}

export function parsePhoneNumberForCountry(
  countryCode: string,
  nationalNumber: string,
) {
  const digits = extractDigits(nationalNumber);
  if (!digits) return null;

  return parsePhoneNumberFromString(digits, countryCode as CountryCode);
}

export function getNationalNumberPlaceholder(countryCode: string) {
  try {
    const example = getExampleNumber(countryCode as CountryCode, examples);
    return example?.formatNational() || 'Phone number';
  } catch {
    return 'Phone number';
  }
}

export function isValidE164PhoneNumber(value: string) {
  if (!value) return false;
  return isValidPhoneNumber(value);
}

export function isValidPhoneForCountry(
  countryCode: string,
  nationalNumber: string,
) {
  const parsed = parsePhoneNumberForCountry(countryCode, nationalNumber);
  return Boolean(parsed && isValidPhoneNumber(parsed.number));
}

export function getPhoneValidationError(
  countryCode: string,
  nationalNumber: string,
) {
  const digits = extractDigits(nationalNumber);
  if (!digits) return null;

  const country = getCountryByCode(countryCode);
  const parsed = parsePhoneNumberForCountry(countryCode, nationalNumber);

  if (!parsed) {
    return `Enter numbers only for your ${country.name} phone number.`;
  }

  if (!isPossiblePhoneNumber(parsed.number)) {
    return `Phone number is too short for ${country.name}.`;
  }

  if (!isValidPhoneNumber(parsed.number)) {
    return `Enter a valid ${country.name} phone number.`;
  }

  return null;
}
