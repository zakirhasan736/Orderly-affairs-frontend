'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeletons';
import {
  adminGenerateCoupons,
  adminListCoupons,
  adminRevokeCoupon,
  type AdminCoupon,
} from '@/libs/api/adminApi';

const DURATION_OPTIONS = [
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
  { label: '3 months', days: 90 },
  { label: '6 months', days: 182 },
  { label: '1 year', days: 365 },
] as const;

function grantsLabel(c: AdminCoupon) {
  if (c.kind === 'lifetime') return 'Lifetime access';
  if (c.duration_days) {
    if (c.duration_days >= 365) return '1-year trial';
    if (c.duration_days >= 180) return '6-month trial';
    if (c.duration_days >= 90) return '3-month trial';
    return `${c.duration_days}-day trial`;
  }
  return c.plan_label || 'Portal access';
}

function statusClass(s?: string) {
  const v = (s || '').toLowerCase();
  if (v === 'unused') return 'outline';
  if (v === 'redeemed') return 'ok';
  return 'flat';
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kind, setKind] = useState<'duration' | 'lifetime'>('duration');
  const [days, setDays] = useState(30);
  const [quantity, setQuantity] = useState(5);
  const [expiresAt, setExpiresAt] = useState('2026-12-31');
  const [campaign, setCampaign] = useState('');
  const [planLabel, setPlanLabel] = useState('Portal — full access');
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await adminListCoupons();
      setCoupons(list.coupons || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    if (kind === 'lifetime') {
      return `Selected: Lifetime × ${quantity} codes · ${planLabel}. Lifetime codes never expire and are capped at 25 a year.`;
    }
    const label =
      DURATION_OPTIONS.find(d => d.days === days)?.label || `${days}-day`;
    return `Selected: ${label} trial × ${quantity} codes · ${planLabel}. Redemption converts the account to a trial with that end date.`;
  }, [kind, days, quantity, planLabel]);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await adminGenerateCoupons({
        kind,
        duration_days: kind === 'duration' ? days : undefined,
        quantity: Math.max(1, Math.min(100, quantity)),
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        note: campaign || undefined,
        plan_label: planLabel || undefined,
      });
      const codes = (res.coupons || []).map(c => c.code).filter(Boolean);
      toast.success(`Generated ${codes.length} code${codes.length === 1 ? '' : 's'}`);
      if (codes.length) {
        void navigator.clipboard.writeText(codes.join('\n'));
        toast.message('Codes copied to clipboard');
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generate failed');
    } finally {
      setGenerating(false);
    }
  };

  const revoke = async (code: string) => {
    if (!window.confirm(`Revoke unused code ${code}?`)) return;
    try {
      await adminRevokeCoupon(code);
      toast.success('Code revoked');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Revoke failed');
    }
  };

  const copy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success('Copied');
  };

  return (
    <>
      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <h2>Issue one-time-use codes</h2>
          <span style={{ color: 'var(--oa-muted)', fontSize: 13 }}>
            Each code redeems once, then burns
          </span>
        </div>
        <div className="oa-admin-panel-body">
          <form onSubmit={e => void generate(e)}>
            <div className="oa-admin-filters">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.days}
                  type="button"
                  className={
                    kind === 'duration' && days === opt.days ? 'active' : undefined
                  }
                  onClick={() => {
                    setKind('duration');
                    setDays(opt.days);
                  }}
                >
                  {opt.label}
                </button>
              ))}
              <button
                type="button"
                className={kind === 'lifetime' ? 'active' : undefined}
                style={
                  kind === 'lifetime'
                    ? undefined
                    : {
                        borderColor: 'rgba(185, 138, 62, 0.45)',
                        color: 'var(--oa-gold)',
                      }
                }
                onClick={() => setKind('lifetime')}
              >
                Lifetime
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                marginTop: 8,
                alignItems: 'end',
              }}
            >
              <div className="oa-admin-field" style={{ margin: 0 }}>
                <label htmlFor="qty">Quantity</label>
                <input
                  id="qty"
                  className="oa-admin-input"
                  type="number"
                  min={1}
                  max={100}
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value) || 1)}
                />
              </div>
              <div className="oa-admin-field" style={{ margin: 0 }}>
                <label htmlFor="grants">Grants</label>
                <select
                  id="grants"
                  className="oa-admin-select"
                  value={planLabel}
                  onChange={e => setPlanLabel(e.target.value)}
                >
                  <option>Portal — full access</option>
                  <option>Standard Kit</option>
                  <option>Fireproof Kit</option>
                </select>
              </div>
              <div className="oa-admin-field" style={{ margin: 0 }}>
                <label htmlFor="exp">Codes expire</label>
                <input
                  id="exp"
                  className="oa-admin-input"
                  type="date"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                />
              </div>
              <div className="oa-admin-field" style={{ margin: 0 }}>
                <label htmlFor="camp">Campaign</label>
                <input
                  id="camp"
                  className="oa-admin-input"
                  placeholder="Estate-planner webinar"
                  value={campaign}
                  onChange={e => setCampaign(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="oa-admin-btn primary"
                disabled={generating}
              >
                {generating
                  ? 'Generating…'
                  : `Generate ${quantity} code${quantity === 1 ? '' : 's'}`}
              </button>
            </div>

            <div
              className="oa-admin-notice"
              style={{
                marginTop: 16,
                marginBottom: 0,
                background: 'var(--oa-teal-soft)',
                borderColor: 'rgba(46, 125, 110, 0.25)',
              }}
            >
              {summary}
            </div>
          </form>
        </div>
      </div>

      {error && <div className="oa-admin-err">{error}</div>}

      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <h2>Codes</h2>
          <button type="button" className="oa-admin-btn ghost" onClick={() => void load()}>
            Refresh
          </button>
        </div>
        <div className="oa-admin-panel-body" style={{ padding: 0 }}>
          {loading ? (
            <AdminTableSkeleton cols={6} />
          ) : (
            <div className="oa-admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Grants</th>
                    <th>Campaign</th>
                    <th>Status</th>
                    <th>Redeemed by</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.code}>
                      <td style={{ fontWeight: 700 }}>{c.code}</td>
                      <td>{grantsLabel(c)}</td>
                      <td style={{ whiteSpace: 'normal' }}>{c.note || '—'}</td>
                      <td>
                        <span className={`oa-admin-tag ${statusClass(c.status)}`}>
                          {(c.status || '—').charAt(0).toUpperCase() +
                            (c.status || '').slice(1)}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'normal' }}>
                        {c.redeemed_by || '—'}
                      </td>
                      <td>
                        {c.status === 'unused' ? (
                          <button
                            type="button"
                            className="oa-admin-btn ghost"
                            onClick={() => void revoke(c.code)}
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="oa-admin-btn ghost"
                            onClick={() => void copy(c.code)}
                          >
                            Copy
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!coupons.length && (
                    <tr>
                      <td colSpan={6} style={{ color: 'var(--oa-muted)' }}>
                        No codes yet.
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
