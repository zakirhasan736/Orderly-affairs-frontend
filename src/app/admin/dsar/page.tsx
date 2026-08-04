'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminTablePageSkeleton } from '@/components/admin/AdminSkeletons';
import {
  adminCreateDsar,
  adminListDsar,
  adminPatchDsar,
  type AdminDsar,
} from '@/libs/api/adminApi';

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

function fmtDeadline(row: AdminDsar) {
  if (!row.deadline_at) return '—';
  const d = fmtDate(row.deadline_at).replace(/\//g, '-');
  const left = row.days_left != null ? ` · ${row.days_left}d` : '';
  return `${new Date(row.deadline_at).toISOString().slice(0, 10)}${left}`;
}

function statusClass(s: string) {
  const v = s.toLowerCase();
  if (v === 'awaiting_id') return 'warn';
  if (v === 'in_progress') return 'flat';
  if (v === 'new') return 'outline';
  if (v === 'completed') return 'ok';
  return 'flat';
}

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function AdminDsarPage() {
  const [items, setItems] = useState<AdminDsar[]>([]);
  const [open, setOpen] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [type, setType] = useState<'export' | 'delete' | 'correct' | 'restrict'>(
    'export',
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminListDsar();
      setItems(data.items || []);
      setOpen(data.open ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load DSAR');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminCreateDsar({
        requester_email: email.trim(),
        request_type: type,
      });
      toast.success('DSAR request opened');
      setEmail('');
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (row: AdminDsar, status: string) => {
    setBusy(true);
    try {
      await adminPatchDsar(row.id, { status });
      toast.success('Status updated');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading && !items.length) {
    return <AdminTablePageSkeleton cols={6} rows={5} />;
  }

  return (
    <>
      {error && <div className="oa-admin-err">{error}</div>}

      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <h2>Open requests</h2>
          <span style={{ color: 'var(--oa-muted)', fontSize: 13 }}>
            CCPA/CPRA · respond within 45 days · {open} open
          </span>
          <button
            type="button"
            className="oa-admin-btn primary"
            onClick={() => setShowForm(v => !v)}
          >
            {showForm ? 'Cancel' : 'New request'}
          </button>
        </div>

        {showForm && (
          <div className="oa-admin-panel-body">
            <form
              onSubmit={e => void create(e)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 160px auto',
                gap: 10,
                alignItems: 'end',
              }}
            >
              <div className="oa-admin-field" style={{ margin: 0 }}>
                <label htmlFor="dsar-email">Requester email</label>
                <input
                  id="dsar-email"
                  className="oa-admin-input"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="oa-admin-field" style={{ margin: 0 }}>
                <label htmlFor="dsar-type">Type</label>
                <select
                  id="dsar-type"
                  className="oa-admin-select"
                  value={type}
                  onChange={e =>
                    setType(e.target.value as typeof type)
                  }
                >
                  <option value="export">Export</option>
                  <option value="delete">Delete</option>
                  <option value="correct">Correct</option>
                  <option value="restrict">Restrict</option>
                </select>
              </div>
              <button
                type="submit"
                className="oa-admin-btn primary"
                disabled={busy}
              >
                Open
              </button>
            </form>
          </div>
        )}

        <div className="oa-admin-panel-body" style={{ padding: 0 }}>
          <div className="oa-admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Requester</th>
                  <th>Type</th>
                  <th>Received</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map(row => {
                  const urgent =
                    row.days_left != null &&
                    row.days_left <= 14 &&
                    !['completed', 'rejected'].includes(row.status);
                  return (
                    <tr key={row.id}>
                      <td style={{ fontFamily: 'var(--oa-display)', fontWeight: 600 }}>
                        {row.case_id}
                      </td>
                      <td style={{ whiteSpace: 'normal' }}>
                        {row.requester_email}
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>
                        {row.request_type}
                      </td>
                      <td>{fmtDate(row.received_at)}</td>
                      <td>
                        <span
                          className={`oa-admin-tag ${urgent ? 'warn' : 'outline'}`}
                        >
                          {fmtDeadline(row)}
                        </span>
                      </td>
                      <td>
                        <span className={`oa-admin-tag ${statusClass(row.status)}`}>
                          {statusLabel(row.status)}
                        </span>
                      </td>
                      <td>
                        <select
                          className="oa-admin-select"
                          style={{ minWidth: 140 }}
                          disabled={busy}
                          value={row.status}
                          onChange={e => void setStatus(row, e.target.value)}
                        >
                          <option value="new">New</option>
                          <option value="awaiting_id">Awaiting ID</option>
                          <option value="in_progress">In progress</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {!items.length && (
                  <tr>
                    <td colSpan={7} style={{ color: 'var(--oa-muted)' }}>
                      No DSAR requests yet. Open one to start the 45-day clock.
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
