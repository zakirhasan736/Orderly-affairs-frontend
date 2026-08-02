'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

import {
  Mail,
  Eye,
  EyeOff,
  Smartphone,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { fetchSession, markPortalSession } from '@/libs/secureFetch';
import { useAppDispatch } from '@/store/hooks';
import { setSession } from '@/store/slices/authSlice';
import Image from 'next/image';
import {
  useLoginMutation,
  useSignupMutation,
  useVerifyTotpMutation,
  useGenerateMfaMutation,
  useSendEmailOtpMutation,
  useVerifyEmailCodeMutation,
  useLinkAuthenticatorMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useVerifySmsOtpMutation,
  useStartSmsMfaMutation,
  useStartEmailMfaMutation,
  useResendSmsMfaMutation,
  useResumePendingSignupMutation,
} from '@/services/authApi';
import { Input } from '@/components/common/ui/input';
import { PhoneNumberInput } from '@/components/PhoneNumberInput';
import { SixDigitOtpInput } from '@/components/SixDigitOtpInput';
import { TurnstileCaptcha } from '@/components/TurnstileCaptcha';
import {
  AuthPortalShell,
  AuthCard,
  AuthModeToggle,
  AuthFieldLabel,
  PasswordStrengthBars,
  type CheckoutOrderSummary,
} from '@/components/auth/AuthPortalShell';
import { StartTrialCheckout } from '@/components/auth/StartTrialCheckout';
import {
  SUBSCRIPTION_PLAN_LIST,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
} from '@/constants/subscriptionPlans';
import { cn } from '@common/ui/utils';
import { isValidE164PhoneNumber } from '@/utils/phoneCountries';
import { getOtpSessionId } from '@/utils/otpSession';
import {
  formatRetryCountdown,
  parseAuthApiError,
} from '@/utils/authRateLimit';
import { isCaptchaEnabledNow } from '@/utils/captchaConfig';
import { toast } from 'sonner';
import {
  RateLimitBanner,
  rateLimitedButtonLabel,
} from '@/components/RateLimitBanner';
import { Button } from '@/components/common/ui/button';
import { InlineNotice } from '@/components/common/ui/inline-notice';

type MFAMethod = 'authenticator' | 'email' | 'sms';

type MFAStep =
  | 'credentials'
  | 'mfa_method_selection'
  | 'setupMfa'
  | 'verifyMfa'
  | 'verifyEmail'
  | 'verifySms'
  | 'forgot_password'
  | 'reset_password';

type OnboardingStep = MFAStep | 'plan_selection' | 'payment';

/** Module-level — never call loadStripe inside a component (remounts Elements every render). */
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
);

type AuthLoadingAction =
  | 'sign_in'
  | 'forgot_password'
  | 'request_reset'
  | 'reset_password'
  | 'mfa_method'
  | 'send_email_code'
  | 'login_mfa_email_send'
  | 'start_sms'
  | 'resend_sms'
  | 'resend_email'
  | 'verify_mfa'
  | 'verify_email'
  | 'verify_sms';

// ------------------------------
// Validation helpers
// ------------------------------
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** Login identifier: email address or phone (8+ digits). */
const isValidLoginIdentifier = (value: string) => {
  const raw = value.trim();
  if (!raw) return false;
  if (isValidEmail(raw)) return true;
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 8;
};

const verifyTOTPCode = (code: string) => /^\d{6}$/.test(code);

import { getSafeErrorMessage } from '@/utils/safeErrorMessage';

const getApiErrorMessage = (err: unknown, fallback: string) =>
  getSafeErrorMessage(err, fallback);

const completeOwnerAuth = async (
  router: ReturnType<typeof useRouter>,
  dispatch: ReturnType<typeof useAppDispatch>,
  options?: {
    requiresBilling?: boolean;
    billingOnly?: boolean;
    email?: string;
    onNeedsBilling?: () => void;
    onBillingOnly?: () => void;
  },
): Promise<'dashboard' | 'billing' | 'billing_lock'> => {
  let session: Awaited<ReturnType<typeof fetchSession>> | null = null;

  // Cookie Domain propagation can lag one tick after Set-Cookie
  for (let attempt = 0; attempt < 4; attempt++) {
    session = await fetchSession();
    if (session.authenticated && session.role === 'owner') break;
    await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
  }

  if (!session?.authenticated || session.role !== 'owner') {
    throw new Error('Session not established');
  }

  dispatch(
    setSession({
      user: {
        email: session.email ?? options?.email ?? '',
        role: 'owner',
        owner_id: session.owner_id ?? null,
      },
    }),
  );

  const billingOnly =
    Boolean(options?.billingOnly) || Boolean(session.billing_only);

  const needsBilling =
    Boolean(options?.requiresBilling) || Boolean(session.requires_billing);

  // Incomplete signup/checkout must stay on plan/payment — do not mark portal
  // session yet or middleware/reload will bounce them into /dashboard.
  if (needsBilling && !billingOnly) {
    options?.onNeedsBilling?.();
    return 'billing';
  }

  await markPortalSession();

  if (billingOnly) {
    options?.onBillingOnly?.();
    goToDashboard(router);
    return 'billing_lock';
  }

  goToDashboard(router);
  return 'dashboard';
};

const goToDashboard = (router: ReturnType<typeof useRouter>) => {
  // Full navigation so middleware/cookies settle after Set-Cookie from API
  if (typeof window !== 'undefined') {
    window.location.assign('/dashboard');
    return;
  }
  router.replace('/dashboard');
};

const hasValidOwnerSession = async () => {
  const session = await fetchSession();
  return session.authenticated && session.role === 'owner';
};

const MFA_METHODS: MFAMethod[] = ['authenticator', 'email', 'sms'];
const OTP_LENGTH = 6;
const MAX_ATTEMPTS = 5;

const emptyMfaMethods = (): Record<MFAMethod, boolean> => ({
  authenticator: false,
  email: false,
  sms: false,
});

const normalizeMfaMethods = (
  methods?: Partial<Record<MFAMethod, boolean>>,
  legacyMethod?: MFAMethod,
) => {
  const normalized = emptyMfaMethods();
  MFA_METHODS.forEach(method => {
    normalized[method] = Boolean(methods?.[method]);
  });
  if (legacyMethod) normalized[legacyMethod] = true;
  return normalized;
};

const firstAvailableMfaMethod = (
  methods: Record<MFAMethod, boolean>,
  fallback: MFAMethod = 'email',
) => MFA_METHODS.find(method => methods[method]) || fallback;

const AUTH_OTP_INPUT_CLASS =
  'auth-otp-input h-12 sm:h-14 text-center text-lg tracking-[0.35em] enhanced-field-frame';

function AuthStatusBanner({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className="auth-status-banner flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-left sm:p-4"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-white text-slate-500 shadow-sm">
        {icon}
      </div>
      <p className="min-w-0 text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
        {children}
      </p>
    </div>
  );
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function addYears(base: Date, years: number) {
  const d = new Date(base);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

/** Keep in sync with marketing copy (“14-day trial”). */
const TRIAL_DAYS = 14;

function formatLongDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

function formatTrialEndDate(days = TRIAL_DAYS) {
  return formatLongDate(addDays(new Date(), days));
}

function formatTrialEndShort(days = TRIAL_DAYS) {
  return formatShortDate(addDays(new Date(), days));
}

/** Shared billing dates for left order panel + checkout notes. */
function getCheckoutBillingDates(days = TRIAL_DAYS) {
  const today = new Date();
  const trialEnd = addDays(today, days);
  const yearlyRenewalFromToday = addYears(today, 1);
  const yearlyRenewalAfterTrial = addYears(trialEnd, 1);
  return {
    today,
    trialEnd,
    trialEndShort: formatShortDate(trialEnd),
    trialEndFull: formatLongDate(trialEnd),
    yearlyRenewalFromTodayFull: formatLongDate(yearlyRenewalFromToday),
    yearlyRenewalAfterTrialFull: formatLongDate(yearlyRenewalAfterTrial),
  };
}

const PLAN_PRICES = {
  yearly: {
    label: SUBSCRIPTION_PLANS.yearly.label,
    price: SUBSCRIPTION_PLANS.yearly.annualPrice,
    note: SUBSCRIPTION_PLANS.yearly.note,
  },
} as const;

function buildCheckoutOrderSummary(options: {
  selectedPlan: SubscriptionPlanId;
  isTrial: boolean;
  trialMode?: 'cardless' | 'card_on_file';
}): CheckoutOrderSummary {
  const plan = PLAN_PRICES[options.selectedPlan];
  const dates = getCheckoutBillingDates();
  const dueToday = options.isTrial ? '$0.00' : plan.price;

  let dueNote: string;
  let footerNote: string;

  if (options.isTrial) {
    dueNote = `Your ${TRIAL_DAYS}-day trial runs to ${dates.trialEndShort}. First charge of ${plan.price} on ${dates.trialEndFull}, then renews yearly.`;
    footerNote =
      options.trialMode === 'cardless'
        ? `No card today. Add payment any time in settings. Cancel before ${dates.trialEndShort} and you won’t be charged.`
        : `Card fields are provided by Stripe — we never see or store your card number. Cancel any time before ${dates.trialEndShort} and you won’t be charged.`;
  } else {
    dueNote = `Charged today. Next yearly renewal on ${dates.yearlyRenewalFromTodayFull}.`;
    footerNote =
      'Card fields are provided by Stripe — we never see or store your card number. Cancel any time from settings.';
  }

  return {
    planLabel: plan.label,
    planPrice: plan.price,
    planNote: plan.note,
    dueToday,
    dueNote,
    footerNote,
  };
}

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [resumePendingSignup] = useResumePendingSignupMutation();

  // 🔗 API hooks
  const [login] = useLoginMutation();
  const [signup] = useSignupMutation();
  const [verifyTotp] = useVerifyTotpMutation();
  const [generateMfa] = useGenerateMfaMutation();
  const [linkAuthenticator] = useLinkAuthenticatorMutation();
  const [sendEmailOtp] = useSendEmailOtpMutation();
  const [verifyEmailCode] = useVerifyEmailCodeMutation();
  const [requestPasswordReset] = useRequestPasswordResetMutation();
  const [resetPassword] = useResetPasswordMutation();
  const [verifySmsOtp] = useVerifySmsOtpMutation();
  const [startSmsMfa] = useStartSmsMfaMutation();
  const [startEmailMfa] = useStartEmailMfaMutation();
  const [resendSmsMfa] = useResendSmsMfaMutation();

  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [step, setStep] = useState<OnboardingStep>('credentials');
  const [selectedPlan] = useState<SubscriptionPlanId>('yearly');
  const [planDetailsOpen, setPlanDetailsOpen] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [trialMode, setTrialMode] = useState<'cardless' | 'card_on_file'>(
    'cardless',
  );

  const [isNewUser, setIsNewUser] = useState(false);
  const [selectedMFAMethod, setSelectedMFAMethod] =
    useState<MFAMethod>('authenticator');
  const [isLoginMfaChallenge, setIsLoginMfaChallenge] = useState(false);
  const [mfaChallengeToken, setMfaChallengeToken] = useState('');
  const [loginMFAMethods, setLoginMFAMethods] = useState(emptyMfaMethods);
  const [loginPrimaryMFAMethod, setLoginPrimaryMFAMethod] =
    useState<MFAMethod | null>(null);
  const [hasLinkedAuthenticator, setHasLinkedAuthenticator] = useState(false);

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [showPhoneValidation, setShowPhoneValidation] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaReady, setCaptchaReady] = useState(
    () => !isCaptchaEnabledNow(),
  );
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const refreshCaptcha = useCallback(() => {
    setCaptchaToken('');
    if (isCaptchaEnabledNow()) setCaptchaReady(false);
    setCaptchaResetKey(k => k + 1);
  }, []);
  const securityReady =
    !isCaptchaEnabledNow() || (captchaReady && !!captchaToken);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

  const [smsSent, setSmsSent] = useState(false);
  const [error, setError] = useState('');
  const [loadingAction, setLoadingAction] = useState<AuthLoadingAction | null>(
    null,
  );
  const loadingActionRef = useRef<AuthLoadingAction | null>(null);
  const isAuthLoading = (action: AuthLoadingAction) =>
    loadingAction === action;
  const isAuthBusy = loadingAction !== null;
  const startAuthLoading = (action: AuthLoadingAction) => {
    loadingActionRef.current = action;
    setLoadingAction(action);
  };
  const stopAuthLoading = (action?: AuthLoadingAction) => {
    if (action && loadingActionRef.current !== action) return;
    loadingActionRef.current = null;
    setLoadingAction(null);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const session = await fetchSession();
      if (cancelled) return;
      if (!session.authenticated || session.role !== 'owner') return;

      // Still needs plan / trial / payment — keep them in checkout, never dashboard.
      // Also honor ?resume=checkout when AuthWatcher bounced them back from /dashboard.
      const resumeCheckout =
        typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('resume') ===
          'checkout';

      if (session.requires_billing || resumeCheckout) {
        setIsNewUser(true);
        setStep('plan_selection');
        return;
      }

      goToDashboard(router);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // OTP UX
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [cooldown, setCooldown] = useState(0);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const autoMfaVerifyKey = useRef('');
  const autoEmailVerifyKey = useRef('');
  const autoSmsVerifyKey = useRef('');

  const applyAuthError = useCallback((err: unknown, fallback: string) => {
    const parsed = parseAuthApiError(err, fallback);
    if (parsed.status === 429) {
      const wait = parsed.retryAfterSeconds ?? 45;
      setError('');
      setRateLimitSeconds(wait);
      toast.message('Please wait before trying again', {
        description: `You can continue in ${formatRetryCountdown(wait)}.`,
        duration: 4000,
        id: 'auth-rate-limit',
      });
    } else if (
      parsed.status === 403 &&
      /payment|billing|plan|paused|email|vault access/i.test(parsed.message)
    ) {
      setError(parsed.message);
      toast.message('Vault access paused', {
        description: parsed.message,
        duration: 8000,
        id: 'auth-billing-lock',
      });
    } else {
      setError(parsed.message);
      toast.error(parsed.message, { id: 'auth-error' });
    }
    return parsed;
  }, []);

useEffect(() => {
  if (cooldown <= 0) return;

  const timer = setInterval(() => {
    setCooldown(prev => prev - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [cooldown]);

useEffect(() => {
  if (rateLimitSeconds <= 0) return undefined;
  const timer = setInterval(() => {
    setRateLimitSeconds(prev => {
      if (prev <= 1) {
        toast.success('You can try again now', { id: 'auth-rate-limit-ready' });
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  return () => clearInterval(timer);
  // Only start/stop when crossing zero — avoid resetting every tick
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [rateLimitSeconds > 0]);

const guardRateLimit = useCallback(() => {
  if (rateLimitSeconds <= 0) return false;
  toast.message('Please wait', {
    description: `Try again in ${formatRetryCountdown(rateLimitSeconds)}.`,
    id: 'auth-rate-limit',
    duration: 2500,
  });
  return true;
}, [rateLimitSeconds]);

const handleSendEmailCode = async () => {
  if (guardRateLimit()) return;
  if (isAuthBusy) return;
  if (!isNewUser && !securityReady) {
    setError('Wait for the security check to finish before requesting a code');
    toast.error('Wait for the security check to finish');
    return;
  }

  setError('');
  startAuthLoading('send_email_code');

  try {
    const res = await sendEmailOtp({
      email,
      ...(isNewUser
        ? { flow: 'signup' }
        : { captcha_token: captchaToken }),
      otp_session_id: getOtpSessionId(),
      ...(mfaChallengeToken
        ? { mfa_challenge_token: mfaChallengeToken }
        : {}),
    }).unwrap();

    setVerificationSent(true);
    setEmailCode('');
    setAttempts(0);
    setRateLimitSeconds(0);
    setCooldown(res.cooldown_seconds ?? 45);
    refreshCaptcha();
  } catch (err: unknown) {
    applyAuthError(err, 'Failed to send verification code');
    refreshCaptcha();
  } finally {
    stopAuthLoading();
  }
};

  // Inside LoginPage component
 const handleForgotPasswordClick = async () => {
   setError('');

   if (guardRateLimit()) return;

   if (email && isValidEmail(email)) {
     if (!captchaToken) {
       setError('Complete the CAPTCHA before requesting a reset code');
       toast.error('Complete the security check before requesting a reset code');
       return;
     }
     startAuthLoading('forgot_password');

     try {
       await requestPasswordReset({
         email,
         captcha_token: captchaToken,
         otp_session_id: getOtpSessionId(),
       }).unwrap();
       setResetEmail(email);
       refreshCaptcha();
       setResetOtp('');
       setRateLimitSeconds(0);
       setCooldown(45);
       toast.success('If an account exists for that email, a reset code has been sent.');
       setStep('reset_password');
     } catch (err: unknown) {
       applyAuthError(err, 'Failed to send reset code');
       refreshCaptcha();
     } finally {
       stopAuthLoading();
     }
   } else {
     setResetEmail(email);
     setStep('forgot_password');
   }
 };

 const handleRequestReset = async () => {
   setError('');
   if (guardRateLimit()) return;
   if (!captchaToken) {
     setError('Complete the CAPTCHA before requesting a reset code');
     toast.error('Complete the security check before requesting a reset code');
     return;
   }
   startAuthLoading('request_reset');

   try {
     await requestPasswordReset({
       email: resetEmail,
       captcha_token: captchaToken,
       otp_session_id: getOtpSessionId(),
     }).unwrap();
     setResetEmailSent(true);
     refreshCaptcha();
     setResetOtp('');
     setRateLimitSeconds(0);
     toast.success('If an account exists for that email, a reset code has been sent.');
     setCooldown(45);
     setStep('reset_password');
   } catch (err: unknown) {
     applyAuthError(err, 'Failed to send reset code');
     refreshCaptcha();
   } finally {
     stopAuthLoading();
   }
 };
const handleResetPassword = async () => {
  if (newPassword !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }
  if (guardRateLimit()) return;

  startAuthLoading('reset_password');

  try {
    await resetPassword({
      email: resetEmail,
      otp: resetOtp,
      new_password: newPassword,
      captcha_token: captchaToken,
    }).unwrap();

    toast.success('Password reset successfully!');
    setRateLimitSeconds(0);
    setStep('credentials');
  } catch (err: unknown) {
    applyAuthError(err, 'Reset failed');
  } finally {
    stopAuthLoading();
  }
};

const beginLinkedLoginMfa = async (
  method: MFAMethod,
  options?: {
    otpAlreadySent?: boolean;
    /** Login already tried to send and failed — do not auto-send again */
    otpSendFailed?: boolean;
    cooldownSeconds?: number;
    loginChallenge?: boolean;
    challengeToken?: string;
    /** Resolved account email (needed when user signed in with phone). */
    accountEmail?: string;
  },
) => {
  setSelectedMFAMethod(method);
  setError('');

  const useLoginChallenge = options?.loginChallenge ?? isLoginMfaChallenge;
  const challengeToken = options?.challengeToken ?? mfaChallengeToken;
  const accountEmail = (options?.accountEmail || email).trim();

  if (method === 'authenticator') {
    setHasLinkedAuthenticator(true);
    setMfaCode('');
    setStep('verifyMfa');
    return;
  }

  if (method === 'email') {
    setEmailCode('');
    setAttempts(0);

    if (options?.otpAlreadySent) {
      setVerificationSent(true);
      setCooldown(options.cooldownSeconds ?? 45);
      setStep('verifyEmail');
      return;
    }

    // Failed send → wait for user to resend; never treat as "code sent"
    if (options?.otpSendFailed) {
      setVerificationSent(false);
      setCooldown(0);
      setStep('verifyEmail');
      return;
    }

    if (useLoginChallenge && challengeToken) {
      if (isAuthBusy) {
        setStep('verifyEmail');
        return;
      }
      startAuthLoading('login_mfa_email_send');
      try {
        const res = await startEmailMfa({
          email: accountEmail,
          mfa_challenge_token: challengeToken,
        }).unwrap();
        setVerificationSent(true);
        setRateLimitSeconds(0);
        setCooldown(res.cooldown_seconds ?? 45);
      } catch (err: unknown) {
        setVerificationSent(false);
        setError(getApiErrorMessage(err, 'Failed to send verification code'));
      } finally {
        stopAuthLoading('login_mfa_email_send');
      }
      setStep('verifyEmail');
      return;
    }

    setVerificationSent(false);
    setCooldown(0);
    setStep('verifyEmail');
    return;
  }

  if (options?.otpAlreadySent) {
    setSmsSent(true);
    setOtp(Array(OTP_LENGTH).fill(''));
    setAttempts(0);
    setCooldown(options.cooldownSeconds ?? 45);
    setStep('verifySms');
    return;
  }

  if (options?.otpSendFailed) {
    setSmsSent(false);
    setOtp(Array(OTP_LENGTH).fill(''));
    setAttempts(0);
    setCooldown(0);
    setStep('verifySms');
    return;
  }

  if (isAuthBusy) {
    setStep('verifySms');
    return;
  }

  startAuthLoading('start_sms');
  try {
    const smsRes = await startSmsMfa({
      email: accountEmail,
      ...(useLoginChallenge && challengeToken
        ? { mfa_challenge_token: challengeToken }
        : {}),
    }).unwrap();
    if (smsRes.phone) setPhoneNumber(smsRes.phone);
    setSmsSent(true);
    setOtp(Array(OTP_LENGTH).fill(''));
    setAttempts(0);
    setRateLimitSeconds(0);
    setCooldown(smsRes.cooldown_seconds ?? 45);
    setStep('verifySms');
  } catch (err: unknown) {
    setSmsSent(false);
    setError(getApiErrorMessage(err, 'Failed to send SMS code'));
    setStep('verifySms');
  } finally {
    stopAuthLoading();
  }
};

  // ------------------------------
  // Password Strength
  // ------------------------------
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    score: 0,
  });

  const evaluatePasswordStrength = (pwd: string) => {
    const length = pwd.length >= 12;
    const uppercase = /[A-Z]/.test(pwd);
    const lowercase = /[a-z]/.test(pwd);
    const number = /\d/.test(pwd);
    const special = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    const score = [length, uppercase, lowercase, number, special].filter(
      Boolean,
    ).length;
    setPasswordStrength({
      length,
      uppercase,
      lowercase,
      number,
      special,
      score,
    });
  };


  // -----------------------------------------------------------
  // HANDLERS
  // -----------------------------------------------------------

const handleCredentialsSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoginMfaChallenge(false);
  setLoginPrimaryMFAMethod(null);
  setMfaChallengeToken('');

  if (guardRateLimit()) return;

  try {
    if (isNewUser) {
      if (!isValidEmail(email)) throw new Error('Enter a valid email');
    } else if (!isValidLoginIdentifier(email)) {
      throw new Error('Enter a valid email or phone number');
    }
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    if (isNewUser) {
      if (!firstName.trim()) {
        throw new Error('Enter your first name');
      }
      if (!lastName.trim()) {
        throw new Error('Enter your last name');
      }
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (passwordStrength.score < 4) {
        throw new Error('Use a stronger password');
      }

      if (!agreeToTerms) {
        throw new Error('Please agree to the terms to continue');
      }

      setStep('mfa_method_selection');
      return;
    }

    startAuthLoading('sign_in');

    if (!securityReady) {
      setError('Complete the security check before signing in');
      toast.error('Complete the security check before continuing');
      stopAuthLoading('sign_in');
      return;
    }

    const res = await login({
      email,
      password,
      ...(!isNewUser
        ? {
            captcha_token: captchaToken,
            otp_session_id: getOtpSessionId(),
          }
        : {}),
    }).unwrap();

    // Phone login returns the account email — keep it for MFA / session calls
    const accountEmail = (res.email || email).trim();
    if (res.email) {
      setEmail(res.email);
    }

    if (res.mfa_required) {
      const activeMethods = normalizeMfaMethods(
        res.mfa_methods,
        res.method as MFAMethod | undefined,
      );
      const preferredMethod =
        res.method && activeMethods[res.method as MFAMethod]
          ? (res.method as MFAMethod)
          : firstAvailableMfaMethod(activeMethods);

      setLoginMFAMethods(activeMethods);
      setLoginPrimaryMFAMethod(preferredMethod);
      setIsLoginMfaChallenge(true);
      setSelectedMFAMethod(preferredMethod);
      setMfaChallengeToken(res.mfa_challenge_token ?? '');
      setVerificationSent(false);
      setSmsSent(false);
      setOtp(Array(OTP_LENGTH).fill(''));
      setAttempts(0);

      if (res.otp_error) {
        setError(
          typeof res.otp_error === 'string'
            ? res.otp_error
            : 'Could not send verification code. Please try again.',
        );
      }

      await beginLinkedLoginMfa(preferredMethod, {
        otpAlreadySent: Boolean(res.otp_sent) && !res.otp_error,
        otpSendFailed: Boolean(res.otp_error) && !res.otp_sent,
        cooldownSeconds: res.cooldown_seconds,
        loginChallenge: true,
        challengeToken: res.mfa_challenge_token ?? '',
        accountEmail,
      });
      return;
    }

    await completeOwnerAuth(router, dispatch, {
      email: accountEmail,
      requiresBilling: Boolean(res.requires_billing),
      onNeedsBilling: () => {
        setError('');
        setStep('plan_selection');
      },
    });
    setRateLimitSeconds(0);
  } catch (err: unknown) {
    applyAuthError(err, 'Authentication failed');
    refreshCaptcha();
  } finally {
    stopAuthLoading('sign_in');
  }
};

const handleMFAMethodSelection = async () => {
  setError('');
  startAuthLoading('mfa_method');

  try {
    if (!selectedMFAMethod) {
      throw new Error('Select a verification method');
    }

    if (isNewUser) {
      if (selectedMFAMethod === 'sms') {
        setShowPhoneValidation(true);
      }

      if (selectedMFAMethod === 'sms' && !phoneNumber.trim()) {
        throw new Error('Phone number is required for SMS MFA');
      }

      if (selectedMFAMethod === 'sms' && !isValidE164PhoneNumber(phoneNumber.trim())) {
        throw new Error('Enter a valid phone number for the selected country');
      }

      const composedName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const signupPayload: {
        email: string;
        password: string;
        full_name?: string;
        first_name?: string;
        last_name?: string;
        mfa_method: MFAMethod;
        phone_number?: string;
        otp_session_id?: string;
      } = {
        email,
        password,
        full_name: composedName || undefined,
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        mfa_method: selectedMFAMethod,
        otp_session_id: getOtpSessionId(),
      };

      if (phoneNumber.trim()) {
        signupPayload.phone_number = phoneNumber.trim();
      }

      const signupRes = await signup(signupPayload).unwrap();

      // ✅ NEW USER → AUTHENTICATOR
      if (selectedMFAMethod === 'authenticator') {
        setQrCodeUrl(signupRes.qrCodeUrl || '');
        setHasLinkedAuthenticator(false);
        setMfaCode('');
        setStep('setupMfa');
        return;
      }

      // ✅ NEW USER → EMAIL
      if (selectedMFAMethod === 'email') {
        setVerificationSent(true);
        setEmailCode('');
        setAttempts(0);
        setRateLimitSeconds(0);
        setCooldown(signupRes.cooldown_seconds ?? 45);
        setStep('verifyEmail');
        return;
      }

      // ✅ NEW USER → SMS
      if (selectedMFAMethod === 'sms') {
        setSmsSent(true); // backend already sent it during signup
        setOtp(Array(OTP_LENGTH).fill(''));
        setAttempts(0);
        setRateLimitSeconds(0);
        setCooldown(signupRes.cooldown_seconds ?? 45);
        setStep('verifySms');
        return;
      }
    }

    if (isLoginMfaChallenge) {
      const isAlreadyActive = loginMFAMethods[selectedMFAMethod];

      if (!isAlreadyActive) {
        throw new Error(
          'That MFA method is not linked. Log in with a linked method, then add new methods in Vault Settings.',
        );
      }

      await beginLinkedLoginMfa(selectedMFAMethod, {
        loginChallenge: true,
        challengeToken: mfaChallengeToken,
      });
      return;
    }

    // =========================
    // EXISTING USER MFA SETUP
    // =========================
    if (selectedMFAMethod === 'authenticator') {
      const qr = await generateMfa({ email }).unwrap();
      setQrCodeUrl(qr.qrCodeUrl);
      setHasLinkedAuthenticator(false);
      setMfaCode('');
      setStep('setupMfa');
      return;
    }

    if (selectedMFAMethod === 'email') {
      setVerificationSent(false);
      setEmailCode('');
      setAttempts(0);
      setCooldown(0);
      setStep('verifyEmail');
      return;
    }

    if (selectedMFAMethod === 'sms') {
      setShowPhoneValidation(true);

      if (!phoneNumber.trim()) {
        throw new Error('Enter a phone number to enable SMS MFA');
      }

      if (!isValidE164PhoneNumber(phoneNumber.trim())) {
        throw new Error('Enter a valid phone number for the selected country');
      }

      if (!captchaToken) {
        throw new Error('Complete the CAPTCHA before requesting an OTP');
      }

      const smsRes = await startSmsMfa({
        email,
        phoneNumber: phoneNumber.trim(),
        captcha_token: captchaToken,
        otp_session_id: getOtpSessionId(),
      }).unwrap();

      if (smsRes.requires_phone) {
        throw new Error('Enter a phone number to enable SMS MFA');
      }

      if (smsRes.phone) setPhoneNumber(smsRes.phone);
      setSmsSent(true);
      setOtp(Array(OTP_LENGTH).fill(''));
      setAttempts(0);
      setCooldown(smsRes.cooldown_seconds ?? 60);
      setStep('verifySms');
      return;
    }
  } catch (err: unknown) {
    const parsed = parseAuthApiError(err, 'Failed to continue');
    const detail = parsed.message;

    // ✅ PENDING SIGNUP ALREADY EXISTS → CONTINUE INSTEAD OF FAILING
    if (
      isNewUser &&
      typeof detail === 'string' &&
      detail.includes('Signup already started')
    ) {
    if (selectedMFAMethod === 'authenticator') {
      try {
        const resumeRes = await resumePendingSignup({
          email,
          otp_session_id: getOtpSessionId(),
        }).unwrap();

        setQrCodeUrl(resumeRes.qrCodeUrl || '');
        setHasLinkedAuthenticator(false);
        setMfaCode('');
        setError('');
        setStep('setupMfa');
        return;
      } catch (resumeErr: unknown) {
        applyAuthError(
          resumeErr,
          'Signup already started, but failed to restore QR code.',
        );
        refreshCaptcha();
        return;
      }
    }

      if (selectedMFAMethod === 'email') {
        setVerificationSent(true);
        setEmailCode('');
        setStep('verifyEmail');
        return;
      }

      if (selectedMFAMethod === 'sms') {
        try {
          const resendRes = await resendSmsMfa({
            email,
            otp_session_id: getOtpSessionId(),
          }).unwrap();
          setSmsSent(true);
          setOtp(Array(OTP_LENGTH).fill(''));
          setAttempts(0);
          setCooldown(resendRes.cooldown_seconds ?? 45);
          setError('');
          setStep('verifySms');
          return;
        } catch (resendErr: unknown) {
          applyAuthError(
            resendErr,
            'Signup already started, but SMS resend failed. Try again or pick another method.',
          );
          return;
        }
      }
    }

    applyAuthError(err, 'Failed to continue');
    refreshCaptcha();
  } finally {
    stopAuthLoading('mfa_method');
  }
};

const verifyMfaCode = useCallback(async () => {
  setError('');
  startAuthLoading('verify_mfa');

  try {
    if (!verifyTOTPCode(mfaCode)) {
      throw new Error('Enter valid 6-digit code');
    }

    let res;

    if (hasLinkedAuthenticator) {
      res = await verifyTotp({
        email,
        code: mfaCode,
        ...(isLoginMfaChallenge
          ? { mfa_challenge_token: mfaChallengeToken }
          : {}),
      }).unwrap();
    } else {
      res = await linkAuthenticator({
        email,
        code: mfaCode,
      }).unwrap();
    }

    await completeOwnerAuth(router, dispatch, {
      email,
      requiresBilling: Boolean(
        (res as { requires_billing?: boolean })?.requires_billing,
      ),
      onNeedsBilling: () => {
        setError('');
        setStep('plan_selection');
      },
    });
  } catch (err: unknown) {
    setError(getApiErrorMessage(err, 'Invalid verification code'));
  } finally {
    stopAuthLoading('verify_mfa');
  }
}, [
  mfaCode,
  hasLinkedAuthenticator,
  verifyTotp,
  email,
  linkAuthenticator,
  router,
]);

const handleVerifyMfa = async (e: React.FormEvent) => {
  e.preventDefault();
  await verifyMfaCode();
};

const verifyEmailOtpCode = useCallback(async () => {
  setError('');

  if (guardRateLimit()) return;

  if (attempts >= MAX_ATTEMPTS) {
    setError('Too many failed attempts. Try again later.');
    toast.error('Too many failed attempts. Try again later.');
    return;
  }

  startAuthLoading('verify_email');

  try {
    const code = parseInt(emailCode, 10);
    if (isNaN(code) || emailCode.length !== 6) {
      throw new Error('Enter the 6-digit code from your email');
    }

    const res = await verifyEmailCode({
      email,
      code,
      otp_session_id: getOtpSessionId(),
      ...(isLoginMfaChallenge
        ? { mfa_challenge_token: mfaChallengeToken }
        : {}),
    }).unwrap();

    setAttempts(0);
    setRateLimitSeconds(0);
    toast.success('Email verified');

    const destination = await completeOwnerAuth(router, dispatch, {
      email,
      requiresBilling: Boolean(res.requires_billing),
      onNeedsBilling: () => {
        setError('');
        setIsNewUser(false);
        setStep('plan_selection');
      },
    });

    if (destination === 'dashboard') {
      toast.success('Signed in');
    }
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message === 'Session not established'
    ) {
      setError('Verified, but sign-in session failed. Please sign in.');
      toast.error('Verified, but sign-in session failed. Please sign in.');
      setStep('credentials');
      setIsNewUser(false);
      refreshCaptcha();
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (nextAttempts >= MAX_ATTEMPTS) {
      setError('Too many failed attempts. Try again later.');
      toast.error('Too many failed attempts. Try again later.');
    } else {
      applyAuthError(err, 'Invalid or expired code. Request a new one.');
    }
  } finally {
    stopAuthLoading('verify_email');
  }
}, [
  emailCode,
  verifyEmailCode,
  email,
  router,
  attempts,
  rateLimitSeconds,
  isLoginMfaChallenge,
  mfaChallengeToken,
  dispatch,
  applyAuthError,
  refreshCaptcha,
]);

const handleVerifyEmail = async (e: React.FormEvent) => {
  e.preventDefault();
  await verifyEmailOtpCode();
};

const verifySmsOtpCode = useCallback(async () => {
  setError('');

  const smsCode = otp.join('');

  if (smsCode.length !== 6) {
    setError('Enter the 6-digit code');
    return;
  }

  if (attempts >= MAX_ATTEMPTS) {
    setError('Too many failed attempts. Try again later.');
    return;
  }

  startAuthLoading('verify_sms');

  try {
    const res = await verifySmsOtp({
      email,
      code: smsCode,
      otp_session_id: getOtpSessionId(),
      ...(isLoginMfaChallenge
        ? { mfa_challenge_token: mfaChallengeToken }
        : {}),
    }).unwrap();

    setAttempts(0);

    await completeOwnerAuth(router, dispatch, {
      email,
      requiresBilling: Boolean(
        (res as { requires_billing?: boolean })?.requires_billing,
      ),
      onNeedsBilling: () => {
        setError('');
        setStep('plan_selection');
      },
    });
  } catch (err: unknown) {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    setError(
      nextAttempts >= MAX_ATTEMPTS
        ? 'Too many failed attempts. Try again later.'
        : getApiErrorMessage(err, 'Invalid SMS code'),
    );
  } finally {
    stopAuthLoading('verify_sms');
  }
}, [otp, attempts, verifySmsOtp, email, router]);

const handleVerifySms = async (e: React.FormEvent) => {
  e.preventDefault();
  await verifySmsOtpCode();
};

useEffect(() => {
  const canAutoVerify = step === 'verifyMfa' || step === 'setupMfa';

  if (!canAutoVerify || mfaCode.length !== 6) {
    autoMfaVerifyKey.current = '';
    return;
  }

  if (isAuthBusy) return;

  const verifyKey = [
    step,
    hasLinkedAuthenticator ? 'linked' : 'setup',
    qrCodeUrl,
    mfaCode,
  ].join(':');

  if (autoMfaVerifyKey.current === verifyKey) return;

  autoMfaVerifyKey.current = verifyKey;
  void verifyMfaCode();
}, [step, mfaCode, loadingAction, hasLinkedAuthenticator, qrCodeUrl, verifyMfaCode]);

useEffect(() => {
  if (
    step !== 'verifyEmail' ||
    emailCode.length !== 6 ||
    !verificationSent ||
    attempts >= MAX_ATTEMPTS
  ) {
    autoEmailVerifyKey.current = '';
    return;
  }

  if (isAuthBusy) return;

  const verifyKey = [
    email,
    emailCode,
    isNewUser ? 'signup' : 'login',
  ].join(':');

  if (autoEmailVerifyKey.current === verifyKey) return;

  autoEmailVerifyKey.current = verifyKey;
  void verifyEmailOtpCode();
}, [
  step,
  emailCode,
  verificationSent,
  loadingAction,
  email,
  isNewUser,
  verifyEmailOtpCode,
  attempts,
]);

const handleResendEmail = async () => {
  if (cooldown > 0 || guardRateLimit() || isAuthBusy) return;

  if (!isNewUser && !captchaToken) {
    setError('Complete the CAPTCHA before resending the OTP');
    return;
  }

  try {
    setError('');
    startAuthLoading('resend_email');

    const res = await sendEmailOtp({
      email,
      ...(isNewUser ? { flow: 'signup' } : { captcha_token: captchaToken }),
      otp_session_id: getOtpSessionId(),
      ...(mfaChallengeToken
        ? { mfa_challenge_token: mfaChallengeToken }
        : {}),
    }).unwrap();

    setRateLimitSeconds(0);
    setCooldown(res.cooldown_seconds ?? 45);
    setEmailCode('');
    if (!isNewUser) setCaptchaToken('');
    setVerificationSent(true);
  } catch (err: unknown) {
    applyAuthError(err, 'Failed to resend OTP');
    if (!isNewUser) refreshCaptcha();
  } finally {
    stopAuthLoading('resend_email');
  }
};

useEffect(() => {
  const smsCode = otp.join('');

  if (
    step !== 'verifySms' ||
    smsCode.length !== 6 ||
    !smsSent ||
    attempts >= MAX_ATTEMPTS
  ) {
    autoSmsVerifyKey.current = '';
    return;
  }

  if (isAuthBusy) return;

  const verifyKey = [email, smsCode, attempts].join(':');

  if (autoSmsVerifyKey.current === verifyKey) return;

  autoSmsVerifyKey.current = verifyKey;
  void verifySmsOtpCode();
}, [
  step,
  otp,
  smsSent,
  attempts,
  loadingAction,
  email,
  verifySmsOtpCode,
]);

const handleResendSms = async () => {
  if (cooldown > 0 || guardRateLimit() || isAuthBusy) return;

  if (!isNewUser && !captchaToken) {
    setError('Complete the CAPTCHA before resending the OTP');
    return;
  }

  try {
    setError('');
    startAuthLoading('resend_sms');

    const res = await resendSmsMfa({
      email,
      ...(isNewUser ? { flow: 'signup' } : { captcha_token: captchaToken }),
      otp_session_id: getOtpSessionId(),
    }).unwrap();

    setRateLimitSeconds(0);
    setCooldown(res.cooldown_seconds ?? 45);
    setOtp(Array(OTP_LENGTH).fill(''));
    if (!isNewUser) refreshCaptcha();
  } catch (err: unknown) {
    applyAuthError(err, 'Failed to resend OTP');
    if (!isNewUser) refreshCaptcha();
  } finally {
    stopAuthLoading('resend_sms');
  }
};
  // Animation
  const stepVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };
const handleBack = () => {
  switch (step) {
    case 'payment':
      setStep('plan_selection');
      break;

    case 'plan_selection':
      setStep('mfa_method_selection');
      break;

    case 'verifyMfa':
    case 'setupMfa':
    case 'verifyEmail':
    case 'verifySms':
      setError('');
      setStep('mfa_method_selection');
      break;

    case 'mfa_method_selection':
      setError('');
      setStep('credentials');
      break;

    default:
      setStep('credentials');
  }
};

const isMethodAvailable = (method: MFAMethod) =>
  isNewUser || !isLoginMfaChallenge || loginMFAMethods[method];

const getMethodBadge = (method: MFAMethod) => {
  if (!isLoginMfaChallenge || isNewUser) return null;
  if (loginMFAMethods[method]) {
    return method === loginPrimaryMFAMethod
      ? 'Primary linked'
      : 'Secondary linked';
  }
  return 'Set up in Vault Settings';
};

const showSmsPhoneInput =
  selectedMFAMethod === 'sms' &&
  (isNewUser || (!isLoginMfaChallenge && !isNewUser));

const showEmailCaptcha =
  selectedMFAMethod === 'email' && !isNewUser && !isLoginMfaChallenge;

const orderedMfaMethods =
  isLoginMfaChallenge && loginPrimaryMFAMethod
    ? [
        loginPrimaryMFAMethod,
        ...MFA_METHODS.filter(method => method !== loginPrimaryMFAMethod),
      ]
    : MFA_METHODS;

const getMfaMethodMeta = (method: MFAMethod) => {
  if (method === 'authenticator') {
    return {
      icon: <Smartphone className="h-4 w-4 text-[var(--accent-teal)]" />,
      title: 'Authenticator app',
      description:
        'Codes from Google Authenticator, 1Password, or Authy.',
      fallbackBadge: 'Most Secure',
      badgeVariant: 'secondary' as const,
    };
  }

  if (method === 'email') {
    return {
      icon: <Mail className="h-4 w-4 text-[var(--accent-teal)]" />,
      title: 'Email code',
      description: email
        ? `A 6-digit code to ${email}.`
        : 'A 6-digit code to your email.',
      fallbackBadge: 'Convenient',
      badgeVariant: 'outline' as const,
    };
  }

  const phoneHint = phoneNumber.trim()
    ? `A code to ${phoneNumber.trim().replace(/\d(?=\d{4})/g, '·')}.`
    : 'A code to your mobile number.';

  return {
    icon: <MessageSquare className="h-4 w-4 text-[var(--ink-muted)]" />,
    title: 'Text message',
    description: phoneHint,
    fallbackBadge: 'Medium',
    badgeVariant: 'outline' as const,
  };
};

const signupStepIndex: 1 | 2 | 3 =
  step === 'plan_selection' || step === 'payment'
    ? 3
    : step === 'credentials'
      ? 1
      : 2;

const authMode: 'login' | 'signup' = isNewUser ? 'signup' : 'login';

const mobileStepLabel = (() => {
  if (isNewUser) {
    if (step === 'credentials') return 'Step 1 of 3';
    if (step === 'plan_selection' || step === 'payment') return 'Step 3 of 3';
    if (
      step === 'mfa_method_selection' ||
      step === 'setupMfa' ||
      step === 'verifyMfa' ||
      step === 'verifyEmail' ||
      step === 'verifySms'
    ) {
      return 'Step 2 of 3';
    }
  }
  if (
    !isNewUser &&
    (step === 'verifyMfa' ||
      step === 'verifyEmail' ||
      step === 'verifySms' ||
      step === 'mfa_method_selection')
  ) {
    return 'Step 2 of 2';
  }
  return undefined;
})();

const mobileSubtitle =
  step === 'plan_selection'
    ? 'Start paid now, or begin a 14-day trial with no charge.'
    : undefined;

const checkoutOrderSummary = (() => {
  if (step !== 'payment' && step !== 'plan_selection') return null;
  // Plan step: preview selected plan with trial-first due ($0) until they pick pay vs trial.
  if (step === 'plan_selection') {
    const plan = PLAN_PRICES[selectedPlan];
    const dates = getCheckoutBillingDates();
    return {
      planLabel: plan.label,
      planPrice: plan.price,
      planNote: plan.note,
      dueToday: '$0.00',
      dueNote: `Trial or pay today. On trial, first charge of ${plan.price} is ${dates.trialEndFull}, then renews yearly.`,
      footerNote: `Annual billing only. After the first charge, your next renewal is ${dates.yearlyRenewalAfterTrialFull}.`,
    } satisfies CheckoutOrderSummary;
  }
  return buildCheckoutOrderSummary({
    selectedPlan,
    isTrial,
    trialMode,
  });
})();

const signupAsideSteps = (() => {
  const mfaLabel =
    selectedMFAMethod === 'authenticator'
      ? 'Authenticator app · Most Secure'
      : selectedMFAMethod === 'sms'
        ? 'Text message'
        : selectedMFAMethod === 'email'
          ? 'Email code'
          : 'Authenticator app, email, or SMS';

  return [
    {
      title: 'Create your account',
      description: email.trim() || 'Email and a password',
    },
    {
      title: 'Secure it',
      description: mfaLabel,
    },
    {
      title: 'Your annual plan',
      description: 'Then payment, or start the trial',
    },
  ];
})();

const mobileTitle = (() => {
  if (step === 'plan_selection') return 'Your annual plan';
  if (step === 'payment') {
    return isTrial ? 'Start your trial' : 'Secure checkout';
  }
  if (step === 'credentials') {
    return isNewUser ? 'Create your account' : 'Welcome back';
  }
  if (step === 'mfa_method_selection') {
    return isLoginMfaChallenge
      ? 'Try another way'
      : 'How should we verify it’s you?';
  }
  if (
    step === 'verifyMfa' ||
    step === 'verifyEmail' ||
    step === 'verifySms' ||
    step === 'setupMfa'
  ) {
    return 'Enter the code we texted you';
  }
  if (step === 'forgot_password') return 'Forgot password';
  if (step === 'reset_password') return 'Reset password';
  return 'Orderly Affairs';
})();

const passwordStrengthHint = (() => {
  if (!password) return undefined;
  if (passwordStrength.score >= 5) return 'Very strong';
  if (passwordStrength.score >= 4) {
    return passwordStrength.special
      ? 'Strong'
      : 'Strong · add one more symbol for the best score';
  }
  if (passwordStrength.score >= 3) return 'Moderate · keep going';
  return 'Weak · add length and variety';
})();

const backButtonLabel =
  isLoginMfaChallenge &&
  (step === 'verifyMfa' || step === 'verifyEmail' || step === 'verifySms')
    ? 'Try another way'
    : 'Back';

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  const isPasswordResetFlow =
    step === 'forgot_password' || step === 'reset_password';
  const isPaymentStep = step === 'payment';
  const isPlanStep = step === 'plan_selection';

  return (
    <AuthPortalShell
      mode={authMode}
      signupStep={signupStepIndex}
      signupSteps={signupAsideSteps}
      checkoutSummary={checkoutOrderSummary}
      mobileTitle={mobileTitle}
      mobileStepLabel={mobileStepLabel}
      mobileSubtitle={mobileSubtitle}
      mobileShowTagline={!isNewUser && step === 'credentials'}
      mobileChrome={
        isPasswordResetFlow
          ? 'reset'
          : isPaymentStep
            ? 'checkout'
            : isPlanStep
              ? 'plan'
              : 'brand'
      }
      onMobileBack={handleBack}
    >
      <AuthCard
        flush={step === 'payment' || step === 'plan_selection'}
        flushOnMobile={
          step === 'credentials' || step === 'reset_password'
        }
        wide={isPlanStep || isPaymentStep}
        className={
          isPlanStep ? 'lg:px-[52px] lg:py-[44px]' : undefined
        }
      >
            {error &&
              rateLimitSeconds <= 0 &&
              step !== 'payment' &&
              step !== 'plan_selection' &&
              step !== 'forgot_password' &&
              step !== 'reset_password' && (
              <InlineNotice
                variant="danger"
                className="mb-4"
                title={error}
              />
            )}
            <RateLimitBanner seconds={rateLimitSeconds} />
            {step !== 'credentials' &&
              step !== 'forgot_password' &&
              step !== 'reset_password' &&
              step !== 'payment' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className={cn(
                  'mb-4 items-center gap-2 text-[var(--ink-muted)]',
                  step === 'plan_selection' ? 'hidden lg:flex' : 'flex',
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                {backButtonLabel}
              </Button>
            )}

            <AnimatePresence mode="wait">
              {step !== 'payment' ? (
              <motion.div
                key={step}
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.35 }}
                className={cn(
                  step === 'plan_selection' &&
                    'flex min-h-0 flex-1 flex-col lg:block lg:flex-none',
                )}
              >
                {/* STEP 1: Credentials */}
                {step === 'credentials' && (
                  <form
                    data-cy="auth-credentials-form"
                    onSubmit={handleCredentialsSubmit}
                    className="space-y-3 lg:space-y-4"
                  >
                    {!isNewUser ? (
                      <AuthModeToggle
                        isNewUser={isNewUser}
                        disabled={isAuthBusy}
                        onChange={next => {
                          setIsNewUser(next);
                          // Captcha is login/reset only — don't gate signup on it
                          if (!next) refreshCaptcha();
                          else {
                            setCaptchaToken('');
                            setCaptchaReady(true);
                          }
                        }}
                      />
                    ) : null}

                    <div
                      className={cn(
                        'mb-0 space-y-0',
                        isNewUser ? 'lg:mb-[22px]' : 'mb-6 hidden lg:block',
                      )}
                    >
                      <h2
                        className={cn(
                          'auth-serif-title m-0 font-semibold',
                          isNewUser
                            ? 'hidden text-[21px] lg:block'
                            : 'text-[22px]',
                        )}
                      >
                        {isNewUser ? 'Create Your Account' : 'Welcome back'}
                      </h2>
                      <p
                        className={cn(
                          'mt-[7px] mb-0 text-[14px] leading-snug text-[#6e7c77]',
                          isNewUser ? 'hidden lg:block' : '',
                        )}
                      >
                        {isNewUser
                          ? 'Set up your secure Orderly Affairs account.'
                          : 'Sign in with your email or phone number.'}
                      </p>
                    </div>

                    {!isNewUser ? (
                      <>
                        <TurnstileCaptcha
                          gateMode
                          onTokenChange={setCaptchaToken}
                          onReadyChange={setCaptchaReady}
                          resetKey={captchaResetKey}
                        />

                        {!securityReady ? (
                          <p className="text-center text-sm text-[#6e7c77]">
                            Form unlocks after Cloudflare security check finishes.
                          </p>
                        ) : null}
                      </>
                    ) : null}

                    <div
                      className={
                        !isNewUser && !securityReady
                          ? 'space-y-3 opacity-40 pointer-events-none select-none lg:space-y-3.5'
                          : 'space-y-3 lg:space-y-3.5'
                      }
                      aria-disabled={!isNewUser && !securityReady}
                    >
                    {isNewUser ? (
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                          <div>
                            <AuthFieldLabel htmlFor="firstName">
                              First name
                            </AuthFieldLabel>
                            <Input
                              id="firstName"
                              data-cy="auth-first-name"
                              type="text"
                              value={firstName}
                              onChange={e => setFirstName(e.target.value)}
                              placeholder="Margaret"
                              className="auth-field"
                              autoComplete="given-name"
                              required
                            />
                          </div>
                          <div>
                            <AuthFieldLabel htmlFor="lastName">
                              Last name
                            </AuthFieldLabel>
                            <Input
                              id="lastName"
                              data-cy="auth-last-name"
                              type="text"
                              value={lastName}
                              onChange={e => setLastName(e.target.value)}
                              placeholder="Bell"
                              className="auth-field"
                              autoComplete="family-name"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <AuthFieldLabel htmlFor="email">Email</AuthFieldLabel>
                          <Input
                            id="email"
                            data-cy="auth-email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@email.com"
                            className="auth-field"
                            autoComplete="email"
                            required
                          />
                        </div>
                        <div>
                          <AuthFieldLabel htmlFor="password">
                            New password
                          </AuthFieldLabel>
                          <div className="relative">
                            <Input
                              id="password"
                              data-cy="auth-password"
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={e => {
                                setPassword(e.target.value);
                                evaluatePasswordStrength(e.target.value);
                              }}
                              placeholder="Create a password"
                              className="auth-field pr-16"
                              autoComplete="new-password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="auth-show-toggle absolute right-1 top-1/2 -translate-y-1/2"
                            >
                              {showPassword ? 'Hide' : 'Show'}
                            </button>
                          </div>
                          {password ? (
                            <PasswordStrengthBars
                              score={passwordStrength.score}
                              hint={passwordStrengthHint}
                            />
                          ) : null}
                        </div>
                        <div>
                          <AuthFieldLabel htmlFor="confirmPassword">
                            Confirm password
                          </AuthFieldLabel>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              data-cy="auth-confirm-password"
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={e => setConfirmPassword(e.target.value)}
                              placeholder="Re-enter your password"
                              className="auth-field pr-16"
                              autoComplete="new-password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              className="auth-show-toggle absolute right-1 top-1/2 -translate-y-1/2"
                            >
                              {showConfirmPassword ? 'Hide' : 'Show'}
                            </button>
                          </div>
                          {confirmPassword && password !== confirmPassword ? (
                            <p className="mt-1.5 text-xs text-red-500">
                              Passwords do not match
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <AuthFieldLabel htmlFor="email">
                            Email or phone
                          </AuthFieldLabel>
                          <Input
                            id="email"
                            data-cy="auth-email"
                            type="text"
                            inputMode="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@email.com or +1…"
                            className="auth-field"
                            autoComplete="username"
                            required
                          />
                        </div>
                        <div>
                          <AuthFieldLabel htmlFor="password">
                            Password
                          </AuthFieldLabel>
                          <div className="relative">
                            <Input
                              id="password"
                              data-cy="auth-password"
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={e => {
                                setPassword(e.target.value);
                                evaluatePasswordStrength(e.target.value);
                              }}
                              placeholder="Enter your password"
                              className="auth-field pr-16"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="auth-show-toggle absolute right-1 top-1/2 -translate-y-1/2"
                            >
                              {showPassword ? 'Hide' : 'Show'}
                            </button>
                          </div>
                          <div className="mt-3 mb-[22px] hidden items-center justify-between gap-3 text-[13px] lg:flex">
                            <label className="flex items-center gap-2 text-[#3c4a46]">
                              <input
                                type="checkbox"
                                checked={keepSignedIn}
                                onChange={e =>
                                  setKeepSignedIn(e.target.checked)
                                }
                                className="h-[17px] w-[17px] rounded-[5px] border-[1.5px] border-[#cfd8d4] accent-[#2B5A8C]"
                              />
                              Keep me signed in
                            </label>
                            <Button
                              type="button"
                              data-cy="auth-forgot-password"
                              variant="link"
                              className="auth-link h-auto p-0 text-[13px]"
                              onClick={handleForgotPasswordClick}
                              disabled={isAuthBusy}
                            >
                              {isAuthLoading('forgot_password') && (
                                <span className="mr-2 h-3 w-3 border-2 border-[#2B5A8C] border-t-transparent rounded-full animate-spin"></span>
                              )}
                              Forgot password?
                            </Button>
                          </div>
                        </div>
                      </>
                    )}

                    {isNewUser && (
                      <label className="mt-1 flex items-start gap-2.5 text-[12.5px] leading-[1.5] text-[#3c4a46] lg:mt-4 lg:text-[13px]">
                        <input
                          type="checkbox"
                          checked={agreeToTerms}
                          onChange={e => setAgreeToTerms(e.target.checked)}
                          className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded-[5px] border-[1.5px] border-[#2B5A8C] accent-[#2B5A8C]"
                        />
                        <span>
                          I agree to the terms and understand this kit is not
                          legal advice.
                        </span>
                      </label>
                    )}

                    <Button
                      data-cy="auth-submit"
                      className="w-full btn-primary mt-auto lg:mt-[18px]"
                      disabled={
                        isAuthBusy ||
                        rateLimitSeconds > 0 ||
                        (!isNewUser && !securityReady) ||
                        (isNewUser &&
                          (!!confirmPassword && password !== confirmPassword))
                      }
                    >
                      {rateLimitedButtonLabel(
                        rateLimitSeconds,
                        'Continue',
                        'Please wait…',
                        isAuthLoading('sign_in'),
                      )}
                    </Button>

                    {!isNewUser ? (
                      <>
                        <button
                          type="button"
                          className="inline-flex min-h-[52px] w-full items-center justify-center rounded-[26px] border border-[#e4e6e1] bg-white text-[14px] font-medium text-[#213D59] lg:hidden"
                          onClick={() =>
                            toast.message('Face ID coming soon', {
                              description:
                                'Use email and password for now.',
                            })
                          }
                        >
                          Use Face ID
                        </button>

                        <div className="relative my-5 hidden items-center gap-3 text-[12px] text-[#a5b1ad] lg:flex">
                          <span className="h-px flex-1 bg-[#eceae4]" />
                          or
                          <span className="h-px flex-1 bg-[#eceae4]" />
                        </div>
                        <button
                          type="button"
                          className="hidden min-h-12 w-full items-center justify-center rounded-3xl border border-[#e4e6e1] bg-white text-[14px] font-medium text-[#213D59] transition hover:bg-[#f5f8fc] lg:inline-flex"
                          onClick={() =>
                            toast.message('Passkeys coming soon', {
                              description:
                                'Use email and password for now.',
                            })
                          }
                        >
                          Use a passkey instead
                        </button>
                        <p className="mt-[22px] mb-0 hidden text-center text-[13px] text-[#6e7c77] lg:block">
                          Given a password card?{' '}
                          <button
                            type="button"
                            className="auth-link"
                            onClick={() =>
                              toast.message('Access codes coming soon', {
                                description:
                                  'Sign in with your email and password for now.',
                              })
                            }
                          >
                            Enter your access code
                          </button>
                        </p>
                        <button
                          type="button"
                          data-cy="auth-forgot-password-mobile"
                          className="auth-link mx-auto block text-center text-[13px] lg:hidden"
                          onClick={handleForgotPasswordClick}
                          disabled={isAuthBusy}
                        >
                          Forgot password?
                        </button>
                      </>
                    ) : (
                      <p className="mb-1.5 mt-4 text-center text-[12.5px] text-[#6e7c77] lg:mt-4 lg:text-[13px]">
                        Already have an account?{' '}
                        <button
                          type="button"
                          data-cy="auth-toggle-mode"
                          onClick={() => {
                            setIsNewUser(false);
                            refreshCaptcha();
                          }}
                          className="auth-link"
                        >
                          Sign in
                        </button>
                      </p>
                    )}
                    </div>
                  </form>
                )}
                {step === 'mfa_method_selection' && (
                  <div className="space-y-4">
                    <div className="space-y-0">
                      {isNewUser ? (
                        <p className="auth-step-kicker">Step 2 of 3</p>
                      ) : null}
                      <h2 className="auth-serif-title mt-3 mb-1 text-[19px] font-semibold">
                        {isLoginMfaChallenge
                          ? 'Try another way'
                          : 'How should we verify it’s you?'}
                      </h2>
                      <p className="mb-4 text-[13.5px] leading-snug text-[#6e7c77]">
                        {isLoginMfaChallenge && !isNewUser
                          ? 'Your primary method starts automatically. Choose another linked method if you need a fallback.'
                          : 'You can add the others later in Settings.'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {orderedMfaMethods.map(method => {
                        const meta = getMfaMethodMeta(method);
                        const available = isMethodAvailable(method);
                        const selected = selectedMFAMethod === method;
                        const badge =
                          getMethodBadge(method) || meta.fallbackBadge;

                        return (
                          <label
                            key={method}
                            className={cn(
                              'flex cursor-pointer items-center gap-3.5 rounded-[13px] p-4 transition',
                              selected
                                ? 'border-[1.5px] border-[#2B5A8C] bg-[#f4f8f7]'
                                : 'border border-[#e4e6e1] bg-white',
                              !available && 'cursor-not-allowed opacity-50',
                            )}
                          >
                            <input
                              type="radio"
                              name="mfaMethod"
                              value={method}
                              checked={selected}
                              disabled={!available}
                              onChange={e =>
                                setSelectedMFAMethod(
                                  e.target.value as MFAMethod,
                                )
                              }
                              className="sr-only"
                            />
                            <span
                              className={cn(
                                'h-[18px] w-[18px] shrink-0 rounded-full',
                                selected
                                  ? 'bg-[#2B5A8C] shadow-[inset_0_0_0_3px_#fff]'
                                  : 'border-[1.5px] border-[#cfd8d4] bg-transparent',
                              )}
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <p className="m-0 text-[14.5px] font-semibold text-[#213D59]">
                                {meta.title}
                              </p>
                              <p className="mt-[3px] mb-0 text-[12.5px] text-[#5c6b66]">
                                {meta.description}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'shrink-0 rounded-[5px] px-2 py-1 text-[11px] font-medium',
                                selected || method === 'authenticator'
                                  ? 'bg-[#e7eef7] text-[#1f5c52]'
                                  : 'bg-[#f2f1ec] text-[#5c6b66]',
                              )}
                            >
                              {badge}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {showSmsPhoneInput && (
                      <>
                        <PhoneNumberInput
                          value={phoneNumber}
                          onChange={setPhoneNumber}
                          label="Mobile Number"
                          showValidation={showPhoneValidation}
                        />
                        {!isNewUser ? (
                          <TurnstileCaptcha
                            gateMode
                            onTokenChange={setCaptchaToken}
                            onReadyChange={setCaptchaReady}
                            resetKey={captchaResetKey}
                          />
                        ) : null}
                      </>
                    )}

                    {showEmailCaptcha && !isNewUser ? (
                      <TurnstileCaptcha
                          gateMode
                          onTokenChange={setCaptchaToken}
                          onReadyChange={setCaptchaReady}
                          resetKey={captchaResetKey}
                        />
                    ) : null}

                    <Button
                      data-cy="auth-mfa-continue"
                      onClick={handleMFAMethodSelection}
                      className="w-full btn-primary"
                      disabled={
                        isAuthBusy ||
                        (!isNewUser && showSmsPhoneInput && !securityReady) ||
                        (!isNewUser && showEmailCaptcha && !securityReady)
                      }
                    >
                      {isAuthLoading('mfa_method')
                        ? isLoginMfaChallenge
                          ? 'Starting...'
                          : 'Setting up...'
                        : isLoginMfaChallenge
                          ? 'Use this method'
                          : 'Continue'}
                    </Button>
                  </div>
                )}
                {/* STEP 3: Authenticator Setup/Verify */}
                {(step === 'setupMfa' || step === 'verifyMfa') && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="auth-step-kicker">
                        {isNewUser ? 'Step 2 of 3' : 'Step 2 of 2'}
                      </p>
                      <h2 className="auth-serif-title text-[1.65rem]">
                        Enter the code from your app
                      </h2>
                      <p className="text-[14px] text-[var(--ink-muted)]">
                        {!hasLinkedAuthenticator && qrCodeUrl
                          ? 'Scan the QR code, then enter the 6-digit code.'
                          : 'Open your authenticator app and enter the 6-digit code.'}
                      </p>
                    </div>
                    {!hasLinkedAuthenticator && qrCodeUrl ? (
                      <>
                        <Image
                          src={qrCodeUrl}
                          alt="QR"
                          width={192}
                          height={192}
                          className="mx-auto rounded-xl border border-[rgba(33, 61, 89,0.1)]"
                        />
                        <form onSubmit={handleVerifyMfa} className="space-y-4">
                          <SixDigitOtpInput
                            idPrefix="totp-setup"
                            value={mfaCode}
                            onChange={setMfaCode}
                            disabled={isAuthLoading('verify_mfa')}
                          />
                          <Button
                            type="submit"
                            className="w-full btn-primary"
                            disabled={
                              isAuthLoading('verify_mfa') ||
                              mfaCode.length !== 6
                            }
                          >
                            {isAuthLoading('verify_mfa')
                              ? 'Verifying...'
                              : 'Open my vault'}
                          </Button>
                        </form>
                      </>
                    ) : (
                      <form onSubmit={handleVerifyMfa} className="space-y-4">
                        <SixDigitOtpInput
                          idPrefix="totp-verify"
                          value={mfaCode}
                          onChange={setMfaCode}
                          disabled={isAuthLoading('verify_mfa')}
                        />
                        <Button
                          type="submit"
                          className="w-full btn-primary"
                          disabled={
                            isAuthLoading('verify_mfa') ||
                            mfaCode.length !== 6
                          }
                        >
                          {isAuthLoading('verify_mfa')
                            ? 'Verifying...'
                            : 'Open my vault'}
                        </Button>
                      </form>
                    )}

                    <p className="text-center text-[13px] text-[var(--ink-muted)]">
                      Didn&apos;t arrive?{' '}
                      <button
                        type="button"
                        className="auth-link"
                        onClick={() => {
                          setStep('mfa_method_selection');
                        }}
                      >
                        Choose another method
                      </button>
                    </p>
                  </div>
                )}

                {/* STEP 4: Email Verification */}
                {step === 'verifyEmail' && (
                  <div className="space-y-4">
                    <div className="space-y-0">
                      <p className="auth-step-kicker">
                        {isNewUser ? 'Step 2 of 3' : 'Step 2 of 2'}
                      </p>
                      <h2 className="auth-serif-title mt-3 mb-0 text-[22px] font-semibold">
                        Enter the code we emailed you
                      </h2>
                      <p className="mt-[7px] mb-6 text-[14px] text-[#6e7c77]">
                        {verificationSent
                          ? `Sent to ${email}.${
                              cooldown > 0
                                ? ` It expires in ${formatRetryCountdown(cooldown)}.`
                                : ''
                            }`
                          : `We'll send a 6-digit code to ${email}.`}
                      </p>
                    </div>

                    {!verificationSent ? (
                      isLoginMfaChallenge &&
                      isAuthLoading('login_mfa_email_send') ? (
                        <div className="flex items-center justify-center py-4">
                          <span className="h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                          <span className="ml-2 text-sm text-muted-foreground">
                            Sending verification code...
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {!isNewUser ? (
                            <TurnstileCaptcha
                          gateMode
                          onTokenChange={setCaptchaToken}
                          onReadyChange={setCaptchaReady}
                          resetKey={captchaResetKey}
                        />
                          ) : null}
                          <Button
                            onClick={handleSendEmailCode}
                            className="w-full btn-primary"
                            disabled={
                              isAuthBusy ||
                              rateLimitSeconds > 0 ||
                              (!isNewUser && !securityReady)
                            }
                          >
                            {rateLimitedButtonLabel(
                              rateLimitSeconds,
                              'Send Verification Code',
                              'Sending…',
                              isAuthLoading('send_email_code'),
                            )}
                          </Button>
                        </div>
                      )
                    ) : (
                      <form onSubmit={handleVerifyEmail} className="space-y-5">
                        <SixDigitOtpInput
                          idPrefix="email-otp"
                          value={emailCode}
                          onChange={setEmailCode}
                          disabled={
                            isAuthLoading('verify_email') ||
                            attempts >= MAX_ATTEMPTS
                          }
                        />
                        <Button
                          type="submit"
                          className="w-full btn-primary"
                          disabled={
                            isAuthLoading('verify_email') ||
                            rateLimitSeconds > 0 ||
                            emailCode.length !== 6 ||
                            attempts >= MAX_ATTEMPTS
                          }
                        >
                          {rateLimitedButtonLabel(
                            rateLimitSeconds,
                            'Open my vault',
                            'Verifying…',
                            isAuthLoading('verify_email'),
                          )}
                        </Button>
                      </form>
                    )}

                    {verificationSent && (
                      <>
                        <p className="mt-[18px] mb-0 text-center text-[13px] text-[#6e7c77]">
                      Didn&apos;t arrive?{' '}
                      <button
                        type="button"
                        className="auth-link disabled:opacity-50"
                        disabled={
                          cooldown > 0 ||
                          rateLimitSeconds > 0 ||
                          (!isNewUser && !securityReady)
                        }
                        onClick={handleResendEmail}
                      >
                        {rateLimitedButtonLabel(
                          Math.max(cooldown, rateLimitSeconds),
                          'Send it again',
                        )}
                      </button>
                    </p>

                        {!isNewUser ? (
                          <TurnstileCaptcha
                          gateMode
                          onTokenChange={setCaptchaToken}
                          onReadyChange={setCaptchaReady}
                          resetKey={captchaResetKey}
                        />
                        ) : null}

                        {attempts > 0 && attempts < MAX_ATTEMPTS && (
                          <InlineNotice
                            variant="warning"
                            title={`${MAX_ATTEMPTS - attempts} attempt${
                              MAX_ATTEMPTS - attempts !== 1 ? 's' : ''
                            } remaining before lockout`}
                            description={`After ${MAX_ATTEMPTS} failed sign-ins we lock the account for 15 minutes and email you.`}
                          />
                        )}
                      </>
                    )}
                    {!verificationSent ? (
                      <p className="text-center text-[13px] text-[#6e7c77]">
                        <button
                          type="button"
                          className="auth-link"
                          onClick={() => {
                            setSelectedMFAMethod('authenticator');
                            setStep('mfa_method_selection');
                          }}
                        >
                          Choose another method
                        </button>
                      </p>
                    ) : null}
                  </div>
                )}
                {/* STEP: SMS Verification */}
                {step === 'verifySms' && (
                  <div className="space-y-4">
                    <div className="space-y-0">
                      <p className="auth-step-kicker">
                        {isNewUser ? 'Step 2 of 3' : 'Step 2 of 2'}
                      </p>
                      <h2 className="auth-serif-title mt-3 mb-0 text-[22px] font-semibold">
                        Enter the code we texted you
                      </h2>
                      <p className="mt-[7px] mb-6 text-[14px] text-[#6e7c77]">
                        {phoneNumber.trim()
                          ? `Sent to ${phoneNumber.trim().replace(/\d(?=\d{4})/g, '·')}.`
                          : 'Enter the 6-digit code sent to your phone.'}
                        {cooldown > 0
                          ? ` It expires in ${formatRetryCountdown(cooldown)}.`
                          : ''}
                      </p>
                    </div>

                    <form onSubmit={handleVerifySms} className="space-y-4">
                      <SixDigitOtpInput
                        idPrefix="otp"
                        value={otp.join('')}
                        onChange={nextValue => {
                          const next = Array.from({ length: 6 }, (_, index) =>
                            nextValue[index] || '',
                          );
                          setOtp(next);
                        }}
                        disabled={
                          isAuthLoading('verify_sms') || attempts >= MAX_ATTEMPTS
                        }
                      />

                      <Button
                        type="submit"
                        className="w-full btn-primary"
                        disabled={
                          isAuthLoading('verify_sms') ||
                          otp.join('').length !== 6 ||
                          attempts >= MAX_ATTEMPTS
                        }
                      >
                        {isAuthLoading('verify_sms')
                          ? 'Verifying…'
                          : 'Open my vault'}
                      </Button>
                    </form>

                    <p className="mt-[18px] mb-0 text-center text-[13px] text-[#6e7c77]">
                      Didn&apos;t arrive?{' '}
                      <button
                        type="button"
                        className="auth-link disabled:opacity-50"
                        disabled={
                          cooldown > 0 ||
                          rateLimitSeconds > 0 ||
                          (!isNewUser && !securityReady)
                        }
                        onClick={handleResendSms}
                      >
                        {cooldown > 0
                          ? `Send it again in ${cooldown}s`
                          : 'Send it again'}
                      </button>
                    </p>

                    {!isNewUser ? (
                      <TurnstileCaptcha
                      gateMode
                      onTokenChange={setCaptchaToken}
                      onReadyChange={setCaptchaReady}
                      resetKey={captchaResetKey}
                    />
                    ) : null}

                    {attempts > 0 && attempts < MAX_ATTEMPTS && (
                      <InlineNotice
                        variant="warning"
                        title={`${MAX_ATTEMPTS - attempts} attempt${
                          MAX_ATTEMPTS - attempts !== 1 ? 's' : ''
                        } remaining before lockout`}
                        description={`After ${MAX_ATTEMPTS} failed sign-ins we lock the account for 15 minutes and email you.`}
                      />
                    )}
                  </div>
                )}

                
                {step === 'forgot_password' && (
                  <div className="space-y-0">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="text-[13px] text-[#6e7c77] no-underline"
                    >
                      ← Back to sign in
                    </button>
                    <h1 className="mt-5 mb-0 text-[21px] font-semibold text-[#213D59]">
                      Forgot your password?
                    </h1>
                    <p className="mt-2 mb-[22px] text-[14px] leading-[1.6] text-[#6e7c77]">
                      Enter the email on your account and we&apos;ll send a
                      6-digit reset code. It expires in 10 minutes.
                    </p>

                    <div>
                      <AuthFieldLabel htmlFor="reset-email">
                        Email
                      </AuthFieldLabel>
                      <Input
                        id="reset-email"
                        type="email"
                        value={resetEmail || email}
                        onChange={e => {
                          setResetEmail(e.target.value);
                          setResetEmailSent(false);
                        }}
                        placeholder="you@email.com"
                        className="auth-field"
                      />
                    </div>

                    <div className="mt-3.5 rounded-[14px] border border-[#f2f1ec] bg-[#f5f8fc] p-2">
                      <div className="min-h-[62px] rounded-[10px] border border-[#e4e6e1] bg-white px-3 py-2">
                        <TurnstileCaptcha
                          gateMode
                          onTokenChange={setCaptchaToken}
                          onReadyChange={setCaptchaReady}
                          resetKey={captchaResetKey}
                          className="w-full"
                        />
                        {securityReady ? (
                          <div className="mt-1 flex items-center gap-2.5">
                            <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] border-[#2B5A8C]">
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#2B5A8C"
                                strokeWidth="3"
                                aria-hidden
                              >
                                <path
                                  d="m5 13 4 4L19 7"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                            <span className="flex-1 text-[13px] text-[#3c4a46]">
                              Security check passed
                            </span>
                            <span className="font-mono text-[9px] font-medium uppercase tracking-wide text-[#a5b1ad]">
                              Cloudflare
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <Button
                      className="btn-primary mt-4 flex w-full items-center justify-center"
                      onClick={handleRequestReset}
                      disabled={
                        isAuthBusy ||
                        rateLimitSeconds > 0 ||
                        !(resetEmail || email) ||
                        !securityReady
                      }
                    >
                      {isAuthLoading('request_reset') &&
                        rateLimitSeconds <= 0 && (
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        )}
                      {rateLimitedButtonLabel(
                        rateLimitSeconds,
                        resetEmailSent ? 'Code sent' : 'Send reset code',
                        'Sending…',
                        isAuthLoading('request_reset'),
                      )}
                    </Button>

                    {error && rateLimitSeconds <= 0 ? (
                      <p className="mt-3 text-[13px] text-red-600">{error}</p>
                    ) : null}
                  </div>
                )}

                {step === 'reset_password' && (
                  <div className="flex flex-1 flex-col gap-3.5 lg:gap-0">
                    {/* Desktop: single card body; Mobile: OTP card + fields */}
                    <div className="rounded-2xl border border-[#e4e6e1] bg-white p-[18px] lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
                      <p className="auth-step-kicker hidden lg:block">
                        Check your inbox
                      </p>
                      <h2 className="m-0 text-[15.5px] font-semibold text-[#213D59] lg:mt-3 lg:text-[21px]">
                        <span className="lg:hidden">
                          Enter the code we emailed
                        </span>
                        <span className="hidden lg:inline">
                          Set a new password
                        </span>
                      </h2>
                      <p className="mt-1.5 mb-3.5 text-[12.5px] text-[#8b9995] lg:mb-5 lg:mt-2 lg:text-[14px] lg:text-[#6e7c77]">
                        {(resetEmail || email) && (
                          <>
                            <span className="lg:hidden">
                              {resetEmail || email} ·{' '}
                            </span>
                            <span className="hidden lg:inline">
                              Code sent to {resetEmail || email} ·{' '}
                            </span>
                          </>
                        )}
                        {cooldown > 0 || rateLimitSeconds > 0
                          ? `resend in ${formatRetryCountdown(
                              Math.max(cooldown, rateLimitSeconds),
                            )}`
                          : 'you can resend a new code'}
                      </p>

                      <SixDigitOtpInput
                        idPrefix="reset-otp"
                        value={resetOtp}
                        onChange={setResetOtp}
                        disabled={isAuthLoading('reset_password')}
                        className="mb-0"
                      />
                    </div>

                    <div className="flex flex-1 flex-col gap-3 lg:mt-[18px]">
                      <div>
                        <AuthFieldLabel htmlFor="new-password">
                          New password
                        </AuthFieldLabel>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="auth-field pr-16"
                          />
                          <button
                            type="button"
                            className="auth-show-toggle absolute right-1 top-1/2 -translate-y-1/2"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <AuthFieldLabel htmlFor="confirm-new-password">
                          Confirm new password
                        </AuthFieldLabel>
                        <div className="relative">
                          <Input
                            id="confirm-new-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="auth-field pr-16"
                          />
                          <button
                            type="button"
                            className="auth-show-toggle absolute right-1 top-1/2 -translate-y-1/2"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>

                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-red-500">
                          Passwords do not match
                        </p>
                      )}

                      {error && rateLimitSeconds <= 0 ? (
                        <p className="text-[13px] text-red-600">{error}</p>
                      ) : null}

                      <Button
                        className="btn-primary mt-auto w-full lg:mt-[18px]"
                        onClick={handleResetPassword}
                        disabled={
                          isAuthBusy ||
                          rateLimitSeconds > 0 ||
                          resetOtp.length !== 6 ||
                          !newPassword ||
                          newPassword !== confirmPassword
                        }
                      >
                        {rateLimitSeconds > 0 || isAuthLoading('reset_password')
                          ? rateLimitedButtonLabel(
                              rateLimitSeconds,
                              'Reset password',
                              'Resetting…',
                              isAuthLoading('reset_password'),
                            )
                          : (
                              <>
                                <span className="lg:hidden">Reset password</span>
                                <span className="hidden lg:inline">
                                  Reset password &amp; sign in
                                </span>
                              </>
                            )}
                      </Button>

                      <p className="mb-0 mt-3.5 hidden text-center text-[12.5px] text-[#8b9995] lg:block">
                        Everyone you&apos;ve invited keeps their access — only
                        your own sign-in changes.
                      </p>

                      <button
                        type="button"
                        className="auth-link mx-auto hidden text-[13px] disabled:opacity-50 lg:block"
                        disabled={
                          cooldown > 0 ||
                          rateLimitSeconds > 0 ||
                          !securityReady
                        }
                        onClick={handleRequestReset}
                      >
                        {cooldown > 0 || rateLimitSeconds > 0
                          ? `Resend in ${formatRetryCountdown(
                              Math.max(cooldown, rateLimitSeconds),
                            )}`
                          : 'Resend code'}
                      </button>
                    </div>
                  </div>
                )}
                {step === 'plan_selection' && (
                  <div
                    data-cy="checkout-plan-selection"
                    className="flex min-h-0 flex-1 flex-col text-left text-[#213D59] lg:block lg:flex-none"
                  >
                    <div className="min-h-0 flex-1 space-y-[11px] overflow-y-auto overscroll-contain px-4 pb-3 pt-4 lg:space-y-0 lg:overflow-visible lg:px-0 lg:pb-0 lg:pt-0">
                      <div className="hidden lg:block">
                        <p className="m-0 font-[family-name:var(--font-family-mono)] text-[11px] font-medium tracking-[0.14em] uppercase text-[#5a6b80]">
                          Step 3 of 3
                        </p>
                        <h2 className="mt-3.5 mb-0 font-[family-name:var(--font-family-display)] text-[34px] font-normal leading-[1.2] text-[#213D59]">
                          Your annual plan
                        </h2>
                        <p className="mt-3 mb-0 max-w-[52ch] text-[16.5px] leading-snug text-[#5a6b80] text-pretty">
                          Start paid now, or begin a 14-day trial with no charge.
                        </p>
                      </div>

                      <div className="lg:mt-7">
                        {SUBSCRIPTION_PLAN_LIST.map(plan => {
                          const detailsOpen = planDetailsOpen;
                          return (
                            <div
                              key={plan.id}
                              data-cy={`checkout-plan-${plan.id}`}
                              className="flex flex-col rounded-2xl border-[1.5px] border-[#2B5A8C] bg-[#f7f9fc] p-4 lg:px-6 lg:py-[22px]"
                            >
                              <div className="flex items-center gap-[11px] lg:gap-3">
                                <p className="m-0 flex-1 text-[16.5px] font-semibold text-[#213D59] lg:text-[17px]">
                                  {plan.title}
                                </p>
                                <span className="shrink-0 rounded-md bg-[#fff3dd] px-[7px] py-[3px] text-[11px] font-medium text-[#7a5a1c] lg:rounded-md lg:px-[9px] lg:py-1 lg:text-xs">
                                  {plan.badge}
                                </span>
                              </div>
                              <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 lg:mt-4">
                                <span className="font-[family-name:var(--font-family-display)] text-[18px] leading-none text-[#8a97a8] line-through decoration-[#8a97a8] lg:text-[20px]">
                                  {plan.listPrice}
                                </span>
                                <p className="m-0 font-[family-name:var(--font-family-display)] text-[23px] font-normal leading-none text-[#213D59] lg:text-[26px]">
                                  {plan.amount}{' '}
                                  <span className="font-[family-name:var(--font-family)] text-sm text-[#5a6b80] lg:text-[15px]">
                                    {plan.period}
                                  </span>
                                </p>
                              </div>
                              <p className="mt-1.5 mb-0 text-[12.5px] font-semibold text-[#7a5a1c] lg:text-[13px]">
                                Limited-time offer · Save {plan.discountPercent}%
                              </p>
                              <p className="mt-1.5 mb-0 text-[13.5px] leading-snug text-[#5a6b80] lg:mt-2 lg:text-[14.5px] lg:leading-normal">
                                {plan.description}
                              </p>
                              <button
                                type="button"
                                data-cy={`checkout-plan-details-${plan.id}`}
                                className="mt-3 self-start text-[13px] font-semibold text-[#2B5A8C] underline-offset-2 hover:underline lg:text-[13.5px]"
                                aria-expanded={detailsOpen}
                                onClick={() =>
                                  setPlanDetailsOpen(open => !open)
                                }
                              >
                                {detailsOpen ? 'Hide details' : 'Details'}
                              </button>
                              {detailsOpen ? (
                                <ul className="mt-3 mb-0 space-y-2 border-t border-[#d5dde8] pt-3">
                                  {plan.features.map(feature => (
                                    <li
                                      key={feature.label}
                                      className="flex items-baseline justify-between gap-3 text-[12.5px] leading-snug lg:text-[13px]"
                                    >
                                      <span className="text-[#5a6b80]">
                                        {feature.label}
                                      </span>
                                      <span className="shrink-0 font-semibold text-[#213D59]">
                                        {feature.value}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>

                      <Button
                        data-cy="checkout-continue-payment"
                        className="btn-primary mt-5 hidden h-[52px] w-full rounded-[26px] text-[15.5px] font-medium lg:mt-5 lg:inline-flex"
                        onClick={() => {
                          setError('');
                          setIsTrial(false);
                          setStep('payment');
                        }}
                      >
                        Continue to payment
                      </Button>

                      <div className="border-t border-[#7688a1] pt-3.5 lg:mt-[30px] lg:pt-[26px]">
                        <div className="lg:flex lg:items-baseline lg:gap-2.5">
                          <h3 className="m-0 text-[15.5px] font-semibold text-[#213D59] lg:text-lg">
                            Or start the trial
                          </h3>
                          <p className="mt-1.5 mb-3 text-[13.5px] text-[#5a6b80] lg:mt-0 lg:mb-0 lg:text-[14.5px]">
                            14 days free. Pick how you want to handle the card.
                          </p>
                        </div>

                        <div className="mt-0 grid grid-cols-2 gap-2 lg:mt-4 lg:gap-3">
                          <button
                            type="button"
                            role="radio"
                            aria-checked={trialMode === 'cardless'}
                            data-cy="checkout-trial-cardless"
                            className={cn(
                              'cursor-pointer rounded-[13px] bg-white p-[13px] text-left transition lg:rounded-[14px] lg:px-5 lg:py-[18px]',
                              trialMode === 'cardless'
                                ? 'border-[1.5px] border-[#213D59]'
                                : 'border border-[#7688a1]',
                            )}
                            onClick={() => setTrialMode('cardless')}
                          >
                            <div className="flex items-center gap-2 lg:gap-[11px]">
                              <span
                                className={cn(
                                  'h-[18px] w-[18px] shrink-0 rounded-full',
                                  trialMode === 'cardless'
                                    ? 'bg-[#213D59] shadow-[inset_0_0_0_3px_#fff]'
                                    : 'border-[1.5px] border-[#7688a1] bg-transparent',
                                )}
                                aria-hidden
                              />
                              <p className="m-0 text-[14.5px] font-semibold text-[#213D59] lg:text-base">
                                <span className="lg:hidden">Cardless</span>
                                <span className="hidden lg:inline">
                                  Cardless trial
                                </span>
                              </p>
                            </div>
                            <p className="mt-1.5 mb-0 text-[12.5px] leading-snug text-[#5a6b80] lg:mt-[11px] lg:text-sm lg:leading-[1.55]">
                              <span className="lg:hidden">
                                Access pauses after the trial.
                              </span>
                              <span className="hidden lg:inline">
                                No card now. Access pauses after the trial until
                                you add payment.
                              </span>
                            </p>
                          </button>

                          <button
                            type="button"
                            role="radio"
                            aria-checked={trialMode === 'card_on_file'}
                            data-cy="checkout-trial-card-on-file"
                            className={cn(
                              'cursor-pointer rounded-[13px] bg-white p-[13px] text-left transition lg:rounded-[14px] lg:px-5 lg:py-[18px]',
                              trialMode === 'card_on_file'
                                ? 'border-[1.5px] border-[#213D59]'
                                : 'border border-[#7688a1]',
                            )}
                            onClick={() => setTrialMode('card_on_file')}
                          >
                            <div className="flex items-center gap-2 lg:gap-[11px]">
                              <span
                                className={cn(
                                  'h-[18px] w-[18px] shrink-0 rounded-full',
                                  trialMode === 'card_on_file'
                                    ? 'bg-[#213D59] shadow-[inset_0_0_0_3px_#fff]'
                                    : 'border-[1.5px] border-[#7688a1] bg-transparent',
                                )}
                                aria-hidden
                              />
                              <p className="m-0 text-[14.5px] font-semibold text-[#213D59] lg:text-base">
                                Card on file
                              </p>
                            </div>
                            <p className="mt-1.5 mb-0 text-[12.5px] leading-snug text-[#5a6b80] lg:mt-[11px] lg:text-sm lg:leading-[1.55]">
                              <span className="lg:hidden">
                                Charged on day 15.
                              </span>
                              <span className="hidden lg:inline">
                                Add a card today; nothing is charged until day
                                15, and it continues without a gap.
                              </span>
                            </p>
                          </button>
                        </div>

                        {trialMode === 'cardless' ? (
                          <div
                            className="mt-3.5 rounded-2xl border border-[#9a7326] bg-[#fff3dd] px-4 py-3.5 lg:mt-4 lg:px-[22px] lg:py-5"
                            role="note"
                          >
                            <p className="m-0 text-[14px] font-semibold text-[#7a5a1c] lg:text-[15.5px]">
                              Important: cardless trial
                            </p>
                            <p className="mt-1.5 mb-0 text-[13px] leading-relaxed text-[#6d4d15] lg:mt-2 lg:text-[14.5px] lg:leading-[1.6]">
                              No card needed today. When the trial ends without
                              a card on file, vault access pauses until you add
                              payment — nothing is deleted.
                            </p>
                          </div>
                        ) : null}

                        <Button
                          data-cy="checkout-continue-trial"
                          variant="outline"
                          className="mt-3.5 hidden h-[50px] w-full rounded-[25px] border-[#213D59] bg-white text-[15px] font-medium text-[#213D59] hover:bg-[#f7f9fc] lg:mt-3.5 lg:inline-flex"
                          onClick={() => {
                            setError('');
                            setIsTrial(true);
                            setStep('payment');
                          }}
                        >
                          {trialMode === 'cardless'
                            ? 'Start cardless trial'
                            : 'Start trial with card'}
                        </Button>

                        <p className="mt-3.5 mb-0 hidden text-[13.5px] leading-relaxed text-[#5a6b80] lg:block">
                          You picked a{' '}
                          <b className="font-semibold text-[#33506e]">
                            {trialMode === 'cardless'
                              ? 'cardless trial'
                              : 'card-on-file trial'}
                          </b>{' '}
                          on the{' '}
                          <b className="font-semibold text-[#33506e]">
                            {SUBSCRIPTION_PLANS[selectedPlan].title}
                          </b>{' '}
                          plan. You can switch plans or add a card any time in
                          settings.
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 space-y-[9px] bg-[#f5f8fc] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1 lg:hidden">
                      <Button
                        data-cy="checkout-continue-payment-mobile"
                        className="btn-primary h-[52px] w-full rounded-[26px] text-[15.5px] font-medium"
                        onClick={() => {
                          setError('');
                          setIsTrial(false);
                          setStep('payment');
                        }}
                      >
                        Continue to payment
                      </Button>
                      <Button
                        data-cy="checkout-continue-trial-mobile"
                        variant="outline"
                        className="h-[50px] w-full rounded-[25px] border-[#213D59] bg-white text-[14.5px] font-medium text-[#213D59] hover:bg-white"
                        onClick={() => {
                          setError('');
                          setIsTrial(true);
                          setStep('payment');
                        }}
                      >
                        {trialMode === 'cardless'
                          ? 'Start cardless trial'
                          : 'Start trial with card'}
                      </Button>
                    </div>
                  </div>
                )}

              </motion.div>
              ) : null}
            </AnimatePresence>

            {step === 'payment' ? (
              <div className="relative z-10 flex min-h-0 flex-1 flex-col lg:flex-none">
                <Elements
                  stripe={stripePromise}
                  options={{
                    fonts: [
                      {
                        cssSrc:
                          'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600&display=swap',
                      },
                    ],
                  }}
                >
                  <StartTrialCheckout
                    isTrial={isTrial}
                    trialMode={trialMode}
                    selectedPlan={selectedPlan}
                    router={router}
                    onBack={handleBack}
                    onSwitchToCardless={() => {
                      setTrialMode('cardless');
                      setIsTrial(true);
                    }}
                  />
                </Elements>
              </div>
            ) : null}
      </AuthCard>
      {step !== 'payment' && step !== 'plan_selection' ? (
        <p className="mt-6 px-1 text-center text-[11px] leading-relaxed text-[rgba(33, 61, 89,0.45)] lg:hidden">
          Encrypted at rest · You choose who opens it
        </p>
      ) : null}
    </AuthPortalShell>
  );
}
