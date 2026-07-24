'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@common/ui/button';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import { Alert, AlertDescription } from '@common/ui/alert';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

interface NextOfKinLoginPageProps {
  onLoginSuccess: (nokData: any) => void;
  onBackToOwner: () => void;
  formData: any;
  captchaSlot?: React.ReactNode;
  /** When captcha is shown, block submit until Cloudflare finishes. */
  captchaReady?: boolean;
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
  const [failedAttempts] = useState(0);
  const [isLocked] = useState(false);

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      setError('Please fill in both fields.');
      return;
    }
    if (captchaSlot && !captchaReady) {
      setError('Complete the security check before signing in.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await onLoginSuccess({ email: emailOrPhone, password });
    } catch (err: any) {
      setError(err?.message || 'Login failed');
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
    (!captchaSlot || captchaReady);

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col overflow-x-hidden"
      style={{
        background:
          'radial-gradient(1000px 480px at 50% -10%, rgba(37,99,235,0.14), transparent 55%), linear-gradient(180deg, #10213f 0%, #152a4d 36%, #eef2f7 36%, #f8fafc 100%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[40%] opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:max-w-lg">
        <button
          type="button"
          onClick={onBackToOwner}
          className="mb-6 inline-flex w-auto items-center gap-1.5 self-start rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white/90 ring-1 ring-white/15 transition active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Owner dashboard
        </button>

        <div className="mb-6 flex items-start gap-3 text-white sm:mb-8">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-white/12 ring-1 ring-white/20">
            <Image
              src="/images/brand-logo.png"
              alt="Orderly Affairs"
              width={40}
              height={40}
              className="h-9 w-9 rounded-lg object-contain"
            />
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/60">
              Orderly Affairs
            </p>
            <h1 className="mt-1 text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-[2rem]">
              Next of Kin
            </h1>
            <p className="mt-1.5 text-sm leading-6 text-white/70">
              Secure access to the vault shared with you.
            </p>
          </div>
        </div>

        <div className="mt-auto rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_28px_70px_rgba(16,33,63,0.16)] sm:p-7">
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#10213f]" />
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[#10213f]">
                Sign in
              </h2>
              <p className="text-[13px] text-slate-500">
                Registered email and password
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {error ? (
              <Alert variant={isLocked ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {failedAttempts > 0 && failedAttempts < 3 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {3 - failedAttempts} attempt
                  {3 - failedAttempts !== 1 ? 's' : ''} remaining before lockout.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#10213f]">
                Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={emailOrPhone}
                  onChange={e => setEmailOrPhone(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="h-12 rounded-2xl border-slate-200 bg-[#f8fafc] pl-10"
                  disabled={isLocked || isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#10213f]">
                Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="h-12 rounded-2xl border-slate-200 bg-[#f8fafc] pl-10 pr-11"
                  disabled={isLocked || isLoading}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-[#10213f]"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLocked || isLoading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {captchaSlot ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/90 p-2.5">
                <div className="flex min-h-[65px] items-center justify-center">
                  {captchaSlot}
                </div>
              </div>
            ) : null}

            <Button
              onClick={() => void handleLogin()}
              disabled={!isFormValid || isLocked || isLoading || (Boolean(captchaSlot) && !captchaReady)}
              className="h-12 w-full rounded-2xl bg-[#10213f] text-[15px] font-semibold text-white hover:bg-[#1a335f] sm:w-auto sm:min-w-[200px] sm:px-8"
              size="lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Authenticating…
                </span>
              ) : captchaSlot && !captchaReady ? (
                'Waiting for security check…'
              ) : (
                'Continue securely'
              )}
            </Button>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] leading-5 text-slate-500">
          Protected access for authorized next of kin only
        </p>
      </div>
    </div>
  );
};
