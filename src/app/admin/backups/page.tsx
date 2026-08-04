'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminTablePageSkeleton } from '@/components/admin/AdminSkeletons';
import { useAdminAuth } from '@/components/admin/AdminAuthProvider';
import {
  adminListBackups,
  adminRestoreBackup,
  adminRunBackup,
  type AdminBackupItem,
  type AdminBackupsList,
} from '@/libs/api/adminApi';

function fmt(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
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

function fmtBytes(n: number) {
  if (!n || n < 1024) return `${n || 0} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminBackupsPage() {
  const { session } = useAdminAuth();
  const isSuper =
    session?.admin_role === 'super_admin' ||
    session?.admin_role === 'system_owner' ||
    session?.admin_areas?.includes('*');

  const [data, setData] = useState<AdminBackupsList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<AdminBackupItem | null>(
    null,
  );
  const [confirmText, setConfirmText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await adminListBackups());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load backups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runNow = async () => {
    if (!isSuper) {
      toast.error('Super Admin only');
      return;
    }
    setBusy(true);
    try {
      const result = await adminRunBackup(null);
      toast.success(
        `Backup saved${
          result.local_path
            ? `: ${result.local_path.replace(/\\/g, '/').split('/').pop()}`
            : ''
        }`,
      );
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Backup failed');
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async () => {
    if (!restoreTarget || !isSuper) return;
    if (confirmText.trim() !== 'RESTORE') {
      toast.error('Type RESTORE to confirm');
      return;
    }
    setBusy(true);
    try {
      const result = await adminRestoreBackup(restoreTarget.filename, {
        create_safety_backup: true,
      });
      toast.success(
        `Restored ${result.document_count} documents from ${result.restored_from}` +
          (result.safety_backup_filename
            ? ` · safety snapshot: ${result.safety_backup_filename}`
            : ''),
      );
      setRestoreTarget(null);
      setConfirmText('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Restore failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) return <AdminTablePageSkeleton cards={3} cols={6} />;

  return (
    <>
      {error && <div className="oa-admin-err">{error}</div>}

      {data && (
        <div className="oa-admin-cards">
          <div className="oa-admin-stat">
            <div className="label">Local packages</div>
            <div className="value">{data.count}</div>
            <div className="delta">keep {data.retention_days} days</div>
          </div>
          <div className="oa-admin-stat">
            <div className="label">Daily cron (UTC)</div>
            <div className="value" style={{ fontSize: 22 }}>
              {data.cron_utc}
            </div>
            <div className="delta">
              {data.backup_enabled ? 'scheduler on' : 'scheduler off'}
            </div>
          </div>
          <div className="oa-admin-stat">
            <div className="label">S3 upload</div>
            <div className="value" style={{ fontSize: 22 }}>
              {data.s3_enabled ? 'On' : 'Off'}
            </div>
            <div className="delta">versioned bucket when enabled</div>
          </div>
        </div>
      )}

      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <h2>Encrypted backups</h2>
          <span style={{ color: 'var(--oa-muted)', fontSize: 13 }}>
            Vault fields stay ciphertext · Super Admin can restore after wipe
          </span>
          <button
            type="button"
            className="oa-admin-btn ghost"
            onClick={() => void load()}
            disabled={busy}
          >
            Refresh
          </button>
          {isSuper && (
            <button
              type="button"
              className="oa-admin-btn primary"
              onClick={() => void runNow()}
              disabled={busy}
            >
              {busy ? 'Working…' : 'Run backup now'}
            </button>
          )}
        </div>

        <div className="oa-admin-panel-body" style={{ padding: 0 }}>
          <div className="oa-admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Package</th>
                  <th>Size</th>
                  <th>Documents</th>
                  <th>S3</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(data?.items || []).map(row => (
                  <tr key={row.filename}>
                    <td>{fmt(row.created_at)}</td>
                    <td style={{ whiteSpace: 'normal', maxWidth: 280 }}>
                      <code style={{ fontSize: 12 }}>{row.filename}</code>
                      {row.is_latest && (
                        <>
                          {' '}
                          <span className="oa-admin-tag ok">Latest</span>
                        </>
                      )}
                    </td>
                    <td>{fmtBytes(row.bytes)}</td>
                    <td>{row.document_count}</td>
                    <td>
                      {row.s3_key ? (
                        <span className="oa-admin-tag blue">Uploaded</span>
                      ) : (
                        <span className="oa-admin-tag flat">Local</span>
                      )}
                    </td>
                    <td>
                      {isSuper && (
                        <button
                          type="button"
                          className="oa-admin-btn ghost"
                          disabled={busy}
                          onClick={() => {
                            setRestoreTarget(row);
                            setConfirmText('');
                          }}
                        >
                          Restore
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!data?.items?.length && (
                  <tr>
                    <td colSpan={6} style={{ color: 'var(--oa-muted)' }}>
                      No backups yet. Run a backup or wait for the daily cron.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {restoreTarget && (
        <div className="oa-admin-panel" style={{ borderColor: 'var(--oa-warn, #b45309)' }}>
          <div className="oa-admin-panel-head">
            <h2>Confirm restore</h2>
          </div>
          <div className="oa-admin-panel-body">
            <p style={{ marginTop: 0, lineHeight: 1.5 }}>
              This <strong>replaces</strong> backed-up Mongo collections with
              data from{' '}
              <code>{restoreTarget.filename}</code>. A safety snapshot is taken
              first so you can undo. Type <strong>RESTORE</strong> to continue.
            </p>
            <div className="oa-admin-field">
              <label htmlFor="restore-confirm">Confirmation</label>
              <input
                id="restore-confirm"
                className="oa-admin-input"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="RESTORE"
                autoComplete="off"
                disabled={busy}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button
                type="button"
                className="oa-admin-btn primary"
                disabled={busy || confirmText.trim() !== 'RESTORE'}
                onClick={() => void doRestore()}
              >
                {busy ? 'Restoring…' : 'Restore this backup'}
              </button>
              <button
                type="button"
                className="oa-admin-btn ghost"
                disabled={busy}
                onClick={() => {
                  setRestoreTarget(null);
                  setConfirmText('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
