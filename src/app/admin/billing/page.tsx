'use client';

import React, { useEffect, useState } from 'react';
import { AdminTablePageSkeleton } from '@/components/admin/AdminSkeletons';
import { adminBillingReport } from '@/libs/api/adminApi';

function money(n?: number | null) {
  if (n == null || Number.isNaN(n)) return '—';
  return `$${Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return iso;
  }
}

function monthLabel(ym: string) {
  try {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return ym;
  }
}

function statusClass(s: string) {
  const v = s.toLowerCase();
  if (v === 'paid') return 'ok';
  if (v === 'failed') return 'warn';
  if (v === 'disputed') return 'warn';
  return 'flat';
}

function downloadCsv(
  monthly: Array<Record<string, unknown>>,
  txs: Array<Record<string, unknown>>,
) {
  const lines = [
    'MONTHLY REPORT',
    'month,txns,gross,refunds,net,mrr,delta_pct',
    ...monthly.map(r =>
      [r.month, r.txns, r.gross, r.refunds, r.net, r.mrr, r.delta_pct ?? '']
        .join(','),
    ),
    '',
    'TRANSACTIONS',
    'date,customer,invoice,method,amount,status',
    ...txs.map(t =>
      [t.date, t.customer, t.invoice, t.method, t.amount, t.status]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'orderly-billing-report.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminBillingPage() {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof adminBillingReport>
  > | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setData(await adminBillingReport());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load billing');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <AdminTablePageSkeleton cards={4} cols={6} rows={5} />;
  if (error) return <div className="oa-admin-err">{error}</div>;
  if (!data) return null;

  return (
    <>
      <div className="oa-admin-cards">
        <div className="oa-admin-stat">
          <div className="label">MRR</div>
          <div className="value">{money(data.mrr)}</div>
        </div>
        <div className="oa-admin-stat">
          <div className="label">Net month</div>
          <div className="value">{money(data.net_month)}</div>
        </div>
        <div className="oa-admin-stat">
          <div className="label">Failed</div>
          <div className="value">{data.failed}</div>
        </div>
        <div className="oa-admin-stat">
          <div className="label">Disputes</div>
          <div className={`value${data.disputes ? ' gold' : ''}`}>
            {data.disputes}
          </div>
        </div>
      </div>

      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <h2>Monthly transaction report</h2>
          <button
            type="button"
            className="oa-admin-btn ghost"
            onClick={() =>
              downloadCsv(
                data.monthly as unknown as Array<Record<string, unknown>>,
                data.transactions as unknown as Array<Record<string, unknown>>,
              )
            }
          >
            Download CSV
          </button>
        </div>
        <div className="oa-admin-panel-body" style={{ padding: 0 }}>
          <div className="oa-admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Txns</th>
                  <th>Gross</th>
                  <th>Refunds</th>
                  <th>Net</th>
                  <th>MRR</th>
                  <th>Δ</th>
                </tr>
              </thead>
              <tbody>
                {data.monthly.map(row => (
                  <tr key={row.month}>
                    <td>{monthLabel(row.month)}</td>
                    <td>{row.txns}</td>
                    <td>{money(row.gross)}</td>
                    <td>{money(row.refunds)}</td>
                    <td>{money(row.net)}</td>
                    <td>{money(row.mrr)}</td>
                    <td
                      style={{
                        color:
                          row.delta_pct == null
                            ? 'var(--oa-muted)'
                            : row.delta_pct >= 0
                              ? 'var(--oa-teal)'
                              : 'var(--oa-gold)',
                        fontWeight: 600,
                      }}
                    >
                      {row.delta_pct == null
                        ? '—'
                        : `${row.delta_pct > 0 ? '+' : ''}${row.delta_pct}%`}
                    </td>
                  </tr>
                ))}
                {!data.monthly.length && (
                  <tr>
                    <td colSpan={7} style={{ color: 'var(--oa-muted)' }}>
                      No Stripe invoice data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <h2>Transactions</h2>
        </div>
        <div className="oa-admin-panel-body" style={{ padding: 0 }}>
          <div className="oa-admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Invoice</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((t, i) => (
                  <tr key={`${t.invoice}-${i}`}>
                    <td>{fmtDate(t.date)}</td>
                    <td style={{ whiteSpace: 'normal' }}>{t.customer}</td>
                    <td>{t.invoice}</td>
                    <td>{t.method}</td>
                    <td>{money(t.amount)}</td>
                    <td>
                      <span className={`oa-admin-tag ${statusClass(t.status)}`}>
                        {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
                {!data.transactions.length && (
                  <tr>
                    <td colSpan={6} style={{ color: 'var(--oa-muted)' }}>
                      No transactions returned from Stripe.
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
