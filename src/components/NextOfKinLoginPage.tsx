'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import { InlineNotice } from '@/components/common/ui/inline-notice';
import { SessionExpiredNotice } from '@/components/SessionExpiredNotice';
import { BrandLogo } from '@/components/BrandLogo';
import {
  useStartEmailMfaMutation,
  useVerifyEmailCodeMutation,
  useVerifyTotpMutation,
  type LoginResponse,
  type MFAMethod,
} from '@/services/authApi';
import { getOtpSessionId } from '@/utils/otpSession';
import { getSafeErrorMessage } from '@/utils/safeErrorMessage';
import {
  collaboratorPortalMismatch,
  type CollaboratorPortal,
} from '@/utils/portalLogin';

interface NextOfKinLoginPageProps {
  /** Password step — return API body (may be MFA challenge or authenticated). */
  onLoginSuccess: (nokData: {
    email: string;
    password: string;
  }) => Promise<LoginResponse | void> | LoginResponse | void;
  /** Called after password+MFA session is established. */
  onAuthenticated?: (res: LoginResponse) => void | Promise<void>;
  onBackToOwner: () => void;
  formData?: unknown;
  captchaSlot?: React.ReactNode;
  /** When captcha is shown, block submit until Cloudflare finishes. */
  captchaReady?: boolean;
  titleOverride?: string;
  subtitleOverride?: string;
  /** Reject the other collaborator type after password/MFA. */
  expectedPortal?: CollaboratorPortal;
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#213D59"
      strokeWidth="1.7"
      className={className}
      aria-hidden
    >
      <path
        d="M12 3l7 3v5.5c0 4.2-2.9 7.6-7 8.5-4.1-.9-7-4.3-7-8.5V6z"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BrandAside({
  onBackToOwner,
  title,
  subtitle,
}: {
  onBackToOwner: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <aside className="relative hidden min-h-[100dvh] w-full max-w-[min(100%,37.5rem)] flex-col bg-[#213D59] px-12 py-12 text-white lg:flex">
      <button
        type="button"
        onClick={onBackToOwner}
        className="inline-flex h-11 w-fit items-center gap-2 self-start rounded-2xl bg-white/10 px-3.5 text-[12.5px] font-medium text-white/90"
        style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif' }}
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.7} />
        Owner sign-in
      </button>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[18px] bg-white">
          <BrandLogo size={42} className="h-[70%] w-[70%]" />
        </div>
        <p className="nok-mono mt-4 mb-0 text-[11px] font-medium tracking-[0.14em] uppercase text-white/55">
          Orderly Affairs
        </p>
        <h1 className="nok-serif mt-2.5 mb-0 max-w-[18ch] text-[40px] leading-[1.1] font-normal text-white">
          {title}
        </h1>
        <p className="mt-3.5 mb-0 max-w-[40ch] text-[16px] leading-[1.7] text-white/72">
          {subtitle}
        </p>
      </div>

      <p className="mt-0 mb-0 border-t border-white/14 pt-[22px] text-center text-[13.5px] leading-[1.7] text-white/60">
        You&apos;ll receive an email or SMS notification for every sign-in.
        Access is logged with time and IP address.
      </p>
    </aside>
  );
}

function MobileBrandHeader({
  onBackToOwner,
  title,
  subtitle,
}: {
  onBackToOwner: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="bg-[#213D59] px-5 pb-[30px] pt-[max(0.75rem,env(safe-area-inset-top))] text-white lg:hidden">
      <button
        type="button"
        onClick={onBackToOwner}
        className="inline-flex h-11 w-fit items-center gap-[7px] rounded-[15px] bg-white/10 px-3 text-xs font-medium text-white/90"
        style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif' }}
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.7} />
        Owner sign-in
      </button>

      <div className="mt-[22px] flex flex-col items-center text-center">
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-white">
          <BrandLogo size={36} className="h-[70%] w-[70%]" />
        </div>
        <p className="nok-mono mt-3 mb-0 text-[9.5px] font-medium tracking-[0.14em] uppercase text-white/55">
          Orderly Affairs
        </p>
        <h1 className="nok-serif mt-1.5 mb-0 text-[28px] leading-[1.1] font-normal text-white">
          {title}
        </h1>
        <p className="mt-2 mb-0 max-w-[40ch] text-sm leading-[1.55] text-white/70">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export const NextOfKinLoginPage: React.FC<NextOfKinLoginPageProps> = ({
  onLoginSuccess,
  onAuthenticated,
  onBackToOwner,
  captchaSlot,
  captchaReady = true,
  titleOverride,
  subtitleOverride,
  expectedPortal,
}) => {
  const title = titleOverride || 'Next of Kin';
  const subtitle =
    subtitleOverride || 'Secure access to the vault shared with you.';
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const passwordRef = useRef('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  const [mfaStep, setMfaStep] = useState(false);
  const [mfaMethod, setMfaMethod] = useState<MFAMethod | null>(null);
  const [mfaMethods, setMfaMethods] = useState<MFAMethod[]>([]);
  const [mfaChallengeToken, setMfaChallengeToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const [verifyTotp] = useVerifyTotpMutation();
  const [verifyEmailCode] = useVerifyEmailCodeMutation();
  const [startEmailMfa] = useStartEmailMfaMutation();

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = window.setTimeout(
      () => setOtpCooldown(seconds => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [otpCooldown]);

  const maxAttempts = 3;
  const attemptsLeft = Math.max(0, maxAttempts - failedAttempts);
  const isLocked = failedAttempts >= maxAttempts;

  const finishAuthenticated = async (res: LoginResponse) => {
    const mismatch = expectedPortal
      ? collaboratorPortalMismatch(res.access_type, expectedPortal)
      : null;
    if (mismatch) {
      try {
        await import('@/libs/secureFetch').then(({ nokLogout }) => nokLogout());
      } catch {
        /* ignore */
      }
      throw new Error(mismatch);
    }
    try {
      const { unlockVaultWithPassword } = await import('@/libs/e2ee/unlock');
      await unlockVaultWithPassword(passwordRef.current || password);
    } catch {
      /* vault may stay locked if wrap not configured */
    }
    if (onAuthenticated) {
      await onAuthenticated(res);
      return;
    }
    if (!res.authenticated) {
      throw new Error('Session not established');
    }
  };

  const enterMfa = async (res: LoginResponse) => {
    const method = (res.method as MFAMethod) || 'authenticator';
    const methods = (
      Array.isArray(res.methods)
        ? res.methods
        : Object.entries(res.mfa_methods || {})
            .filter(([, on]) => on)
            .map(([k]) => k)
    ) as MFAMethod[];

    setMfaChallengeToken(res.mfa_challenge_token || '');
    setMfaMethods(methods.length ? methods : [method]);
    setMfaMethod(method);
    setMfaCode('');
    setMfaStep(true);
    setOtpCooldown(
      typeof res.cooldown_seconds === 'number' && res.cooldown_seconds > 0
        ? res.cooldown_seconds
        : res.otp_sent
          ? 45
          : 0,
    );

    if (method === 'email' && res.mfa_challenge_token && !res.otp_sent) {
      try {
        const sent = await startEmailMfa({
          email: (res.email || emailOrPhone).toLowerCase().trim(),
          mfa_challenge_token: res.mfa_challenge_token,
          otp_session_id: getOtpSessionId(),
        }).unwrap();
        setOtpCooldown(sent.cooldown_seconds ?? 45);
      } catch {
        /* login may already have sent OTP */
      }
    }
  };

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      setError('Please fill in both fields.');
      return;
    }
    if (captchaSlot && !captchaReady) {
      setError('Complete the security check before signing in.');
      return;
    }
    if (isLocked) {
      setError('Too many failed attempts. Try again later.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const res = (await onLoginSuccess({
        email: emailOrPhone,
        password,
      })) as LoginResponse | void;

      if (res && res.mfa_required) {
        const mismatch = expectedPortal
          ? collaboratorPortalMismatch(
              res.access_type || res.portal,
              expectedPortal,
            )
          : null;
        if (mismatch) {
          throw new Error(mismatch);
        }
        await enterMfa(res);
        setFailedAttempts(0);
        return;
      }

      if (res) {
        await finishAuthenticated(res);
      }
      setFailedAttempts(0);
    } catch (err: unknown) {
      setFailedAttempts(n => n + 1);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    const code = mfaCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError('');
    const email = emailOrPhone.toLowerCase().trim();

    try {
      let res: LoginResponse;
      if (mfaMethod === 'email') {
        res = (await verifyEmailCode({
          email,
          code: parseInt(code, 10),
          otp_session_id: getOtpSessionId(),
          mfa_challenge_token: mfaChallengeToken,
        }).unwrap()) as LoginResponse;
      } else {
        res = (await verifyTotp({
          email,
          code,
          mfa_challenge_token: mfaChallengeToken,
        }).unwrap()) as LoginResponse;
      }

      if (!res.authenticated) {
        throw new Error('Session not established');
      }
      await finishAuthenticated(res);
    } catch (err: unknown) {
      setError(getSafeErrorMessage(err, 'Invalid or expired code'));
    } finally {
      setIsLoading(false);
    }
  };

  const switchMfaMethod = async (method: MFAMethod) => {
    setMfaMethod(method);
    setMfaCode('');
    setError('');
    if (method === 'email' && mfaChallengeToken) {
      try {
        const sent = await startEmailMfa({
          email: emailOrPhone.toLowerCase().trim(),
          mfa_challenge_token: mfaChallengeToken,
          otp_session_id: getOtpSessionId(),
        }).unwrap();
        setOtpCooldown(sent.cooldown_seconds ?? 45);
      } catch (err: unknown) {
        setError(getSafeErrorMessage(err, 'Could not send email code'));
      }
    }
  };

  const handleResendCode = async () => {
    if (otpCooldown > 0 || resending || mfaMethod !== 'email') return;
    setResending(true);
    setError('');
    try {
      const sent = await startEmailMfa({
        email: emailOrPhone.toLowerCase().trim(),
        mfa_challenge_token: mfaChallengeToken,
        otp_session_id: getOtpSessionId(),
      }).unwrap();
      setOtpCooldown(sent.cooldown_seconds ?? 45);
    } catch (err: unknown) {
      setError(getSafeErrorMessage(err, 'Could not resend the code'));
    } finally {
      setResending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (mfaStep) void handleVerifyMfa();
      else void handleLogin();
    }
  };

  const isFormValid =
    emailOrPhone.trim().length > 0 &&
    password.trim().length > 0 &&
    (!captchaSlot || captchaReady) &&
    !isLocked;

  return (
    <div className="nok-login flex min-h-[100dvh] flex-col lg:flex-row">
      <BrandAside
        onBackToOwner={onBackToOwner}
        title={title}
        subtitle={subtitle}
      />
      <MobileBrandHeader
        onBackToOwner={onBackToOwner}
        title={title}
        subtitle={subtitle}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:items-center lg:justify-center lg:p-12">
        <div className="mx-auto flex w-full max-w-[min(100%,28.75rem)] flex-1 flex-col lg:flex-none">
          <div className="rounded-[16px] border border-[#E4EAF0] bg-white p-5 lg:p-[34px]">
            <div className="flex items-center gap-[11px]">
              {mfaStep ? (
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#213D59]" />
              ) : (
                <ShieldIcon className="shrink-0" />
              )}
              <div className="min-w-0">
                <h2 className="m-0 text-[17px] font-semibold text-[#213D59] lg:text-[19px]">
                  {mfaStep ? 'Verify identity' : 'Sign in'}
                </h2>
                <p className="mt-0.5 mb-0 text-[12.5px] text-[#8b9995] lg:mt-[2px] lg:text-[13px]">
                  {mfaStep
                    ? mfaMethod === 'email'
                      ? 'Enter the code we emailed you'
                      : 'Enter the code from your authenticator app'
                    : 'Registered email and password'}
                </p>
              </div>
            </div>

            <SessionExpiredNotice className="mt-5" />

            {error ? (
              <InlineNotice
                className="mt-5"
                variant={isLocked ? 'danger' : 'warning'}
                title={error}
              />
            ) : null}

            {!mfaStep && !error && failedAttempts > 0 && attemptsLeft > 0 ? (
              <InlineNotice
                className="mt-5"
                variant="warning"
                title={`${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining before lockout`}
                description={`After ${maxAttempts} failed sign-ins we lock the account for 15 minutes and email you.`}
              />
            ) : null}

            {mfaStep ? (
              <>
                {mfaMethods.length > 1 ? (
                  <div className="mt-5 flex gap-2">
                    {mfaMethods.map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => void switchMfaMethod(method)}
                        className={`rounded-xl px-3 py-2 text-xs font-medium ${
                          mfaMethod === method
                            ? 'bg-[#213D59] text-white'
                            : 'bg-[#F6F8FA] text-[#213D59]'
                        }`}
                      >
                        {method === 'email' ? 'Email' : 'Authenticator'}
                      </button>
                    ))}
                  </div>
                ) : null}

                <label className="mt-[18px] flex flex-col gap-[7px]">
                  <span className="nok-field-label">Verification code</span>
                  <input
                    id="nok-mfa-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={mfaCode}
                    onChange={e =>
                      setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    onKeyDown={handleKeyPress}
                    className="nok-field tracking-[0.35em]"
                    disabled={isLoading}
                  />
                </label>

                {mfaMethod === 'email' ? (
                  <button
                    type="button"
                    className="mt-2.5 text-left text-[13px] font-medium text-[#2E7FAD] disabled:opacity-50"
                    disabled={otpCooldown > 0 || resending || isLoading}
                    onClick={() => void handleResendCode()}
                  >
                    {otpCooldown > 0
                      ? `Resend in ${otpCooldown}s`
                      : resending
                        ? 'Sending…'
                        : 'Resend code'}
                  </button>
                ) : null}

                <button
                  type="button"
                  className="nok-submit"
                  onClick={() => void handleVerifyMfa()}
                  disabled={mfaCode.length !== 6 || isLoading}
                >
                  {isLoading ? 'Verifying…' : 'Verify and continue'}
                </button>

                <button
                  type="button"
                  className="mt-3 w-full text-center text-xs text-[#8b9995]"
                  onClick={() => {
                    setMfaStep(false);
                    setMfaCode('');
                    setError('');
                    setOtpCooldown(0);
                  }}
                  disabled={isLoading}
                >
                  Back to password
                </button>
              </>
            ) : (
              <>
                <label className="mt-[18px] flex flex-col gap-[7px]">
                  <span className="nok-field-label">Email</span>
                  <span className="relative block">
                    <Mail
                      className="pointer-events-none absolute top-1/2 left-3.5 h-[15px] w-[15px] -translate-y-1/2 text-[#a5b1ad]"
                      strokeWidth={1.7}
                    />
                    <input
                      id="nok-email"
                      type="email"
                      autoComplete="email"
                      placeholder="your.email@example.com"
                      value={emailOrPhone}
                      onChange={e => setEmailOrPhone(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="nok-field"
                      disabled={isLocked || isLoading}
                    />
                  </span>
                </label>

                <label className="mt-3.5 flex flex-col gap-[7px] lg:mt-[14px]">
                  <span className="nok-field-label">Password</span>
                  <span className="relative block">
                    <Lock
                      className="pointer-events-none absolute top-1/2 left-3.5 h-[15px] w-[15px] -translate-y-1/2 text-[#8b9995]"
                      strokeWidth={1.7}
                    />
                    <input
                      id="nok-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••••"
                      value={password}
                      onChange={e => {
                        passwordRef.current = e.target.value;
                        setPassword(e.target.value);
                      }}
                      onKeyDown={handleKeyPress}
                      className="nok-field nok-field-password"
                      disabled={isLocked || isLoading}
                    />
                    <button
                      type="button"
                      className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[#8b9995]"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLocked || isLoading}
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" strokeWidth={1.7} />
                      ) : (
                        <Eye className="h-4 w-4" strokeWidth={1.7} />
                      )}
                    </button>
                  </span>
                </label>

                {captchaSlot ? (
                  <div className="mt-4 rounded-[14px] border border-[#f2f1ec] bg-[#F6F8FA] p-2.5 lg:mt-4 lg:p-2.5">
                    <div className="flex min-h-[62px] items-center justify-center overflow-x-auto rounded-[10px] border border-[#e4e6e1] bg-white px-3.5 py-2 lg:min-h-[65px]">
                      {captchaSlot}
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  className="nok-submit"
                  onClick={() => void handleLogin()}
                  disabled={!isFormValid || isLoading}
                >
                  {isLoading
                    ? 'Authenticating…'
                    : captchaSlot && !captchaReady
                      ? 'Waiting for security check…'
                      : 'Continue securely'}
                </button>
              </>
            )}
          </div>

          <p className="mt-auto pt-[18px] text-center text-xs text-[#8b9995] lg:mt-[18px] lg:pt-0 lg:text-[12.5px]">
            Protected access for family members and next of kin
            <br />
            <a
              href="/next-kin/instructions"
              className="mt-1.5 inline-block font-medium text-[#2E7FAD]"
            >
              Instructions for next of kin
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
