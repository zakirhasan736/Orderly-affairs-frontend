/** Family collaborator ACL helpers for the owner dashboard shell. */

export type FamilyDashboardSession = {
  isFamily: boolean;
  accessLevel?: string | null;
  authorizedSections: string[];
  permissions: Record<string, boolean>;
  portalRole?: string | null;
  portalRoleLabel?: string | null;
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
  portal_role?: string | null;
  portal_role_label?: string | null;
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
    portalRole: session.portal_role || null,
    portalRoleLabel: session.portal_role_label || null,
  };
}

export function familyHasFullDashboard(session: FamilyDashboardSession): boolean {
  if (!session.isFamily) return true;
  const level = String(session.accessLevel || '').trim();
  if (
    level === 'Area-Specific Access' ||
    level === 'Section-Specific Access'
  ) {
    return false;
  }
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

/**
 * Vault section ids the collaborator may open in the sidebar / browse grid.
 * Excludes management-only specials (billing, vault_settings, overview).
 */
export function familyAllowedVaultSectionIds(
  session: FamilyDashboardSession,
): 'all' | Set<string> {
  if (!session.isFamily || familyHasFullDashboard(session)) return 'all';
  const ids = new Set(
    session.authorizedSections.filter(id => !SPECIAL_AREAS.has(id)),
  );
  if (session.authorizedSections.includes('section2_nextkin')) {
    ids.add('2');
  }
  return ids;
}

/** Whether a vault section (1–21) is visible for this family session. */
export function familyCanSeeVaultSection(
  session: FamilyDashboardSession,
  sectionId: string,
): boolean {
  if (!session.isFamily) return true;
  const id = String(sectionId);
  if (id === 'dashboard' || id === 'overview') {
    return familyCanSeeOverview(session);
  }
  if (id === 'vault-settings' || id === 'vault_settings') {
    return familyCanViewVaultSettings(session);
  }
  // Section 2 management UI needs area grant; Admin+ manage is separate.
  if (id === '2' || id === 'section2_nextkin') {
    return (
      familyHasArea(session, '2') ||
      familyHasArea(session, 'section2_nextkin') ||
      familyCanManageNextKin(session)
    );
  }
  const allowed = familyAllowedVaultSectionIds(session);
  if (allowed === 'all') return true;
  return allowed.has(id);
}

export function familyCanSeeMessages(session: FamilyDashboardSession): boolean {
  return familyCanSeeVaultSection(session, '4');
}

export function familyCanSeeNokLetters(session: FamilyDashboardSession): boolean {
  return familyCanSeeVaultSection(session, '3');
}

/** Fetch NOK list for letters / overview cards (not only Admin manage). */
export function familyCanFetchNextKinList(
  session: FamilyDashboardSession,
): boolean {
  if (!session.isFamily) return true;
  return (
    familyCanManageNextKin(session) ||
    familyCanSeeVaultSection(session, '2') ||
    familyCanSeeNokLetters(session) ||
    familyCanSeeOverview(session)
  );
}

/** Canonical family portal role capability matrix (matches backend PORTAL_ROLES). */
export const FAMILY_PORTAL_ROLE_CAPS: Record<
  string,
  {
    can_write: boolean;
    can_upload: boolean;
    can_manage_family_access: boolean;
    can_manage_nextkin: boolean;
    can_manage_billing: boolean;
    can_view_vault_settings: boolean;
  }
> = {
  viewer: {
    can_write: false,
    can_upload: false,
    can_manage_family_access: false,
    can_manage_nextkin: false,
    can_manage_billing: false,
    can_view_vault_settings: false,
  },
  editor: {
    can_write: true,
    can_upload: true,
    can_manage_family_access: false,
    can_manage_nextkin: false,
    can_manage_billing: false,
    can_view_vault_settings: false,
  },
  portal_manager: {
    can_write: true,
    can_upload: true,
    can_manage_family_access: true,
    can_manage_nextkin: false,
    can_manage_billing: false,
    can_view_vault_settings: true,
  },
  admin: {
    can_write: true,
    can_upload: true,
    can_manage_family_access: true,
    can_manage_nextkin: true,
    can_manage_billing: false,
    can_view_vault_settings: true,
  },
  super_admin: {
    can_write: true,
    can_upload: true,
    can_manage_family_access: true,
    can_manage_nextkin: true,
    can_manage_billing: true,
    can_view_vault_settings: true,
  },
};

function roleCap(
  session: FamilyDashboardSession,
  key: keyof (typeof FAMILY_PORTAL_ROLE_CAPS)['viewer'],
): boolean {
  if (!session.isFamily) return true;
  const role = familyPortalRoleId(session);
  const caps = FAMILY_PORTAL_ROLE_CAPS[role] || FAMILY_PORTAL_ROLE_CAPS.viewer;
  // Portal role is authoritative (matches backend resolve_dashboard_permissions).
  return Boolean(caps[key]);
}

export function familyCanWrite(session: FamilyDashboardSession): boolean {
  return roleCap(session, 'can_write');
}

/** Viewer (and any family role without can_write): inspect only. */
export function familyIsReadOnly(session: FamilyDashboardSession): boolean {
  if (!session.isFamily) return false;
  return !familyCanWrite(session);
}

export type FamilyPortalRoleId =
  | 'viewer'
  | 'editor'
  | 'portal_manager'
  | 'admin'
  | 'super_admin'
  | string;

export const FAMILY_PORTAL_ROLE_LABELS: Record<string, string> = {
  viewer: 'Viewer',
  editor: 'Editor',
  portal_manager: 'Portal Manager',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

export function familyPortalRoleDisplayLabel(
  session: FamilyDashboardSession,
): string {
  if (!session.isFamily) return '';
  const fromApi = String(session.portalRoleLabel || '').trim();
  if (fromApi) return fromApi;
  const id = familyPortalRoleId(session);
  return FAMILY_PORTAL_ROLE_LABELS[id] || 'Viewer';
}

export function familyPortalRoleId(
  session: FamilyDashboardSession,
): FamilyPortalRoleId {
  if (!session.isFamily) return 'owner';
  const raw = String(session.portalRole || 'viewer')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (raw === 'view' || raw === 'read' || raw === 'read_only' || raw === 'readonly') {
    return 'viewer';
  }
  if (raw === 'edit' || raw === 'writer') return 'editor';
  if (raw === 'manager' || raw === 'portalmanager') return 'portal_manager';
  if (raw === 'family_admin' || raw === 'kit_admin') return 'admin';
  if (raw === 'superadmin' || raw === 'super-admin') return 'super_admin';
  return raw || 'viewer';
}

export function familyCanUpload(session: FamilyDashboardSession): boolean {
  return roleCap(session, 'can_upload');
}

/** Drag/drop on overview when they can upload and may see overview. */
export function familyCanUseOverviewUploads(
  session: FamilyDashboardSession,
): boolean {
  if (!session.isFamily) return true;
  return familyCanUpload(session) && familyCanSeeOverview(session);
}

/** Drag/drop on a vault section when they can upload and see that section. */
export function familyCanUseSectionUploads(
  session: FamilyDashboardSession,
  sectionId: string,
): boolean {
  if (!session.isFamily) return true;
  return (
    familyCanUpload(session) && familyCanSeeVaultSection(session, sectionId)
  );
}

export function familyCanManageFamilyAccess(
  session: FamilyDashboardSession,
): boolean {
  return roleCap(session, 'can_manage_family_access');
}

/** Super Admin may view billing status; payment mutations stay owner-only. */
export function familyCanViewBilling(session: FamilyDashboardSession): boolean {
  if (!session.isFamily) return true;
  if (!roleCap(session, 'can_manage_billing')) return false;
  return familyHasFullDashboard(session) || familyHasArea(session, 'billing');
}

export function familyCanViewVaultSettings(
  session: FamilyDashboardSession,
): boolean {
  if (!session.isFamily) return true;
  if (
    !familyHasArea(session, 'vault_settings') &&
    !familyHasFullDashboard(session)
  ) {
    return false;
  }
  return (
    roleCap(session, 'can_view_vault_settings') ||
    roleCap(session, 'can_manage_family_access') ||
    roleCap(session, 'can_manage_billing')
  );
}

export function familyCanManageNextKin(
  session: FamilyDashboardSession,
): boolean {
  if (!session.isFamily) return true;
  if (!roleCap(session, 'can_manage_nextkin')) return false;
  return (
    familyHasFullDashboard(session) ||
    familyHasArea(session, 'section2_nextkin') ||
    familyHasArea(session, '2')
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
    if (familyCanManageNextKin(session) || familyCanSeeVaultSection(session, '2')) {
      return '2';
    }
    return '1';
  }
  const preferred = [...allowed].sort((a, b) => Number(a) - Number(b));
  return preferred[0] || 'dashboard';
}

export function familyRoleBannerText(
  session: FamilyDashboardSession,
): string | null {
  if (!session.isFamily) return null;
  const label = session.portalRoleLabel || session.portalRole || 'Viewer';
  const role = familyPortalRoleId(session);
  if (role === 'viewer' || familyIsReadOnly(session)) {
    return `Family ${label} · view-only on granted areas (fields and Add buttons are locked)`;
  }
  const parts = ['can edit granted areas'];
  if (familyCanUpload(session)) parts.push('uploads on');
  if (familyCanManageFamilyAccess(session)) parts.push('manage family access');
  if (familyCanManageNextKin(session)) parts.push('manage Next of Kin');
  if (familyCanViewBilling(session)) parts.push('billing view');
  return `Family ${label} · ${parts.join(' · ')}`;
}

/** Click targets that mutate vault data — blocked for Viewers. */
export function isFamilyMutateControl(el: Element | null): boolean {
  if (!el || !(el instanceof Element)) return false;
  if (el.closest('[data-oa-view-ok]')) return false;
  if (el.closest('[data-oa-mutate]')) return true;

  const file = el.closest('input[type="file"]');
  if (file) return true;

  const field = el.closest(
    'input:not([type="button"]):not([type="submit"]):not([type="reset"]), textarea, select, [role="combobox"], [role="listbox"], [role="option"], [role="checkbox"], [role="radio"], [role="switch"], [contenteditable="true"]',
  );
  if (field && !field.closest('[data-oa-view-ok]')) return true;

  const btn = el.closest('button, [role="button"], a.button');
  if (!btn || btn.closest('[data-oa-view-ok]')) return false;

  const label = `${btn.textContent || ''} ${btn.getAttribute('aria-label') || ''} ${btn.getAttribute('title') || ''}`.toLowerCase();
  return /\b(add|remove|delete|clear|upload|save|create|write|send|autofill|fill empty|choose document|wipe|replace|edit letter|drop)\b/.test(
    label,
  );
}
