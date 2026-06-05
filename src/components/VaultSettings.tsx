
'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { Mail, MessageSquare, ShieldCheck, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
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


  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-12 pb-32 vault-settings-section">
      {/* OWNER MFA SETTINGS */}
      <div className="bg-white p-8 md:p-10 rounded-3xl border shadow-sm space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black uppercase text-slate-900">
              Owner MFA Methods
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Enable multiple verification methods. During login, you can use
              any linked method.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase text-slate-600">
            <ShieldCheck className="h-4 w-4" />
            {activeMfaCount} Linked
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {mfaOptions.map(option => {
            const active = mfaMethods[option.id];
            const busy = securityLoading === option.id;

            return (
              <div
                key={option.id}
                className={`rounded-2xl border p-5 transition ${
                  active
                    ? 'border-emerald-200 bg-emerald-50/60'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        active
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
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
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                      active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {active ? 'Linked' : 'Off'}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {active ? (
                    <button
                      type="button"
                      disabled={busy || activeMfaCount <= 1}
                      onClick={() => disableMethod(option.id)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-black uppercase text-slate-700 transition hover:bg-white disabled:opacity-60"
                    >
                      {busy
                        ? 'Updating...'
                        : activeMfaCount <= 1
                          ? 'Keep One Linked'
                          : 'Disable'}
                    </button>
                  ) : (
                    <>
                      {option.id === 'email' && setupMethod === 'email' && (
                        <div className="space-y-2">
                          <input
                            value={emailCode}
                            onChange={e =>
                              setEmailCode(
                                e.target.value.replace(/\D/g, '').slice(0, 6),
                              )
                            }
                            placeholder="Email code"
                            className="w-full rounded-xl border px-4 py-3 text-center tracking-widest"
                          />
                          <button
                            type="button"
                            disabled={
                              busy ||
                              emailCode.length !== 6 ||
                              emailAttempts >= MAX_EMAIL_ATTEMPTS
                            }
                            onClick={verifyEmailMfa}
                            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-xs font-black uppercase text-white disabled:opacity-60"
                          >
                            Verify Email
                          </button>
                          <button
                            type="button"
                            disabled={
                              busy ||
                              emailCooldown > 0 ||
                              !emailCaptchaToken
                            }
                            onClick={resendEmailMfa}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-black uppercase text-slate-700 disabled:opacity-60"
                          >
                            {emailCooldown > 0
                              ? `Resend in ${emailCooldown}s`
                              : 'Resend Code'}
                          </button>
                          <TurnstileCaptcha
                            onTokenChange={setEmailCaptchaToken}
                          />
                          {emailAttempts > 0 &&
                            emailAttempts < MAX_EMAIL_ATTEMPTS && (
                              <p className="text-center text-xs text-slate-500">
                                Failed attempts: {emailAttempts} /{' '}
                                {MAX_EMAIL_ATTEMPTS}
                              </p>
                            )}
                        </div>
                      )}

                      {option.id === 'authenticator' &&
                        setupMethod === 'authenticator' && (
                          <div className="space-y-3">
                            {qrCodeUrl && (
                              <Image
                                src={qrCodeUrl}
                                alt="Authenticator QR code"
                                width={160}
                                height={160}
                                className="mx-auto rounded-xl border bg-white p-2"
                              />
                            )}
                            {mfaSecret && (
                              <code className="block rounded-xl bg-slate-100 px-3 py-2 text-center text-[11px] text-slate-700">
                                {mfaSecret}
                              </code>
                            )}
                            <input
                              value={authCode}
                              onChange={e =>
                                setAuthCode(
                                  e.target.value
                                    .replace(/\D/g, '')
                                    .slice(0, 6),
                                )
                              }
                              placeholder="Authenticator code"
                              className="w-full rounded-xl border px-4 py-3 text-center tracking-widest"
                            />
                            <button
                              type="button"
                              disabled={busy || authCode.length !== 6}
                              onClick={verifyAuthenticatorMfa}
                              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-xs font-black uppercase text-white disabled:opacity-60"
                            >
                              Verify Authenticator
                            </button>
                          </div>
                        )}

                      {option.id === 'sms' && (
                        <div className="space-y-2">
                          {setupMethod !== 'sms' && (
                            <>
                              <PhoneNumberInput
                                value={smsPhone || me?.phone || ''}
                                onChange={setSmsPhone}
                                label="Mobile Number"
                                helperText="SMS verification codes will be sent to this number."
                                showValidation={showSmsPhoneValidation}
                              />
                              <TurnstileCaptcha onTokenChange={setSmsCaptchaToken} />
                            </>
                          )}
                          {setupMethod === 'sms' && (
                            <input
                              value={smsCode}
                              onChange={e =>
                                setSmsCode(
                                  e.target.value
                                    .replace(/\D/g, '')
                                    .slice(0, 6),
                                )
                              }
                              placeholder="SMS code"
                              className="w-full rounded-xl border px-4 py-3 text-center tracking-widest"
                            />
                          )}
                          <button
                            type="button"
                            disabled={
                              busy ||
                              (setupMethod === 'sms' && smsCode.length !== 6)
                            }
                            onClick={
                              setupMethod === 'sms'
                                ? verifySmsMfa
                                : beginSmsMfa
                            }
                            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-xs font-black uppercase text-white disabled:opacity-60"
                          >
                            {setupMethod === 'sms'
                              ? 'Verify SMS'
                              : 'Send SMS Code'}
                          </button>
                        </div>
                      )}

                      {option.id === 'email' && setupMethod !== 'email' && (
                        <div className="space-y-2">
                          <TurnstileCaptcha
                            onTokenChange={setEmailCaptchaToken}
                          />
                          <button
                            type="button"
                            disabled={busy || !emailCaptchaToken}
                            onClick={beginEmailMfa}
                            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-xs font-black uppercase text-white disabled:opacity-60"
                          >
                            {busy ? 'Sending...' : 'Send Email Code'}
                          </button>
                        </div>
                      )}

                      {option.id === 'authenticator' &&
                        setupMethod !== 'authenticator' && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={beginAuthenticatorMfa}
                            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-xs font-black uppercase text-white disabled:opacity-60"
                          >
                            {busy ? 'Starting...' : 'Set Up QR'}
                          </button>
                        )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PLAN CARD */}
      <div className="bg-white p-10 rounded-3xl border shadow-sm">
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
        <div className="flex mt-6 items-center gap-4">
          <button
            disabled={!canChangePlan || disableActions}
            onClick={() => setShowUpgradeModal(true)}
            className={`px-10 py-4 cursor-pointer rounded-xl text-xs font-black uppercase ${
              disableActions
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-[#1e293b] text-white'
            }`}
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
              className="px-6 py-3 cursor-pointer bg-amber-600 text-white rounded-xl text-xs font-black"
            >
              Pause Subscription
            </button>
          )}

          {billing.status === 'paused' && (
            <button
              onClick={resumeSubscription}
              className="px-6 py-3 cursor-pointer bg-amber-600 text-white rounded-xl text-xs font-black"
            >
              Resume Subscription
            </button>
          )}
          <button
            onClick={openBillingPortal}
            className="px-6 py-3 bg-slate-800 text-white rounded-xl text-xs font-black"
          >
            Manage Billing
          </button>
        </div>
      </div>

      {/* INVOICES */}
      <div className="bg-white rounded-3xl border overflow-hidden">
        <table className="w-full text-sm">
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

      {/* MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md">
            <h3 className="font-black uppercase mb-6">Choose Plan</h3>

            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`w-full p-4 mb-3 rounded ${
                selectedPlan === 'monthly' ? 'bg-slate-100 font-black' : ''
              }`}
            >
              Monthly
            </button>

            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`w-full p-4 rounded ${
                selectedPlan === 'yearly' ? 'bg-slate-100 font-black' : ''
              }`}
            >
              Yearly
            </button>

            <StripePaymentForm onSuccess={handleProcessPayment} />
          </div>
        </div>
      )}
    </div>
  );
};

export default VaultSettings;
