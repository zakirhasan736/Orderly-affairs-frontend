/** Family collaborator ACL helpers for the owner dashboard shell. */

export type FamilyDashboardSession = {
  isFamily: boolean;
  accessLevel?: string | null;
  authorizedSections: string[];
  permissions: Record<string, boolean>;
};

const SPECIAL_AREAS = new Set([
  'overview',
  'billing',
  'vault_settings',
  'section2_nextkin',
]);

export function parseFamilyDashboardSession(session: {
  role?: string;
  access_type?: string;
  access_level?: string | null;
  authorized_sections?: string[];
  dashboard_permissions?: Record<string, boolean>;
}): FamilyDashboardSession {
  const isFamily =
    session.role === 'nextkin' &&
    String(session.access_type || '').toLowerCase() === 'family';
  return {
    isFamily,
    accessLevel: session.access_level,
    authorizedSections: Array.isArray(session.authorized_sections)
      ? session.authorized_sections.map(String)
      : [],
    permissions: session.dashboard_permissions || {},
  };
}

export function familyHasFullDashboard(session: FamilyDashboardSession): boolean {
  if (!session.isFamily) return true;
  const level = session.accessLevel || '';
  return (
    level === 'Full Kit Access' ||
    level === 'Full Dashboard Access' ||
    level.toLowerCase().includes('full')
  );
}

export function familyHasArea(
  session: FamilyDashboardSession,
  areaId: string,
): boolean {
  if (!session.isFamily) return true;
  if (familyHasFullDashboard(session)) return true;
  const id = String(areaId);
  if (session.authorizedSections.includes(id)) return true;
  if (
    (id === 'section2_nextkin' && session.authorizedSections.includes('2')) ||
    (id === '2' && session.authorizedSections.includes('section2_nextkin'))
  ) {
    return true;
  }
  return false;
}

/** Vault section ids only (excludes billing / vault_settings / etc.). */
export function familyAllowedVaultSectionIds(
  session: FamilyDashboardSession,
): 'all' | Set<string> {
  if (!session.isFamily || familyHasFullDashboard(session)) return 'all';
  const ids = new Set(
    session.authorizedSections.filter(id => !SPECIAL_AREAS.has(id)),
  );
  // Special area maps onto vault section 2
  if (session.authorizedSections.includes('section2_nextkin')) {
    ids.add('2');
  }
  return ids;
}

export function familyCanViewVaultSettings(
  session: FamilyDashboardSession,
): boolean {
  if (!session.isFamily) return true;
  if (!familyHasArea(session, 'vault_settings')) return false;
  return Boolean(
    session.permissions.can_view_vault_settings ||
      session.permissions.can_manage_family_access ||
      session.permissions.can_manage_billing,
  );
}

export function familyCanManageNextKin(
  session: FamilyDashboardSession,
): boolean {
  if (!session.isFamily) return true;
  return (
    Boolean(session.permissions.can_manage_nextkin) &&
    familyHasArea(session, 'section2_nextkin')
  );
}

export function familyCanSeeOverview(
  session: FamilyDashboardSession,
): boolean {
  if (!session.isFamily) return true;
  return familyHasArea(session, 'overview') || familyHasFullDashboard(session);
}

export function firstAllowedFamilySectionId(
  session: FamilyDashboardSession,
): string {
  if (familyCanSeeOverview(session)) return 'dashboard';
  if (familyCanViewVaultSettings(session)) return 'vault-settings';
  const allowed = familyAllowedVaultSectionIds(session);
  if (allowed === 'all') {
    return familyCanManageNextKin(session) ? '2' : '1';
  }
  const preferred = [...allowed].sort((a, b) => Number(a) - Number(b));
  return preferred[0] || 'dashboard';
}
