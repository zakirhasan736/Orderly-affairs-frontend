
'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Cookies from 'js-cookie';
import {
  ChevronRight,
  Mail,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@common/ui/button';
import { cn } from '@common/ui/utils';
import {
  MobileBottomSheet,
  MobileSheetHandle,
  MOBILE_SHEET_SCROLL_PADDING,
  useIsMobile,
} from '@/components/MobileBottomSheet';
import { SixDigitOtpInput } from '@/components/SixDigitOtpInput';
import {
  useGetStatusQuery,
  useGetInvoicesQuery,
  useCreateCustomerMutation,
  // useStartSubscriptionMutation,
  useChangePlanMutation,
  usePauseSubscriptionMutation,
  useResumeSubscriptionMutation,
  usePortalMutation,
} from '@/services/billingApi';
import {
  type MFAMethod,
  useDisableMfaMethodMutation,
  useGenerateMfaMutation,
  useGetMeQuery,
  useLinkAuthenticatorMutation,
  useSendEmailOtpMutation,
  useStartSmsMfaMutation,
  useVerifyEmailCodeMutation,
  useVerifySmsOtpMutation,
} from '@/services/authApi';
import { StripePaymentForm } from './StripePaymentForm';
import { PhoneNumberInput } from './PhoneNumberInput';
import { TurnstileCaptcha } from './TurnstileCaptcha';
import { isValidE164PhoneNumber } from '@/utils/phoneCountries';
import { getOtpSessionId } from '@/utils/otpSession';
interface InvoiceLine {
  description: string;
  amount: number;
  proration?: boolean;
}

interface Invoice {
  id: string;
  created: number;
  amount_due: number;
  status: string;
  pdf?: string;
  lines?: InvoiceLine[];
}

/* ---------------- Skeleton ---------------- */
const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

/* ---------------- Helpers ---------------- */
const daysBetween = (end: string) =>
  Math.max(
    0,
    Math.ceil((new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

const formatDate = (unix: number) =>
  new Date(unix * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const mfaOptions: Array<{
  id: MFAMethod;
  title: string;
  desc: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'authenticator',
    title: 'Authenticator App',
    desc: 'Use a QR-based app such as Google Authenticator or Authy.',
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    id: 'email',
    title: 'Email Verification',
    desc: 'Receive verification codes at your owner account email.',
    icon: <Mail className="h-5 w-5" />,
  },
  {
    id: 'sms',
    title: 'SMS Text Code',
    desc: 'Receive verification codes on a verified mobile number.',
    icon: <MessageSquare className="h-5 w-5" />,
  },
];

const getErrorMessage = (err: unknown, fallback: string) => {
  if (
    err &&
    typeof err === 'object' &&
    'data' in err &&
    err.data &&
    typeof err.data === 'object' &&
    'detail' in err.data &&
    typeof err.data.detail === 'string'
  ) {
    return err.data.detail;
  }

  return fallback;
};

/* ---------------- Component ---------------- */
const VaultSettings = () => {
  const {
    data: status,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useGetStatusQuery();
  const { data: invoices, isLoading: invoicesLoading } = useGetInvoicesQuery();
  const {
    data: me,
    isLoading: meLoading,
    refetch: refetchMe,
  } = useGetMeQuery();

  const [createCustomer] = useCreateCustomerMutation();
  // const [startSubscription] = useStartSubscriptionMutation();
  const [changePlan] = useChangePlanMutation();
  const [sendEmailOtp] = useSendEmailOtpMutation();
  const [verifyEmailCode] = useVerifyEmailCodeMutation();
  const [generateMfa] = useGenerateMfaMutation();
  const [linkAuthenticator] = useLinkAuthenticatorMutation();
  const [startSmsMfa] = useStartSmsMfaMutation();
  const [verifySmsOtp] = useVerifySmsOtpMutation();
  const [disableMfaMethod] = useDisableMfaMethodMutation();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>(
    'yearly',
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [securityLoading, setSecurityLoading] = useState<MFAMethod | null>(
    null,
  );
  const [setupMethod, setSetupMethod] = useState<MFAMethod | null>(null);
  const [mfaSheetMethod, setMfaSheetMethod] = useState<MFAMethod | null>(null);
  const isMobile = useIsMobile();
  const [emailCode, setEmailCode] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsPhone, setSmsPhone] = useState('');
  const [showSmsPhoneValidation, setShowSmsPhoneValidation] = useState(false);
  const [smsCaptchaToken, setSmsCaptchaToken] = useState('');
  const [emailCaptchaToken, setEmailCaptchaToken] = useState('');
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [emailAttempts, setEmailAttempts] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [authCode, setAuthCode] = useState('');
  const autoEmailVerifyKey = useRef('');
  const autoAuthenticatorVerifyKey = useRef('');
  const autoSmsVerifyKey = useRef('');
const [pauseSub] = usePauseSubscriptionMutation();
const [resumeSub] = useResumeSubscriptionMutation();
const [openPortal] = usePortalMutation();

const pauseSubscription = async () => {
  await pauseSub();
  await refetchStatus();
};

const resumeSubscription = async () => {
  await resumeSub().unwrap();
  await refetchStatus();
};

const openBillingPortal = async () => {
  const { url } = await openPortal().unwrap();
  window.location.href = url;
};

const saveToken = useCallback((token?: string) => {
  if (!token) return;
  Cookies.set('auth_token', token, {
    secure: true,
    sameSite: 'strict',
    path: '/',
  });
}, []);

const MAX_EMAIL_ATTEMPTS = 5;

const beginEmailMfa = async () => {
  if (!me?.email) return;

  if (!emailCaptchaToken) {
    toast.error('Complete the CAPTCHA before requesting an OTP');
    return;
  }

  setSecurityLoading('email');
  try {
    const res = await sendEmailOtp({
      email: me.email,
      captcha_token: emailCaptchaToken,
      otp_session_id: getOtpSessionId(),
    }).unwrap();
    setSetupMethod('email');
    setEmailCode('');
    setEmailAttempts(0);
    setEmailCooldown(res.cooldown_seconds ?? 60);
    setEmailCaptchaToken('');
    toast.success('Email verification code sent');
  } catch (err: unknown) {
    toast.error(getErrorMessage(err, 'Could not send email code'));
  } finally {
    setSecurityLoading(null);
  }
};

const resendEmailMfa = async () => {
  if (!me?.email || emailCooldown > 0) return;

  if (!emailCaptchaToken) {
    toast.error('Complete the CAPTCHA before resending the OTP');
    return;
  }

  setSecurityLoading('email');
  try {
    const res = await sendEmailOtp({
      email: me.email,
      captcha_token: emailCaptchaToken,
      otp_session_id: getOtpSessionId(),
    }).unwrap();
    setEmailCode('');
    setEmailCooldown(res.cooldown_seconds ?? 60);
    setEmailCaptchaToken('');
    toast.success('Email verification code resent');
  } catch (err: unknown) {
    toast.error(getErrorMessage(err, 'Could not resend email code'));
  } finally {
    setSecurityLoading(null);
  }
};

const verifyEmailMfa = useCallback(async () => {
  if (!me?.email) return;

  if (emailAttempts >= MAX_EMAIL_ATTEMPTS) {
    toast.error('Too many failed attempts. Try again later.');
    return;
  }

  const code = Number(emailCode);
  if (!Number.isInteger(code) || emailCode.length !== 6) {
    toast.error('Enter the 6-digit email code');
    return;
  }

  setSecurityLoading('email');
  try {
    const res = await verifyEmailCode({
      email: me.email,
      code,
      otp_session_id: getOtpSessionId(),
    }).unwrap();
    setEmailAttempts(0);
    saveToken(res.access_token);
    setSetupMethod(null);
    setMfaSheetMethod(null);
    setEmailCode('');
    await refetchMe();
    toast.success('Email MFA enabled');
  } catch (err: unknown) {
    const nextAttempts = emailAttempts + 1;
    setEmailAttempts(nextAttempts);
    toast.error(
      nextAttempts >= MAX_EMAIL_ATTEMPTS
        ? 'Too many failed attempts. Try again later.'
        : getErrorMessage(err, 'Email verification failed'),
    );
  } finally {
    setSecurityLoading(null);
  }
}, [
  me?.email,
  emailCode,
  emailAttempts,
  verifyEmailCode,
  saveToken,
  refetchMe,
]);

const beginAuthenticatorMfa = async () => {
  if (!me?.email) return;
  setSecurityLoading('authenticator');
  try {
    const res = await generateMfa({ email: me.email }).unwrap();
    setQrCodeUrl(res.qrCodeUrl);
    setMfaSecret(res.secret);
    setAuthCode('');
    setSetupMethod('authenticator');
  } catch (err: unknown) {
    toast.error(getErrorMessage(err, 'Could not start authenticator setup'));
  } finally {
    setSecurityLoading(null);
  }
};

const verifyAuthenticatorMfa = useCallback(async () => {
  if (!me?.email || !mfaSecret) return;
  if (authCode.length !== 6) {
    toast.error('Enter the 6-digit authenticator code');
    return;
  }

  setSecurityLoading('authenticator');
  try {
    const res = await linkAuthenticator({
      email: me.email,
      code: authCode,
      secret: mfaSecret,
    }).unwrap();
    saveToken(res.access_token);
    setSetupMethod(null);
    setMfaSheetMethod(null);
    setQrCodeUrl('');
    setMfaSecret('');
    setAuthCode('');
    await refetchMe();
    toast.success('Authenticator MFA enabled');
  } catch (err: unknown) {
    toast.error(getErrorMessage(err, 'Authenticator verification failed'));
  } finally {
    setSecurityLoading(null);
  }
}, [
  me?.email,
  mfaSecret,
  authCode,
  linkAuthenticator,
  saveToken,
  refetchMe,
]);

const beginSmsMfa = async () => {
  if (!me?.email) return;

  setShowSmsPhoneValidation(true);

  const fullPhone = smsPhone.trim();
  if (!fullPhone) {
    toast.error('Enter a phone number to enable SMS MFA');
    return;
  }

  if (!isValidE164PhoneNumber(fullPhone)) {
    toast.error('Enter a valid phone number for the selected country');
    return;
  }

  if (!smsCaptchaToken) {
    toast.error('Complete the CAPTCHA before requesting an OTP');
    return;
  }

  setSecurityLoading('sms');
  try {
    const res = await startSmsMfa({
      email: me.email,
      phoneNumber: fullPhone,
      captcha_token: smsCaptchaToken,
      otp_session_id: getOtpSessionId(),
    }).unwrap();

    if (res.requires_phone) {
      toast.error('Enter a phone number to enable SMS MFA');
      return;
    }

    setSmsPhone(res.phone || smsPhone);
    setSmsCode('');
    setSetupMethod('sms');
    toast.success('SMS verification code sent');
  } catch (err: unknown) {
    toast.error(getErrorMessage(err, 'Could not send SMS code'));
  } finally {
    setSecurityLoading(null);
  }
};

const verifySmsMfa = useCallback(async () => {
  if (!me?.email) return;
  if (smsCode.length !== 6) {
    toast.error('Enter the 6-digit SMS code');
    return;
  }

  setSecurityLoading('sms');
  try {
    const res = await verifySmsOtp({
      email: me.email,
      code: smsCode,
      otp_session_id: getOtpSessionId(),
    }).unwrap();
    saveToken(res.access_token);
    setSetupMethod(null);
    setMfaSheetMethod(null);
    setSmsCode('');
    await refetchMe();
    toast.success('SMS MFA enabled');
  } catch (err: unknown) {
    toast.error(getErrorMessage(err, 'SMS verification failed'));
  } finally {
    setSecurityLoading(null);
  }
}, [me?.email, smsCode, verifySmsOtp, saveToken, refetchMe]);

useEffect(() => {
  if (emailCooldown <= 0) return;

  const timer = setInterval(() => {
    setEmailCooldown(prev => prev - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [emailCooldown]);

useEffect(() => {
  if (
    setupMethod !== 'email' ||
    emailCode.length !== 6 ||
    emailAttempts >= MAX_EMAIL_ATTEMPTS
  ) {
    autoEmailVerifyKey.current = '';
    return;
  }

  if (securityLoading) return;

  const verifyKey = [me?.email || '', emailCode].join(':');

  if (autoEmailVerifyKey.current === verifyKey) return;

  autoEmailVerifyKey.current = verifyKey;
  void verifyEmailMfa();
}, [setupMethod, emailCode, securityLoading, me?.email, verifyEmailMfa, emailAttempts]);

useEffect(() => {
  if (setupMethod !== 'authenticator' || authCode.length !== 6 || !mfaSecret) {
    autoAuthenticatorVerifyKey.current = '';
    return;
  }

  if (securityLoading) return;

  const verifyKey = [me?.email || '', mfaSecret, authCode].join(':');

  if (autoAuthenticatorVerifyKey.current === verifyKey) return;

  autoAuthenticatorVerifyKey.current = verifyKey;
  void verifyAuthenticatorMfa();
}, [
  setupMethod,
  authCode,
  mfaSecret,
  securityLoading,
  me?.email,
  verifyAuthenticatorMfa,
]);

useEffect(() => {
  if (setupMethod !== 'sms' || smsCode.length !== 6) {
    autoSmsVerifyKey.current = '';
    return;
  }

  if (securityLoading) return;

  const verifyKey = [me?.email || '', smsCode].join(':');

  if (autoSmsVerifyKey.current === verifyKey) return;

  autoSmsVerifyKey.current = verifyKey;
  void verifySmsMfa();
}, [setupMethod, smsCode, securityLoading, me?.email, verifySmsMfa]);

useEffect(() => {
  if (me?.phone && !smsPhone) {
    setSmsPhone(me.phone);
  }
}, [me?.phone, smsPhone]);

const disableMethod = async (method: MFAMethod) => {
  if (activeMfaCount <= 1) {
    toast.error('At least one MFA method must remain linked.');
    return;
  }

  setSecurityLoading(method);
  try {
    await disableMfaMethod({ method }).unwrap();
    if (setupMethod === method) setSetupMethod(null);
    await refetchMe();
    toast.success('MFA method disabled');
  } catch (err: unknown) {
    toast.error(getErrorMessage(err, 'Could not disable MFA method'));
  } finally {
    setSecurityLoading(null);
  }
};

  /* ---------------- Guards ---------------- */
  if (statusLoading || meLoading) {
    return (
      <div className="p-12 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

if (!status) return null;

const billing = status;

  const isTrial = billing.is_trial;
  const trialDaysLeft = billing.trial_end ? daysBetween(billing.trial_end) : 0;

const disableActions =
  statusLoading ||
  invoicesLoading ||
  isProcessing ||
  (!billing.has_payment_method && !isTrial);


  /* ---------------- Actions ---------------- */
const handleProcessPayment = async () => {
  try {
    setIsProcessing(true);

    await createCustomer().unwrap();

    /**
     * 🔥 KEY FIX:
     * Trial users ALREADY have a subscription
     * → just end trial + activate billing
     */
    await changePlan({ plan: selectedPlan }).unwrap();

    await refetchStatus();
    setShowUpgradeModal(false);
  } catch (err: unknown) {
    console.error(err);
    alert(getErrorMessage(err, 'Billing failed. Please try again.'));
  } finally {
    setIsProcessing(false);
  }
};
const canChangePlan =
  billing.status === 'active' || billing.status === 'trialing';

const mfaMethods = {
  authenticator: Boolean(me?.mfa_methods?.authenticator),
  email: Boolean(me?.mfa_methods?.email),
  sms: Boolean(me?.mfa_methods?.sms),
};

const activeMfaCount = Object.values(mfaMethods).filter(Boolean).length;

const closeMfaSheet = () => {
  setMfaSheetMethod(null);
};

const openMfaSheet = (method: MFAMethod) => {
  setMfaSheetMethod(method);
};

const renderMfaSetupContent = (optionId: MFAMethod) => {
  const active = mfaMethods[optionId];
  const busy = securityLoading === optionId;
  const option = mfaOptions.find(item => item.id === optionId);

  if (!option) return null;

  if (active) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <p className="text-sm font-semibold text-emerald-950">
            {option.title} is linked
          </p>
          <p className="mt-1 text-sm leading-6 text-emerald-800">
            {option.desc}
          </p>
        </div>

        <button
          type="button"
          disabled={busy || activeMfaCount <= 1}
          onClick={() => disableMethod(optionId)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:opacity-60"
        >
          {busy
            ? 'Updating...'
            : activeMfaCount <= 1
              ? 'Keep One Linked'
              : 'Disable Method'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-slate-500">{option.desc}</p>

      {optionId === 'email' && setupMethod === 'email' && (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-muted/30 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to{' '}
              <span className="font-semibold text-foreground">{me?.email}</span>
            </p>
            <div className="mt-4">
              <SixDigitOtpInput
                idPrefix={`vault-email-otp-${optionId}`}
                value={emailCode}
                onChange={setEmailCode}
                disabled={busy || emailAttempts >= MAX_EMAIL_ATTEMPTS}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={
              busy ||
              emailCode.length !== 6 ||
              emailAttempts >= MAX_EMAIL_ATTEMPTS
            }
            onClick={verifyEmailMfa}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Verify Email
          </button>

          <button
            type="button"
            disabled={busy || emailCooldown > 0 || !emailCaptchaToken}
            onClick={resendEmailMfa}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 disabled:opacity-60"
          >
            {emailCooldown > 0
              ? `Resend in ${emailCooldown}s`
              : 'Resend Code'}
          </button>

          <TurnstileCaptcha onTokenChange={setEmailCaptchaToken} />

          {emailAttempts > 0 && emailAttempts < MAX_EMAIL_ATTEMPTS && (
            <p className="text-center text-xs text-slate-500">
              Failed attempts: {emailAttempts} / {MAX_EMAIL_ATTEMPTS}
            </p>
          )}
        </div>
      )}

      {optionId === 'authenticator' && setupMethod === 'authenticator' && (
        <div className="space-y-4">
          {qrCodeUrl && (
            <Image
              src={qrCodeUrl}
              alt="Authenticator QR code"
              width={200}
              height={200}
              className="mx-auto rounded-2xl border bg-white p-3"
            />
          )}
          {mfaSecret && (
            <code className="block rounded-2xl bg-slate-100 px-3 py-2 text-center text-[11px] text-slate-700">
              {mfaSecret}
            </code>
          )}
          <div className="rounded-2xl border bg-muted/30 p-4">
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Enter the 6-digit code from your authenticator app
            </p>
            <SixDigitOtpInput
              idPrefix={`vault-auth-otp-${optionId}`}
              value={authCode}
              onChange={setAuthCode}
              disabled={busy}
            />
          </div>
          <button
            type="button"
            disabled={busy || authCode.length !== 6}
            onClick={verifyAuthenticatorMfa}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Verify Authenticator
          </button>
        </div>
      )}

      {optionId === 'sms' && (
        <div className="space-y-4">
          {setupMethod !== 'sms' ? (
            <>
              <PhoneNumberInput
                value={smsPhone || me?.phone || ''}
                onChange={setSmsPhone}
                label="Mobile Number"
                helperText="SMS verification codes will be sent to this number."
                showValidation={showSmsPhoneValidation}
              />
              <TurnstileCaptcha onTokenChange={setSmsCaptchaToken} />
              <button
                type="button"
                disabled={busy}
                onClick={beginSmsMfa}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? 'Sending...' : 'Send SMS Code'}
              </button>
            </>
          ) : (
            <>
              <div className="rounded-2xl border bg-muted/30 p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent to{' '}
                  <span className="font-semibold text-foreground">
                    {smsPhone || me?.phone}
                  </span>
                </p>
                <div className="mt-4">
                  <SixDigitOtpInput
                    idPrefix={`vault-sms-otp-${optionId}`}
                    value={smsCode}
                    onChange={setSmsCode}
                    disabled={busy}
                  />
                </div>
              </div>
              <button
                type="button"
                disabled={busy || smsCode.length !== 6}
                onClick={verifySmsMfa}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Verify SMS
              </button>
            </>
          )}
        </div>
      )}

      {optionId === 'email' && setupMethod !== 'email' && (
        <div className="space-y-4">
          <TurnstileCaptcha onTokenChange={setEmailCaptchaToken} />
          <button
            type="button"
            disabled={busy || !emailCaptchaToken}
            onClick={beginEmailMfa}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? 'Sending...' : 'Send Email Code'}
          </button>
        </div>
      )}

      {optionId === 'authenticator' && setupMethod !== 'authenticator' && (
        <button
          type="button"
          disabled={busy}
          onClick={beginAuthenticatorMfa}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Starting...' : 'Set Up QR Code'}
        </button>
      )}
    </div>
  );
};

const mfaSheetOption = mfaOptions.find(item => item.id === mfaSheetMethod);

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-6 pb-24 vault-settings-section sm:space-y-10 sm:pb-32">
      {/* OWNER MFA SETTINGS */}
      <div className="space-y-4 rounded-3xl border bg-white p-4 shadow-sm sm:space-y-6 sm:p-8 md:p-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black uppercase text-slate-900 sm:text-xl">
              Owner MFA Methods
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enable multiple verification methods. During login, you can use
              any linked method.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase text-slate-600">
            <ShieldCheck className="h-4 w-4" />
            {activeMfaCount} Linked
          </div>
        </div>

        {isMobile ? (
          <div className="space-y-3">
            {mfaOptions.map(option => {
              const active = mfaMethods[option.id];

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => openMfaSheet(option.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border p-3 text-left shadow-sm transition active:scale-[0.99]',
                    active
                      ? 'border-emerald-200 bg-emerald-50/60'
                      : 'border-slate-200 bg-white',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                      active
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {option.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-slate-900">
                        {option.title}
                      </span>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase',
                          active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500',
                        )}
                      >
                        {active ? 'Linked' : 'Off'}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">
                      {option.desc}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {mfaOptions.map(option => {
              const active = mfaMethods[option.id];
              const busy = securityLoading === option.id;

              return (
                <div
                  key={option.id}
                  className={cn(
                    'rounded-2xl border p-5 transition',
                    active
                      ? 'border-emerald-200 bg-emerald-50/60'
                      : 'border-slate-200 bg-white',
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-11 w-11 items-center justify-center rounded-xl',
                          active
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {option.icon}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900">
                          {option.title}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {option.desc}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] font-black uppercase',
                        active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      {active ? 'Linked' : 'Off'}
                    </span>
                  </div>

                  <div className="mt-5">
                    {renderMfaSetupContent(option.id)}
                    {busy && (
                      <p className="mt-3 text-center text-xs text-slate-500">
                        Working...
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PLAN CARD */}
      <div className="rounded-3xl border bg-white p-4 shadow-sm sm:p-8 md:p-10">
        <h2 className="text-xl font-black uppercase">
          {isTrial ? 'Free Trial Phase' : 'Subscription Active'}
        </h2>

        <p className="mt-2 text-xs uppercase text-slate-500">
          {isTrial
            ? `${trialDaysLeft} days remaining`
            : `Plan: ${billing.plan?.toUpperCase()}`}
        </p>
        {isTrial && trialDaysLeft <= 3 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-6 py-4 rounded-xl text-sm font-bold">
            ⏰ Your free trial ends in {trialDaysLeft} days. Add a payment
            method to avoid interruption.
          </div>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row  sm:items-center">
          <button
            disabled={!canChangePlan || disableActions}
            onClick={() => setShowUpgradeModal(true)}
            className={cn(
              'w-auto whitespace-nowrap cursor-pointer rounded-xl px-6 py-3.5 text-xs font-black uppercase sm:w-auto sm:px-10 sm:py-4',
              disableActions
                ? 'cursor-not-allowed bg-slate-300'
                : 'bg-[#1e293b] text-white',
            )}
          >
            {!billing.has_payment_method
              ? 'Add Payment Method'
              : isTrial
                ? 'Upgrade Now'
                : 'Change Plan'}
          </button>
          {billing.status === 'active' && (
            <button
              onClick={pauseSubscription}
              className="w-auto whitespace-nowrap cursor-pointer rounded-xl bg-amber-600 px-6 py-3 text-xs font-black text-white sm:w-auto"
            >
              Pause Subscription
            </button>
          )}

          {billing.status === 'paused' && (
            <button
              onClick={resumeSubscription}
              className="w-auto whitespace-nowrap cursor-pointer rounded-xl bg-amber-600 px-6 py-3 text-xs font-black text-white sm:w-auto"
            >
              Resume Subscription
            </button>
          )}
          <button
            onClick={openBillingPortal}
            className="w-auto whitespace-nowrap cursor-pointer rounded-xl bg-slate-800 px-6 py-3 text-xs uppercase font-black text-white sm:w-auto"
          >
            Manage Billing
          </button>
        </div>
      </div>

      {/* INVOICES */}
      <div className="overflow-hidden rounded-3xl border bg-white">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-left">Invoice</th>
              <th className="p-4">Date</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {invoicesLoading && (
              <tr>
                <td colSpan={4} className="p-8">
                  <Skeleton className="h-6 w-full" />
                </td>
              </tr>
            )}

            {!invoicesLoading &&
              invoices?.map((inv: Invoice) => (
                <>
                  <tr key={inv.id} className="border-t">
                    <td className="p-4 font-mono">{inv.id}</td>
                    <td className="p-4">{formatDate(inv.created)}</td>
                    <td className="p-4">${inv.amount_due.toFixed(2)}</td>
                    <td className="p-4 capitalize">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {inv.pdf && (
                        <a
                          href={inv.pdf}
                          target="_blank"
                          className="text-indigo-600 font-bold text-xs"
                        >
                          PDF
                        </a>
                      )}
                    </td>
                  </tr>
                  <tr>
                    {inv.lines?.map((line: InvoiceLine) => (
                      <div
                        key={line.description}
                        className="text-xs text-slate-500 pl-6"
                      >
                        {line.proration && '🔁 '}
                        {line.description}: ${line.amount.toFixed(2)}
                      </div>
                    ))}
                  </tr>
                </>
              ))}

            {!invoicesLoading && invoices?.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">
                  No invoices yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* MFA SETUP — mobile bottom sheet */}
      {isMobile && (
        <MobileBottomSheet
          open={!!mfaSheetMethod}
          onClose={closeMfaSheet}
          className="max-h-[92dvh]"
          labelledBy="vault-mfa-sheet-title"
        >
          <div className="flex h-full min-h-0 flex-col">
            <MobileSheetHandle />
            <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 pb-4 pt-1">
              <div className="min-w-0 flex-1">
                <h3
                  id="vault-mfa-sheet-title"
                  className="text-lg font-semibold text-slate-950"
                >
                  {mfaSheetOption?.title || 'MFA Method'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {mfaSheetOption?.desc}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeMfaSheet}
                className="h-10 w-10 shrink-0 rounded-full"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div
              className={cn(
                'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5',
                MOBILE_SHEET_SCROLL_PADDING,
              )}
            >
              {mfaSheetMethod && renderMfaSetupContent(mfaSheetMethod)}
            </div>
          </div>
        </MobileBottomSheet>
      )}

      {/* UPGRADE MODAL */}
      {showUpgradeModal && isMobile ? (
        <MobileBottomSheet
          open={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          className="max-h-[90dvh]"
          labelledBy="vault-upgrade-title"
          zClassName="z-[80]"
        >
          <div className="flex h-full min-h-0 flex-col">
            <MobileSheetHandle />
            <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 pb-4 pt-1">
              <h3
                id="vault-upgrade-title"
                className="text-lg font-semibold text-slate-950"
              >
                Choose Plan
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowUpgradeModal(false)}
                className="h-10 w-10 rounded-full"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div
              className={cn(
                'min-h-0 flex-1 overflow-y-auto px-4 py-5',
                MOBILE_SHEET_SCROLL_PADDING,
              )}
            >
              <button
                type="button"
                onClick={() => setSelectedPlan('monthly')}
                className={cn(
                  'mb-3 w-full rounded-2xl border p-4 text-left',
                  selectedPlan === 'monthly' && 'border-primary bg-primary/5',
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlan('yearly')}
                className={cn(
                  'mb-5 w-full rounded-2xl border p-4 text-left',
                  selectedPlan === 'yearly' && 'border-primary bg-primary/5',
                )}
              >
                Yearly
              </button>
              <StripePaymentForm onSuccess={handleProcessPayment} />
            </div>
          </div>
        </MobileBottomSheet>
      ) : (
        showUpgradeModal && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-8">
              <h3 className="mb-6 font-black uppercase">Choose Plan</h3>

              <button
                type="button"
                onClick={() => setSelectedPlan('monthly')}
                className={cn(
                  'mb-3 w-full rounded-xl p-4',
                  selectedPlan === 'monthly' && 'bg-slate-100 font-black',
                )}
              >
                Monthly
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan('yearly')}
                className={cn(
                  'w-full rounded-xl p-4',
                  selectedPlan === 'yearly' && 'bg-slate-100 font-black',
                )}
              >
                Yearly
              </button>

              <StripePaymentForm onSuccess={handleProcessPayment} />
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default VaultSettings;
