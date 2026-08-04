'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/components/admin/AdminAuthProvider';
import { statusTagClass } from '@/components/admin/adminNav';
import {
  adminCreateRoleDef,
  adminDeleteRoleDef,
  adminInviteStaff,
  adminListStaff,
  adminPatchStaff,
  adminRolesCatalog,
  type AdminArea,
  type AdminRoleDef,
  type AdminStaff,
} from '@/libs/api/adminApi';
import { AdminRolesSkeleton } from '@/components/admin/AdminSkeletons';

function fmt(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

export default function AdminRolesPage() {
  const { session } = useAdminAuth();
  const canManage =
    session?.can_manage_roles ||
    session?.admin_role === 'super_admin' ||
    session?.admin_role === 'system_owner';

  const [areas, setAreas] = useState<AdminArea[]>([]);
  const [roles, setRoles] = useState<AdminRoleDef[]>([]);
  const [matrixCols, setMatrixCols] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [matrixRows, setMatrixRows] = useState<
    Array<{ name: string; note: string; flags: number[] }>
  >([]);
  const [staff, setStaff] = useState<AdminStaff[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Invite form
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('viewer');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [useCustomAreas, setUseCustomAreas] = useState(false);

  // Custom role form
  const [showCustomRole, setShowCustomRole] = useState(false);
  const [newRoleId, setNewRoleId] = useState('');
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleAreas, setNewRoleAreas] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [catalog, staffRes] = await Promise.all([
        adminRolesCatalog(),
        adminListStaff(q.trim() || undefined),
      ]);
      setAreas(catalog.areas || []);
      setRoles(catalog.roles || []);
      setMatrixCols(catalog.matrix_columns || []);
      setMatrixRows(catalog.matrix_rows || []);
      setStaff(staffRes.staff || []);
      if (!roleId && catalog.roles?.[0]) {
        setRoleId(catalog.roles[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [q, roleId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedRole = useMemo(
    () => roles.find(r => r.id === roleId),
    [roles, roleId],
  );

  useEffect(() => {
    if (!useCustomAreas && selectedRole) {
      setSelectedAreas(
        selectedRole.areas?.includes('*')
          ? areas.map(a => a.id)
          : [...(selectedRole.areas || [])],
      );
    }
  }, [selectedRole, useCustomAreas, areas]);

  const toggleArea = (id: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  };

  const onInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      toast.error('Only Super Admin can invite access persons');
      return;
    }
    setBusy(true);
    try {
      await adminInviteStaff({
        email: email.trim(),
        full_name: fullName.trim(),
        password,
        admin_role: roleId,
        admin_areas: useCustomAreas
          ? selectedAreas.length === areas.length
            ? ['*']
            : selectedAreas
          : undefined,
      });
      toast.success('Access person saved — they can sign in at /admin/login');
      setEmail('');
      setFullName('');
      setPassword('');
      setUseCustomAreas(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setBusy(false);
    }
  };

  const onChangeStaffRole = async (person: AdminStaff, nextRole: string) => {
    if (!canManage) return;
    setBusy(true);
    try {
      if (nextRole === 'suspended') {
        await adminPatchStaff(person.id, {
          suspended: true,
          is_admin: false,
        });
        toast.success(`Suspended ${person.email}`);
      } else {
        await adminPatchStaff(person.id, {
          admin_role: nextRole,
          suspended: false,
          is_admin: true,
        });
        toast.success(`Updated ${person.email} → ${nextRole}`);
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const onCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    setBusy(true);
    try {
      await adminCreateRoleDef({
        id: newRoleId.trim().toLowerCase().replace(/\s+/g, '_'),
        label: newRoleLabel.trim(),
        description: newRoleDesc.trim(),
        areas: newRoleAreas,
      });
      toast.success('Custom role created');
      setShowCustomRole(false);
      setNewRoleId('');
      setNewRoleLabel('');
      setNewRoleDesc('');
      setNewRoleAreas([]);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create role failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading && !staff.length && !matrixRows.length) {
    return <AdminRolesSkeleton />;
  }

  return (
    <>
      {error ? <div className="oa-admin-err">{error}</div> : null}

      {/* Permission matrix — zip layout */}
      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <h2>Admin roles &amp; access permissions</h2>
        </div>
        <div className="oa-admin-panel-body" style={{ padding: 0 }}>
          <div className="oa-admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Permission</th>
                  {matrixCols.map(c => (
                    <th key={c.id}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixRows.map(row => (
                  <tr key={row.name}>
                    <td style={{ whiteSpace: 'normal', minWidth: 200 }}>
                      <strong style={{ fontSize: 13.5 }}>{row.name}</strong>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--oa-muted)',
                          marginTop: 2,
                        }}
                      >
                        {row.note}
                      </div>
                    </td>
                    {row.flags.map((flag, i) => (
                      <td key={`${row.name}-${i}`}>
                        <span
                          style={{
                            fontFamily: 'var(--oa-display)',
                            color: flag
                              ? 'var(--oa-brand)'
                              : 'var(--oa-muted)',
                            fontWeight: flag ? 700 : 400,
                          }}
                        >
                          {flag ? '✓' : '—'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Role cards */}
      <div className="oa-admin-cards">
        {roles.map(r => (
          <div key={r.id} className="oa-admin-stat">
            <div className="label">{r.builtin ? 'Built-in' : 'Custom'}</div>
            <div className="value" style={{ fontSize: 18 }}>
              {r.label}
            </div>
            <div className="delta" style={{ whiteSpace: 'normal' }}>
              {r.description}
              <div style={{ marginTop: 6 }}>
                {(r.areas || []).includes('*')
                  ? 'All areas'
                  : `${(r.areas || []).length} areas`}
              </div>
            </div>
            {!r.builtin && canManage ? (
              <button
                type="button"
                className="oa-admin-btn ghost"
                style={{ marginTop: 8, padding: 0 }}
                onClick={() =>
                  void adminDeleteRoleDef(r.id)
                    .then(() => {
                      toast.success('Role deleted');
                      return load();
                    })
                    .catch(err =>
                      toast.error(
                        err instanceof Error ? err.message : 'Delete failed',
                      ),
                    )
                }
              >
                Delete
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {/* Create access person */}
      {canManage ? (
        <div className="oa-admin-panel">
          <div className="oa-admin-panel-head">
            <h2>Create access person</h2>
            <span style={{ fontSize: 12, color: 'var(--oa-muted)' }}>
              Assign role + restrict console areas
            </span>
          </div>
          <div className="oa-admin-panel-body">
            <form
              onSubmit={onInvite}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
              }}
            >
              <div className="oa-admin-field">
                <label>Full name</label>
                <input
                  className="oa-admin-input"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="oa-admin-field">
                <label>Email</label>
                <input
                  className="oa-admin-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="oa-admin-field">
                <label>Temp password</label>
                <input
                  className="oa-admin-input"
                  type="text"
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div className="oa-admin-field">
                <label>Role</label>
                <select
                  className="oa-admin-select"
                  value={roleId}
                  onChange={e => {
                    setRoleId(e.target.value);
                    setUseCustomAreas(false);
                  }}
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div
                className="oa-admin-field"
                style={{ gridColumn: '1 / -1' }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={useCustomAreas}
                    onChange={e => setUseCustomAreas(e.target.checked)}
                  />
                  Restrict access areas (override role defaults)
                </label>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginTop: 8,
                    opacity: useCustomAreas ? 1 : 0.55,
                    pointerEvents: useCustomAreas ? 'auto' : 'none',
                  }}
                >
                  {areas.map(a => (
                    <label
                      key={a.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12.5,
                        border: '1px solid var(--oa-border)',
                        borderRadius: 999,
                        padding: '6px 12px',
                        background: selectedAreas.includes(a.id)
                          ? 'var(--oa-brand-10)'
                          : 'var(--oa-card)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAreas.includes(a.id)}
                        onChange={() =>
                          toggleArea(a.id, selectedAreas, setSelectedAreas)
                        }
                      />
                      {a.label}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <button
                  type="submit"
                  className="oa-admin-btn primary"
                  disabled={busy}
                  style={{ minHeight: 44 }}
                >
                  {busy ? 'Saving…' : 'Save access person'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Custom role */}
      {canManage ? (
        <div className="oa-admin-panel">
          <div className="oa-admin-panel-head">
            <h2>Custom role definition</h2>
            <button
              type="button"
              className="oa-admin-btn secondary"
              onClick={() => setShowCustomRole(v => !v)}
            >
              {showCustomRole ? 'Close' : 'New role'}
            </button>
          </div>
          {showCustomRole ? (
            <div className="oa-admin-panel-body">
              <form onSubmit={onCreateRole}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12,
                  }}
                >
                  <div className="oa-admin-field">
                    <label>Role id (snake_case)</label>
                    <input
                      className="oa-admin-input"
                      value={newRoleId}
                      onChange={e => setNewRoleId(e.target.value)}
                      placeholder="billing_ops"
                      required
                    />
                  </div>
                  <div className="oa-admin-field">
                    <label>Label</label>
                    <input
                      className="oa-admin-input"
                      value={newRoleLabel}
                      onChange={e => setNewRoleLabel(e.target.value)}
                      placeholder="Billing ops"
                      required
                    />
                  </div>
                </div>
                <div className="oa-admin-field">
                  <label>Description</label>
                  <input
                    className="oa-admin-input"
                    value={newRoleDesc}
                    onChange={e => setNewRoleDesc(e.target.value)}
                  />
                </div>
                <div className="oa-admin-field">
                  <label>Access areas</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {areas.map(a => (
                      <label
                        key={a.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12.5,
                          border: '1px solid var(--oa-border)',
                          borderRadius: 999,
                          padding: '6px 12px',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={newRoleAreas.includes(a.id)}
                          onChange={() =>
                            toggleArea(a.id, newRoleAreas, setNewRoleAreas)
                          }
                        />
                        {a.label}
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  className="oa-admin-btn primary"
                  disabled={busy || newRoleAreas.length === 0}
                >
                  Create role
                </button>
              </form>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Admin roster — zip layout */}
      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <h2>Admin roster</h2>
          <input
            className="oa-admin-input"
            style={{ maxWidth: 240 }}
            placeholder="Search staff…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <div className="oa-admin-panel-body" style={{ padding: 0 }}>
          <div className="oa-admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Role</th>
                  <th>Areas</th>
                  <th>MFA</th>
                  <th>Last login</th>
                  <th>Change role</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(person => (
                  <tr key={person.id}>
                    <td style={{ whiteSpace: 'normal' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 999,
                            background: person.admin_mfa_enabled
                              ? 'var(--oa-teal-soft)'
                              : 'var(--oa-gold-soft)',
                            color: person.admin_mfa_enabled
                              ? 'var(--oa-teal)'
                              : 'var(--oa-gold)',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            flex: 'none',
                          }}
                        >
                          {(person.full_name || person.email || '?')
                            .split(/\s+/)
                            .slice(0, 2)
                            .map(p => p[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div>
                          <strong>{person.full_name || '—'}</strong>
                          <div style={{ fontSize: 12, color: 'var(--oa-muted)' }}>
                            {person.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`oa-admin-tag ${statusTagClass('active')}`}
                      >
                        {person.admin_role_label || person.admin_role}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'normal', maxWidth: 220 }}>
                      <span style={{ fontSize: 12 }}>
                        {(person.admin_areas || []).includes('*')
                          ? 'All areas'
                          : (person.admin_areas || []).join(', ') || '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`oa-admin-tag ${
                          person.admin_mfa_enabled ? 'ok' : 'warn'
                        }`}
                      >
                        {person.admin_mfa_enabled ? 'Enrolled' : 'Missing'}
                      </span>
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(person.last_login)}
                    </td>
                    <td>
                      {canManage ? (
                        <select
                          className="oa-admin-select"
                          style={{ width: 'auto', minHeight: 36 }}
                          value={person.admin_role}
                          disabled={busy}
                          onChange={e =>
                            void onChangeStaffRole(person, e.target.value)
                          }
                        >
                          {roles.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.label}
                            </option>
                          ))}
                          <option value="suspended">Suspended</option>
                        </select>
                      ) : (
                        person.admin_role_label || person.admin_role
                      )}
                    </td>
                  </tr>
                ))}
                {!staff.length ? (
                  <tr>
                    <td colSpan={6} style={{ color: 'var(--oa-muted)' }}>
                      No admin access persons yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
