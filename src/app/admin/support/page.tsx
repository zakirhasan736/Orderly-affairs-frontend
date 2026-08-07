'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  adminClearRateLimits,
  adminDeleteUser,
  adminForceLogoutUser,
  adminListUsers,
  adminPatchUser,
  type AdminUser,
} from '@/libs/api/adminApi';
import {
  adminGetSupportThread,
  adminListSupportThreads,
  adminReplySupportThread,
  type SupportMessage,
  type SupportThread,
} from '@/libs/api/supportChat';
import {
  AdminListSkeleton,
  AdminPanelSkeleton,
} from '@/components/admin/AdminSkeletons';
import { useAdminAuth } from '@/components/admin/AdminAuthProvider';

type ToolId = 'unlock' | 'email' | 'password' | 'delete' | null;

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const ALL_TOOLS = [
  {
    id: 'unlock' as const,
    title: 'Unlock account',
    body: 'Clear a lockout after failed logins.',
    badge: 'Identity check',
  },
  {
    id: 'email' as const,
    title: 'Change email',
    body: 'Both addresses are notified.',
    badge: 'Identity check',
  },
  {
    id: 'password' as const,
    title: 'Password reset',
    body: 'Vault re-keys client-side.',
    badge: 'Auto-logged',
  },
  {
    id: 'delete' as const,
    title: 'Delete account',
    body: 'Soft-delete / revoke access (super admin · audited).',
    badge: 'Super admin',
  },
];

export default function AdminSupportPage() {
  const { session } = useAdminAuth();
  const canClearLimits = Boolean(session?.can_clear_rate_limits);
  const canSuspend = Boolean(session?.can_suspend_accounts);
  const canEditEmail = Boolean(session?.can_edit_profile_email);
  const canForceLogout = Boolean(session?.can_force_logout);
  const canDelete = Boolean(session?.can_delete_users);

  const tools = useMemo(
    () =>
      ALL_TOOLS.filter(t => {
        if (t.id === 'unlock') return canClearLimits || canSuspend;
        if (t.id === 'email') return canEditEmail;
        if (t.id === 'password') return canForceLogout;
        if (t.id === 'delete') return canDelete;
        return false;
      }),
    [canClearLimits, canSuspend, canEditEmail, canForceLogout, canDelete],
  );

  const [owners, setOwners] = useState<AdminUser[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [tool, setTool] = useState<ToolId>(null);
  const [reason, setReason] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [selected, setSelected] = useState<SupportThread | null>(null);
  const [draft, setDraft] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const selectedOwner = useMemo(
    () => owners.find(o => o.id === selectedOwnerId) || null,
    [owners, selectedOwnerId],
  );

  useEffect(() => {
    void (async () => {
      try {
        const users = await adminListUsers({ page: 1, page_size: 100 });
        setOwners(users.users || []);
        if (users.users?.[0]) setSelectedOwnerId(users.users[0].id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load users');
      }
    })();
  }, []);

  const loadThreads = useCallback(async () => {
    try {
      const data = await adminListSupportThreads();
      setThreads(data.threads);
      setLoadingList(false);
    } catch {
      setLoadingList(false);
    }
  }, []);

  const loadThread = useCallback(async (threadId: string) => {
    setLoadingThread(true);
    try {
      const data = await adminGetSupportThread(threadId);
      setSelected(data.thread);
      setMessages(data.messages);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open thread');
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    void loadThreads();
    const id = window.setInterval(() => void loadThreads(), 8000);
    return () => window.clearInterval(id);
  }, [loadThreads]);

  useEffect(() => {
    if (!selectedId) return;
    void loadThread(selectedId);
    const id = window.setInterval(() => void loadThread(selectedId), 4000);
    return () => window.clearInterval(id);
  }, [selectedId, loadThread]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const runTool = async () => {
    if (!selectedOwner) {
      toast.error('Select an account first');
      return;
    }
    if (!reason.trim()) {
      toast.error('Reason is required for the audit log');
      return;
    }
    setBusy(true);
    try {
      if (tool === 'unlock') {
        if (!canClearLimits && !canSuspend) {
          throw new Error('Not allowed to unlock accounts');
        }
        if (canClearLimits) {
          await adminClearRateLimits(selectedOwner.email, reason.trim());
        }
        if (canSuspend) {
          await adminPatchUser(selectedOwner.id, {
            suspend: false,
            reason: reason.trim(),
          });
          toast.success('Account unlocked · rate limits cleared');
        } else {
          toast.success('Rate limits cleared (account not reinstated)');
        }
      } else if (tool === 'password') {
        if (!canForceLogout) {
          throw new Error('Not allowed to force logout');
        }
        await adminForceLogoutUser(selectedOwner.id, reason.trim());
        toast.success('Sessions revoked — owner must reset password on next login');
      } else if (tool === 'email') {
        if (!canEditEmail) {
          throw new Error('Not allowed to change email');
        }
        if (!newEmail.trim()) {
          toast.error('Enter the new email');
          setBusy(false);
          return;
        }
        await adminPatchUser(selectedOwner.id, {
          email: newEmail.trim(),
          reason: reason.trim(),
        });
        toast.success('Email updated · both addresses should be notified');
      } else if (tool === 'delete') {
        if (!canDelete) {
          throw new Error('Not allowed to delete users');
        }
        await adminDeleteUser(selectedOwner.id, reason.trim());
        toast.success('Account hard-deleted · linked data wiped · action audited');
      }
      setTool(null);
      setReason('');
      setNewEmail('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!selectedId || !draft.trim() || sending) return;
    setSending(true);
    try {
      const { message } = await adminReplySupportThread(selectedId, draft.trim());
      setMessages(prev =>
        prev.some(m => m.id === message.id) ? prev : [...prev, message],
      );
      setDraft('');
      void loadThreads();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reply failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <span style={{ color: 'var(--oa-muted)', fontSize: 13, fontWeight: 600 }}>
          Acting on
        </span>
        <select
          className="oa-admin-select"
          style={{ maxWidth: 420, flex: '1 1 280px' }}
          value={selectedOwnerId}
          onChange={e => setSelectedOwnerId(e.target.value)}
        >
          {owners.map(o => (
            <option key={o.id} value={o.id}>
              {(o.full_name || o.email).slice(0, 24)} — {o.email}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: 18,
        }}
      >
        {tools.map(t => (
          <button
            key={t.id}
            type="button"
            className="oa-admin-panel"
            style={{
              textAlign: 'left',
              cursor: 'pointer',
              padding: 0,
              margin: 0,
              border: '1px solid var(--oa-border)',
              background: 'var(--oa-surface)',
            }}
            onClick={() => {
              setTool(t.id);
              setReason('');
            }}
          >
            <div className="oa-admin-panel-body">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <strong style={{ fontFamily: 'var(--oa-display)', fontSize: 18 }}>
                  {t.title}
                </strong>
                <span className="oa-admin-tag outline">{t.badge}</span>
              </div>
              <p style={{ margin: 0, color: 'var(--oa-muted)', fontSize: 13 }}>
                {t.body}
              </p>
            </div>
          </button>
        ))}
      </div>

      {tool && selectedOwner && (
        <div
          className="oa-admin-drawer"
          role="presentation"
          onClick={() => !busy && setTool(null)}
        >
          <div
            className="oa-admin-drawer-panel"
            style={{
              maxWidth: 480,
              margin: 'auto',
              height: 'auto',
              maxHeight: '90vh',
              borderRadius: 24,
              border: '1px solid var(--oa-border)',
            }}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-label={tools.find(t => t.id === tool)?.title}
          >
            <div className="oa-admin-sheet-handle" style={{ display: 'block' }} />
            <h2 style={{ margin: '0 0 12px', fontSize: 26 }}>
              {tools.find(t => t.id === tool)?.title}
            </h2>
            {tool === 'delete' && (
              <div
                className="oa-admin-notice"
                style={{
                  background: 'var(--oa-gold-soft)',
                  borderColor: 'rgba(185, 138, 62, 0.28)',
                  color: 'var(--oa-ink)',
                }}
              >
                Destructive. Super admin only — soft-deletes the account and
                revokes sessions. Reason is written to the audit log.
              </div>
            )}
            <div className="oa-admin-field">
              <label>Account</label>
              <input
                className="oa-admin-input"
                readOnly
                value={`${selectedOwner.full_name || 'Owner'} (${selectedOwner.email})`}
              />
            </div>
            {tool === 'email' && (
              <div className="oa-admin-field">
                <label>New email</label>
                <input
                  className="oa-admin-input"
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                />
              </div>
            )}
            <div className="oa-admin-field">
              <label>Reason · written to the audit log</label>
              <textarea
                className="oa-admin-textarea"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ticket #… — identity verified…"
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="oa-admin-btn secondary"
                disabled={busy}
                onClick={() => setTool(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="oa-admin-btn primary"
                disabled={busy}
                onClick={() => void runTool()}
              >
                Confirm & log
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <h2>Live inbox</h2>
          <button
            type="button"
            className="oa-admin-btn ghost"
            onClick={() => void loadThreads()}
          >
            Refresh
          </button>
        </div>
        <div
          className="oa-admin-panel-body"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 300px) 1fr',
            gap: 0,
            padding: 0,
            minHeight: 420,
          }}
        >
          <div style={{ borderRight: '1px solid var(--oa-divider)' }}>
            {loadingList ? (
              <AdminListSkeleton rows={5} />
            ) : (
              <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                {threads.map(thread => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedId(thread.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '14px 16px',
                      border: 'none',
                      borderBottom: '1px solid var(--oa-divider)',
                      background:
                        selectedId === thread.id
                          ? 'var(--oa-teal-soft)'
                          : 'transparent',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      minHeight: 44,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                      {thread.owner_email || 'Owner'}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--oa-muted)',
                        marginTop: 4,
                      }}
                    >
                      {thread.last_preview || 'No messages'}
                    </div>
                  </button>
                ))}
                {!threads.length && (
                  <p
                    style={{
                      padding: 16,
                      color: 'var(--oa-muted)',
                      fontSize: 13,
                    }}
                  >
                    No live threads yet.
                  </p>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 420 }}>
            {!selectedId ? (
              <div
                style={{
                  flex: 1,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--oa-muted)',
                  fontSize: 13,
                  padding: 24,
                }}
              >
                Select a conversation to reply.
              </div>
            ) : (
              <>
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--oa-divider)',
                  }}
                >
                  <strong>{selected?.owner_email}</strong>
                  <div style={{ fontSize: 12, color: 'var(--oa-muted)' }}>
                    {selected?.subject || 'Live support'}
                  </div>
                </div>
                <div
                  ref={scrollerRef}
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 16,
                    background: 'var(--oa-paper)',
                  }}
                >
                  {loadingThread && !messages.length ? (
                    <AdminPanelSkeleton withHead={false} lines={4} />
                  ) : (
                    messages.map(m => (
                      <div
                        key={m.id}
                        style={{
                          marginBottom: 10,
                          display: 'flex',
                          justifyContent:
                            m.sender === 'admin' ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '80%',
                            padding: '10px 14px',
                            borderRadius: 16,
                            background:
                              m.sender === 'admin'
                                ? 'var(--oa-teal)'
                                : 'var(--oa-surface)',
                            color: m.sender === 'admin' ? '#fff' : 'var(--oa-text)',
                            border:
                              m.sender === 'admin'
                                ? 'none'
                                : '1px solid var(--oa-border)',
                            fontSize: 13.5,
                          }}
                        >
                          <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                          <div
                            style={{
                              fontSize: 11,
                              opacity: 0.7,
                              marginTop: 4,
                            }}
                          >
                            {formatTime(m.created_at)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <form
                  onSubmit={e => void sendReply(e)}
                  style={{
                    display: 'flex',
                    gap: 8,
                    padding: 12,
                    borderTop: '1px solid var(--oa-divider)',
                  }}
                >
                  <input
                    className="oa-admin-input"
                    placeholder="Reply to the owner…"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="oa-admin-btn primary"
                    disabled={sending || !draft.trim()}
                  >
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
