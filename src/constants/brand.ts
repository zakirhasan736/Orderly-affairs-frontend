/** Shared brand mark — `public/images/brand-logo.png` (absolute from site root). */
export const BRAND_LOGO = '/images/brand-logo.png';

/** Light mark for navy / ink surfaces when PNG is unavailable. */
export const BRAND_MARK_LIGHT = '/images/brand-mark-light.svg';

/** @deprecated Prefer BRAND_LOGO */
export const BRAND_LOGO_LIGHT = BRAND_LOGO;

/** @deprecated Prefer BRAND_LOGO */
export const BRAND_LOGO_DARK = BRAND_LOGO;

/**
 * Native portal tokens, matched to orderly-affairs.com.
 * Accent blue is for fills, icons, and large headings only; not small text or links.
 */
export const BRAND_COLOR = {
  navy: '#213D59',
  navyDeep: '#16293C',
  navySoft: '#2C4B6B',
  accent: '#3EB1E5',
  accentMid: '#619FCE',
  accentLight: '#7ACAF9',
  slate: '#6A7481',
  muted: '#7A8794',
  /** Links and small text on white. Accent blue is ~2.2:1 and fails WCAG. */
  link: '#2E7FAD',
  complete: '#1F9D6B',
  completeTint: '#E8F6F0',
  dueSoon: '#B4761A',
  dueSoonTint: '#FDF4E4',
  overdue: '#C2442E',
  overdueTint: '#FBEDEA',
  accentSurface: '#EAF6FD',
  paper: '#F6F8FA',
  border: '#E4EAF0',
} as const;
