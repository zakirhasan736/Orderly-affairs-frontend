/**
 * Mirrors backend assert_section_read_access for NOK portal URLs.
 */

export type NokAccessShape = {
  access_level?: string | null;
  authorized_sections?: 'all' | string[] | null;
  full_access?: boolean;
  immediate_access?: boolean;
};

const FULL_ACCESS_LEVELS = new Set([
  'Full Kit Access',
  'Full Dashboard Access',
]);

function parentSectionDigits(sectionId: string): string {
  const digits = sectionId.replace(/\D/g, '');
  return digits || sectionId;
}

export function nokHasFullKitAccess(access: NokAccessShape | null | undefined): boolean {
  if (!access) return false;
  if (access.full_access === true) return true;
  if (access.authorized_sections === 'all') return true;
  const level = String(access.access_level || '').trim();
  return FULL_ACCESS_LEVELS.has(level);
}

export function nokCanReadSection(
  access: NokAccessShape | null | undefined,
  sectionId: string,
): boolean {
  if (!access) return false;
  if (access.immediate_access === false) return false;
  if (nokHasFullKitAccess(access)) return true;

  const sid = String(sectionId || '').trim();
  if (!sid) return false;

  const allowed = Array.isArray(access.authorized_sections)
    ? access.authorized_sections.map(String)
    : [];

  if (allowed.includes(sid)) return true;

  const parent = parentSectionDigits(sid);
  return allowed.some(entry => parentSectionDigits(entry) === parent);
}
