'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@common/ui/button';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@common/ui/sheet';
import {
  useGenerateMfaMutation,
  useGetMeQuery,
  useLinkAuthenticatorMutation,
  useStartEmailMfaMutation,
  useVerifyEmailCodeMutation,
} from '@/services/authApi';
import { getOtpSessionId } from '@/utils/otpSession';
import { getSafeErrorMessage } from '@/utils/safeErrorMessage';

type SetupMode = null | 'authenticator' | 'email';

/**
 * NOK / family MFA enrollment — authenticator app + email OTP.
 * Uses the same backend endpoints as owner Vault Settings.
 */
export function NokMfaSettingsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: me, refetch } = useGetMeQuery(undefined, { skip: !open });
  const [generateMfa] = useGenerateMfaMutation();
  const [linkAuthenticator] = useLinkAuthenticatorMutation();
  const [startEmailMfa] = useStartEmailMfaMutation();
  const [verifyEmailCode] = useVerifyEmailCodeMutation();

  const [setupMode, setSetupMode] = useState<SetupMode>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const email = me?.email || '';
  const methods = me?.mfa_methods || {};
  const hasAuthenticator = Boolean(methods.authenticator);
  const hasEmail = Boolean(methods.email);

  const resetSetup = () => {
    setSetupMode(null);
    setQrCodeUrl('');
    setCode('');
  };

  const startAuthenticator = async () => {
    if (!email) return;
    setBusy(true);
    try {
      const res = await generateMfa({ email }).unwrap();
      setQrCodeUrl(res.qrCodeUrl || '');
      setSetupMode('authenticator');
      setCode('');
    } catch (err: unknown) {
      toast.error(getSafeErrorMessage(err, 'Could not start authenticator setup'));
    } finally {
      setBusy(false);
    }
  };

  const confirmAuthenticator = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast.error('Enter the 6-digit authenticator code');
      return;
    }
    setBusy(true);
    try {
      await linkAuthenticator({ email, code }).unwrap();
      toast.success('Authenticator MFA enabled');
      resetSetup();
      await refetch();
    } catch (err: unknown) {
      toast.error(getSafeErrorMessage(err, 'Invalid authenticator code'));
    } finally {
      setBusy(false);
    }
  };

  const startEmail = async () => {
    if (!email) return;
    setBusy(true);
    try {
      await startEmailMfa({
        email,
        otp_session_id: getOtpSessionId(),
      }).unwrap();
      setSetupMode('email');
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
      resetSetup();
      await refetch();
    } catch (err: unknown) {
      toast.error(getSafeErrorMessage(err, 'Invalid email code'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={next => {
        if (!next) resetSetup();
        onOpenChange(next);
      }}
    >
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-[#213D59]">
            <ShieldCheck className="h-5 w-5" />
            Sign-in security
          </SheetTitle>
          <SheetDescription>
            Link an authenticator app and/or email codes. These are required
            after your password when MFA is enabled.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Signed in as <span className="font-medium text-[#213D59]">{email || '…'}</span>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[#213D59]">Authenticator app</p>
                <p className="mt-1 text-xs text-slate-500">
                  Google Authenticator, Authy, or similar
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  hasAuthenticator
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {hasAuthenticator ? 'Linked' : 'Off'}
              </span>
            </div>
            {!hasAuthenticator && setupMode !== 'authenticator' ? (
              <Button
                type="button"
                className="mt-4 h-10 w-full rounded-xl"
                disabled={busy || !email}
                onClick={() => void startAuthenticator()}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set up authenticator'}
              </Button>
            ) : null}
            {setupMode === 'authenticator' && qrCodeUrl ? (
              <div className="mt-4 space-y-3">
                <div className="flex justify-center rounded-xl border bg-white p-3">
                  <Image
                    src={qrCodeUrl}
                    alt="Authenticator QR code"
                    width={180}
                    height={180}
                    unoptimized
                  />
                </div>
                <Label htmlFor="nok-totp">6-digit code</Label>
                <Input
                  id="nok-totp"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="tracking-[0.3em]"
                />
                <Button
                  type="button"
                  className="h-10 w-full rounded-xl"
                  disabled={busy || code.length !== 6}
                  onClick={() => void confirmAuthenticator()}
                >
                  Confirm authenticator
                </Button>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[#213D59]">Email codes</p>
                <p className="mt-1 text-xs text-slate-500">
                  One-time code sent to your email at login
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  hasEmail
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {hasEmail ? 'Linked' : 'Off'}
              </span>
            </div>
            {!hasEmail && setupMode !== 'email' ? (
              <Button
                type="button"
                className="mt-4 h-10 w-full rounded-xl"
                disabled={busy || !email}
                onClick={() => void startEmail()}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enable email MFA'}
              </Button>
            ) : null}
            {setupMode === 'email' ? (
              <div className="mt-4 space-y-3">
                <Label htmlFor="nok-email-otp">Code from email</Label>
                <Input
                  id="nok-email-otp"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="tracking-[0.3em]"
                />
                <Button
                  type="button"
                  className="h-10 w-full rounded-xl"
                  disabled={busy || code.length !== 6}
                  onClick={() => void confirmEmail()}
                >
                  Confirm email MFA
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
