'use client';

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { statusTagClass } from '@/components/admin/adminNav';
import {
  adminDeleteUser,
  adminDeathCertificateUrl,
  adminForceLogoutUser,
  adminGrantComp,
  adminListUsers,
  adminPatchUser,
  adminReleaseNokAccess,
  type AdminAuthorizedPerson,
  type AdminDeathVerification,
  type AdminUser,
} from '@/libs/api/adminApi';
import {
  AdminTablePageSkeleton,
  AdminTableSkeleton,
} from '@/components/admin/AdminSkeletons';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'trial', label: 'Trial' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Locked' },
] as const;

const COMP_PRESETS = [
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
  { label: '6mo', days: 180 },
  { label: '1yr', days: 365 },
  { label: 'Lifetime', days: null },
] as const;

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

function displayStatus(u: AdminUser): string {
  if (u.suspended) return 'suspended';
  if (u.is_complimentary) return 'complimentary';
  return (u.billing_status || 'pending').toLowerCase();
}

function initials(u: AdminUser) {
  const n = (u.full_name || u.email || 'U').trim();
  const parts = n.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return n.slice(0, 2).toUpperCase();
}

function AuthorizedPeopleList({ people }: { people: AdminAuthorizedPerson[] }) {
  if (!people.length) {
    return (
      <p style={{ margin: 0, color: 'var(--oa-muted)', fontSize: 13 }}>
        No next of kin or family collaborators named.
      </p>
    );
  }
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
      {people.map(p => (
        <li key={p.id} style={{ fontSize: 13.5, lineHeight: 1.45 }}>
          <strong>{p.full_name || p.email || '—'}</strong>
          <span style={{ color: 'var(--oa-muted)' }}> · {p.kind}</span>
          {p.relationship ? (
            <span style={{ color: 'var(--oa-muted)' }}> · {p.relationship}</span>
          ) : null}
          <div style={{ color: 'var(--oa-muted)', fontSize: 12.5 }}>
            {[p.email, p.phone_number].filter(Boolean).join(' · ') || 'No contact on file'}
            {p.kind?.includes('After death') ||
            p.kind?.includes('Attorney') ||
            p.access_timing === 'upon_death' ? (
              <span>
                {' · ID: '}
                {p.didit_status || 'not started'}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function DeathVerificationPanel({
  selected,
  busy,
}: {
  selected: AdminUser;
  busy: boolean;
}) {
  const dv: AdminDeathVerification | undefined = selected.death_verification;
  const ada = selected.after_death_case;
  const gates = ada?.gates;
  return (
    <div
      style={{
        marginBottom: 16,
        padding: 12,
        borderRadius: 12,
        border: '1px solid var(--oa-line, #E4EAF0)',
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--oa-muted)',
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        After-death access
      </div>
      {ada ? (
        <p style={{ margin: '0 0 8px', color: 'var(--oa-muted)' }}>
          Case {ada.reference} · {ada.status}
          <br />
          Death record (Didit USA SSDMF): {ada.owner_death_record?.status || 'PENDING'}
          {ada.owner_death_record?.override ? ' · override on file' : ''}
          <br />
          Protection: {ada.protection?.completed
            ? '168 hours complete'
            : ada.protection?.started
              ? `${ada.protection?.remaining_seconds ?? 0}s remaining`
              : 'Not started — begins when the death certificate is stored'}
          <br />
          Notices: D0 {ada.notifications?.day0 ? 'sent' : '—'} · D2 {ada.notifications?.day2 ? 'sent' : '—'} · D4 {ada.notifications?.day4 ? 'sent' : '—'} · D6 {ada.notifications?.day6 ? 'sent' : '—'}
          <br />
          Owner: {ada.owner_response?.disputed ? 'disputed' : ada.owner_response?.fresh_login_at ? 'fresh login (not auto-stopped)' : 'no dispute'}
        </p>
      ) : (
        <p style={{ margin: '0 0 8px', color: 'var(--oa-muted)' }}>
          No open after-death case. Living Release Access is a separate action.
        </p>
      )}
      {gates ? (
        <ul style={{ margin: '0 0 8px', paddingLeft: 18, color: 'var(--oa-ink)' }}>
          <li>Certificate on file: {gates.certificate_on_file ? 'yes' : 'no'}</li>
          <li>Claimant identity approved: {gates.claimant_kyc_approved ? 'yes' : 'no'}</li>
          <li>Death record MATCH or override: {gates.ssdmf_match_or_override ? 'yes' : 'no'}</li>
          <li>168-hour protection complete: {gates.protection_complete ? 'yes' : 'no'}</li>
          <li>No owner dispute: {gates.no_owner_dispute ? 'yes' : 'no'}</li>
        </ul>
      ) : null}
      <p style={{ margin: '0 0 8px', color: 'var(--oa-muted)' }}>
        Certificate:{' '}
        {dv?.certificate_uploaded
          ? dv.certificate_filename || 'uploaded'
          : 'not uploaded'}
        {ada?.certificate?.version ? ` · v${ada.certificate.version}` : ''}
      </p>
      {dv?.certificate_uploaded ? (
        <button
          type="button"
          className="oa-admin-btn ghost"
          disabled={busy}
          style={{ marginTop: 8 }}
          onClick={() => {
            void adminDeathCertificateUrl(selected.id)
              .then(data => {
                if (data.url) window.open(data.url, '_blank', 'noopener');
              })
              .catch(err => {
                window.alert(err instanceof Error ? err.message : String(err));
              });
          }}
        >
          View certificate
        </button>
      ) : null}
    </div>
  );
}

function UserDetail({
  selected,
  busy,
  onClose,
  onRun,
  asSheet,
}: {
  selected: AdminUser;
  busy: boolean;
  onClose: () => void;
  onRun: (fn: () => Promise<unknown>, ok: string) => void;
  asSheet?: boolean;
}) {
  const [compDays, setCompDays] = useState<number | null>(30);
  const [compNote, setCompNote] = useState('');
  const st = displayStatus(selected);

  return (
    <div
      className={asSheet ? 'oa-admin-drawer-panel' : 'oa-admin-user-detail'}
      onClick={asSheet ? e => e.stopPropagation() : undefined}
      role={asSheet ? 'dialog' : undefined}
      aria-label={asSheet ? 'Manage user' : undefined}
    >
      {asSheet ? <div className="oa-admin-sheet-handle" /> : null}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div>
          <div className="oa-admin-avatar-lg">{initials(selected)}</div>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--oa-display)',
              color: 'var(--oa-ink)',
              fontSize: 26,
              lineHeight: 1.1,
            }}
          >
            {selected.full_name || selected.email}
          </h2>
          <p
            style={{
              margin: '6px 0 0',
              color: 'var(--oa-muted)',
              fontSize: 13,
            }}
          >
            {selected.email}
            <br />
            <span style={{ fontSize: 12 }}>
              owner (customer) · view details
            </span>
          </p>
        </div>
        <button
          type="button"
          className="oa-admin-btn ghost"
          onClick={onClose}
          disabled={busy}
        >
          Close
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '14px 0' }}>
        <span className={`oa-admin-tag ${statusTagClass(st)}`}>{st}</span>
        <span className="oa-admin-tag outline">MFA on</span>
        {selected.section_count != null ? (
          <span className="oa-admin-tag flat">
            {selected.section_count}/22 sections
          </span>
        ) : null}
      </div>

      <div
        style={{
          display: 'grid',
          gap: 10,
          fontSize: 13.5,
          marginBottom: 18,
          paddingBottom: 16,
          borderBottom: '1px solid var(--oa-divider)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--oa-muted)' }}>Plan</span>
          <strong>{selected.plan || '—'}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--oa-muted)' }}>Renews / trial</span>
          <strong>{fmt(selected.trial_end)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--oa-muted)' }}>Last active</span>
          <strong>{fmt(selected.last_login)}</strong>
        </div>
      </div>

      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--oa-muted)',
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Authorized people
      </div>
      <div style={{ marginBottom: 16 }}>
        <AuthorizedPeopleList people={selected.authorized_people || []} />
      </div>
      <DeathVerificationPanel selected={selected} busy={busy} />
      {selected.death_report_pending && selected.owner_status !== 'deceased' ? (
        <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--oa-muted)' }}>
          A next of kin reported a passing. Confirm identity (ID: status on
          each after-death person). Release access only sends claim emails to
          people whose Didit check is Approved.
        </p>
      ) : null}
      {selected.owner_status === 'deceased' ? (
        <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--oa-muted)' }}>
          Passing already recorded. Release again to re-send unused claim links.
        </p>
      ) : null}
      <button
        type="button"
        className="oa-admin-btn primary"
        style={{ width: '100%', marginBottom: 16 }}
        disabled={
          busy ||
          !selected.after_death_case?.gates?.certificate_on_file ||
          !selected.after_death_case?.gates?.protection_complete ||
          !selected.after_death_case?.gates?.claimant_kyc_approved ||
          selected.after_death_case?.gates?.no_owner_dispute === false
        }
        onClick={() => {
          const gates = selected.after_death_case?.gates;
          if (
            !gates?.certificate_on_file ||
            !gates?.protection_complete ||
            !gates?.claimant_kyc_approved ||
            gates.no_owner_dispute === false
          ) {
            window.alert(
              (gates?.reasons || []).join(' ') ||
                'Release gates are not met. Certificate, 168-hour protection, claimant identity, and no owner dispute are required. Death-record MATCH or a documented override is also required.',
            );
            return;
          }
          const needsSsdmfOverride = !gates.ssdmf_match_or_override;
          let ssdmf_override = false;
          let death_check_override_reason: string | undefined;
          if (needsSsdmfOverride) {
            death_check_override_reason =
              window.prompt(
                'Owner death-record check is not MATCH. Enter override reason (required). This is logged. NO_MATCH is not proof the owner is alive.',
              ) || undefined;
            if (!death_check_override_reason?.trim()) {
              window.alert('Override reason is required.');
              return;
            }
            ssdmf_override = true;
          }
          const note =
            window.prompt(
              `Release vault access for ${selected.email}?\n\nThis emails a 72-hour claim link only to claimants whose Didit status is Approved. Nothing else auto-unlocks.\n\nSupporting notes${ssdmf_override ? ' (required for override)' : ''}:`,
            ) ?? undefined;
          if (note === undefined) return;
          if (ssdmf_override && !note.trim()) {
            window.alert('Add supporting notes when overriding a death-record check.');
            return;
          }
          onRun(
            () =>
              adminReleaseNokAccess(selected.id, {
                confirm: true,
                note: note.trim() || undefined,
                ssdmf_override,
                death_check_override_reason,
              }),
            'Vault access released',
          );
        }}
      >
        Release access
      </button>

      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--oa-muted)',
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Grant free trial
      </div>
      <div className="oa-admin-comp-grid">
        {COMP_PRESETS.map(p => (
          <button
            key={p.label}
            type="button"
            className={compDays === p.days ? 'active' : undefined}
            onClick={() => setCompDays(p.days)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="oa-admin-field">
        <label htmlFor="comp-note">Reason (audit log)</label>
        <textarea
          id="comp-note"
          className="oa-admin-textarea"
          value={compNote}
          onChange={e => setCompNote(e.target.value)}
          placeholder="Required for audit trail"
        />
      </div>
      <button
        type="button"
        className="oa-admin-btn primary"
        style={{ width: '100%', marginBottom: 10 }}
        disabled={busy}
        onClick={() =>
          onRun(
            () =>
              adminGrantComp(selected.id, {
                kind: compDays == null ? 'lifetime' : 'duration',
                duration_days: compDays ?? undefined,
                note: compNote || undefined,
                send_email: true,
              }),
            'Complimentary access granted',
          )
        }
      >
        Grant access
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          type="button"
          className="oa-admin-btn secondary"
          disabled={busy}
          onClick={() => {
            const reason = window.prompt(
              `Force logout ${selected.email}? Enter an audit reason (required).`,
            );
            if (!reason?.trim()) {
              toast.error('Reason is required');
              return;
            }
            onRun(
              () => adminForceLogoutUser(selected.id, reason.trim()),
              'All sessions signed out',
            );
          }}
        >
          Send password reset / force logout
        </button>
        <button
          type="button"
          className="oa-admin-btn secondary"
          disabled={busy}
          onClick={() =>
            onRun(
              () =>
                adminPatchUser(selected.id, {
                  suspend: !selected.suspended,
                }),
              selected.suspended
                ? 'Account unsuspended'
                : 'Account suspended',
            )
          }
        >
          {selected.suspended ? 'Unsuspend account' : 'Suspend account'}
        </button>
        <button
          type="button"
          className="oa-admin-btn ink"
          disabled={busy}
          onClick={() => {
            const reason = window.prompt(
              `Permanently delete ${selected.email} and ALL linked data (NOK, family, letters, messages, sections, subscription, S3)?\n\nEnter an audit reason (required).`,
            );
            if (!reason?.trim()) {
              toast.error('Reason is required to delete an account');
              return;
            }
            const confirmed = window.confirm(
              `This hard-deletes ${selected.email}. Vault, media, NOK/family accounts, and billing are wiped. A hashed identity fingerprint is kept so the same email/phone cannot re-register.`,
            );
            if (!confirmed) return;
            onRun(
              () => adminDeleteUser(selected.id, reason.trim()),
              'User permanently deleted',
            );
          }}
        >
          Delete account
        </button>
      </div>
      <p
        style={{
          fontSize: 12,
          color: 'var(--oa-muted)',
          margin: '16px 0 0',
          lineHeight: 1.45,
        }}
      >
        Delete is a hard purge (all linked data). A reason is required and audited.
        Hashed email/phone is retained to block re-registration.
      </p>
    </div>
  );
}

function AdminUsersInner() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get('status') || '').toLowerCase();

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState(
    STATUS_FILTERS.some(f => f.value === initialStatus) ? initialStatus : '',
  );
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminListUsers({
        q: q.trim() || undefined,
        status: status || undefined,
        page,
        page_size: 25,
      });
      setUsers(data.users || []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [q, status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const s = (searchParams.get('status') || '').toLowerCase();
    if (STATUS_FILTERS.some(f => f.value === s)) {
      setStatus(s);
      setPage(1);
    }
    const qq = searchParams.get('q');
    if (qq != null) setQ(qq);
  }, [searchParams]);

  // Keep selection in sync when list refreshes; do not auto-open first row
  // so the table stays full-width until the admin clicks a row.
  useEffect(() => {
    if (!selected) return;
    const next = users.find(u => u.id === selected.id) || null;
    setSelected(next);
  }, [users]); // eslint-disable-line react-hooks/exhaustive-deps

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / 25)), [total]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      setSelected(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        className={`oa-admin-users-layout${selected && !isMobile ? ' has-detail' : ''}`}
      >
        <div className="oa-admin-panel" style={{ marginBottom: 0 }}>
          <div className="oa-admin-panel-head">
            <h2>
              <span className="oa-display">{total}</span> accounts
            </h2>
          </div>
          <div className="oa-admin-panel-body">
            <div className="oa-admin-filters">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.label}
                  type="button"
                  className={status === f.value ? 'active' : undefined}
                  onClick={() => {
                    setStatus(f.value);
                    setPage(1);
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <input
              className="oa-admin-input"
              style={{ marginBottom: 14 }}
              placeholder="Search name or email…"
              value={q}
              onChange={e => {
                setQ(e.target.value);
                setPage(1);
              }}
            />

            {error && <div className="oa-admin-err">{error}</div>}

            {loading ? (
              <AdminTableSkeleton cols={4} rows={8} />
            ) : (
              <div className="oa-admin-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Term</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      const st = displayStatus(u);
                      const isSel = selected?.id === u.id;
                      const people = u.authorized_people || [];
                      return (
                        <React.Fragment key={u.id}>
                        <tr
                          className={isSel ? 'selected' : undefined}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelected(u)}
                        >
                          <td>
                            <div
                              style={{
                                display: 'flex',
                                gap: 10,
                                alignItems: 'center',
                              }}
                            >
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 999,
                                  background: 'var(--oa-teal-soft)',
                                  color: 'var(--oa-teal)',
                                  display: 'grid',
                                  placeItems: 'center',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  flex: 'none',
                                }}
                              >
                                {initials(u)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600 }}>
                                  {u.full_name || '—'}
                                </div>
                                <div
                                  style={{
                                    color: 'var(--oa-muted)',
                                    fontSize: 12,
                                    whiteSpace: 'normal',
                                  }}
                                >
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{u.plan || '—'}</td>
                          <td>
                            <span
                              className={`oa-admin-tag ${statusTagClass(st)}`}
                            >
                              {st}
                            </span>
                            {u.owner_status === 'deceased' ? (
                              <span className="oa-admin-tag warn" style={{ marginLeft: 6 }}>
                                deceased
                              </span>
                            ) : u.death_report_pending ? (
                              <span className="oa-admin-tag warn" style={{ marginLeft: 6 }}>
                                death report
                              </span>
                            ) : null}
                            {u.death_verification?.ssdmf_status === 'MATCH' ? (
                              <span className="oa-admin-tag" style={{ marginLeft: 6 }}>
                                SSDMF match
                              </span>
                            ) : null}
                          </td>
                          <td>{fmt(u.trial_end)}</td>
                        </tr>
                        <tr>
                          <td
                            colSpan={4}
                            style={{
                              background: 'var(--oa-paper, #f7f6f2)',
                              padding: '10px 16px 14px',
                              borderTop: 'none',
                            }}
                          >
                            <div
                              style={{
                                fontSize: 11,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                color: 'var(--oa-muted)',
                                fontWeight: 700,
                                marginBottom: 8,
                              }}
                            >
                              Authorized people
                            </div>
                            <AuthorizedPeopleList people={people} />
                          </td>
                        </tr>
                        </React.Fragment>
                      );
                    })}
                    {!users.length && (
                      <tr>
                        <td colSpan={4} style={{ color: 'var(--oa-muted)' }}>
                          No owners match this filter.
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
                  marginTop: 14,
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

        {selected && !isMobile ? (
          <UserDetail
            selected={selected}
            busy={busy}
            onClose={() => setSelected(null)}
            onRun={(fn, ok) => void run(fn, ok)}
          />
        ) : null}
      </div>

      {selected && isMobile ? (
        <div
          className="oa-admin-drawer"
          onClick={() => !busy && setSelected(null)}
          role="presentation"
        >
          <UserDetail
            selected={selected}
            busy={busy}
            onClose={() => setSelected(null)}
            onRun={(fn, ok) => void run(fn, ok)}
            asSheet
          />
        </div>
      ) : null}
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<AdminTablePageSkeleton cols={4} rows={8} />}>
      <AdminUsersInner />
    </Suspense>
  );
}
