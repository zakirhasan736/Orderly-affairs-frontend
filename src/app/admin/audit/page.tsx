'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AdminTablePageSkeleton,
  AdminTableSkeleton,
} from '@/components/admin/AdminSkeletons';
import { adminAuditLog } from '@/libs/api/adminApi';

type AuditRow = {
  id: string;
  admin_email?: string;
  action?: string;
  target?: string;
  created_at?: string;
  meta?: Record<string, unknown>;
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'support', label: 'Support' },
  { id: 'billing', label: 'Billing' },
  { id: 'coupon', label: 'Coupon' },
  { id: 'legacy', label: 'Legacy' },
] as const;

function fmt(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return String(iso);
  }
}

function categoryOf(action?: string) {
  const a = (action || '').toLowerCase();
  if (a.startsWith('coupon') || a.includes('coupon')) return 'Coupon';
  if (a.startsWith('legacy')) return 'Legacy';
  if (a.startsWith('billing') || a.includes('comp') || a.includes('refund'))
    return 'Billing';
  if (a.startsWith('support') || a.includes('support')) return 'Support';
  if (a.startsWith('auth') || a.includes('login') || a.includes('mfa'))
    return 'Auth';
  if (a.startsWith('dsar')) return 'DSAR';
  if (a.includes('view')) return 'View';
  const head = a.split('.')[0];
  return head ? head.charAt(0).toUpperCase() + head.slice(1) : 'System';
}

function actionLabel(action?: string) {
  if (!action) return '—';
  return action.replace(/[._]/g, ' ');
}

function matchesFilter(row: AuditRow, filter: string) {
  if (filter === 'all') return true;
  const cat = categoryOf(row.action).toLowerCase();
  const act = (row.action || '').toLowerCase();
  if (filter === 'coupon') return cat === 'coupon' || act.includes('coupon');
  if (filter === 'legacy') return cat === 'legacy' || act.includes('legacy');
  if (filter === 'billing')
    return cat === 'billing' || act.includes('billing') || act.includes('comp');
  if (filter === 'support')
    return cat === 'support' || act.includes('support');
  return true;
}

export default function AdminAuditPage() {
  const [items, setItems] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pageSize = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminAuditLog(page, { page_size: pageSize });
      setItems(data.items || data.audit || []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => items.filter(r => matchesFilter(r, filter)),
    [items, filter],
  );

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  if (loading && !items.length) {
    return <AdminTablePageSkeleton cols={6} rows={8} />;
  }

  return (
    <div className="oa-admin-panel">
      <div className="oa-admin-panel-head">
        <h2>Audit log</h2>
        <div className="oa-admin-filters" style={{ margin: 0 }}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              className={filter === f.id ? 'active' : undefined}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="oa-admin-panel-body" style={{ padding: 0 }}>
        {error && (
          <div className="oa-admin-err" style={{ margin: 16 }}>
            {error}
          </div>
        )}
        {loading ? (
          <AdminTableSkeleton cols={6} rows={8} />
        ) : (
          <div className="oa-admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp (UTC)</th>
                  <th>Admin</th>
                  <th>Category</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(row => {
                  const ip =
                    (row.meta?.ip as string) ||
                    (row.meta?.client_ip as string) ||
                    '—';
                  return (
                    <tr key={row.id}>
                      <td>{fmt(row.created_at)}</td>
                      <td style={{ fontWeight: 600 }}>
                        {(row.admin_email || 'system').split('@')[0]}
                      </td>
                      <td>
                        <span className="oa-admin-tag outline">
                          {categoryOf(row.action)}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'normal' }}>
                        {actionLabel(row.action)}
                      </td>
                      <td style={{ whiteSpace: 'normal' }}>
                        {row.target || '—'}
                      </td>
                      <td>{ip}</td>
                    </tr>
                  );
                })}
                {!visible.length && (
                  <tr>
                    <td colSpan={6} style={{ color: 'var(--oa-muted)' }}>
                      No audit events for this filter.
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
              padding: 16,
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
  );
}
