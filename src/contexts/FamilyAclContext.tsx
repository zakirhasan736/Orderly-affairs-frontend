'use client';

import React, { createContext, useContext, useMemo } from 'react';
import {
  familyCanManageFamilyAccess,
  familyCanManageNextKin,
  familyCanSeeVaultSection,
  familyCanUpload,
  familyCanUseOverviewUploads,
  familyCanUseSectionUploads,
  familyCanViewBilling,
  familyCanViewVaultSettings,
  familyCanWrite,
  familyIsReadOnly,
  familyPortalRoleId,
  isFamilyMutateControl,
  type FamilyDashboardSession,
  type FamilyPortalRoleId,
  parseFamilyDashboardSession,
} from '@/utils/familyDashboardAccess';

type FamilyAclContextValue = {
  session: FamilyDashboardSession;
  portalRole: FamilyPortalRoleId;
  portalRoleLabel: string | null;
  /** True for Viewer (and any family role without write). */
  isReadOnly: boolean;
  canWrite: boolean;
  canUpload: boolean;
  canManageFamilyAccess: boolean;
  canManageNextKin: boolean;
  canViewBilling: boolean;
  canViewVaultSettings: boolean;
  canSeeSection: (sectionId: string) => boolean;
  canUseOverviewUploads: boolean;
  canUseSectionUploads: (sectionId: string) => boolean;
};

const FamilyAclContext = createContext<FamilyAclContextValue>({
  session: parseFamilyDashboardSession({}),
  portalRole: 'viewer',
  portalRoleLabel: null,
  isReadOnly: false,
  canWrite: true,
  canUpload: true,
  canManageFamilyAccess: true,
  canManageNextKin: true,
  canViewBilling: true,
  canViewVaultSettings: true,
  canSeeSection: () => true,
  canUseOverviewUploads: true,
  canUseSectionUploads: () => true,
});

export function FamilyAclProvider({
  session,
  children,
}: {
  session: FamilyDashboardSession;
  children: React.ReactNode;
}) {
  const value = useMemo<FamilyAclContextValue>(
    () => ({
      session,
      portalRole: familyPortalRoleId(session),
      portalRoleLabel: session.portalRoleLabel || null,
      isReadOnly: familyIsReadOnly(session),
      canWrite: familyCanWrite(session),
      canUpload: familyCanUpload(session),
      canManageFamilyAccess: familyCanManageFamilyAccess(session),
      canManageNextKin: familyCanManageNextKin(session),
      canViewBilling: familyCanViewBilling(session),
      canViewVaultSettings: familyCanViewVaultSettings(session),
      canSeeSection: (sectionId: string) =>
        familyCanSeeVaultSection(session, sectionId),
      canUseOverviewUploads: familyCanUseOverviewUploads(session),
      canUseSectionUploads: (sectionId: string) =>
        familyCanUseSectionUploads(session, sectionId),
    }),
    [session],
  );

  return (
    <FamilyAclContext.Provider value={value}>
      {children}
    </FamilyAclContext.Provider>
  );
}

export function useFamilyAcl(): FamilyAclContextValue {
  return useContext(FamilyAclContext);
}

/**
 * Wraps vault section UI so Viewers can scroll/expand/read but cannot
 * fill fields, Add cards, upload, or click mutate actions.
 */
export function FamilyReadOnlyGuard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isReadOnly } = useFamilyAcl();

  const blockIfMutate = (event: React.SyntheticEvent) => {
    if (!isReadOnly) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!isFamilyMutateControl(target)) return;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      className={className}
      data-oa-family-readonly={isReadOnly ? 'true' : undefined}
      onClickCapture={blockIfMutate}
      onChangeCapture={blockIfMutate}
      onInputCapture={blockIfMutate}
      onDropCapture={blockIfMutate}
      onDragOverCapture={
        isReadOnly
          ? e => {
              e.preventDefault();
              e.stopPropagation();
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
