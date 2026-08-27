/**
 * Calendar-date helpers that avoid the classic UTC off-by-one:
 * `new Date("1978-09-15")` is midnight UTC → shows as 09/14 in US timezones.
 */

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_PREFIX_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/;
const SLASH_RE = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/;

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/** Format a local Date as YYYY-MM-DD (no timezone shift). */
export function formatDateOnly(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Format a local Date as MM/DD/YYYY for display. */
export function formatDateOnlyDisplay(date: Date): string {
  return `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}/${date.getFullYear()}`;
}

/**
 * Parse a stored date value into a local calendar Date.
 * Prefer the YYYY-MM-DD prefix of ISO strings so DOB never shifts a day.
 */
export function parseDateOnly(value: string | Date | null | undefined): Date | undefined {
  if (value == null || value === '') return undefined;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const text = String(value).trim();
  if (!text) return undefined;

  const iso = text.match(ISO_PREFIX_RE);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return undefined;
    }
    return date;
  }

  const slash = text.match(SLASH_RE);
  if (slash) {
    let a = Number(slash[1]);
    let b = Number(slash[2]);
    let year = Number(slash[3]);
    if (year < 100) year += year < 70 ? 2000 : 1900;
    let month = a;
    let day = b;
    // Prefer US MM/DD; if first part > 12 treat as D/M/Y.
    if (a > 12 && b <= 12) {
      day = a;
      month = b;
    }
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return undefined;
    }
    return date;
  }

  const fallback = new Date(text);
  if (Number.isNaN(fallback.getTime())) return undefined;
  return new Date(
    fallback.getFullYear(),
    fallback.getMonth(),
    fallback.getDate(),
  );
}

/** If the string is a calendar date, show MM/DD/YYYY; otherwise leave it. */
export function formatDateOnlyDisplayValue(
  value: string | Date | null | undefined,
): string {
  if (value == null || value === '') return '';
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : formatDateOnlyDisplay(value);
  }
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  if (
    !DATE_ONLY_RE.test(trimmed) &&
    !ISO_PREFIX_RE.test(trimmed) &&
    !SLASH_RE.test(trimmed)
  ) {
    return trimmed;
  }
  const parsed = parseDateOnly(trimmed);
  return parsed ? formatDateOnlyDisplay(parsed) : trimmed;
}

/** Normalize any date-ish value to YYYY-MM-DD for storage / AI apply. */
export function toDateOnlyString(
  value: string | Date | null | undefined,
): string | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (DATE_ONLY_RE.test(trimmed)) return trimmed;
  }
  const parsed = parseDateOnly(value);
  return parsed ? formatDateOnly(parsed) : undefined;
}
