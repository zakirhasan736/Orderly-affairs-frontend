'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@common/ui/button';
import { cn } from '@common/ui/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/ui/dialog';
import {
  useGetFamilyRoleAreasQuery,
  useGetPortalRolesQuery,
  useUpdateFamilyRoleAreasMutation,
  type FamilyRoleAreaEntry,
  type PortalRoleId,
} from '@/services/authApi';
import { getSafeErrorMessage } from '@/utils/safeErrorMessage';
import {
  getFamilyAccessAreaRows,
  type FamilyAccessLevel,
} from '@/utils/familyAccessAreas';

const ROLE_ORDER: PortalRoleId[] = [
  'viewer',
  'editor',
  'portal_manager',
  'admin',
  'super_admin',
];

const FALLBACK_ROLE_LABELS: Record<string, string> = {
  viewer: 'Viewer',
  editor: 'Editor',
  portal_manager: 'Portal Manager',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

type RoleDraft = Record<string, FamilyRoleAreaEntry>;

function emptyMatrix(roleIds: string[]): RoleDraft {
  return Object.fromEntries(
    roleIds.map(id => [
      id,
      {
        access_level: 'Full Dashboard Access' as const,
        authorized_sections: [] as string[],
      },
    ]),
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Global per-role access areas for family collaborators.
 * Saving updates defaults and applies them to every member with that portal role.
 */
export function FamilyRoleAreaDefaultsDialog({ open, onOpenChange }: Props) {
  const areaRows = useMemo(() => getFamilyAccessAreaRows(), []);
  const { data: rolesData } = useGetPortalRolesQuery();
  const { data, isLoading, isFetching, refetch } = useGetFamilyRoleAreasQuery(
    undefined,
    { skip: !open },
  );
  const [save, { isLoading: saving }] = useUpdateFamilyRoleAreasMutation();

  const roleIds = useMemo(() => {
    const fromApi = rolesData?.roles?.map(r => r.id) || [];
    const ordered = ROLE_ORDER.filter(
      id => fromApi.includes(id) || !fromApi.length,
    );
    const extras = fromApi.filter(id => !ROLE_ORDER.includes(id as PortalRoleId));
    return [...ordered, ...extras];
  }, [rolesData]);

  const roleLabel = (id: string) =>
    rolesData?.roles?.find(r => r.id === id)?.label ||
    FALLBACK_ROLE_LABELS[id] ||
    id;

  const [activeRole, setActiveRole] = useState<string>('viewer');
  const [draft, setDraft] = useState<RoleDraft>(() => emptyMatrix(ROLE_ORDER));
  const [applyToMembers, setApplyToMembers] = useState(true);

  useEffect(() => {
    if (!open) return;
    void refetch();
  }, [open, refetch]);

  useEffect(() => {
    if (!open || !data?.roles) return;
    const next = emptyMatrix(roleIds);
    for (const id of roleIds) {
      const entry = data.roles[id];
      if (!entry) continue;
      const isFull =
        entry.access_level === 'Full Dashboard Access' ||
        entry.access_level === 'Full Kit Access';
      next[id] = {
        access_level: isFull ? 'Full Dashboard Access' : 'Area-Specific Access',
        authorized_sections: isFull
          ? []
          : (entry.authorized_sections || []).map(String),
      };
    }
    setDraft(next);
    if (!roleIds.includes(activeRole) && roleIds[0]) {
      setActiveRole(roleIds[0]);
    }
  }, [open, data, roleIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = draft[activeRole] || {
    access_level: 'Full Dashboard Access' as FamilyAccessLevel,
    authorized_sections: [],
  };
  const areaMode = current.access_level;
  const areaDraft =
    areaMode === 'Full Dashboard Access'
      ? areaRows.map(r => r.id)
      : current.authorized_sections || [];

  const groupedRows = useMemo(() => {
    const map = new Map<string, typeof areaRows>();
    for (const row of areaRows) {
      const list = map.get(row.group) || [];
      list.push(row);
      map.set(row.group, list);
    }
    return [...map.entries()];
  }, [areaRows]);

  const setRoleAreas = (
    roleId: string,
    access_level: FamilyAccessLevel,
    authorized_sections: string[],
  ) => {
    setDraft(prev => ({
      ...prev,
      [roleId]: { access_level, authorized_sections },
    }));
  };

  const toggleAreaMark = (id: string) => {
    const nextSections =
      areaMode === 'Full Dashboard Access'
        ? areaRows.map(r => r.id).filter(x => x !== id)
        : areaDraft.includes(id)
          ? areaDraft.filter(x => x !== id)
          : [...areaDraft, id];
    setRoleAreas(activeRole, 'Area-Specific Access', nextSections);
  };

  const onSave = async () => {
    for (const roleId of roleIds) {
      const entry = draft[roleId];
      if (
        entry?.access_level === 'Area-Specific Access' &&
        !(entry.authorized_sections || []).length
      ) {
        toast.error(
          `${roleLabel(roleId)}: mark at least one area, or choose full dashboard`,
        );
        setActiveRole(roleId);
        return;
      }
    }
    try {
      const result = await save({
        roles: draft,
        apply_to_members: applyToMembers,
      }).unwrap();
      toast.success(
        result.message ||
          `Saved role access areas${
            applyToMembers
              ? ` · ${result.members_updated ?? 0} member(s) updated`
              : ''
          }`,
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(getSafeErrorMessage(error, 'Could not save role access areas'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(94dvh,48rem)] w-[min(100vw-1rem,56rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="shrink-0 space-y-1 border-b border-slate-100 px-4 py-4 pr-12 sm:px-5">
          <DialogTitle className="text-[#213D59]">
            Global role access areas
          </DialogTitle>
          <DialogDescription>
            Increase or reduce which vault areas each portal role can open.
            Defaults apply to new invites; turn on “Apply to existing members”
            to update everyone already assigned that role.
          </DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-slate-100 bg-slate-50/90 px-3 py-2.5 sm:px-4">
          {roleIds.map(id => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveRole(id)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                activeRole === id
                  ? 'bg-[#0f3d4c] text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100',
              )}
            >
              {roleLabel(id)}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
          <Button
            type="button"
            size="sm"
            variant={
              areaMode === 'Full Dashboard Access' ? 'default' : 'outline'
            }
            className="rounded-full"
            onClick={() =>
              setRoleAreas(activeRole, 'Full Dashboard Access', [])
            }
          >
            Full dashboard
          </Button>
          <Button
            type="button"
            size="sm"
            variant={
              areaMode === 'Area-Specific Access' ? 'default' : 'outline'
            }
            className="rounded-full"
            onClick={() =>
              setRoleAreas(
                activeRole,
                'Area-Specific Access',
                areaMode === 'Full Dashboard Access'
                  ? areaRows.map(r => r.id)
                  : current.authorized_sections || [],
              )
            }
          >
            Specific areas
          </Button>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl"
              disabled={areaMode === 'Full Dashboard Access'}
              onClick={() =>
                setRoleAreas(
                  activeRole,
                  'Area-Specific Access',
                  areaRows.map(r => r.id),
                )
              }
            >
              Mark all
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl"
              disabled={areaMode === 'Full Dashboard Access'}
              onClick={() =>
                setRoleAreas(activeRole, 'Area-Specific Access', [])
              }
            >
              Unmark all
            </Button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3">
          {(isLoading || isFetching) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          )}
          <p className="mb-2 px-2 text-xs text-slate-500">
            Editing areas for{' '}
            <span className="font-semibold text-slate-800">
              {roleLabel(activeRole)}
            </span>
            . Viewer stays view-only; Editor+ can edit marked areas when their
            role allows write.
          </p>
          <table className="w-full border-separate border-spacing-y-1 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
              <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2 font-semibold">Area</th>
                <th className="hidden px-3 py-2 font-semibold sm:table-cell">
                  Group
                </th>
                <th className="px-3 py-2 text-right font-semibold">Access</th>
              </tr>
            </thead>
            <tbody>
              {groupedRows.map(([group, rows]) =>
                rows.map(row => {
                  const marked =
                    areaMode === 'Full Dashboard Access' ||
                    areaDraft.includes(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'rounded-xl transition',
                        marked ? 'bg-emerald-50/70' : 'bg-white',
                      )}
                    >
                      <td className="rounded-l-xl px-3 py-2.5 align-top">
                        <p className="font-medium text-slate-900">
                          {row.title}
                        </p>
                        {row.hint ? (
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {row.hint}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:hidden">
                          {group}
                        </p>
                      </td>
                      <td className="hidden px-3 py-2.5 align-middle text-xs text-slate-500 sm:table-cell">
                        {group}
                      </td>
                      <td className="rounded-r-xl px-3 py-2.5 text-right align-middle">
                        <input
                          type="checkbox"
                          checked={marked}
                          disabled={areaMode === 'Full Dashboard Access'}
                          onChange={() => toggleAreaMark(row.id)}
                          aria-label={`Access to ${row.title}`}
                          className="h-5 w-5 cursor-pointer rounded border border-[#C5D4E0] accent-[#213D59] disabled:cursor-default disabled:opacity-80"
                        />
                      </td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>

        <DialogFooter className="shrink-0 flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <label className="flex cursor-pointer items-start gap-2 text-left text-xs text-slate-600 sm:max-w-[22rem]">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={applyToMembers}
              onChange={e => setApplyToMembers(e.target.checked)}
            />
            <span>
              Apply to existing family members with these roles (increases or
              reduces their access areas now)
            </span>
          </label>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl sm:flex-none"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-xl sm:flex-none"
              onClick={() => void onSave()}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save role areas
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
