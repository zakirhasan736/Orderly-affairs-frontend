'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/BrandLogo';
import { fetchSession } from '@/libs/secureFetch';
import { FAMILY_PORTAL_ROLE_LABELS } from '@/utils/familyDashboardAccess';
import { getSafeErrorMessage } from '@/utils/safeErrorMessage';
import {
  useCollaboratorChangePasswordMutation,
  useGenerateMfaMutation,
  useGetMeQuery,
  useLinkAuthenticatorMutation,
  useStartEmailMfaMutation,
  useVerifyEmailCodeMutation,
} from '@/services/authApi';

type SetupState = {
  mustChangePassword: boolean;
  mustEnrollMfa: boolean;
  email: string;
  fullName?: string;
  portalRoleLabel?: string;
};

export function CollaboratorFirstLoginGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginSurface =
    pathname === '/next-kin' ||
    pathname === '/next-kin/' ||
    pathname.startsWith('/next-kin/claim') ||
    pathname.startsWith('/next-kin/verify-identity') ||
    pathname.startsWith('/verify-identity') ||
    pathname.startsWith('/next-kin/instructions') ||
    pathname.startsWith('/instructions-for-next-of-kin') ||
    pathname.startsWith('/how-next-of-kin-access-works') ||
    pathname.startsWith('/family');
  const [checked, setChecked] = useState(isLoginSurface);
  const [setup, setSetup] = useState<SetupState | null>(null);

  const refresh = useCallback(async () => {
    const session = await fetchSession();
    if (
      session.authenticated &&
      session.role === 'nextkin' &&
      (session.must_change_password || session.must_enroll_mfa)
    ) {
      setSetup({
        mustChangePassword: Boolean(session.must_change_password),
        mustEnrollMfa: Boolean(session.must_enroll_mfa),
        email: session.email || '',
        fullName: session.full_name,
        portalRoleLabel:
          session.portal_role_label ||
          FAMILY_PORTAL_ROLE_LABELS[session.portal_role || ''] ||
          undefined,
      });
    } else {
      setSetup(null);
    }
    setChecked(true);
  }, []);

  useEffect(() => {
    if (isLoginSurface) {
      setSetup(null);
      setChecked(true);
      return;
    }
    void refresh();
  }, [refresh, pathname, isLoginSurface]);

  if (!checked) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F6F8FA]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E4EAF0] border-t-[#3EB1E5]" />
      </div>
    );
  }

  if (!setup) return children;

  return (
    <FirstLoginWizard
      setup={setup}
      onComplete={() => {
        setSetup(null);
      }}
      onRefresh={refresh}
    />
  );
}

function FirstLoginWizard({
  setup,
  onComplete,
  onRefresh,
}: {
  setup: SetupState;
  onComplete: () => void;
  onRefresh: () => Promise<void>;
}) {
  const step = setup.mustChangePassword ? 'password' : 'mfa';
  const greeting = setup.fullName
    ? `Welcome, ${setup.fullName.split(' ')[0]}`
    : 'Secure your access';

  return (
    <div className="min-h-[100dvh] bg-[#F6F8FA] px-4 py-10">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-[#213D59]/10">
            <BrandLogo size={36} alt="" className="h-8 w-8" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7A8794]">
              First sign-in
            </p>
            <h1 className="text-[22px] font-bold tracking-tight text-[#213D59]">
              {greeting}
            </h1>
            {setup.portalRoleLabel ? (
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {setup.portalRoleLabel}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mb-4 flex gap-2 text-[12px] font-semibold">
          <span
            className={
              step === 'password'
                ? 'rounded-full bg-[#213D59] px-3 py-1 text-white'
                : 'rounded-full bg-[#E8F6F0] px-3 py-1 text-[#1F9D6B]'
            }
          >
            1. New password
          </span>
          <span
            className={
              step === 'mfa'
                ? 'rounded-full bg-[#213D59] px-3 py-1 text-white'
                : 'rounded-full bg-white px-3 py-1 text-[#7A8794] ring-1 ring-[#E4EAF0]'
            }
          >
            2. Two-factor authentication
          </span>
        </div>

        {step === 'password' ? (
          <PasswordStep
            onDone={async () => {
              await onRefresh();
            }}
          />
        ) : (
          <MfaStep
            email={setup.email}
            onDone={async () => {
              await onRefresh();
              onComplete();
            }}
          />
        )}
      </div>
    </div>
  );
}

function PasswordStep({ onDone }: { onDone: () => Promise<void> }) {
  const [changePassword, { isLoading }] = useCollaboratorChangePasswordMutation();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);

  const submit = async () => {
    if (next.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (next !== confirm) {
      toast.error('New password and confirmation do not match');
      return;
    }
    try {
      await changePassword({
        current_password: current,
        new_password: next,
      }).unwrap();
      try {
        const { unlockVaultWithPassword } = await import('@/libs/e2ee/unlock');
        await unlockVaultWithPassword(next);
      } catch {
        /* wrap may not exist yet */
      }
      toast.success('Password updated');
      await onDone();
    } catch (err: unknown) {
      toast.error(getSafeErrorMessage(err, 'Could not update password'));
    }
  };

  return (
    <div className="rounded-[20px] border border-[#E4EAF0] bg-white p-6 shadow-sm">
      <p className="text-[15px] font-bold text-[#213D59]">Choose your own password</p>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#7A8794]">
        Replace the temporary password from your invite. You will use this new
        password from now on.
      </p>
      <Field
        label="Current password"
        value={current}
        onChange={setCurrent}
        show={show}
        onToggle={() => setShow(v => !v)}
      />
      <Field
        label="New password"
        value={next}
        onChange={setNext}
        show={show}
        onToggle={() => setShow(v => !v)}
      />
      <Field
        label="Confirm new password"
        value={confirm}
        onChange={setConfirm}
        show={show}
        onToggle={() => setShow(v => !v)}
      />
      <button
        type="button"
        disabled={isLoading}
        onClick={() => void submit()}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#213D59] text-[14px] font-semibold text-white disabled:opacity-60"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Save password and continue
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="mt-4 block">
      <span className="mb-1 block text-[12px] font-semibold text-[#6A7481]">
        {label}
      </span>
      <span className="relative block">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={event => onChange(event.target.value)}
          className="h-11 w-full rounded-[10px] border border-[#E4EAF0] px-3 pr-10 text-[15px] text-[#213D59] outline-none focus:border-[#3EB1E5]"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8794]"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}

function MfaStep({ email, onDone }: { email: string; onDone: () => Promise<void> }) {
  const { data: me, refetch } = useGetMeQuery();
  const [generateMfa] = useGenerateMfaMutation();
  const [linkAuthenticator] = useLinkAuthenticatorMutation();
  const [startEmailMfa] = useStartEmailMfaMutation();
  const [verifyEmailCode] = useVerifyEmailCodeMutation();
  const [mode, setMode] = useState<'choose' | 'authenticator' | 'email'>('choose');
  const [qr, setQr] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const startAuth = async () => {
    setBusy(true);
    try {
      const res = await generateMfa({ email }).unwrap();
      setQr(res.qrCodeUrl || '');
      setMode('authenticator');
      setCode('');
    } catch (err: unknown) {
      toast.error(getSafeErrorMessage(err, 'Could not start authenticator setup'));
    } finally {
      setBusy(false);
    }
  };

  const confirmAuth = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast.error('Enter the 6-digit authenticator code');
      return;
    }
    setBusy(true);
    try {
      await linkAuthenticator({ email, code }).unwrap();
      toast.success('Authenticator MFA enabled');
      await refetch();
      await onDone();
    } catch (err: unknown) {
      toast.error(getSafeErrorMessage(err, 'Invalid authenticator code'));
    } finally {
      setBusy(false);
    }
  };

  const startEmail = async () => {
    setBusy(true);
    try {
      await startEmailMfa({
        email,
        otp_session_id: getOtpSessionId(),
      }).unwrap();
      setMode('email');
      setCode('');
      toast.success('Verification code sent to your email');
    } catch (err: unknown) {
      toast.error(getSafeErrorMessage(err, 'Could not send email code'));
    } finally {
      setBusy(false);
    }
  };

  const confirmEmail = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast.error('Enter the 6-digit email code');
      return;
    }
    setBusy(true);
    try {
      await verifyEmailCode({
        email,
        code: parseInt(code, 10),
        otp_session_id: getOtpSessionId(),
      }).unwrap();
      toast.success('Email MFA enabled');
      await refetch();
      await onDone();
    } catch (err: unknown) {
      toast.error(getSafeErrorMessage(err, 'Invalid email code'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[20px] border border-[#E4EAF0] bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-[#213D59]">
        <ShieldCheck className="h-5 w-5" />
        <p className="text-[15px] font-bold">Set up two-factor authentication</p>
      </div>
      <p className="text-[13.5px] leading-relaxed text-[#7A8794]">
        After you sign in with your password, you will need a second step. Choose
        an authenticator app or email codes.
      </p>

      {mode === 'choose' ? (
        <div className="mt-5 space-y-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void startAuth()}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#213D59] text-[14px] font-semibold text-white disabled:opacity-60"
          >
            Use an authenticator app
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void startEmail()}
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#E4EAF0] bg-white text-[14px] font-semibold text-[#213D59] disabled:opacity-60"
          >
            Use email codes
          </button>
        </div>
      ) : null}

      {mode === 'authenticator' ? (
        <div className="mt-4 space-y-3">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Authenticator QR code" className="mx-auto h-44 w-44" />
          ) : null}
          <p className="text-center text-[12.5px] text-[#7A8794]">
            Scan with Google Authenticator, Authy, or 1Password, then enter the
            6-digit code.
          </p>
          <input
            value={code}
            onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            placeholder="000000"
            className="h-11 w-full rounded-[10px] border border-[#E4EAF0] px-3 text-center text-[18px] tracking-[0.3em] text-[#213D59]"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void confirmAuth()}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#213D59] text-[14px] font-semibold text-white disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enable authenticator'}
          </button>
        </div>
      ) : null}

      {mode === 'email' ? (
        <div className="mt-4 space-y-3">
          <p className="text-[13px] text-[#7A8794]">
            Enter the 6-digit code we sent to {email}.
          </p>
          <input
            value={code}
            onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            placeholder="000000"
            className="h-11 w-full rounded-[10px] border border-[#E4EAF0] px-3 text-center text-[18px] tracking-[0.3em] text-[#213D59]"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void confirmEmail()}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#213D59] text-[14px] font-semibold text-white disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enable email MFA'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
