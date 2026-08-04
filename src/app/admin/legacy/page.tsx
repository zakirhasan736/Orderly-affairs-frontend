'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminTablePageSkeleton } from '@/components/admin/AdminSkeletons';
import {
  adminApproveLegacy,
  adminCreateLegacy,
  adminDenyLegacy,
  adminListLegacy,
  adminPatchLegacy,
  type AdminLegacy,
} from '@/libs/api/adminApi';

function statusClass(s: string) {
  const v = s.toLowerCase();
  if (v === 'granted') return 'ok';
  if (v === 'denied') return 'bad';
  return 'warn';
}

function statusLabel(row: AdminLegacy) {
  const s = row.status;
  if (s === 'awaiting_2nd') return 'Awaiting 2nd';
  if (s === 'under_review') return 'Under review';
  if (s === 'granted' && row.granted_at) {
    try {
      return `Granted ${new Date(row.granted_at).toLocaleDateString(undefined, {
        month: '2-digit',
        day: '2-digit',
      })}`;
    } catch {
      return 'Granted';
    }
  }
  return s.replace(/_/g, ' ');
}

export default function AdminLegacyPage() {
  const [items, setItems] = useState<AdminLegacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    deceased_email: '',
    deceased_name: '',
    requester_name: '',
    requester_email: '',
    relationship: 'Spouse',
    designated: true,
    death_cert: false,
    id_verified: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminListLegacy();
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
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
      await adminCreateLegacy(form);
      toast.success('Legacy request opened');
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  };

  const toggleDoc = async (row: AdminLegacy, field: 'death_cert' | 'id_verified') => {
    setBusy(true);
    try {
      await adminPatchLegacy(row.id, { [field]: !row[field] });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const approve = async (row: AdminLegacy) => {
    const note = window.prompt('Approval note (written to audit log)') || undefined;
    setBusy(true);
    try {
      await adminApproveLegacy(row.id, note);
      toast.success('Approval recorded');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Approve failed');
    } finally {
      setBusy(false);
    }
  };

  const deny = async (row: AdminLegacy) => {
    const note = window.prompt('Denial reason (audit log)') || undefined;
    if (!window.confirm(`Deny ${row.case_id}?`)) return;
    setBusy(true);
    try {
      await adminDenyLegacy(row.id, note);
      toast.success('Request denied');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Deny failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading && !items.length) {
    return <AdminTablePageSkeleton cols={7} rows={4} />;
  }

  return (
    <>
      <div
        className="oa-admin-notice"
        style={{
          background: 'var(--oa-gold-soft)',
          borderColor: 'rgba(185, 138, 62, 0.28)',
          color: 'var(--oa-ink)',
        }}
      >
        Legacy access hands a designated person entry to a deceased user’s vault:
        certified death certificate, ID match against the designated contacts, and
        two admin approvals.
      </div>

      {error && <div className="oa-admin-err">{error}</div>}

      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <h2>Legacy requests</h2>
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
              }}
            >
              {(
                [
                  ['deceased_email', 'Deceased email', 'email'],
                  ['deceased_name', 'Deceased name', 'text'],
                  ['requester_name', 'Requester name', 'text'],
                  ['requester_email', 'Requester email', 'email'],
                  ['relationship', 'Relationship', 'text'],
                ] as const
              ).map(([key, label, type]) => (
                <div key={key} className="oa-admin-field" style={{ margin: 0 }}>
                  <label>{label}</label>
                  <input
                    className="oa-admin-input"
                    type={type}
                    required={key !== 'deceased_name'}
                    value={form[key]}
                    onChange={e =>
                      setForm(f => ({ ...f, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.designated}
                  onChange={e =>
                    setForm(f => ({ ...f, designated: e.target.checked }))
                  }
                />
                Designated contact
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.death_cert}
                  onChange={e =>
                    setForm(f => ({ ...f, death_cert: e.target.checked }))
                  }
                />
                Death cert on file
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.id_verified}
                  onChange={e =>
                    setForm(f => ({ ...f, id_verified: e.target.checked }))
                  }
                />
                ID verified
              </label>
              <button type="submit" className="oa-admin-btn primary" disabled={busy}>
                Create
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
                  <th>Deceased</th>
                  <th>Requester</th>
                  <th>Relationship</th>
                  <th>Documents</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map(row => (
                  <tr key={row.id}>
                    <td
                      style={{
                        fontFamily: 'var(--oa-display)',
                        fontWeight: 600,
                      }}
                    >
                      {row.case_id}
                    </td>
                    <td>{row.deceased_name || row.deceased_email}</td>
                    <td>{row.requester_name}</td>
                    <td style={{ whiteSpace: 'normal' }}>
                      {row.relationship}
                      {row.designated ? ' · designated' : ' · not designated'}
                    </td>
                    <td style={{ whiteSpace: 'normal' }}>
                      <button
                        type="button"
                        className="oa-admin-btn ghost"
                        style={{ minHeight: 32, padding: '0 6px' }}
                        disabled={busy}
                        onClick={() => void toggleDoc(row, 'death_cert')}
                      >
                        {row.death_cert ? 'Death cert ✓' : 'Death cert pending'}
                      </button>
                      {' · '}
                      <button
                        type="button"
                        className="oa-admin-btn ghost"
                        style={{ minHeight: 32, padding: '0 6px' }}
                        disabled={busy}
                        onClick={() => void toggleDoc(row, 'id_verified')}
                      >
                        {row.id_verified ? 'ID ✓' : 'ID pending'}
                      </button>
                    </td>
                    <td>
                      <span className={`oa-admin-tag ${statusClass(row.status)}`}>
                        {statusLabel(row)}
                      </span>
                    </td>
                    <td>
                      {row.status !== 'granted' && row.status !== 'denied' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="oa-admin-btn ghost"
                            disabled={busy}
                            onClick={() => void approve(row)}
                          >
                            Review
                          </button>
                          <button
                            type="button"
                            className="oa-admin-btn secondary"
                            style={{ minHeight: 36 }}
                            disabled={busy}
                            onClick={() => void deny(row)}
                          >
                            Deny
                          </button>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td colSpan={7} style={{ color: 'var(--oa-muted)' }}>
                      No legacy access requests in the queue.
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
