'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@common/ui/utils';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, AlertTriangle } from 'lucide-react';
import { BRAND_LOGO } from '@/constants/brand';

interface NextOfKinLoginPageProps {
  onLoginSuccess: (nokData: {
    email: string;
    password: string;
  }) => void | Promise<void>;
  onBackToOwner: () => void;
  formData?: unknown;
  captchaSlot?: React.ReactNode;
  /** When captcha is shown, block submit until Cloudflare finishes. */
  captchaReady?: boolean;
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

function BrandAside({ onBackToOwner }: { onBackToOwner: () => void }) {
  return (
    <aside className="relative hidden min-h-[100dvh] w-full max-w-[min(100%,37.5rem)] flex-col bg-[#213D59] px-12 py-12 text-white lg:flex">
      <button
        type="button"
        onClick={onBackToOwner}
        className="inline-flex h-11 w-fit items-center gap-2 self-start rounded-2xl bg-white/10 px-3.5 text-[12.5px] font-medium text-white/90"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.7} />
        Owner dashboard
      </button>

      <div className="mt-auto flex items-start gap-[18px]">
        <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[18px] bg-white">
          <Image
            src={BRAND_LOGO}
            alt="Orderly Affairs"
            width={42}
            height={42}
            className="h-[70%] w-[70%] object-contain"
            priority
          />
        </div>
        <div className="min-w-0">
          <p className="nok-mono m-0 text-[11px] font-medium tracking-[0.14em] uppercase text-white/55">
            Orderly Affairs
          </p>
          <h1 className="nok-serif mt-2.5 mb-0 text-[40px] leading-[1.1] font-normal text-white">
            Next of Kin
          </h1>
          <p className="mt-3.5 mb-0 max-w-[40ch] text-[16px] leading-[1.7] text-white/72">
            Secure access to the vault shared with you.
          </p>
        </div>
      </div>

      <p className="mt-10 mb-0 border-t border-white/14 pt-[22px] text-[13.5px] leading-[1.7] text-white/60">
        You&apos;ll receive an email or SMS notification for every sign-in.
        Access is logged with time and IP address.
      </p>
    </aside>
  );
}

function MobileBrandHeader({ onBackToOwner }: { onBackToOwner: () => void }) {
  return (
    <div className="bg-[#213D59] px-5 pb-[30px] pt-[max(0.75rem,env(safe-area-inset-top))] text-white lg:hidden">
      <button
        type="button"
        onClick={onBackToOwner}
        className="inline-flex h-11 w-fit items-center gap-[7px] rounded-[15px] bg-white/10 px-3 text-xs font-medium text-white/90"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.7} />
        Owner dashboard
      </button>

      <div className="mt-[22px] flex items-start gap-3.5">
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-white">
          <Image
            src={BRAND_LOGO}
            alt="Orderly Affairs"
            width={36}
            height={36}
            className="h-[70%] w-[70%] object-contain"
            priority
          />
        </div>
        <div className="min-w-0">
          <p className="nok-mono m-0 text-[9.5px] font-medium tracking-[0.14em] uppercase text-white/55">
            Orderly Affairs
          </p>
          <h1 className="nok-serif mt-1.5 mb-0 text-[28px] leading-[1.1] font-normal text-white">
            Next of Kin
          </h1>
          <p className="mt-2 mb-0 text-sm leading-[1.55] text-white/70">
            Secure access to the vault shared with you.
          </p>
        </div>
      </div>
    </div>
  );
}

export const NextOfKinLoginPage: React.FC<NextOfKinLoginPageProps> = ({
  onLoginSuccess,
  onBackToOwner,
  captchaSlot,
  captchaReady = true,
}) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  const maxAttempts = 3;
  const attemptsLeft = Math.max(0, maxAttempts - failedAttempts);
  const isLocked = failedAttempts >= maxAttempts;

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
      await onLoginSuccess({ email: emailOrPhone, password });
      setFailedAttempts(0);
    } catch (err: unknown) {
      setFailedAttempts(n => n + 1);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleLogin();
    }
  };

  const isFormValid =
    emailOrPhone.trim().length > 0 &&
    password.trim().length > 0 &&
    (!captchaSlot || captchaReady) &&
    !isLocked;

  return (
    <div className="nok-login flex min-h-[100dvh] flex-col lg:flex-row">
      <BrandAside onBackToOwner={onBackToOwner} />
      <MobileBrandHeader onBackToOwner={onBackToOwner} />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:items-center lg:justify-center lg:p-12">
        <div className="mx-auto flex w-full max-w-[min(100%,28.75rem)] flex-1 flex-col lg:flex-none">
          <div className="rounded-[18px] border border-[#e4e6e1] bg-white p-5 lg:p-[34px]">
            <div className="flex items-center gap-[11px]">
              <ShieldIcon className="shrink-0" />
              <div className="min-w-0">
                <h2 className="m-0 text-[17px] font-semibold text-[#213D59] lg:text-[19px]">
                  Sign in
                </h2>
                <p className="mt-0.5 mb-0 text-[12.5px] text-[#8b9995] lg:mt-[2px] lg:text-[13px]">
                  Registered email and password
                </p>
              </div>
            </div>

            {error ? (
              <div
                className={cn(
                  'mt-5 flex items-start gap-2.5 rounded-xl border px-3.5 py-[13px] text-[13px] leading-[1.5]',
                  isLocked
                    ? 'border-[#f0c9c5] bg-[#fdf4f3] text-[#b4483f]'
                    : 'border-[#e8d9b5] bg-[#fdf8ee] text-[#8a6420]',
                )}
              >
                <AlertTriangle className="mt-px h-[15px] w-[15px] shrink-0" strokeWidth={1.9} />
                <span>{error}</span>
              </div>
            ) : null}

            {!error && failedAttempts > 0 && attemptsLeft > 0 ? (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#e8d9b5] bg-[#fdf8ee] px-3.5 py-[13px] text-[13px] leading-[1.5] text-[#8a6420]">
                <AlertTriangle className="mt-px h-[15px] w-[15px] shrink-0" strokeWidth={1.9} />
                <span>
                  {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
                  before lockout.
                </span>
              </div>
            ) : null}

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
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="nok-field nok-field-password"
                  disabled={isLocked || isLoading}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[#8b9995]"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLocked || isLoading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
              <div className="mt-4 rounded-[14px] border border-[#f2f1ec] bg-[#f5f8fc] p-2.5 lg:mt-4 lg:p-2.5">
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
          </div>

          <p className="mt-auto pt-[18px] text-center text-xs text-[#8b9995] lg:mt-[18px] lg:pt-0 lg:text-[12.5px]">
            Protected access for authorized next of kin only
          </p>
        </div>
      </div>
    </div>
  );
};
