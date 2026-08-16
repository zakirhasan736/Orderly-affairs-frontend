export type CollaboratorPortal = 'nextkin' | 'family';

export function isFamilyAccessType(accessType: string | undefined | null): boolean {
  return String(accessType || '').toLowerCase() === 'family';
}

export function collaboratorPortalMismatch(
  accessType: string | undefined | null,
  expected: CollaboratorPortal,
): string | null {
  const isFamily = isFamilyAccessType(accessType);
  if (expected === 'family' && !isFamily) {
    return 'This account signs in at the Next of Kin page, not here.';
  }
  if (expected === 'nextkin' && isFamily) {
    return 'This account signs in at the family collaborator page, not here.';
  }
  return null;
}
