'use client';

import React, { useMemo, useState } from 'react';
import {
  LayoutGrid,
  Loader2,
  Plus,
  Trash2,
  UserRound,
  Pencil,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@common/ui/button';
import { Checkbox } from '@common/ui/checkbox';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import { cn } from '@common/ui/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/ui/dialog';
import { getSafeErrorMessage } from '@/utils/safeErrorMessage';
import {
  useCreateFamilyMemberMutation,
  useDeleteFamilyMemberMutation,
  useGetFamilyRoleAreasQuery,
  useGetMyFamilyQuery,
  useGetPortalRolesQuery,
  useUpdateFamilyMemberMutation,
  type FamilyMemberResponse,
} from '@/services/authApi';
import {
  getFamilyAccessAreaRows,
  type FamilyAccessLevel,
} from '@/utils/familyAccessAreas';

const MAX_FAMILY = 5;

const FALLBACK_ROLES = [
  {
    id: 'viewer',
    label: 'Viewer',
    description:
      'View granted dashboard vault sections only. Cannot edit fields, upload documents, manage billing, family roles, or Next of Kin.',
  },
  {
    id: 'editor',
    label: 'Editor',
    description:
      'View and update granted vault sections, including drag-and-drop document uploads. Cannot manage family roles, Next of Kin, billing, or Vault Settings.',
  },
  {
    id: 'portal_manager',
    label: 'Portal Manager',
    description:
      'Editor rights on granted areas, plus invite/edit other family collaborators (role & area access). Cannot approve/delete Next of Kin or change billing. Vault Settings family area only — MFA stays owner-only.',
  },
  {
    id: 'admin',
    label: 'Admin',
    description:
      'Full edit/upload on granted dashboard areas, manage family collaborators, and manage Section 2 Next of Kin (approve, revoke, delete). Cannot change owner billing or owner MFA.',
  },
  {
    id: 'super_admin',
    label: 'Super Admin',
    description:
      'Highest family collaborator role: edit/upload granted areas, manage family access, manage Next of Kin, and view billing status in Vault Settings (payment changes still require the owner).',
  },
] as const;

type AreaRow = {
  id: string;
  title: string;
  group: string;
  hint?: string;
};

type Draft = {
  full_name: string;
  email: string;
  relationship: string;
  portal_role: string;
  access_level: FamilyAccessLevel;
  authorized_sections: string[];
  master_password: string;
};

function emptyDraft(): Draft {
  return {
    full_name: '',
    email: '',
    relationship: '',
    portal_role: 'viewer',
    access_level: 'Full Dashboard Access',
    authorized_sections: [],
    master_password: '',
  };
}

function generatePassword(length = 14) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  if (typeof window !== 'undefined' && window.crypto) {
    const values = new Uint32Array(length);
    window.crypto.getRandomValues(values);
    return Array.from(values, value => chars[value % chars.length]).join('');
  }
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('');
}

/**
 * Family collaborator invites for the owner dashboard.
 * Shown on Access Control (Section 2) and Vault Settings.
 * Separate from Next of Kin accounts.
 */
export function FamilyAccessManagement({
  variant = 'vault-settings',
}: {
  variant?: 'vault-settings' | 'access-management';
}) {
  const { data, isLoading, refetch, isFetching } = useGetMyFamilyQuery();
  const { data: rolesData } = useGetPortalRolesQuery();
  const { data: roleAreasData } = useGetFamilyRoleAreasQuery();
  const [createFamily, { isLoading: creating }] =
    useCreateFamilyMemberMutation();
  const [updateFamily, { isLoading: updating }] =
    useUpdateFamilyMemberMutation();
  const [deleteFamily, { isLoading: deleting }] =
    useDeleteFamilyMemberMutation();

  const members = data || [];
  const roles = rolesData?.roles?.length ? rolesData.roles : FALLBACK_ROLES;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [areasOpen, setAreasOpen] = useState(false);
  const [areaDraft, setAreaDraft] = useState<string[]>([]);
  const [areaMode, setAreaMode] = useState<FamilyAccessLevel>(
    'Area-Specific Access',
  );

  const areaRows = useMemo<AreaRow[]>(() => getFamilyAccessAreaRows(), []);

  const applyRoleDefaultAreas = (roleId: string): Partial<Draft> => {
    const entry = roleAreasData?.roles?.[roleId];
    if (!entry) {
      return {
        access_level: 'Full Dashboard Access',
        authorized_sections: [],
      };
    }
    const isFull =
      entry.access_level === 'Full Dashboard Access' ||
      entry.access_level === 'Full Kit Access';
    return {
      access_level: isFull ? 'Full Dashboard Access' : 'Area-Specific Access',
      authorized_sections: isFull
        ? []
        : (entry.authorized_sections || []).map(String),
    };
  };

  const roleLabel = (id?: string) =>
    roles.find(r => r.id === id)?.label || id || 'Viewer';

  const openAdd = () => {
    if (members.length >= MAX_FAMILY) {
      toast.error(`You can invite at most ${MAX_FAMILY} family members`);
      return;
    }
    setEditingId(null);
    setDraft({
      ...emptyDraft(),
      ...applyRoleDefaultAreas('viewer'),
      master_password: generatePassword(),
    });
  };

  const openEdit = (member: FamilyMemberResponse) => {
    setEditingId(member.id);
    const isFull =
      member.access_level === 'Full Kit Access' ||
      (member as { access_level_label?: string }).access_level_label ===
        'Full Dashboard Access';
    setDraft({
      full_name: member.full_name || '',
      email: member.email || '',
      relationship: member.relationship || '',
      portal_role: member.portal_role || 'viewer',
      access_level: isFull ? 'Full Dashboard Access' : 'Area-Specific Access',
      authorized_sections: Array.isArray(member.authorized_sections)
        ? member.authorized_sections.map(String)
        : [],
      master_password: member.master_password || '',
    });
  };

  const closeForm = () => {
    setDraft(null);
    setEditingId(null);
    setAreasOpen(false);
  };

  const openAreasPopup = () => {
    if (!draft) return;
    setAreaMode(draft.access_level);
    setAreaDraft(
      draft.access_level === 'Full Dashboard Access'
        ? areaRows.map(row => row.id)
        : [...draft.authorized_sections],
    );
    setAreasOpen(true);
  };

  const toggleAreaMark = (id: string) => {
    setAreaMode('Area-Specific Access');
    setAreaDraft(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id],
    );
  };

  const markAllAreas = () => {
    setAreaMode('Area-Specific Access');
    setAreaDraft(areaRows.map(row => row.id));
  };

  const unmarkAllAreas = () => {
    setAreaMode('Area-Specific Access');
    setAreaDraft([]);
  };

  const applyAreasPopup = () => {
    if (!draft) return;
    if (areaMode === 'Full Dashboard Access') {
      setDraft({
        ...draft,
        access_level: 'Full Dashboard Access',
        authorized_sections: [],
      });
    } else {
      if (areaDraft.length === 0) {
        toast.error('Mark at least one access area, or choose full dashboard');
        return;
      }
      setDraft({
        ...draft,
        access_level: 'Area-Specific Access',
        authorized_sections: areaDraft,
      });
    }
    setAreasOpen(false);
  };

  const save = async () => {
    if (!draft) return;
    if (
      !draft.full_name.trim() ||
      !draft.email.trim() ||
      !draft.relationship.trim()
    ) {
      toast.error('Full name, email, and relationship are required');
      return;
    }
    if (
      draft.access_level === 'Area-Specific Access' &&
      draft.authorized_sections.length === 0
    ) {
      toast.error('Open Access areas and mark at least one area');
      return;
    }

    const body = {
      full_name: draft.full_name.trim(),
      email: draft.email.trim().toLowerCase(),
      relationship: draft.relationship.trim(),
      portal_role: draft.portal_role,
      access_level: draft.access_level,
      authorized_sections:
        draft.access_level === 'Area-Specific Access'
          ? draft.authorized_sections
          : [],
      master_password: draft.master_password.trim() || undefined,
    };

    try {
      const { ownerVaultMustBeUnlockedForShare, shareVaultDekWithCollaborator } =
        await import('@/libs/e2ee/shareVaultDek');

      if (await ownerVaultMustBeUnlockedForShare()) {
        toast.error(
          'Unlock your vault first (re-enter your account password on the overview), then save again so this person can open encrypted sections.',
        );
        return;
      }

      const existing = editingId
        ? members.find(m => m.id === editingId)
        : null;
      const wrapMissing = existing?.e2ee_wrap_configured === false;
      const pw = draft.master_password.trim();
      if (editingId && wrapMissing && !pw) {
        toast.error(
          'Vault key not shared yet. Enter their login password in this form and save so they can see your section data.',
        );
        return;
      }

      if (editingId) {
        await updateFamily({ id: editingId, body }).unwrap();
        if (pw) {
          const share = await shareVaultDekWithCollaborator({
            collaboratorId: editingId,
            password: pw,
            requireUnlocked: true,
          });
          if (!share.ok) {
            toast.error(
              share.reason === 'locked'
                ? 'Saved, but vault is locked — unlock and re-save their password to share encrypted sections.'
                : 'Saved family member, but vault key share failed. Re-save their password while your vault is unlocked.',
            );
          } else if (share.shared) {
            toast.success('Family member updated — vault access shared');
          } else {
            toast.success('Family member updated');
          }
        } else {
          toast.success('Family member updated');
        }
        try {
          window.dispatchEvent(new CustomEvent('orderly-family-acl-refresh'));
        } catch {
          /* ignore */
        }
      } else {
        const created = await createFamily(body).unwrap();
        const memberId = String(created.id || '').trim();
        const createdPw =
          (created.master_password || '').trim() ||
          draft.master_password.trim();
        if (memberId && createdPw) {
          const share = await shareVaultDekWithCollaborator({
            collaboratorId: memberId,
            password: createdPw,
            requireUnlocked: true,
          });
          if (!share.ok) {
            toast.error(
              share.reason === 'locked'
                ? 'Invite sent, but unlock your vault and edit them to share encrypted section access.'
                : 'Invite sent, but vault key share failed. Edit them and re-save the password while unlocked.',
            );
          } else {
            toast.success(
              'Invite sent — they can sign in and see granted areas',
            );
          }
        } else {
          toast.success(
            'Invite sent — they get a separate dashboard login (not the owner session)',
          );
        }
      }
      closeForm();
    } catch (error) {
      toast.error(getSafeErrorMessage(error, 'Could not save family member'));
    }
  };

  const remove = async (id: string, name?: string) => {
    if (
      !window.confirm(
        `Remove ${name || 'this family member'}? They will lose dashboard access.`,
      )
    ) {
      return;
    }
    setBusyId(id);
    try {
      await deleteFamily(id).unwrap();
      toast.success('Family member removed');
      if (editingId === id) closeForm();
    } catch (error) {
      toast.error(getSafeErrorMessage(error, 'Could not delete'));
    } finally {
      setBusyId(null);
    }
  };

  const accessSummary = draft
    ? draft.access_level === 'Full Dashboard Access'
      ? 'Full dashboard (all areas)'
      : `${draft.authorized_sections.length} area${
          draft.authorized_sections.length === 1 ? '' : 's'
        } marked`
    : '';

  const groupedRows = useMemo(() => {
    const map = new Map<string, AreaRow[]>();
    for (const row of areaRows) {
      const list = map.get(row.group) || [];
      list.push(row);
      map.set(row.group, list);
    }
    return [...map.entries()];
  }, [areaRows]);

  const onAccessPage = variant === 'access-management';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#E4EAF0] bg-[#F6F8FA] px-3.5 py-3 text-[12px] leading-relaxed text-[#6A7481]">
        {onAccessPage ? (
          <>
            Add family, friends, or advisors who can view or edit your vault
            while you are living. They sign in with their own email and
            password at the family login — separate from Next of Kin above.
          </>
        ) : (
          <>
            Family collaborators sign in with their own email/password at the
            family login link. Owner and family sessions stay separate. This is
            dashboard access, not Next of Kin access.
          </>
        )}
        <span className="mt-2 block font-medium text-[#213D59]">
          To let them see encrypted vault sections, save their invite while your
          vault is unlocked (after a normal owner password sign-in). If a member
          shows “Vault key not shared”, edit them, enter their password, and
          save again.
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm text-[#6A7481]">
          {members.length} / {MAX_FAMILY}{' '}
          {onAccessPage ? 'other people' : 'family members'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-10 flex-1 rounded-xl sm:min-h-0 sm:flex-none"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn('mr-1.5 h-3.5 w-3.5', isFetching && 'animate-spin')}
            />
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            className="min-h-10 flex-1 rounded-xl bg-[#213D59] sm:min-h-0 sm:flex-none hover:bg-[#2C4B6B]"
            onClick={openAdd}
            disabled={members.length >= MAX_FAMILY}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {onAccessPage ? 'Add other person' : 'Invite family'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading family access…</p>
      ) : members.length === 0 && !draft ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
          <UserRound className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-700">
            No family or other collaborators yet
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Invite up to {MAX_FAMILY} people besides next of kin, then mark
            which dashboard areas they can open.
          </p>
          <Button type="button" className="mt-4 rounded-xl bg-[#213D59] hover:bg-[#2C4B6B]" onClick={openAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            {onAccessPage ? 'Add other person' : 'Invite family member'}
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {members.map(member => (
            <li
              key={member.id}
              className="rounded-[16px] border border-[#E4EAF0] border-t-[3px] border-t-[#1F9D6B] bg-white p-4 max-md:rounded-[14px]"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full bg-[#213D59] text-sm font-bold text-white">
                  {(member.full_name || member.email || '?')
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(part => part[0])
                    .join('')
                    .toUpperCase() || '?'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15.5px] font-bold text-[#213D59]">
                    {member.full_name || member.email}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-[#E8F6F0] px-2.5 py-0.5 text-[11px] font-semibold text-[#1F9D6B]">
                      Contributor
                    </span>
                    <span className="rounded-full bg-[#EAF6FD] px-2.5 py-0.5 text-[11px] font-semibold text-[#213D59]">
                      {roleLabel(member.portal_role)}
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-snug text-[#7A8794]">
                    {member.relationship}
                    {member.access_level === 'Full Kit Access'
                      ? ' · Full dashboard'
                      : ` · ${(member.authorized_sections || []).length} areas`}
                    {member.e2ee_wrap_configured === false
                      ? ' · Vault key not shared'
                      : ''}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {member.email}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1 self-end sm:self-start">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl"
                  onClick={() => openEdit(member)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-rose-600"
                  disabled={busyId === member.id || deleting}
                  onClick={() => remove(member.id, member.full_name)}
                >
                  {busyId === member.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-900">
              {editingId ? 'Edit person' : onAccessPage ? 'Add other person' : 'Invite family member'}
            </h4>
            <Button type="button" variant="ghost" size="sm" onClick={closeForm}>
              Cancel
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input
                value={draft.full_name}
                onChange={e => setDraft({ ...draft, full_name: e.target.value })}
                className="rounded-xl bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Relationship</Label>
              <Input
                value={draft.relationship}
                onChange={e =>
                  setDraft({ ...draft, relationship: e.target.value })
                }
                className="rounded-xl bg-white"
                placeholder="Spouse, child, sibling…"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={draft.email}
                disabled={Boolean(editingId)}
                onChange={e => setDraft({ ...draft, email: e.target.value })}
                className="rounded-xl bg-white"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Login password (their own session)</Label>
              <div className="flex gap-2">
                <Input
                  value={draft.master_password}
                  onChange={e =>
                    setDraft({ ...draft, master_password: e.target.value })
                  }
                  className="rounded-xl bg-white font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 rounded-xl"
                  onClick={() =>
                    setDraft({ ...draft, master_password: generatePassword() })
                  }
                >
                  Generate
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  Owner vault access areas
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Mark or unmark overview drag/drop, Access Management, letter
                  of next of kin, messages, every vault section, billing, and
                  Vault Settings.
                </p>
                <p className="mt-2 text-xs font-medium text-[#213D59]">
                  Current: {accessSummary}
                </p>
              </div>
              <Button
                type="button"
                className="h-11 w-full rounded-xl sm:h-10 sm:w-auto"
                onClick={openAreasPopup}
              >
                <LayoutGrid className="mr-1.5 h-4 w-4" />
                Manage access areas
              </Button>
            </div>
          </div>

          {/* Role stays at the bottom of the invite/edit card */}
          <div className="border-t border-slate-200 pt-4">
            <Label className="mb-2 block">
              Portal role — what they can do in marked areas
            </Label>
            <div className="grid gap-2">
              {roles.map(role => (
                <label
                  key={role.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-2xl border px-3.5 py-3 transition',
                    draft.portal_role === role.id
                      ? 'border-[#00305C] bg-white ring-1 ring-[#00305C]/20'
                      : 'border-slate-200 bg-white hover:border-slate-300',
                  )}
                >
                  <input
                    type="radio"
                    className="mt-1"
                    checked={draft.portal_role === role.id}
                    onChange={() =>
                      setDraft({
                        ...draft,
                        portal_role: role.id,
                        ...(editingId
                          ? {}
                          : applyRoleDefaultAreas(role.id)),
                      })
                    }
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">
                      {role.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {role.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Button
            type="button"
            className="w-full rounded-xl"
            onClick={save}
            disabled={creating || updating}
          >
            {(creating || updating) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {editingId ? 'Save changes' : 'Send dashboard invite email'}
          </Button>
        </div>
      )}

      <Dialog open={areasOpen} onOpenChange={setAreasOpen}>
        <DialogContent className="flex max-h-[min(92dvh,44rem)] w-[min(100vw-1rem,52rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
          <DialogHeader className="shrink-0 space-y-1 border-b border-slate-100 px-4 py-4 pr-12 sm:px-5">
            <DialogTitle className="text-[#213D59]">
              Mark vault access areas
            </DialogTitle>
            <DialogDescription>
              Toggle areas on or off for this family member. Full dashboard
              marks everything; specific mode lets you choose section by
              section.
            </DialogDescription>
          </DialogHeader>

          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
            <Button
              type="button"
              size="sm"
              variant={
                areaMode === 'Full Dashboard Access' ? 'default' : 'outline'
              }
              className="rounded-full"
              onClick={() => {
                setAreaMode('Full Dashboard Access');
                setAreaDraft(areaRows.map(row => row.id));
              }}
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
              onClick={() => setAreaMode('Area-Specific Access')}
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
                onClick={markAllAreas}
              >
                Mark all
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-xl"
                disabled={areaMode === 'Full Dashboard Access'}
                onClick={unmarkAllAreas}
              >
                Unmark all
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3">
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
                          <div className="flex justify-end">
                            <Checkbox
                              checked={marked}
                              disabled={areaMode === 'Full Dashboard Access'}
                              onCheckedChange={() => toggleAreaMark(row.id)}
                              aria-label={`Access to ${row.title}`}
                              className="h-5 w-5 border-[#C5D4E0] data-[state=checked]:border-[#213D59] data-[state=checked]:bg-[#213D59]"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-slate-100 px-4 py-3 sm:px-5">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setAreasOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              onClick={applyAreasPopup}
            >
              Apply access areas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
