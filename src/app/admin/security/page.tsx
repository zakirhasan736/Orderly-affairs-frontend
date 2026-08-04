'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AdminTablePageSkeleton } from '@/components/admin/AdminSkeletons';
import { useAdminAuth } from '@/components/admin/AdminAuthProvider';
import {
  adminRunWeeklySecurityMonitor,
  adminSecurityOverview,
} from '@/libs/api/adminApi';

function fmt(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return String(iso);
  }
}

function severityClass(s: string) {
  const v = s.toLowerCase();
  if (v === 'high') return 'warn';
  if (v === 'medium') return 'warn';
  return 'flat';
}

export default function AdminSecurityPage() {
  const { session } = useAdminAuth();
  const isSuper =
    session?.admin_role === 'super_admin' ||
    session?.admin_role === 'system_owner' ||
    session?.admin_areas?.includes('*');

  const [data, setData] = useState<Awaited<
    ReturnType<typeof adminSecurityOverview>
  > | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await adminSecurityOverview());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runWeekly = async () => {
    if (!isSuper) {
      toast.error('Super Admin only');
      return;
    }
    setBusy(true);
    try {
      const result = await adminRunWeeklySecurityMonitor();
      toast.success(
        result.issue_count
          ? `Monitor finished with ${result.issue_count} issue(s)`
          : 'Weekly monitor OK — no encryption issues',
      );
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Monitor failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) return <AdminTablePageSkeleton cards={4} cols={3} />;
  if (error) return <div className="oa-admin-err">{error}</div>;
  if (!data) return null;

  return (
    <>
      <div className="oa-admin-cards">
        <div className="oa-admin-stat">
          <div className="label">Failed logins 24h</div>
          <div className="value">{data.failed_logins_24h}</div>
          <div className="delta">threshold {data.failed_threshold} / day</div>
        </div>
        <div className="oa-admin-stat">
          <div className="label">Locked accounts</div>
          <div className="value">{data.locked_accounts}</div>
          <div className="delta">
            <Link href="/admin/users?status=suspended" className="oa-admin-btn ghost">
              review in Users
            </Link>
          </div>
        </div>
        <div
          className={`oa-admin-stat${data.admins_without_mfa ? ' gold-card' : ''}`}
        >
          <div className="label">Admins without MFA</div>
          <div className={`value${data.admins_without_mfa ? ' gold' : ''}`}>
            {data.admins_without_mfa}
          </div>
          <div className={`delta${data.admins_without_mfa ? ' attn' : ''}`}>
            {data.admins_without_mfa ? 'policy violation' : 'all enrolled'}
          </div>
        </div>
        <div className="oa-admin-stat">
          <div className="label">High-severity alerts</div>
          <div className="value">{data.high_severity_7d}</div>
          <div className="delta">last 7 days</div>
        </div>
      </div>

      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <h2>Security pillars</h2>
          <span style={{ color: 'var(--oa-muted)', fontSize: 13 }}>
            Weekly monitoring · 8-layer section data · AES-256 at rest · HTTPS/TLS
            {data.weekly_monitor_enabled === false ? ' · weekly job off' : ''}
          </span>
          {isSuper && (
            <button
              type="button"
              className="oa-admin-btn primary"
              disabled={busy}
              onClick={() => void runWeekly()}
            >
              {busy ? 'Running…' : 'Run weekly monitor now'}
            </button>
          )}
        </div>
        <div className="oa-admin-panel-body" style={{ fontSize: 14, lineHeight: 1.55 }}>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <li>Weekly security monitoring and logging (audit + alerts)</li>
            <li>Eight-layer defense for personal kit / section data</li>
            <li>
              End-to-end encryption for vault sections (v3) — server cannot decrypt
            </li>
            <li>HTTPS everywhere · TLS in transit (prefer TLS 1.3 at edge)</li>
          </ol>
          <p style={{ marginBottom: 0, color: 'var(--oa-muted)' }}>
            Encrypted backups:{' '}
            <Link href="/admin/backups" className="oa-admin-btn ghost">
              Backups
            </Link>
          </p>
        </div>
      </div>

      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <h2>Security alerts</h2>
          <button
            type="button"
            className="oa-admin-btn ghost"
            onClick={() => void load()}
          >
            Refresh
          </button>
        </div>
        <div className="oa-admin-panel-body" style={{ padding: 0 }}>
          <div className="oa-admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Alert</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {data.alerts.map(a => (
                  <tr key={a.id}>
                    <td>{fmt(a.created_at)}</td>
                    <td style={{ whiteSpace: 'normal' }}>{a.alert}</td>
                    <td>
                      <span className={`oa-admin-tag ${severityClass(a.severity)}`}>
                        {a.severity.charAt(0).toUpperCase() + a.severity.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
                {!data.alerts.length && (
                  <tr>
                    <td colSpan={3} style={{ color: 'var(--oa-muted)' }}>
                      No alerts yet. Weekly monitor and admin actions appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
