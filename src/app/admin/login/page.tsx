'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  adminLogin,
  adminMfaSetupConfirm,
  adminMfaSetupStart,
  adminMfaVerify,
} from '@/libs/api/adminApi';
import { useAdminAuth } from '@/components/admin/AdminAuthProvider';
import { BRAND_LOGO } from '@/constants/brand';
import Image from 'next/image';
import { SessionExpiredNotice } from '@/components/SessionExpiredNotice';
import '@/app/admin/admin.css';

type Step = 'credentials' | 'setup' | 'verify';

export default function AdminLoginPage() {
  const router = useRouter();
  const { refresh } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('credentials');
  const [setupToken, setSetupToken] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    await refresh();
    router.replace('/admin');
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await adminLogin(email.trim(), password);
      if (res.mfa_setup_required && res.setup_token) {
        setSetupToken(res.setup_token);
        const setup = await adminMfaSetupStart(email.trim(), res.setup_token);
        setQr(setup.qr_png_base64);
        setSecret(setup.secret);
        setStep('setup');
        return;
      }
      if (res.mfa_required && res.mfa_challenge_token) {
        setChallengeToken(res.mfa_challenge_token);
        setStep('verify');
        return;
      }
      if (res.authenticated) {
        await finish();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const onSetupConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await adminMfaSetupConfirm(email.trim(), setupToken, code.trim());
      await finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MFA setup failed');
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await adminMfaVerify(email.trim(), challengeToken, code.trim());
      await finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="oa-admin oa-admin-login">
      <div className="oa-admin-login-hero">
        <div className="oa-admin-login-brand">
          <div className="oa-admin-login-brand-mark">
            <Image
              src={BRAND_LOGO}
              alt="Orderly Affairs"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="oa-admin-login-brand-name">Orderly Affairs</div>
            <div className="oa-admin-login-brand-sub">System owner</div>
          </div>
        </div>

        <div className="oa-admin-login-hero-copy">
          <h1>The owner&apos;s console.</h1>
          <p>
            Accounts, subscriptions, payments, coupons and permissions for the
            whole platform — in one place. Metadata only: vault contents stay
            encrypted client-side.
          </p>
        </div>

        <div className="oa-admin-login-hero-foot">
          Owner-only area · MFA enforced · every session recorded
        </div>
      </div>

      <div className="oa-admin-login-panel">
        <div className="oa-admin-login-card">
          <div className="kicker">System owner sign-in</div>
          <h2>
            {step === 'credentials' && 'Verify it’s you'}
            {step === 'setup' && 'Enroll authenticator'}
            {step === 'verify' && 'Authenticator code'}
          </h2>

          <SessionExpiredNotice
            className="mb-4"
            description="Your admin session ended. Sign in again to continue."
          />

          {step === 'credentials' && (
            <form onSubmit={onLogin}>
              <div className="oa-admin-field">
                <label htmlFor="admin-email">Owner email</label>
                <input
                  id="admin-email"
                  className="oa-admin-input"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="oa-admin-field">
                <label htmlFor="admin-pass">Password</label>
                <input
                  id="admin-pass"
                  className="oa-admin-input"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              {error ? <div className="oa-admin-err">{error}</div> : null}
              <button
                type="submit"
                className="oa-admin-btn primary"
                style={{ width: '100%', marginTop: 18, minHeight: 44 }}
                disabled={busy}
              >
                {busy ? 'Signing in…' : 'Sign in to admin panel'}
              </button>
              <p
                style={{
                  fontSize: 11.5,
                  marginTop: 14,
                  textAlign: 'center',
                  color: 'var(--oa-muted)',
                }}
              >
                Permitted admin emails only. Non-owner accounts are rejected at
                this gate.
              </p>
            </form>
          )}

          {step === 'setup' && (
            <form onSubmit={onSetupConfirm}>
              <p style={{ fontSize: 13, color: 'var(--oa-muted)', marginTop: 0 }}>
                Scan this QR with Google Authenticator, Authy, or 1Password, then
                enter the 6-digit code.
              </p>
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:image/png;base64,${qr}`}
                  alt="Admin MFA QR code"
                  style={{
                    width: 180,
                    height: 180,
                    display: 'block',
                    margin: '12px auto',
                    borderRadius: 12,
                  }}
                />
              ) : null}
              {secret ? (
                <p
                  style={{
                    fontSize: 12,
                    fontFamily: 'var(--oa-mono)',
                    wordBreak: 'break-all',
                    textAlign: 'center',
                    color: 'var(--oa-muted)',
                  }}
                >
                  {secret}
                </p>
              ) : null}
              <div className="oa-admin-field">
                <label htmlFor="admin-setup-code">Authenticator code</label>
                <input
                  id="admin-setup-code"
                  className="oa-admin-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123 456"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                />
              </div>
              {error ? <div className="oa-admin-err">{error}</div> : null}
              <button
                type="submit"
                className="oa-admin-btn primary"
                style={{ width: '100%', marginTop: 12, minHeight: 44 }}
                disabled={busy}
              >
                {busy ? 'Confirming…' : 'Confirm & enter console'}
              </button>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={onVerify}>
              <div className="oa-admin-field">
                <label htmlFor="admin-code">Authenticator code (6 digits)</label>
                <input
                  id="admin-code"
                  className="oa-admin-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123 456"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                />
              </div>
              {error ? <div className="oa-admin-err">{error}</div> : null}
              <button
                type="submit"
                className="oa-admin-btn primary"
                style={{ width: '100%', marginTop: 18, minHeight: 44 }}
                disabled={busy}
              >
                {busy ? 'Verifying…' : 'Sign in to admin panel'}
              </button>
              <button
                type="button"
                className="oa-admin-btn ghost"
                style={{ width: '100%', marginTop: 8 }}
                onClick={() => {
                  setStep('credentials');
                  setCode('');
                  setError('');
                }}
              >
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
