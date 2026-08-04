'use client';

import React, { useMemo, useState } from 'react';
import {
  Loader2,
  Plus,
  Trash2,
  UserRound,
  Pencil,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@common/ui/button';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import { cn } from '@common/ui/utils';
import { formConfig } from '@/config/formConfig';
import { getSafeErrorMessage } from '@/utils/safeErrorMessage';
import {
  useCreateFamilyMemberMutation,
  useDeleteFamilyMemberMutation,
  useGetMyFamilyQuery,
  useGetPortalRolesQuery,
  useUpdateFamilyMemberMutation,
  type FamilyMemberResponse,
} from '@/services/authApi';
import { SectionFootprintsPanel } from '@/components/vault/SectionFootprintsPanel';

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

const SPECIAL_AREAS = [
  { id: 'overview', title: 'Dashboard overview' },
  { id: 'billing', title: 'Billing & subscription' },
  { id: 'vault_settings', title: 'Vault Settings (roles & security)' },
  { id: 'section2_nextkin', title: 'Section 2 — Next of Kin management' },
] as const;

type Draft = {
  full_name: string;
  email: string;
  relationship: string;
  portal_role: string;
  access_level: 'Full Dashboard Access' | 'Area-Specific Access';
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
 * Vault Settings — family collaborator invites for the owner dashboard.
 * Separate from Section 2 Next of Kin.
 */
export function FamilyAccessManagement() {
  const { data, isLoading, refetch, isFetching } = useGetMyFamilyQuery();
  const { data: rolesData } = useGetPortalRolesQuery();
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

  const vaultSections = useMemo(
    () =>
      formConfig.chunks.flatMap(chunk =>
        chunk.sections.map(section => ({
          id: section.id,
          title: section.title,
        })),
      ),
    [],
  );

  const roleLabel = (id?: string) =>
    roles.find(r => r.id === id)?.label || id || 'Viewer';

  const openAdd = () => {
    if (members.length >= MAX_FAMILY) {
      toast.error(`You can invite at most ${MAX_FAMILY} family members`);
      return;
    }
    setEditingId(null);
    setDraft({ ...emptyDraft(), master_password: generatePassword() });
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
        ? member.authorized_sections
        : [],
      master_password: member.master_password || '',
    });
  };

  const closeForm = () => {
    setDraft(null);
    setEditingId(null);
  };

  const toggleArea = (id: string) => {
    if (!draft) return;
    const has = draft.authorized_sections.includes(id);
    setDraft({
      ...draft,
      authorized_sections: has
        ? draft.authorized_sections.filter(s => s !== id)
        : [...draft.authorized_sections, id],
    });
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.full_name.trim() || !draft.email.trim() || !draft.relationship.trim()) {
      toast.error('Full name, email, and relationship are required');
      return;
    }
    if (
      draft.access_level === 'Area-Specific Access' &&
      draft.authorized_sections.length === 0
    ) {
      toast.error('Select at least one dashboard area');
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
      if (editingId) {
        await updateFamily({ id: editingId, body }).unwrap();
        const pw = draft.master_password.trim();
        if (pw) {
          try {
            const { wrapDekForNokPassword, isE2eeUnlocked } = await import(
              '@/libs/e2ee/crypto'
            );
            const { postE2eeNokWrap } = await import('@/libs/e2ee/vaultApi');
            if (isE2eeUnlocked()) {
              const wrap = await wrapDekForNokPassword(pw);
              await postE2eeNokWrap({ nok_user_id: editingId, ...wrap });
            } else {
              toast.message(
                'Family member updated. Unlock your vault (re-sign in), then set their password again so they can open encrypted sections.',
              );
            }
          } catch {
            toast.error(
              'Saved family member, but vault key share failed. Re-save their password while your vault is unlocked.',
            );
          }
        }
        toast.success('Family member updated');
      } else {
        const created = await createFamily(body).unwrap();
        const memberId = String(created.id || '').trim();
        const pw =
          (created.master_password || '').trim() ||
          draft.master_password.trim();
        if (memberId && pw) {
          try {
            const { wrapDekForNokPassword, isE2eeUnlocked } = await import(
              '@/libs/e2ee/crypto'
            );
            const { postE2eeNokWrap } = await import('@/libs/e2ee/vaultApi');
            if (isE2eeUnlocked()) {
              const wrap = await wrapDekForNokPassword(pw);
              await postE2eeNokWrap({ nok_user_id: memberId, ...wrap });
            } else {
              toast.message(
                'Invite sent. Unlock your vault then edit this person and re-save their password so encrypted sections open for them.',
              );
            }
          } catch {
            toast.error(
              'Invite sent, but vault key share failed. Edit them and re-save the password while your vault is unlocked.',
            );
          }
        }
        toast.success(
          'Invite sent — they get a separate dashboard login (not the owner session)',
        );
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

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-3 text-[12px] leading-relaxed text-slate-600">
        Family collaborators sign in with their own email/password at the family
        login link. Owner and family sessions stay separate — logging in as the
        owner does not open a family session. This is owner dashboard access,
        not Next of Kin access (Section 2).
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          {members.length} / {MAX_FAMILY} family members
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
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
            className="rounded-xl"
            onClick={openAdd}
            disabled={members.length >= MAX_FAMILY}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Invite family
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading family access…</p>
      ) : members.length === 0 && !draft ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
          <UserRound className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-700">
            No family collaborators yet
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Invite up to {MAX_FAMILY} people with clear roles and dashboard
            areas. Hide Vault Settings role management from Viewer/Editor.
          </p>
          <Button type="button" className="mt-4 rounded-xl" onClick={openAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            Invite family member
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {members.map(member => (
            <li
              key={member.id}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-3"
            >
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00305C] text-sm font-semibold text-white">
                {(member.full_name || member.email || '?')
                  .slice(0, 1)
                  .toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {member.full_name || member.email}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {member.relationship} · {roleLabel(member.portal_role)} ·{' '}
                  {member.access_level === 'Full Kit Access'
                    ? 'Full dashboard'
                    : `${(member.authorized_sections || []).length} areas`}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-400">
                  {member.email}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
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
              {editingId ? 'Edit family member' : 'Invite family member'}
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

          <div>
            <Label className="mb-2 block">Portal role — what they can manage</Label>
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
                      setDraft({ ...draft, portal_role: role.id })
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

          <div>
            <Label className="mb-2 block">Owner dashboard areas</Label>
            <p className="mb-3 text-xs text-slate-500">
              Choose the whole dashboard or specific areas — vault sections,
              billing, Vault Settings, and Section 2 Next of Kin management.
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={
                  draft.access_level === 'Full Dashboard Access'
                    ? 'default'
                    : 'outline'
                }
                className="rounded-full"
                onClick={() =>
                  setDraft({
                    ...draft,
                    access_level: 'Full Dashboard Access',
                    authorized_sections: [],
                  })
                }
              >
                Full dashboard access
              </Button>
              <Button
                type="button"
                size="sm"
                variant={
                  draft.access_level === 'Area-Specific Access'
                    ? 'default'
                    : 'outline'
                }
                className="rounded-full"
                onClick={() =>
                  setDraft({
                    ...draft,
                    access_level: 'Area-Specific Access',
                  })
                }
              >
                Specific dashboard areas
              </Button>
            </div>
            {draft.access_level === 'Area-Specific Access' && (
              <div className="max-h-64 space-y-3 overflow-y-auto rounded-xl border bg-white p-3">
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Management areas
                  </p>
                  {SPECIAL_AREAS.map(area => (
                    <label
                      key={area.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={draft.authorized_sections.includes(area.id)}
                        onChange={() => toggleArea(area.id)}
                      />
                      <span>{area.title}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Vault sections
                  </p>
                  {vaultSections.map(section => (
                    <label
                      key={section.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={draft.authorized_sections.includes(section.id)}
                        onChange={() => toggleArea(section.id)}
                      />
                      <span>
                        {section.id}. {section.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
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

      <SectionFootprintsPanel />
    </div>
  );
}
