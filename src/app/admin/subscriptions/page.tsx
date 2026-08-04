'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { statusTagClass } from '@/components/admin/adminNav';
import { AdminTablePageSkeleton } from '@/components/admin/AdminSkeletons';
import {
  adminBillingOverview,
  adminBillingUsers,
  adminGetOverview,
} from '@/libs/api/adminApi';

type BillingUser = {
  email: string;
  status?: string;
  plan?: string;
  trial_end?: string;
  is_complimentary?: boolean;
  subscription_id?: string;
  comp_kind?: string | null;
};

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

export default function AdminSubscriptionsPage() {
  const [stats, setStats] = useState<
    Array<{ _id: string | null; count: number }>
  >([]);
  const [users, setUsers] = useState<BillingUser[]>([]);
  const [overview, setOverview] = useState<{
    trial: number;
    complimentary: number;
  } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [ov, bill, list] = await Promise.all([
          adminBillingOverview(),
          adminGetOverview(),
          adminBillingUsers(),
        ]);
        setStats(ov.stats || []);
        setOverview({ trial: bill.trial, complimentary: bill.complimentary });
        setUsers(Array.isArray(list) ? list : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const countByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of stats) {
      map[(s._id || 'unknown').toLowerCase()] = s.count;
    }
    return map;
  }, [stats]);

  const lifetimeComp = useMemo(
    () =>
      users.filter(u => u.is_complimentary && u.comp_kind === 'lifetime')
        .length,
    [users],
  );

  if (error) return <div className="oa-admin-err">{error}</div>;
  if (loading) {
    return <AdminTablePageSkeleton cards={4} cols={6} rows={6} />;
  }

  const programmeCards = [
    {
      title: '7 / 14 / 30 days',
      value: overview?.trial ?? 0,
      note: 'Trials running',
      gold: false,
    },
    {
      title: '3 & 6 months',
      value: countByStatus.active || 0,
      note: 'Partner pilots',
      gold: false,
    },
    {
      title: '1 year',
      value: countByStatus.past_due || 0,
      note: 'Enterprise evals / past due',
      gold: false,
    },
    {
      title: 'Lifetime',
      value: lifetimeComp,
      note: 'Owner approval',
      gold: true,
    },
  ];

  return (
    <>
      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <h2>Customer subscriptions</h2>
          <Link href="/admin/users" className="oa-admin-btn ghost">
            Manage owners
          </Link>
        </div>
        <div className="oa-admin-panel-body" style={{ padding: 0 }}>
          <div className="oa-admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Renews</th>
                  <th>Controls</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.email}>
                    <td style={{ whiteSpace: 'normal', fontWeight: 600 }}>
                      {u.email}
                    </td>
                    <td>
                      {u.plan || '—'}
                      {u.is_complimentary ? ' · coupon' : ''}
                    </td>
                    <td>
                      <span
                        className={`oa-admin-tag ${statusTagClass(u.status)}`}
                      >
                        {u.status || '—'}
                      </span>
                    </td>
                    <td>
                      {u.is_complimentary && u.comp_kind === 'lifetime'
                        ? 'never expires'
                        : fmt(u.trial_end)}
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 6,
                        }}
                      >
                        <Link
                          href={`/admin/users?q=${encodeURIComponent(u.email)}`}
                          className="oa-admin-btn secondary"
                          style={{ minHeight: 36, padding: '0 12px' }}
                        >
                          Extend
                        </Link>
                        <Link
                          href={`/admin/users?q=${encodeURIComponent(u.email)}`}
                          className="oa-admin-btn secondary"
                          style={{ minHeight: 36, padding: '0 12px' }}
                        >
                          Pause
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {!users.length && (
                  <tr>
                    <td colSpan={5} style={{ color: 'var(--oa-muted)' }}>
                      No billing rows yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="oa-admin-cards">
        {programmeCards.map(c => (
          <div
            key={c.title}
            className={`oa-admin-stat${c.gold ? ' gold-card' : ''}`}
          >
            <div className="label">{c.title}</div>
            <div className="value">{c.value}</div>
            <div className="delta">
              {c.gold ? (
                <>
                  <span className="oa-admin-tag warn">Owner approval</span>
                </>
              ) : (
                <>
                  <span className="oa-admin-tag outline">Running</span>{' '}
                  <span style={{ marginLeft: 6 }}>{c.note}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
