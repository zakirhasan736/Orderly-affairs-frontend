'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AdminListSkeleton } from '@/components/admin/AdminSkeletons';
import {
  adminBroadcast,
  adminGetOverview,
  adminNotificationHistory,
} from '@/libs/api/adminApi';

type HistoryItem = {
  id: string;
  subject: string;
  body: string;
  audience: string;
  created_at?: string;
  created_by?: string;
  recipient_count?: number;
  sent_count?: number;
};

const CATEGORIES = [
  {
    id: 'trial',
    label: 'Trial ending',
    audience: 'trial' as const,
    subject: 'Your trial ends in 7 days',
    body: 'Your Orderly Affairs trial ends on [trial_end]. Nothing is deleted — editing simply pauses until you choose a plan.',
    audienceLabel: 'Trials ending in 7 days',
  },
  {
    id: 'payment',
    label: 'Payment failed',
    audience: 'active' as const,
    subject: 'We couldn’t process your payment',
    body: 'Please update your payment method to keep your vault active. Your data stays safe.',
    audienceLabel: 'Active paid owners',
  },
  {
    id: 'suspended',
    label: 'Suspended',
    audience: 'suspended' as const,
    subject: 'Your account has been suspended',
    body: 'Sign-in is blocked until an admin reinstates access. Contact support if you believe this is an error.',
    audienceLabel: 'Suspended accounts',
  },
  {
    id: 'coupon',
    label: 'Coupon welcome',
    audience: 'all' as const,
    subject: 'Welcome — your access code is ready',
    body: 'Redeem your one-time access code from Billing to unlock your vault.',
    audienceLabel: 'All owners',
  },
] as const;

const CHANNELS = ['Email + in-app', 'Email', 'In-app', 'SMS'] as const;

function fmt(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
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

export default function AdminNotificationsPage() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['id']>(
    'trial',
  );
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>(
    'Email + in-app',
  );
  const [subject, setSubject] = useState(CATEGORIES[0].subject);
  const [body, setBody] = useState(CATEGORIES[0].body);
  const [audience, setAudience] = useState<(typeof CATEGORIES)[number]['audience']>(
    'trial',
  );
  const [audienceLabel, setAudienceLabel] = useState(
    CATEGORIES[0].audienceLabel,
  );
  const [counts, setCounts] = useState({ trial: 0, all: 0, active: 0, suspended: 0 });
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const audienceCount = useMemo(() => {
    if (audience === 'trial') return counts.trial;
    if (audience === 'active') return counts.active;
    if (audience === 'suspended') return counts.suspended;
    return counts.all;
  }, [audience, counts]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hist, ov] = await Promise.all([
        adminNotificationHistory(),
        adminGetOverview(),
      ]);
      setHistory(hist.items || hist.broadcasts || []);
      setCounts({
        trial: ov.trial || 0,
        all: ov.users || 0,
        active: ov.active || 0,
        suspended: ov.suspended || 0,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const applyCategory = (id: (typeof CATEGORIES)[number]['id']) => {
    const cat = CATEGORIES.find(c => c.id === id)!;
    setCategory(id);
    setAudience(cat.audience);
    setAudienceLabel(cat.audienceLabel);
    setSubject(cat.subject);
    setBody(cat.body);
  };

  const send = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and body are required');
      return;
    }
    if (channel === 'SMS') {
      toast.error('SMS channel is not enabled yet — use Email or In-app');
      return;
    }
    setSending(true);
    try {
      await adminBroadcast({
        subject: subject.trim(),
        body: body.trim(),
        audience,
      });
      toast.success(`Sent to ${audienceCount} people · logged to audit`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Broadcast failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="oa-admin-grid-2">
      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <h2>Compose</h2>
        </div>
        <div className="oa-admin-panel-body">
          <div className="oa-admin-filters">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                type="button"
                className={category === c.id ? 'active' : undefined}
                onClick={() => applyCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="oa-admin-field">
            <label>Audience</label>
            <div style={{ position: 'relative' }}>
              <input
                className="oa-admin-input"
                value={audienceLabel}
                onChange={e => setAudienceLabel(e.target.value)}
              />
              <span
                className="oa-admin-tag flat"
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                {audienceCount}
              </span>
            </div>
          </div>

          <div className="oa-admin-filters">
            {CHANNELS.map(c => (
              <button
                key={c}
                type="button"
                className={channel === c ? 'active' : undefined}
                onClick={() => setChannel(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="oa-admin-field">
            <label htmlFor="n-subject">Subject</label>
            <input
              id="n-subject"
              className="oa-admin-input"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>
          <div className="oa-admin-field">
            <label htmlFor="n-body">Message</label>
            <textarea
              id="n-body"
              className="oa-admin-textarea"
              value={body}
              onChange={e => setBody(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="oa-admin-btn primary"
              disabled={sending}
              onClick={() => void send()}
            >
              {sending ? 'Sending…' : `Send to ${audienceCount} people`}
            </button>
            <button
              type="button"
              className="oa-admin-btn secondary"
              onClick={() =>
                toast.message('Preview', { description: `${subject}\n\n${body}` })
              }
            >
              Preview
            </button>
            <span style={{ marginLeft: 'auto', color: 'var(--oa-muted)', fontSize: 13 }}>
              Logged to audit
            </span>
          </div>
        </div>
      </div>

      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <h2>History</h2>
        </div>
        <div className="oa-admin-panel-body" style={{ padding: 0 }}>
          {loading ? (
            <AdminListSkeleton />
          ) : (
            <div className="oa-admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Sent</th>
                    <th>Subject</th>
                    <th>Audience</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id}>
                      <td>{fmt(h.created_at)}</td>
                      <td style={{ whiteSpace: 'normal' }}>{h.subject}</td>
                      <td>
                        {h.audience} · {h.recipient_count ?? h.sent_count ?? '—'}
                      </td>
                      <td>
                        <span className="oa-admin-tag outline">Sent</span>
                      </td>
                    </tr>
                  ))}
                  {!history.length && (
                    <tr>
                      <td colSpan={4} style={{ color: 'var(--oa-muted)' }}>
                        No broadcasts yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
