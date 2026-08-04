'use client';

import React, { useEffect, useState } from 'react';
import { AdminBarChart } from '@/components/admin/AdminBarChart';
import { AdminOverviewSkeleton } from '@/components/admin/AdminSkeletons';
import { adminGetAnalytics } from '@/libs/api/adminApi';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof adminGetAnalytics>
  > | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void adminGetAnalytics()
      .then(setData)
      .catch(err =>
        setError(err instanceof Error ? err.message : 'Failed to load'),
      );
  }, []);

  if (error) return <div className="oa-admin-err">{error}</div>;
  if (!data) return <AdminOverviewSkeleton />;

  const signups = data.monthly_signups || [];
  const plans = data.plans || [];
  const sections = data.section_completion || [];
  const maxPlan = Math.max(1, ...plans.map(p => p.count));

  return (
    <>
      <div className="oa-admin-grid-2">
        <div className="oa-admin-panel">
          <div className="oa-admin-panel-head">
            <h2>Monthly signups</h2>
          </div>
          <div className="oa-admin-panel-body">
            <AdminBarChart
              height={220}
              valuePosition="below"
              points={signups.map(s => ({
                label: s.label,
                value: s.count,
                display: s.count,
              }))}
              emptyText="No signups in the last 6 months yet."
            />
          </div>
        </div>

        <div className="oa-admin-panel">
          <div className="oa-admin-panel-head">
            <h2>Active vaults by plan</h2>
          </div>
          <div className="oa-admin-panel-body">
            {plans.map(b => (
              <div key={b.plan} className="oa-admin-h-bar">
                <span style={{ color: 'var(--oa-muted)' }}>{b.plan}</span>
                <div className="track">
                  <div
                    className="fill"
                    style={{
                      width: `${Math.round((b.count / maxPlan) * 100)}%`,
                    }}
                  />
                </div>
                <span className="n">{b.count}</span>
              </div>
            ))}
            {!plans.length && (
              <p style={{ color: 'var(--oa-muted)', margin: 0, fontSize: 13 }}>
                No plan metadata yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <h2>Vault section completion</h2>
        </div>
        <div className="oa-admin-panel-body">
          <p
            style={{
              margin: '0 0 18px',
              color: 'var(--oa-muted)',
              fontSize: 13,
            }}
          >
            Share of users who marked the section done — counts only, never
            contents.
          </p>
          {sections.map(s => (
            <div key={s.section_id} className="oa-admin-h-bar">
              <span style={{ color: 'var(--oa-muted)' }}>{s.label}</span>
              <div className="track">
                <div
                  className={`fill${s.attention || s.pct < 30 ? ' gold' : ''}`}
                  style={{ width: `${Math.max(s.pct, 2)}%` }}
                />
              </div>
              <span className="n">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
