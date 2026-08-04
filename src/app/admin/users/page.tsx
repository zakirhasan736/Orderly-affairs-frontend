'use client';

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { statusTagClass } from '@/components/admin/adminNav';
import {
  adminDeleteUser,
  adminForceLogoutUser,
  adminGrantComp,
  adminListUsers,
  adminPatchUser,
  type AdminUser,
} from '@/libs/api/adminApi';
import {
  AdminTablePageSkeleton,
  AdminTableSkeleton,
} from '@/components/admin/AdminSkeletons';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'trial', label: 'Trial' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Locked' },
] as const;

const COMP_PRESETS = [
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
  { label: '6mo', days: 180 },
  { label: '1yr', days: 365 },
  { label: 'Lifetime', days: null },
] as const;

function fmt(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

function displayStatus(u: AdminUser): string {
  if (u.suspended) return 'suspended';
  if (u.is_complimentary) return 'complimentary';
  return (u.billing_status || 'pending').toLowerCase();
}

function initials(u: AdminUser) {
  const n = (u.full_name || u.email || 'U').trim();
  const parts = n.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return n.slice(0, 2).toUpperCase();
}

function UserDetail({
  selected,
  busy,
  onClose,
  onRun,
  asSheet,
}: {
  selected: AdminUser;
  busy: boolean;
  onClose: () => void;
  onRun: (fn: () => Promise<unknown>, ok: string) => void;
  asSheet?: boolean;
}) {
  const [compDays, setCompDays] = useState<number | null>(30);
  const [compNote, setCompNote] = useState('');
  const st = displayStatus(selected);

  return (
    <div
      className={asSheet ? 'oa-admin-drawer-panel' : 'oa-admin-user-detail'}
      onClick={asSheet ? e => e.stopPropagation() : undefined}
      role={asSheet ? 'dialog' : undefined}
      aria-label={asSheet ? 'Manage user' : undefined}
    >
      {asSheet ? <div className="oa-admin-sheet-handle" /> : null}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div>
          <div className="oa-admin-avatar-lg">{initials(selected)}</div>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--oa-display)',
              color: 'var(--oa-ink)',
              fontSize: 26,
              lineHeight: 1.1,
            }}
          >
            {selected.full_name || selected.email}
          </h2>
          <p
            style={{
              margin: '6px 0 0',
              color: 'var(--oa-muted)',
              fontSize: 13,
            }}
          >
            {selected.email}
            <br />
            <span style={{ fontSize: 12 }}>
              owner (customer) · view details
            </span>
          </p>
        </div>
        <button
          type="button"
          className="oa-admin-btn ghost"
          onClick={onClose}
          disabled={busy}
        >
          Close
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '14px 0' }}>
        <span className={`oa-admin-tag ${statusTagClass(st)}`}>{st}</span>
        <span className="oa-admin-tag outline">MFA on</span>
        {selected.section_count != null ? (
          <span className="oa-admin-tag flat">
            {selected.section_count}/22 sections
          </span>
        ) : null}
      </div>

      <div
        style={{
          display: 'grid',
          gap: 10,
          fontSize: 13.5,
          marginBottom: 18,
          paddingBottom: 16,
          borderBottom: '1px solid var(--oa-divider)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--oa-muted)' }}>Plan</span>
          <strong>{selected.plan || '—'}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--oa-muted)' }}>Renews / trial</span>
          <strong>{fmt(selected.trial_end)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--oa-muted)' }}>Last active</span>
          <strong>{fmt(selected.last_login)}</strong>
        </div>
      </div>

      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--oa-muted)',
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Grant free trial
      </div>
      <div className="oa-admin-comp-grid">
        {COMP_PRESETS.map(p => (
          <button
            key={p.label}
            type="button"
            className={compDays === p.days ? 'active' : undefined}
            onClick={() => setCompDays(p.days)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="oa-admin-field">
        <label htmlFor="comp-note">Reason (audit log)</label>
        <textarea
          id="comp-note"
          className="oa-admin-textarea"
          value={compNote}
          onChange={e => setCompNote(e.target.value)}
          placeholder="Required for audit trail"
        />
      </div>
      <button
        type="button"
        className="oa-admin-btn primary"
        style={{ width: '100%', marginBottom: 10 }}
        disabled={busy}
        onClick={() =>
          onRun(
            () =>
              adminGrantComp(selected.id, {
                kind: compDays == null ? 'lifetime' : 'duration',
                duration_days: compDays ?? undefined,
                note: compNote || undefined,
                send_email: true,
              }),
            'Complimentary access granted',
          )
        }
      >
        Grant access
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          type="button"
          className="oa-admin-btn secondary"
          disabled={busy}
          onClick={() => {
            const reason = window.prompt(
              `Force logout ${selected.email}? Enter an audit reason (required).`,
            );
            if (!reason?.trim()) {
              toast.error('Reason is required');
              return;
            }
            onRun(
              () => adminForceLogoutUser(selected.id, reason.trim()),
              'All sessions signed out',
            );
          }}
        >
          Send password reset / force logout
        </button>
        <button
          type="button"
          className="oa-admin-btn secondary"
          disabled={busy}
          onClick={() =>
            onRun(
              () =>
                adminPatchUser(selected.id, {
                  suspend: !selected.suspended,
                }),
              selected.suspended
                ? 'Account unsuspended'
                : 'Account suspended',
            )
          }
        >
          {selected.suspended ? 'Unsuspend account' : 'Suspend account'}
        </button>
        <button
          type="button"
          className="oa-admin-btn ink"
          disabled={busy}
          onClick={() => {
            const reason = window.prompt(
              `Delete ${selected.email}? Enter an audit reason (required).`,
            );
            if (!reason?.trim()) {
              toast.error('Reason is required to delete an account');
              return;
            }
            onRun(
              () => adminDeleteUser(selected.id, reason.trim()),
              'User deleted',
            );
          }}
        >
          Delete account
        </button>
      </div>
      <p
        style={{
          fontSize: 12,
          color: 'var(--oa-muted)',
          margin: '16px 0 0',
          lineHeight: 1.45,
        }}
      >
        Every action asks for a reason and is written to the audit log.
      </p>
    </div>
  );
}

function AdminUsersInner() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get('status') || '').toLowerCase();

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState(
    STATUS_FILTERS.some(f => f.value === initialStatus) ? initialStatus : '',
  );
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminListUsers({
        q: q.trim() || undefined,
        status: status || undefined,
        page,
        page_size: 25,
      });
      setUsers(data.users || []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [q, status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const s = (searchParams.get('status') || '').toLowerCase();
    if (STATUS_FILTERS.some(f => f.value === s)) {
      setStatus(s);
      setPage(1);
    }
    const qq = searchParams.get('q');
    if (qq != null) setQ(qq);
  }, [searchParams]);

  // Keep selection in sync when list refreshes; do not auto-open first row
  // so the table stays full-width until the admin clicks a row.
  useEffect(() => {
    if (!selected) return;
    const next = users.find(u => u.id === selected.id) || null;
    setSelected(next);
  }, [users]); // eslint-disable-line react-hooks/exhaustive-deps

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / 25)), [total]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      setSelected(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        className={`oa-admin-users-layout${selected && !isMobile ? ' has-detail' : ''}`}
      >
        <div className="oa-admin-panel" style={{ marginBottom: 0 }}>
          <div className="oa-admin-panel-head">
            <h2>
              <span className="oa-display">{total}</span> accounts
            </h2>
          </div>
          <div className="oa-admin-panel-body">
            <div className="oa-admin-filters">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.label}
                  type="button"
                  className={status === f.value ? 'active' : undefined}
                  onClick={() => {
                    setStatus(f.value);
                    setPage(1);
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <input
              className="oa-admin-input"
              style={{ marginBottom: 14 }}
              placeholder="Search name or email…"
              value={q}
              onChange={e => {
                setQ(e.target.value);
                setPage(1);
              }}
            />

            {error && <div className="oa-admin-err">{error}</div>}

            {loading ? (
              <AdminTableSkeleton cols={4} rows={8} />
            ) : (
              <div className="oa-admin-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Term</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      const st = displayStatus(u);
                      const isSel = selected?.id === u.id;
                      return (
                        <tr
                          key={u.id}
                          className={isSel ? 'selected' : undefined}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelected(u)}
                        >
                          <td>
                            <div
                              style={{
                                display: 'flex',
                                gap: 10,
                                alignItems: 'center',
                              }}
                            >
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 999,
                                  background: 'var(--oa-teal-soft)',
                                  color: 'var(--oa-teal)',
                                  display: 'grid',
                                  placeItems: 'center',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  flex: 'none',
                                }}
                              >
                                {initials(u)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600 }}>
                                  {u.full_name || '—'}
                                </div>
                                <div
                                  style={{
                                    color: 'var(--oa-muted)',
                                    fontSize: 12,
                                    whiteSpace: 'normal',
                                  }}
                                >
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{u.plan || '—'}</td>
                          <td>
                            <span
                              className={`oa-admin-tag ${statusTagClass(st)}`}
                            >
                              {st}
                            </span>
                          </td>
                          <td>{fmt(u.trial_end)}</td>
                        </tr>
                      );
                    })}
                    {!users.length && (
                      <tr>
                        <td colSpan={4} style={{ color: 'var(--oa-muted)' }}>
                          No owners match this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {pageCount > 1 && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 14,
                  alignItems: 'center',
                }}
              >
                <button
                  type="button"
                  className="oa-admin-btn secondary"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span style={{ color: 'var(--oa-muted)', fontSize: 13 }}>
                  Page {page} of {pageCount}
                </span>
                <button
                  type="button"
                  className="oa-admin-btn secondary"
                  disabled={page >= pageCount}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {selected && !isMobile ? (
          <UserDetail
            selected={selected}
            busy={busy}
            onClose={() => setSelected(null)}
            onRun={(fn, ok) => void run(fn, ok)}
          />
        ) : null}
      </div>

      {selected && isMobile ? (
        <div
          className="oa-admin-drawer"
          onClick={() => !busy && setSelected(null)}
          role="presentation"
        >
          <UserDetail
            selected={selected}
            busy={busy}
            onClose={() => setSelected(null)}
            onRun={(fn, ok) => void run(fn, ok)}
            asSheet
          />
        </div>
      ) : null}
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<AdminTablePageSkeleton cols={4} rows={8} />}>
      <AdminUsersInner />
    </Suspense>
  );
}
