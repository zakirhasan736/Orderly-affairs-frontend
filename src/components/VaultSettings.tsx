
'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ChevronRight,
  Mail,
  MessageSquare,
  Settings2,
  ShieldCheck,
  Smartphone,
  Users,
  X,
} from 'lucide-react';
import { FamilyAccessManagement } from '@/components/vault/FamilyAccessManagement';
import { FamilyRoleAreaDefaultsDialog } from '@/components/vault/FamilyRoleAreaDefaultsDialog';
import { VaultNotificationSettings } from '@/components/vault/VaultNotificationSettings';
import { fetchSession } from '@/libs/secureFetch';
import {
  familyCanManageFamilyAccess,
  familyCanViewBilling,
  familyCanViewVaultSettings,
  parseFamilyDashboardSession,
} from '@/utils/familyDashboardAccess';
import { toast } from 'sonner';
import { Button } from '@common/ui/button';
import { InlineNotice } from '@/components/common/ui/inline-notice';
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
  useChangePlanMutation,
  usePauseSubscriptionMutation,
  useResumeSubscriptionMutation,
  usePortalMutation,
  useSetAutoRenewMutation,
} from '@/services/billingApi';
import {
  type MFAMethod,
  useDeleteAccountMutation,
  useDisableMfaMethodMutation,
  useGenerateMfaMutation,
  useGetMeQuery,
  useLinkAuthenticatorMutation,
  useSendEmailOtpMutation,
  useStartSmsMfaMutation,
  useVerifyEmailCodeMutation,
  useVerifySmsOtpMutation,
} from '@/services/authApi';
import { clearAiUploadHistory } from '@/utils/aiUploadHistory';
import { useLogout } from '@/libs/logoutHandler';
import { StripePaymentForm } from './StripePaymentForm';
import { PhoneNumberInput } from './PhoneNumberInput';
import { TurnstileCaptcha } from './TurnstileCaptcha';
import {
  SUBSCRIPTION_PLAN_LIST,
  type SubscriptionPlanId,
} from '@/constants/subscriptionPlans';
import { isValidE164PhoneNumber } from '@/utils/phoneCountries';
import { getOtpSessionId } from '@/utils/otpSession';
import { getSafeErrorMessage } from '@/utils/safeErrorMessage';
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

const getErrorMessage = (err: unknown, fallback: string) =>
  getSafeErrorMessage(err, fallback);

/* ---------------- Component ---------------- */
const VaultSettings = () => {
  const [familySession, setFamilySession] = useState<{
    isFamily: boolean;
    canManageFamily: boolean;
    canManageBilling: boolean;
    canViewVaultSettings: boolean;
  }>({
    isFamily: false,
    canManageFamily: true,
    canManageBilling: true,
    canViewVaultSettings: true,
  });

  useEffect(() => {
    void fetchSession().then(session => {
      if (
        session.role === 'nextkin' &&
        String(session.access_type || '').toLowerCase() === 'family'
      ) {
        const acl = parseFamilyDashboardSession(session);
        setFamilySession({
          isFamily: true,
          canManageFamily: familyCanManageFamilyAccess(acl),
          canManageBilling: familyCanViewBilling(acl),
          canViewVaultSettings: familyCanViewVaultSettings(acl),
        });
      }
    });
  }, []);

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
  const [changePlan] = useChangePlanMutation();
  const [setAutoRenew, { isLoading: autoRenewLoading }] =
    useSetAutoRenewMutation();
  const [sendEmailOtp] = useSendEmailOtpMutation();
  const [verifyEmailCode] = useVerifyEmailCodeMutation();
  const [generateMfa] = useGenerateMfaMutation();
  const [linkAuthenticator] = useLinkAuthenticatorMutation();
  const [startSmsMfa] = useStartSmsMfaMutation();
  const [verifySmsOtp] = useVerifySmsOtpMutation();
  const [disableMfaMethod] = useDisableMfaMethodMutation();
  const [deleteAccount, { isLoading: isDeletingAccount }] =
    useDeleteAccountMutation();
  const logout = useLogout();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>(
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
  const [authCode, setAuthCode] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeletePanel, setShowDeletePanel] = useState(false);
  const [familyRoleAreasOpen, setFamilyRoleAreasOpen] = useState(false);
  const autoEmailVerifyKey = useRef('');
  const autoAuthenticatorVerifyKey = useRef('');
  const autoSmsVerifyKey = useRef('');
  const emailSendInFlight = useRef(false);
  const smsSendInFlight = useRef(false);
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

const handleDeleteAccount = async () => {
  if (!deletePassword.trim()) {
    toast.error('Enter your password to delete the account');
    return;
  }
  if (deleteConfirm.trim().toUpperCase() !== 'DELETE') {
    toast.error('Type DELETE to confirm');
    return;
  }

  try {
    await deleteAccount({
      password: deletePassword,
      confirm: deleteConfirm.trim().toUpperCase(),
    }).unwrap();
    clearAiUploadHistory();
    toast.success('Account and all media deleted');
    await logout();
  } catch (err: unknown) {
    toast.error(getErrorMessage(err, 'Could not delete account'));
  }
};

const MAX_EMAIL_ATTEMPTS = 5;

const beginEmailMfa = async () => {
  if (!me?.email) return;
  if (emailSendInFlight.current || securityLoading === 'email') return;

  if (!emailCaptchaToken) {
    toast.error('Complete the CAPTCHA before requesting an OTP');
    return;
  }

  emailSendInFlight.current = true;
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
    toast.success(
      res.already_sent
        ? 'Verification code already sent — check your email'
        : 'Email verification code sent',
    );
  } catch (err: unknown) {
    toast.error(getErrorMessage(err, 'Could not send email code'));
  } finally {
    emailSendInFlight.current = false;
    setSecurityLoading(null);
  }
};

const resendEmailMfa = async () => {
  if (!me?.email || emailCooldown > 0) return;
  if (emailSendInFlight.current || securityLoading === 'email') return;

  if (!emailCaptchaToken) {
    toast.error('Complete the CAPTCHA before resending the OTP');
    return;
  }

  emailSendInFlight.current = true;
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
    toast.success(
      res.already_sent
        ? 'Verification code already sent — check your email'
        : 'Email verification code resent',
    );
  } catch (err: unknown) {
    toast.error(getErrorMessage(err, 'Could not resend email code'));
  } finally {
    emailSendInFlight.current = false;
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
  refetchMe,
]);

const beginAuthenticatorMfa = async () => {
  if (!me?.email) return;
  setSecurityLoading('authenticator');
  try {
    const res = await generateMfa({ email: me.email }).unwrap();
    setQrCodeUrl(res.qrCodeUrl);
    setAuthCode('');
    setSetupMethod('authenticator');
  } catch (err: unknown) {
    toast.error(getErrorMessage(err, 'Could not start authenticator setup'));
  } finally {
    setSecurityLoading(null);
  }
};

const verifyAuthenticatorMfa = useCallback(async () => {
  if (!me?.email || !qrCodeUrl) return;
  if (authCode.length !== 6) {
    toast.error('Enter the 6-digit authenticator code');
    return;
  }

  setSecurityLoading('authenticator');
  try {
    const res = await linkAuthenticator({
      email: me.email,
      code: authCode,
    }).unwrap();
    setSetupMethod(null);
    setMfaSheetMethod(null);
    setQrCodeUrl('');
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
  qrCodeUrl,
  authCode,
  linkAuthenticator,
  refetchMe,
]);

const beginSmsMfa = async () => {
  if (!me?.email) return;
  if (smsSendInFlight.current || securityLoading === 'sms') return;

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

  smsSendInFlight.current = true;
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
    setSmsCaptchaToken('');
    toast.success(
      res.already_sent
        ? 'Verification code already sent — check your phone'
        : 'SMS verification code sent',
    );
  } catch (err: unknown) {
    toast.error(getErrorMessage(err, 'Could not send SMS code'));
  } finally {
    smsSendInFlight.current = false;
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
}, [me?.email, smsCode, verifySmsOtp, refetchMe]);

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
  if (setupMethod !== 'authenticator' || authCode.length !== 6 || !qrCodeUrl) {
    autoAuthenticatorVerifyKey.current = '';
    return;
  }

  if (securityLoading) return;

  const verifyKey = [me?.email || '', qrCodeUrl, authCode].join(':');

  if (autoAuthenticatorVerifyKey.current === verifyKey) return;

  autoAuthenticatorVerifyKey.current = verifyKey;
  void verifyAuthenticatorMfa();
}, [
  setupMethod,
  authCode,
  qrCodeUrl,
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

  const password = window.prompt(
    'Enter your account password to disable this MFA method',
  );
  if (!password?.trim()) {
    toast.error('Password is required to disable MFA');
    return;
  }

  setSecurityLoading(method);
  try {
    await disableMfaMethod({ method, password }).unwrap();
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
      <div className="space-y-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <p className="text-sm font-semibold text-emerald-950">
            {option.title} is linked
          </p>
          <p className="mt-1 text-sm leading-6 text-emerald-800">
            {option.desc}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || activeMfaCount <= 1}
            onClick={() => disableMethod(optionId)}
            className="inline-flex h-11 w-auto items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {busy
              ? 'Updating...'
              : activeMfaCount <= 1
                ? 'Keep One Linked'
                : 'Disable Method'}
          </button>
        </div>
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

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={
                busy ||
                emailCode.length !== 6 ||
                emailAttempts >= MAX_EMAIL_ATTEMPTS
              }
              onClick={verifyEmailMfa}
              className="inline-flex h-11 w-auto items-center justify-center rounded-xl bg-[#213D59] px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              Verify Email
            </button>

            <button
              type="button"
              disabled={busy || emailCooldown > 0 || !emailCaptchaToken}
              onClick={resendEmailMfa}
              className="inline-flex h-11 w-auto items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              {emailCooldown > 0
                ? `Resend in ${emailCooldown}s`
                : 'Resend Code'}
            </button>
          </div>

          <TurnstileCaptcha onTokenChange={setEmailCaptchaToken} />

          {emailAttempts > 0 && emailAttempts < MAX_EMAIL_ATTEMPTS && (
            <p className="text-xs text-slate-500">
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || authCode.length !== 6}
              onClick={verifyAuthenticatorMfa}
              className="inline-flex h-11 w-auto items-center justify-center rounded-xl bg-[#213D59] px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              Verify Authenticator
            </button>
          </div>
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
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={beginSmsMfa}
                  className="inline-flex h-11 w-auto items-center justify-center rounded-xl bg-[#213D59] px-5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busy ? 'Sending...' : 'Send SMS Code'}
                </button>
              </div>
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
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || smsCode.length !== 6}
                  onClick={verifySmsMfa}
                  className="inline-flex h-11 w-auto items-center justify-center rounded-xl bg-[#213D59] px-5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Verify SMS
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {optionId === 'email' && setupMethod !== 'email' && (
        <div className="space-y-4">
          <TurnstileCaptcha onTokenChange={setEmailCaptchaToken} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || !emailCaptchaToken}
              onClick={beginEmailMfa}
              className="inline-flex h-11 w-auto items-center justify-center rounded-xl bg-[#213D59] px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? 'Sending...' : 'Send Email Code'}
            </button>
          </div>
        </div>
      )}

      {optionId === 'authenticator' && setupMethod !== 'authenticator' && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={beginAuthenticatorMfa}
            className="inline-flex h-11 w-auto items-center justify-center rounded-xl bg-[#213D59] px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? 'Starting...' : 'Set Up QR Code'}
          </button>
        </div>
      )}
    </div>
  );
};

const mfaSheetOption = mfaOptions.find(item => item.id === mfaSheetMethod);

  /* ---------------- UI ---------------- */
  const showFamilyBlock =
    !familySession.isFamily || familySession.canManageFamily;
  const showMfaBlock = !familySession.isFamily;
  // Super Admin may view billing status; payment mutations stay owner-only.
  const showBillingBlock =
    !familySession.isFamily || familySession.canManageBilling;
  const billingViewOnly = familySession.isFamily && familySession.canManageBilling;

  return (
    <div className="vault-settings-section w-full space-y-4 pb-24 sm:space-y-5 sm:pb-28">
      {/* OWNER MFA SETTINGS */}
      {showMfaBlock && (
      <section className="w-full overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:rounded-[28px]">
        <div className="relative overflow-hidden bg-[#00305C] px-4 py-5 text-white sm:px-6 sm:py-6 md:px-8">
          <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-sky-300/20 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                Security
              </p>
              <h2 className="mt-1 text-[20px] font-bold tracking-tight sm:text-[22px]">
                Owner MFA
              </h2>
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-white/75 sm:text-sm">
                Link authenticator, email, or SMS. Use any method at login.
              </p>
            </div>
            <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white ring-1 ring-white/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              {activeMfaCount} linked
            </div>
          </div>
        </div>

        <div className="space-y-3 p-3 sm:space-y-4 sm:p-5 md:p-6">
          {isMobile ? (
            <div className="space-y-2.5">
              {mfaOptions.map(option => {
                const active = mfaMethods[option.id];

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => openMfaSheet(option.id)}
                    className={cn(
                      'flex w-full min-h-[76px] items-center gap-3 rounded-[22px] border px-3.5 py-3.5 text-left transition active:scale-[0.99]',
                      active
                        ? 'border-emerald-200/90 bg-[linear-gradient(90deg,#ffffff_0%,#ecfdf5_100%)] shadow-sm'
                        : 'border-slate-200 bg-[#f5f8fc] shadow-sm',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                        active
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white text-[#213D59] ring-1 ring-slate-200',
                      )}
                    >
                      {option.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[15px] font-semibold text-[#213D59]">
                          {option.title}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                            active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200/80 text-slate-600',
                          )}
                        >
                          {active ? 'On' : 'Off'}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-slate-500">
                        {option.desc}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
                  </button>
                );
              })}
              <p className="px-1 pt-1 text-center text-[11px] font-medium text-slate-400">
                Tap a method to set up or manage it
              </p>
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
                      'rounded-[24px] border p-5 transition',
                      active
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-slate-200 bg-slate-50/40',
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'flex h-11 w-11 items-center justify-center rounded-2xl',
                            active
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white text-[#213D59] ring-1 ring-slate-200',
                          )}
                        >
                          {option.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#213D59]">
                            {option.title}
                          </h3>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {option.desc}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase',
                          active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500',
                        )}
                      >
                        {active ? 'On' : 'Off'}
                      </span>
                    </div>

                    <div className="mt-5">
                      {renderMfaSetupContent(option.id)}
                      {busy && (
                        <p className="mt-3 text-xs text-slate-500">
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
      </section>
      )}

      {/* PLAN CARD + INVOICES */}
      {showBillingBlock && (
      <>
      <section className="w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)] sm:rounded-[28px]">
        <div className="flex flex-col gap-4 border-b border-[#dbe3ed] bg-white px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-6 md:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Billing
            </p>
            <h2 className="mt-1 text-[18px] font-bold tracking-tight text-[#213D59] sm:text-xl">
              {isTrial ? 'Free Trial Phase' : 'Subscription Active'}
            </h2>
            <p className="mt-1.5 text-[12px] font-medium text-slate-500">
              {isTrial
                ? `${trialDaysLeft} days remaining on your trial`
                : `Plan: ${billing.plan?.toUpperCase() || '—'}`}
            </p>
          </div>
          <span
            className={cn(
              'inline-flex w-auto items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide',
              isTrial
                ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
            )}
          >
            {isTrial ? 'Trial' : billing.status || 'Active'}
          </span>
        </div>

        <div className="space-y-4 p-4 sm:space-y-5 sm:p-6 md:px-8 md:pb-8">
          {isTrial && trialDaysLeft <= 3 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              Your free trial ends in {trialDaysLeft} days. Add a payment
              method to avoid interruption.
            </div>
          )}

          {(billing.status === 'trialing' || billing.status === 'active') && (
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 text-left">
                <p className="text-sm font-semibold text-slate-900">Auto-renew</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                  {billing.auto_renew !== false
                    ? 'On — your card will be charged when the current period ends (or when the trial ends if a card is on file).'
                    : 'Off — you will not be charged automatically. Access may pause when the period ends until you pay.'}
                </p>
              </div>
              {!billingViewOnly && (
              <button
                type="button"
                disabled={autoRenewLoading || disableActions}
                onClick={async () => {
                  const next = !(billing.auto_renew !== false);
                  try {
                    const res = await setAutoRenew({ enabled: next }).unwrap();
                    toast.success(
                      res?.message || (next ? 'Auto-renew on' : 'Auto-renew off'),
                    );
                    await refetchStatus();
                  } catch (err: unknown) {
                    toast.error(
                      getErrorMessage(err, 'Could not update auto-renew'),
                    );
                  }
                }}
                className={cn(
                  'inline-flex h-10 w-auto shrink-0 items-center justify-center rounded-xl px-5 text-xs font-bold uppercase',
                  billing.auto_renew !== false
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-300 text-slate-800',
                )}
              >
                {billing.auto_renew !== false ? 'On' : 'Off'}
              </button>
              )}
            </div>
          )}

          {billingViewOnly ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Billing status is view-only for family Super Admin. Payment method,
              plan changes, and portal access require the kit owner.
            </p>
          ) : (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={!canChangePlan || disableActions}
              onClick={() => setShowUpgradeModal(true)}
              className={cn(
                'inline-flex h-11 w-auto items-center justify-center whitespace-nowrap rounded-xl px-5 text-xs font-bold uppercase',
                disableActions
                  ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                  : 'bg-[#213D59] text-white hover:bg-[#00305C]',
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
                type="button"
                onClick={pauseSubscription}
                className="inline-flex h-11 w-auto items-center justify-center whitespace-nowrap rounded-xl bg-amber-600 px-5 text-xs font-bold text-white hover:bg-amber-700"
              >
                Pause Subscription
              </button>
            )}

            {billing.status === 'paused' && (
              <button
                type="button"
                onClick={resumeSubscription}
                className="inline-flex h-11 w-auto items-center justify-center whitespace-nowrap rounded-xl bg-amber-600 px-5 text-xs font-bold text-white hover:bg-amber-700"
              >
                Resume Subscription
              </button>
            )}
            <button
              type="button"
              onClick={openBillingPortal}
              className="inline-flex h-11 w-auto items-center justify-center whitespace-nowrap rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold uppercase text-[#213D59] hover:bg-slate-50"
            >
              Manage Billing
            </button>
          </div>
          )}
        </div>
      </section>

      {/* INVOICES */}
      <section className="w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)] sm:rounded-[28px]">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-6 md:px-8">
          <h2 className="text-[17px] font-bold tracking-tight text-[#213D59]">
            Invoices
          </h2>
          <p className="mt-1 text-[12px] text-slate-500">
            Recent billing history for this vault.
          </p>
        </div>

        {/* Mobile invoice cards */}
        <div className="space-y-2.5 p-3 sm:hidden">
          {invoicesLoading && <Skeleton className="h-20 w-full rounded-2xl" />}
          {!invoicesLoading &&
            invoices?.map((inv: Invoice) => (
              <div
                key={inv.id}
                className="rounded-2xl border border-slate-200 bg-[#f5f8fc] p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-mono text-[11px] text-slate-500">
                    {inv.id}
                  </p>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold capitalize',
                      inv.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700',
                    )}
                  >
                    {inv.status}
                  </span>
                </div>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#213D59]">
                      ${inv.amount_due.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatDate(inv.created)}
                    </p>
                  </div>
                  {inv.pdf ? (
                    <a
                      href={inv.pdf}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 w-auto items-center rounded-lg bg-[#213D59] px-3 text-[11px] font-bold text-white"
                    >
                      PDF
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          {!invoicesLoading && invoices?.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">
              No invoices yet
            </p>
          )}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left font-semibold text-slate-600">
                  Invoice
                </th>
                <th className="p-4 text-left font-semibold text-slate-600">
                  Date
                </th>
                <th className="p-4 text-left font-semibold text-slate-600">
                  Amount
                </th>
                <th className="p-4 text-left font-semibold text-slate-600">
                  Status
                </th>
                <th className="p-4 text-right font-semibold text-slate-600">
                  File
                </th>
              </tr>
            </thead>

            <tbody>
              {invoicesLoading && (
                <tr>
                  <td colSpan={5} className="p-8">
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              )}

              {!invoicesLoading &&
                invoices?.map((inv: Invoice) => (
                  <tr key={inv.id} className="border-t border-slate-100">
                    <td className="p-4 font-mono text-xs text-slate-600">
                      {inv.id}
                    </td>
                    <td className="p-4 text-slate-700">
                      {formatDate(inv.created)}
                    </td>
                    <td className="p-4 font-semibold text-[#213D59]">
                      ${inv.amount_due.toFixed(2)}
                    </td>
                    <td className="p-4 capitalize">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-bold',
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700',
                        )}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {inv.pdf ? (
                        <a
                          href={inv.pdf}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 w-auto items-center rounded-lg border border-slate-200 px-3 text-xs font-bold text-[#213D59] hover:bg-slate-50"
                        >
                          PDF
                        </a>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}

              {!invoicesLoading && invoices?.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-400"
                  >
                    No invoices yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      </>
      )}

      {/* NOTIFICATION SETTINGS */}
      {!familySession.isFamily && (
        <VaultNotificationSettings />
      )}

      {/* FAMILY ROLE & ACCESS — bottom of Vault Settings */}
      {showFamilyBlock && (
        <section className="w-full overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:rounded-[28px]">
          <div className="relative overflow-hidden bg-[#0f3d4c] px-4 py-4 text-white sm:px-6 sm:py-6 md:px-8">
            <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-teal-300/20 blur-2xl" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                  Family access
                </p>
                <h2 className="mt-1 text-[18px] font-bold tracking-tight sm:text-[22px]">
                  Roles &amp; permissions
                </h2>
                <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-white/75 sm:mt-1.5 sm:text-sm">
                  <span className="sm:hidden">
                    Invite family, set roles, and choose which vault areas they
                    can open.
                  </span>
                  <span className="hidden sm:inline">
                    Invite up to 5 family collaborators, mark vault areas, then
                    choose their portal role. Use the settings control for
                    global areas per role. Separate from Next of Kin (Section
                    2).
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFamilyRoleAreasOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 transition hover:bg-white/25"
                  aria-label="Manage global role access areas"
                  title="Global role access areas"
                >
                  <Settings2 className="h-[18px] w-[18px]" />
                </button>
                <div className="hidden items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white ring-1 ring-white/20 sm:inline-flex">
                  <Users className="h-3.5 w-3.5" />
                  Access
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-3 sm:space-y-4 sm:p-5 md:p-6">
            <FamilyAccessManagement />
          </div>

          <FamilyRoleAreaDefaultsDialog
            open={familyRoleAreasOpen}
            onOpenChange={setFamilyRoleAreasOpen}
          />
        </section>
      )}

      {!familySession.isFamily && (
      <section className="rounded-3xl border border-[#a2453c]/35 bg-[#fbeceb]/40 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-[#8e372f]">Danger zone</h2>
        <InlineNotice
          className="mt-4 max-w-2xl"
          variant="danger"
          title="This deletes everything, permanently"
          description="Your sections, attachments, letters, and everyone's access. It cannot be undone."
        />

        {!showDeletePanel ? (
          <Button
            type="button"
            variant="outline"
            className="mt-5 border-rose-300 text-rose-800 hover:bg-rose-100"
            onClick={() => setShowDeletePanel(true)}
          >
            Delete my account
          </Button>
        ) : (
          <div className="mt-5 max-w-md space-y-3">
            <label className="block text-sm font-medium text-rose-900">
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={deletePassword}
                onChange={event => setDeletePassword(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm text-[#213D59] outline-none focus:border-rose-400"
                placeholder="Your account password"
              />
            </label>
            <label className="block text-sm font-medium text-rose-900">
              Type DELETE to confirm
              <input
                type="text"
                value={deleteConfirm}
                onChange={event => setDeleteConfirm(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm text-[#213D59] outline-none focus:border-rose-400"
                placeholder="DELETE"
              />
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                disabled={isDeletingAccount}
                className="bg-rose-700 text-white hover:bg-rose-800"
                onClick={() => void handleDeleteAccount()}
              >
                {isDeletingAccount ? 'Deleting…' : 'Delete forever'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isDeletingAccount}
                onClick={() => {
                  setShowDeletePanel(false);
                  setDeletePassword('');
                  setDeleteConfirm('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>
      )}

      {/* MFA SETUP — mobile bottom sheet */}
      {isMobile && (
        <MobileBottomSheet
          open={!!mfaSheetMethod}
          onClose={closeMfaSheet}
          className="max-h-[92dvh]"
          labelledBy="vault-mfa-sheet-title"
        >
          <div className="flex h-full min-h-0 flex-col bg-[#f5f8fc]">
            <MobileSheetHandle />
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200/80 bg-white px-4 pb-4 pt-1">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                    mfaSheetMethod && mfaMethods[mfaSheetMethod]
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#213D59] text-white',
                  )}
                >
                  {mfaSheetOption?.icon}
                </span>
                <div className="min-w-0">
                  <h3
                    id="vault-mfa-sheet-title"
                    className="text-[17px] font-bold tracking-tight text-[#213D59]"
                  >
                    {mfaSheetOption?.title || 'MFA Method'}
                  </h3>
                  <p className="mt-1 text-[12px] leading-snug text-slate-500">
                    {mfaSheetOption?.desc}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeMfaSheet}
                className="h-10 w-10 shrink-0 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
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
              <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                {mfaSheetMethod && renderMfaSetupContent(mfaSheetMethod)}
              </div>
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
              {SUBSCRIPTION_PLAN_LIST.map(plan => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cn(
                    'mb-3 w-full rounded-2xl border p-4 text-left',
                    selectedPlan === plan.id && 'border-primary bg-primary/5',
                  )}
                >
                  <p className="m-0 font-semibold text-[#213D59]">
                    {plan.title}
                  </p>
                  <p className="mt-1 mb-0 text-sm text-[rgba(33,61,89,0.7)]">
                    {plan.listPrice ? (
                      <>
                        <span className="mr-1.5 line-through opacity-60">
                          {plan.listPrice}
                        </span>
                        {plan.amount}/year
                        {plan.discountPercent
                          ? ` · ${plan.discountPercent}% off`
                          : ''}
                      </>
                    ) : (
                      <>{plan.amount}/year</>
                    )}
                  </p>
                </button>
              ))}
              <StripePaymentForm onSuccess={handleProcessPayment} />
            </div>
          </div>
        </MobileBottomSheet>
      ) : (
        showUpgradeModal && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-8">
              <h3 className="mb-6 font-black uppercase">Choose Plan</h3>

              {SUBSCRIPTION_PLAN_LIST.map(plan => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cn(
                    'mb-3 w-full rounded-xl p-4 text-left',
                    selectedPlan === plan.id && 'bg-slate-100 font-black',
                  )}
                >
                  <p className="m-0">{plan.title}</p>
                  <p className="mt-1 mb-0 text-sm font-normal text-slate-600">
                    {plan.listPrice ? (
                      <>
                        <span className="mr-1.5 line-through opacity-60">
                          {plan.listPrice}
                        </span>
                        {plan.amount}/year
                        {plan.discountPercent
                          ? ` · ${plan.discountPercent}% off`
                          : ''}
                      </>
                    ) : (
                      <>{plan.amount}/year</>
                    )}
                  </p>
                </button>
              ))}

              <StripePaymentForm onSuccess={handleProcessPayment} />
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default VaultSettings;
