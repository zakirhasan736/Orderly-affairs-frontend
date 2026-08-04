'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AdminTablePageSkeleton,
  AdminTableSkeleton,
} from '@/components/admin/AdminSkeletons';
import {
  adminForceLogoutUser,
  adminListUsers,
  type AdminUser,
} from '@/libs/api/adminApi';

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

function daysAgo(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / (1000 * 60 * 60 * 24);
}

function riskFor(u: AdminUser): { label: string; cls: string } {
  if (u.suspended) return { label: 'High', cls: 'warn' };
  const d = daysAgo(u.last_login);
  if (d != null && d <= 0.5) return { label: 'Medium', cls: 'warn' };
  if (d != null && d <= 7) return { label: 'Low', cls: 'flat' };
  return { label: 'Low', cls: 'flat' };
}

export default function AdminActivityPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminListUsers({ page: 1, page_size: 100 });
      setUsers(data.users || []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const liveSessions = useMemo(
    () =>
      users.filter(u => {
        const d = daysAgo(u.last_login);
        return d != null && d <= 1;
      }).length,
    [users],
  );

  const flagged = useMemo(
    () => users.filter(u => u.suspended).length,
    [users],
  );

  const forceLogout = async (u: AdminUser) => {
    setBusyId(u.id);
    try {
      await adminForceLogoutUser(u.id);
      toast.success(`Signed out ${u.email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Force logout failed');
    } finally {
      setBusyId(null);
    }
  };

  const sorted = useMemo(
    () =>
      [...users].sort((a, b) => {
        const ta = a.last_login ? new Date(a.last_login).getTime() : 0;
        const tb = b.last_login ? new Date(b.last_login).getTime() : 0;
        return tb - ta;
      }),
    [users],
  );

  if (loading && !users.length) {
    return <AdminTablePageSkeleton cards={4} cols={5} />;
  }

  return (
    <>
      <div className="oa-admin-cards">
        <div className="oa-admin-stat">
          <div className="label">Live sessions</div>
          <div className="value">{liveSessions}</div>
          <div className={`delta${flagged ? ' attn' : ''}`}>
            {flagged} flagged high risk
          </div>
        </div>
        <div className="oa-admin-stat">
          <div className="label">Actions today</div>
          <div className="value">{total}</div>
          <div className="delta up">Directory sample</div>
        </div>
        <div className="oa-admin-stat">
          <div className="label">Failed logins 24h</div>
          <div className="value">—</div>
          <div className="delta">Wire auth metrics next</div>
        </div>
        <div className="oa-admin-stat">
          <div className="label">Blocked at WAF</div>
          <div className="value">—</div>
          <div className="delta">Edge telemetry pending</div>
        </div>
      </div>

      <div className="oa-admin-notice">
        Device and IP streams are not ingested yet. Last login is the activity
        proxy; risk is inferred from suspension and recency.
      </div>

      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <h2>Active owners</h2>
          <button
            type="button"
            className="oa-admin-btn ghost"
            onClick={() => void load()}
          >
            Refresh
          </button>
        </div>
        <div className="oa-admin-panel-body" style={{ padding: 0 }}>
          {error && (
            <div className="oa-admin-err" style={{ margin: 16 }}>
              {error}
            </div>
          )}
          {loading ? (
            <AdminTableSkeleton cols={5} />
          ) : (
            <div className="oa-admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Device</th>
                    <th>IP / location</th>
                    <th>Last action</th>
                    <th>Risk</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(u => {
                    const risk = riskFor(u);
                    return (
                      <tr key={u.id}>
                        <td>
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
                        </td>
                        <td style={{ color: 'var(--oa-muted)' }}>—</td>
                        <td style={{ color: 'var(--oa-muted)' }}>—</td>
                        <td>{fmt(u.last_login)}</td>
                        <td>
                          <span className={`oa-admin-tag ${risk.cls}`}>
                            {risk.label}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="oa-admin-btn ghost"
                            disabled={busyId === u.id}
                            onClick={() => void forceLogout(u)}
                          >
                            Sign out
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!sorted.length && (
                    <tr>
                      <td colSpan={6} style={{ color: 'var(--oa-muted)' }}>
                        No owners found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
