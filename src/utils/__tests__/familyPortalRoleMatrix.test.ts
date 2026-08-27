import { describe, expect, it } from 'vitest';
import {
  FAMILY_PORTAL_ROLE_CAPS,
  familyCanManageFamilyAccess,
  familyCanManageNextKin,
  familyCanUpload,
  familyCanViewBilling,
  familyCanViewVaultSettings,
  familyCanWrite,
  familyIsReadOnly,
  familyPortalRoleDisplayLabel,
  parseFamilyDashboardSession,
  type FamilyDashboardSession,
} from '@/utils/familyDashboardAccess';

function familySession(
  portalRole: string,
  opts?: {
    accessLevel?: string;
    sections?: string[];
    permissions?: Record<string, boolean>;
  },
): FamilyDashboardSession {
  return parseFamilyDashboardSession({
    role: 'nextkin',
    access_type: 'family',
    portal_role: portalRole,
    access_level: opts?.accessLevel ?? 'Full Dashboard Access',
    authorized_sections: opts?.sections ?? [],
    dashboard_permissions: opts?.permissions,
  });
}

describe('family portal role matrix', () => {
  it('Viewer is view-only on granted areas', () => {
    const s = familySession('viewer', { sections: ['5', '7'] });
    expect(familyIsReadOnly(s)).toBe(true);
    expect(familyCanWrite(s)).toBe(false);
    expect(familyCanUpload(s)).toBe(false);
    expect(familyCanManageFamilyAccess(s)).toBe(false);
    expect(familyCanManageNextKin(s)).toBe(false);
    expect(familyCanViewBilling(s)).toBe(false);
    expect(familyCanViewVaultSettings(s)).toBe(false);
  });

  it('Editor can edit/upload but not manage family/NOK/billing/settings', () => {
    const s = familySession('editor');
    expect(familyCanWrite(s)).toBe(true);
    expect(familyCanUpload(s)).toBe(true);
    expect(familyCanManageFamilyAccess(s)).toBe(false);
    expect(familyCanManageNextKin(s)).toBe(false);
    expect(familyCanViewBilling(s)).toBe(false);
    expect(familyCanViewVaultSettings(s)).toBe(false);
  });

  it('Portal Manager can manage family + vault settings, not NOK/billing', () => {
    const s = familySession('portal_manager');
    expect(familyCanWrite(s)).toBe(true);
    expect(familyCanUpload(s)).toBe(true);
    expect(familyCanManageFamilyAccess(s)).toBe(true);
    expect(familyCanManageNextKin(s)).toBe(false);
    expect(familyCanViewBilling(s)).toBe(false);
    expect(familyCanViewVaultSettings(s)).toBe(true);
  });

  it('Admin can manage NOK when area granted, not billing', () => {
    const s = familySession('admin', {
      accessLevel: 'Area-Specific Access',
      sections: ['section2_nextkin', 'vault_settings'],
    });
    expect(familyCanManageFamilyAccess(s)).toBe(true);
    expect(familyCanManageNextKin(s)).toBe(true);
    expect(familyCanViewBilling(s)).toBe(false);
    expect(familyCanViewVaultSettings(s)).toBe(true);
  });

  it('Super Admin can view billing when billing area granted', () => {
    const s = familySession('super_admin', {
      accessLevel: 'Area-Specific Access',
      sections: ['billing', 'vault_settings', '2'],
    });
    expect(familyCanViewBilling(s)).toBe(true);
    expect(familyCanManageNextKin(s)).toBe(true);
    expect(familyCanManageFamilyAccess(s)).toBe(true);
  });

  it('stale can_write permission cannot elevate Viewer', () => {
    const s = familySession('viewer', {
      permissions: { can_write: true, can_upload: true, can_manage_nextkin: true },
    });
    expect(familyCanWrite(s)).toBe(false);
    expect(familyCanUpload(s)).toBe(false);
    expect(familyCanManageNextKin(s)).toBe(false);
  });

  it('role caps match product matrix keys', () => {
    expect(Object.keys(FAMILY_PORTAL_ROLE_CAPS)).toEqual([
      'viewer',
      'editor',
      'portal_manager',
      'admin',
      'super_admin',
    ]);
  });

  it('displays Super Admin / Admin labels for the account menu', () => {
    expect(familyPortalRoleDisplayLabel(familySession('super_admin'))).toBe(
      'Super Admin',
    );
    expect(familyPortalRoleDisplayLabel(familySession('admin'))).toBe('Admin');
    expect(
      familyPortalRoleDisplayLabel(
        parseFamilyDashboardSession({
          role: 'nextkin',
          access_type: 'family',
          portal_role: 'viewer',
          portal_role_label: 'Viewer',
        }),
      ),
    ).toBe('Viewer');
  });
});
