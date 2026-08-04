'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminBarChart } from '@/components/admin/AdminBarChart';
import { AdminOverviewSkeleton } from '@/components/admin/AdminSkeletons';
import {
  adminBillingReport,
  adminGetOverview,
  adminListDsar,
  adminListLegacy,
  type AdminOverview,
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

function monthLabel(ym: string) {
  try {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
      month: 'short',
    });
  } catch {
    return ym;
  }
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [revenue, setRevenue] = useState<
    Array<{ label: string; value: number }>
  >([]);
  const [legacyOpen, setLegacyOpen] = useState(0);
  const [dsarOpen, setDsarOpen] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const [ov, bill, legacy, dsar] = await Promise.all([
          adminGetOverview(),
          adminBillingReport().catch(() => null),
          adminListLegacy().catch(() => null),
          adminListDsar().catch(() => null),
        ]);
        setData(ov);
        setLegacyOpen(legacy?.open ?? 0);
        setDsarOpen(dsar?.open ?? 0);
        if (bill?.monthly?.length) {
          setRevenue(
            [...bill.monthly]
              .reverse()
              .slice(-6)
              .map(r => ({
                label: monthLabel(r.month),
                value: Number(r.net || r.mrr || 0),
              })),
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    })();
  }, []);

  if (error) {
    return <div className="oa-admin-err">{error}</div>;
  }

  if (!data) {
    return <AdminOverviewSkeleton />;
  }

  const locked = data.suspended || 0;
  const needsCount = locked + legacyOpen + dsarOpen + (data.pending || 0);
  const mrr = data.mrr ?? data.mrr_estimate;

  const cards = [
    {
      label: 'Total users',
      value: data.users.toLocaleString(),
      delta: `${data.active} active`,
      deltaClass: 'up',
    },
    {
      label: 'MRR',
      value: mrr != null ? `$${Number(mrr).toLocaleString()}` : '—',
      delta: 'From paid invoices',
      deltaClass: '',
    },
    {
      label: 'Trials running',
      value: data.trial,
      delta: `${data.complimentary} complimentary`,
      deltaClass: '',
    },
    {
      label: 'Needs you',
      value: needsCount,
      delta: `${legacyOpen} legacy · ${dsarOpen} DSAR · ${locked} locked`,
      deltaClass: 'attn',
      gold: true,
    },
  ];

  return (
    <>
      <div className="oa-admin-cards">
        {cards.map(c => (
          <div key={c.label} className="oa-admin-stat">
            <div className="label">{c.label}</div>
            <div className={`value${c.gold ? ' gold' : ''}`}>{c.value}</div>
            <div className={`delta ${c.deltaClass}`}>{c.delta}</div>
          </div>
        ))}
      </div>

      <div className="oa-admin-grid-2">
        <div className="oa-admin-panel">
          <div className="oa-admin-panel-head">
            <h2>Needs you</h2>
            <Link href="/admin/legacy" className="oa-admin-btn ghost">
              Open queue
            </Link>
          </div>
          <div className="oa-admin-panel-body" style={{ paddingTop: 4 }}>
            {legacyOpen > 0 && (
              <div className="oa-admin-needs-row">
                <span className="oa-admin-dot-gold" />
                <span style={{ flex: 1 }}>
                  <strong>{legacyOpen}</strong> legacy access request
                  {legacyOpen === 1 ? '' : 's'} awaiting approval
                </span>
                <span className="oa-admin-tag warn">Awaiting 2nd</span>
                <Link href="/admin/legacy" className="oa-admin-btn ghost">
                  Open
                </Link>
              </div>
            )}
            {dsarOpen > 0 && (
              <div className="oa-admin-needs-row">
                <span className="oa-admin-dot-gold" />
                <span style={{ flex: 1 }}>
                  <strong>{dsarOpen}</strong> open DSAR request
                  {dsarOpen === 1 ? '' : 's'} (45-day clock)
                </span>
                <span className="oa-admin-tag warn">In progress</span>
                <Link href="/admin/dsar" className="oa-admin-btn ghost">
                  Open
                </Link>
              </div>
            )}
            {locked > 0 && (
              <div className="oa-admin-needs-row">
                <span className="oa-admin-dot-gold" />
                <span style={{ flex: 1 }}>
                  <strong>{locked}</strong> suspended account
                  {locked === 1 ? '' : 's'} need review
                </span>
                <span className="oa-admin-tag warn">Locked</span>
                <Link
                  href="/admin/users?status=suspended"
                  className="oa-admin-btn ghost"
                >
                  Open
                </Link>
              </div>
            )}
            {(data.pending || 0) > 0 && (
              <div className="oa-admin-needs-row">
                <span className="oa-admin-dot-gold" />
                <span style={{ flex: 1 }}>
                  <strong>{data.pending}</strong> owner
                  {data.pending === 1 ? '' : 's'} still pending a plan
                </span>
                <span className="oa-admin-tag outline">In progress</span>
                <Link
                  href="/admin/users?status=pending"
                  className="oa-admin-btn ghost"
                >
                  Open
                </Link>
              </div>
            )}
            {needsCount === 0 && (
              <p style={{ color: 'var(--oa-muted)', margin: 0, fontSize: 13 }}>
                Nothing urgent right now.
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
          <div className="oa-admin-panel" style={{ marginBottom: 0 }}>
            <div className="oa-admin-panel-head" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <p className="oa-admin-chart-kicker">
                Net revenue — last 6 months
              </p>
            </div>
            <div className="oa-admin-panel-body">
              <AdminBarChart
                height={170}
                showValues={false}
                points={revenue.map(r => ({
                  label: r.label,
                  value: r.value,
                }))}
                emptyText="No Stripe invoice months yet."
              />
            </div>
          </div>

          <div className="oa-admin-panel" style={{ marginBottom: 0 }}>
            <div className="oa-admin-panel-head">
              <h2>Recent admin activity</h2>
              <Link href="/admin/audit" className="oa-admin-btn ghost">
                Full log
              </Link>
            </div>
            <div className="oa-admin-panel-body" style={{ paddingTop: 4 }}>
              {(data.recent_audit || []).slice(0, 6).map(r => (
                <div
                  key={r.id}
                  style={{
                    padding: '11px 0',
                    borderBottom: '1px solid var(--oa-divider)',
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: 'var(--oa-muted)' }}>
                    {fmt(r.created_at)}
                  </span>{' '}
                  · <strong>{r.admin_email}</strong> {r.action}
                  {r.target ? (
                    <span style={{ color: 'var(--oa-muted)' }}>
                      {' '}
                      → {r.target}
                    </span>
                  ) : null}
                </div>
              ))}
              {!data.recent_audit?.length && (
                <p style={{ color: 'var(--oa-muted)', margin: 0, fontSize: 13 }}>
                  No actions yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
