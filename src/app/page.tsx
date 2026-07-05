'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Shield,
  MessageSquare,
  AlertCircle,
  ArrowLeft,
  ShieldIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { fetchSession } from '@/libs/secureFetch';
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
import { Card, CardContent } from '@/components/common/ui/card';
import { Input } from '@/components/common/ui/input';
import { PhoneNumberInput } from '@/components/PhoneNumberInput';
import { SixDigitOtpInput } from '@/components/SixDigitOtpInput';
import { TurnstileCaptcha } from '@/components/TurnstileCaptcha';
import { isValidE164PhoneNumber } from '@/utils/phoneCountries';
import { getOtpSessionId } from '@/utils/otpSession';
import { Label } from '@/components/common/ui/label';
import { Button } from '@/components/common/ui/button';
import { Alert, AlertDescription } from '@/components/common/ui/alert';
import { Badge } from '@/components/common/ui/badge';
import {
  useCreateCustomerMutation,
  useConfirmCardMutation,
  useSetupIntentMutation,
  useStartSubscriptionMutation,
} from '@/services/billingApi';

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

type AuthLoadingAction =
  | 'sign_in'
  | 'forgot_password'
  | 'request_reset'
  | 'reset_password'
  | 'mfa_method'
  | 'send_email_code'
  | 'login_mfa_email_send'
  | 'start_sms'
  | 'verify_mfa'
  | 'verify_email'
  | 'verify_sms';

// ------------------------------
// Validation helpers
// ------------------------------
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const verifyTOTPCode = (code: string) => /^\d{6}$/.test(code);

import { getSafeErrorMessage } from '@/utils/safeErrorMessage';

const getApiErrorMessage = (err: unknown, fallback: string) =>
  getSafeErrorMessage(err, fallback);

const completeOwnerAuth = async (
  router: ReturnType<typeof useRouter>,
  dispatch: ReturnType<typeof useAppDispatch>,
) => {
  const session = await fetchSession();
  if (!session.authenticated || session.role !== 'owner') {
    throw new Error('Session not established');
  }

  dispatch(
    setSession({
      user: {
        email: session.email,
        role: 'owner',
        owner_id: session.owner_id ?? null,
      },
    }),
  );

  goToDashboard(router);
};

const goToDashboard = (router: ReturnType<typeof useRouter>) => {
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

function PaymentForm({
  isTrial,
  selectedPlan,
  router,
}: {
  isTrial: boolean;
  selectedPlan: 'monthly' | 'yearly';
  router: ReturnType<typeof useRouter>;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [createCustomer] = useCreateCustomerMutation();
  const [setupIntent] = useSetupIntentMutation();
  const [confirmCard] = useConfirmCardMutation();
  const [startSubscription] = useStartSubscriptionMutation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      // 1️⃣ Ensure Stripe customer exists
      await createCustomer().unwrap();

      // 2️⃣ If NOT trial → collect & save card
      if (!isTrial) {
        if (!stripe || !elements) {
          throw new Error('Stripe not ready');
        }

        const { client_secret } = await setupIntent().unwrap();

        const card = elements.getElement(CardElement);
        if (!card) {
          throw new Error('Card element not found');
        }

        const result = await stripe.confirmCardSetup(client_secret, {
          payment_method: { card },
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        if (!result.setupIntent?.payment_method) {
          throw new Error('Payment method not created');
        }

        // ✅ SEND PAYMENT METHOD ID
        await confirmCard({
          payment_method_id: result.setupIntent.payment_method as string,
        }).unwrap();

      }

      // 3️⃣ Start subscription (trial or paid)
      await startSubscription({
        plan: selectedPlan,
        is_trial: isTrial,
      }).unwrap();

      // 4️⃣ Success → dashboard
      goToDashboard(router);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Payment failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isTrial && (
        <div className="border rounded-md p-4">
          <CardElement
            options={{
              hidePostalCode: true,
              style: {
                base: {
                  fontSize: '16px',
                  color: '#0f172a',
                  '::placeholder': {
                    color: '#94a3b8',
                  },
                },
              },
            }}
          />
        </div>
      )}

      {isTrial && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You’re starting a <strong>15-day free trial</strong>. No payment
            method required today.
          </AlertDescription>
        </Alert>
      )}

      <Button
        className="w-full btn-primary"
        onClick={handleSubmit}
        disabled={loading || (!isTrial && !stripe)}
      >
        {loading
          ? 'Processing…'
          : isTrial
            ? 'Activate Free Trial'
            : 'Confirm & Pay'}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Secure payment powered by Stripe. You can cancel anytime.
      </p>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  );
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
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>(
    'yearly',
  );
  const [isTrial, setIsTrial] = useState(false);

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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneValidation, setShowPhoneValidation] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');

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
    void hasValidOwnerSession().then(valid => {
      if (valid) goToDashboard(router);
    });
  }, [router]);

  // OTP UX
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [cooldown, setCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const autoMfaVerifyKey = useRef('');
  const autoEmailVerifyKey = useRef('');
  const autoSmsVerifyKey = useRef('');

useEffect(() => {
  if (cooldown <= 0) return;

  const timer = setInterval(() => {
    setCooldown(prev => prev - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [cooldown]);

const handleSendEmailCode = async () => {
  if (!captchaToken) {
    setError('Complete the CAPTCHA before requesting an OTP');
    return;
  }

  setError('');
  startAuthLoading('send_email_code');

  try {
    const res = await sendEmailOtp({
      email,
      captcha_token: captchaToken,
      otp_session_id: getOtpSessionId(),
      ...(mfaChallengeToken
        ? { mfa_challenge_token: mfaChallengeToken }
        : {}),
    }).unwrap();

    setVerificationSent(true);
    setEmailCode('');
    setAttempts(0);
    setCooldown(res.cooldown_seconds ?? 60);
    setCaptchaToken('');
  } catch (err: unknown) {
    setError(getApiErrorMessage(err, 'Failed to send verification code'));
  } finally {
    stopAuthLoading();
  }
};

  // Inside LoginPage component
 const handleForgotPasswordClick = async () => {
   setError('');

   if (email && isValidEmail(email)) {
     if (!captchaToken) {
       setError('Complete the CAPTCHA before requesting a reset code');
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
       alert('If an account exists for that email, a reset code has been sent.');
       setStep('reset_password');
     } catch (err: unknown) {
       setError(getApiErrorMessage(err, 'Failed to send reset code'));
     } finally {
       stopAuthLoading();
     }
   } else {
     setStep('forgot_password');
   }
 };

 const handleRequestReset = async () => {
   setError('');
   if (!captchaToken) {
     setError('Complete the CAPTCHA before requesting a reset code');
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
     alert('If an account exists for that email, a reset code has been sent.');
     setStep('reset_password');
   } catch (err: unknown) {
     setError(getApiErrorMessage(err, 'Failed to send reset code'));
   } finally {
     stopAuthLoading();
   }
 };
const handleResetPassword = async () => {
  if (newPassword !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  startAuthLoading('reset_password');

  try {
    await resetPassword({
      email: resetEmail,
      otp: resetOtp,
      new_password: newPassword,
      captcha_token: captchaToken,
    }).unwrap();

    alert('Password reset successfully!');
    setStep('credentials');
  } catch (err: unknown) {
    setError(getApiErrorMessage(err, 'Reset failed'));
  } finally {
    stopAuthLoading();
  }
};

const beginLinkedLoginMfa = async (
  method: MFAMethod,
  options?: {
    otpAlreadySent?: boolean;
    cooldownSeconds?: number;
    loginChallenge?: boolean;
    challengeToken?: string;
  },
) => {
  setSelectedMFAMethod(method);
  setError('');

  const useLoginChallenge = options?.loginChallenge ?? isLoginMfaChallenge;
  const challengeToken = options?.challengeToken ?? mfaChallengeToken;

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
      setCooldown(options.cooldownSeconds ?? 60);
      setStep('verifyEmail');
      return;
    }

    if (useLoginChallenge && challengeToken) {
      startAuthLoading('login_mfa_email_send');
      try {
        const res = await startEmailMfa({
          email,
          mfa_challenge_token: challengeToken,
        }).unwrap();
        setVerificationSent(true);
        setCooldown(res.cooldown_seconds ?? 60);
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
    setCooldown(options.cooldownSeconds ?? 60);
    setStep('verifySms');
    return;
  }

  startAuthLoading('start_sms');
  try {
    const smsRes = await startSmsMfa({
      email,
      ...(useLoginChallenge && challengeToken
        ? { mfa_challenge_token: challengeToken }
        : {}),
    }).unwrap();
    if (smsRes.phone) setPhoneNumber(smsRes.phone);
    setSmsSent(true);
    setOtp(Array(OTP_LENGTH).fill(''));
    setAttempts(0);
    setCooldown(smsRes.cooldown_seconds ?? 60);
    setStep('verifySms');
  } catch (err: unknown) {
    setError(getApiErrorMessage(err, 'Failed to send SMS code'));
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

  const getPasswordStrengthInfo = () => {
    switch (passwordStrength.score) {
      case 5:
        return {
          text: 'Very strong',
          color: 'text-green-600',
          bg: 'bg-green-600',
        };
      case 4:
        return { text: 'Strong', color: 'text-green-500', bg: 'bg-green-500' };
      case 3:
        return {
          text: 'Moderate',
          color: 'text-yellow-500',
          bg: 'bg-yellow-500',
        };
      case 2:
        return { text: 'Weak', color: 'text-orange-500', bg: 'bg-orange-500' };
      default:
        return { text: 'Very weak', color: 'text-red-500', bg: 'bg-red-500' };
    }
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

  try {
    if (!isValidEmail(email)) throw new Error('Enter a valid email');
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    if (isNewUser) {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (passwordStrength.score < 4) {
        throw new Error('Use a stronger password');
      }

      setStep('mfa_method_selection');
      return;
    }

    startAuthLoading('sign_in');

    if (!isNewUser && !captchaToken) {
      setError('Complete the security check before signing in');
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
        setError('Could not send verification code. Please try again.');
      }

      await beginLinkedLoginMfa(preferredMethod, {
        otpAlreadySent: Boolean(res.otp_sent),
        cooldownSeconds: res.cooldown_seconds,
        loginChallenge: true,
        challengeToken: res.mfa_challenge_token ?? '',
      });
      return;
    }

    await completeOwnerAuth(router, dispatch);
  } catch (err: unknown) {
    setError(getApiErrorMessage(err, 'Authentication failed'));
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

      const signupPayload: {
        email: string;
        password: string;
        mfa_method: MFAMethod;
        phone_number?: string;
        captcha_token?: string;
        otp_session_id?: string;
      } = {
        email,
        password,
        mfa_method: selectedMFAMethod,
        otp_session_id: getOtpSessionId(),
      };

      if (selectedMFAMethod === 'sms') {
        if (!captchaToken) {
          throw new Error('Complete the CAPTCHA before requesting an OTP');
        }
        signupPayload.phone_number = phoneNumber.trim();
        signupPayload.captcha_token = captchaToken;
      }

      if (selectedMFAMethod === 'email') {
        if (!captchaToken) {
          throw new Error('Complete the CAPTCHA before requesting an OTP');
        }
        signupPayload.captcha_token = captchaToken;
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
        setCooldown(signupRes.cooldown_seconds ?? 60);
        setStep('verifyEmail');
        return;
      }

      // ✅ NEW USER → SMS
      if (selectedMFAMethod === 'sms') {
        setSmsSent(true); // backend already sent it during signup
        setOtp(Array(OTP_LENGTH).fill(''));
        setAttempts(0);
        setCooldown(signupRes.cooldown_seconds ?? 60);
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
    const detail = getApiErrorMessage(err, 'Failed to continue');

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
          captcha_token: captchaToken,
          otp_session_id: getOtpSessionId(),
        }).unwrap();

        setQrCodeUrl(resumeRes.qrCodeUrl || '');
        setHasLinkedAuthenticator(false);
        setMfaCode('');
        setError('');
        setStep('setupMfa');
        return;
      } catch (resumeErr: unknown) {
        setError(
          getApiErrorMessage(
            resumeErr,
            'Signup already started, but failed to restore QR code.',
          ),
        );
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
        setSmsSent(true);
        setOtp(Array(OTP_LENGTH).fill(''));
        setAttempts(0);
        setStep('verifySms');
        return;
      }
    }

    setError(detail);
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

    await completeOwnerAuth(router, dispatch);
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

  if (attempts >= MAX_ATTEMPTS) {
    setError('Too many failed attempts. Try again later.');
    return;
  }

  startAuthLoading('verify_email');

  try {
    const code = parseInt(emailCode);
    if (isNaN(code)) throw new Error('Enter valid code');

    const res = await verifyEmailCode({
      email,
      code,
      otp_session_id: getOtpSessionId(),
      ...(isLoginMfaChallenge
        ? { mfa_challenge_token: mfaChallengeToken }
        : {}),
    }).unwrap();

    setAttempts(0);

    await completeOwnerAuth(router, dispatch);
  } catch (err: unknown) {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    setError(
      nextAttempts >= MAX_ATTEMPTS
        ? 'Too many failed attempts. Try again later.'
        : getApiErrorMessage(err, 'Verification failed'),
    );
  } finally {
    stopAuthLoading('verify_email');
  }
}, [emailCode, verifyEmailCode, email, router, attempts]);

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

    await completeOwnerAuth(router, dispatch);
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
  if (cooldown > 0) return;

  if (!captchaToken) {
    setError('Complete the CAPTCHA before resending the OTP');
    return;
  }

  try {
    setError('');

    const res = await sendEmailOtp({
      email,
      captcha_token: captchaToken,
      otp_session_id: getOtpSessionId(),
      ...(mfaChallengeToken
        ? { mfa_challenge_token: mfaChallengeToken }
        : {}),
    }).unwrap();

    setCooldown(res.cooldown_seconds ?? 60);
    setEmailCode('');
    setCaptchaToken('');
    setVerificationSent(true);
  } catch (err: unknown) {
    setError(getApiErrorMessage(err, 'Failed to resend OTP'));
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
  if (cooldown > 0) return;

  if (!captchaToken) {
    setError('Complete the CAPTCHA before resending the OTP');
    return;
  }

  try {
    setError('');

    const res = await resendSmsMfa({
      email,
      captcha_token: captchaToken,
      otp_session_id: getOtpSessionId(),
    }).unwrap();

    setCooldown(res.cooldown_seconds ?? 60);
    setOtp(Array(OTP_LENGTH).fill(''));
    setCaptchaToken('');
  } catch (err: unknown) {
    setError(getApiErrorMessage(err, 'Failed to resend OTP'));
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
  selectedMFAMethod === 'email' &&
  (isNewUser || (!isLoginMfaChallenge && !isNewUser));

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
      icon: <Smartphone className="h-4 w-4 text-primary" />,
      title: 'Authenticator App',
      description: 'Use Google Authenticator, Authy, or similar apps.',
      fallbackBadge: 'Most Secure',
      badgeVariant: 'secondary' as const,
    };
  }

  if (method === 'email') {
    return {
      icon: <Mail className="h-4 w-4 text-blue-500" />,
      title: 'Email Verification',
      description: 'Receive codes via email.',
      fallbackBadge: 'Convenient',
      badgeVariant: 'outline' as const,
    };
  }

  return {
    icon: <MessageSquare className="h-4 w-4 text-gray-400" />,
    title: 'SMS / Text Message',
    description: 'Receive verification codes via SMS.',
    fallbackBadge: 'Medium',
    badgeVariant: 'outline' as const,
  };
};

const backButtonLabel =
  isLoginMfaChallenge &&
  (step === 'verifyMfa' || step === 'verifyEmail' || step === 'verifySms')
    ? 'Try another way'
    : 'Back';

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <Image
            src="/images/brand-logo.png"
            alt="Orderly Logo"
            width={120}
            height={60}
            className="mx-auto"
          />
          <h1 className="text-2xl font-bold">
            {step === 'plan_selection'
              ? 'Choose Your Plan'
              : step === 'payment'
                ? 'Secure Checkout'
                : step === 'credentials'
                  ? isNewUser
                    ? 'Create Your Account'
                    : 'Welcome Back'
                  : step === 'mfa_method_selection'
                    ? isLoginMfaChallenge
                      ? 'Try Another Way'
                      : 'Choose Security Method'
                    : step === 'setupMfa'
                      ? 'Set Up Two-Factor Authentication'
                      : 'Enter Verification Code'}
          </h1>

          <p className="text-muted-foreground mt-2">
            {step === 'plan_selection'
              ? 'Select the subscription that works best for you'
              : step === 'payment'
                ? 'Complete your secure payment'
                : step === 'credentials'
                  ? isNewUser
                    ? 'Set up your secure Orderly Affairs account'
                    : 'Sign in to your Orderly Affairs account'
                  : step === 'mfa_method_selection'
                    ? isLoginMfaChallenge
                      ? 'Use another linked verification method'
                      : 'Select your preferred two-factor authentication method'
                    : step === 'setupMfa'
                      ? 'Complete your security setup'
                      : 'Enter the code to verify your identity'}
          </p>
        </div>
        <Card className="glass-card shadow-[0_40px_80px_-20px_rgba(30,41,59,0.12)] border border-slate-100">
          <CardContent className="px-0 sm:px-6 pt-6 md:pt-9">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {step !== 'credentials' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-4 flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {backButtonLabel}
              </Button>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.35 }}
              >
                {/* STEP 1: Credentials */}
                {step === 'credentials' && (
                  <form
                    onSubmit={handleCredentialsSubmit}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="pl-9 enhanced-field-frame"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => {
                            setPassword(e.target.value);
                            evaluatePasswordStrength(e.target.value);
                          }}
                          placeholder="Enter your password"
                          className="pl-9 enhanced-field-frame"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {!isNewUser && (
                        <Button
                          type="button"
                          variant="link"
                          className="text-xs cursor-pointer flex items-center gap-2"
                          onClick={handleForgotPasswordClick}
                          disabled={isAuthBusy}
                        >
                          {isAuthLoading('forgot_password') && (
                            <span className="h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                          )}
                          Forgot password?
                        </Button>
                      )}
                    </div>

                    {isNewUser && (
                      <>
                        {password && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Password Strength
                              </span>
                              <span
                                className={`text-sm ${
                                  getPasswordStrengthInfo().color
                                }`}
                              >
                                {getPasswordStrengthInfo().text}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  getPasswordStrengthInfo().bg
                                }`}
                                style={{
                                  width: `${
                                    (passwordStrength.score / 5) * 100
                                  }%`,
                                }}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                              <div
                                className={
                                  passwordStrength.length
                                    ? 'text-green-600'
                                    : 'text-gray-400'
                                }
                              >
                                ✓ 12+ characters
                              </div>
                              <div
                                className={
                                  passwordStrength.uppercase
                                    ? 'text-green-600'
                                    : 'text-gray-400'
                                }
                              >
                                ✓ Uppercase letter
                              </div>
                              <div
                                className={
                                  passwordStrength.lowercase
                                    ? 'text-green-600'
                                    : 'text-gray-400'
                                }
                              >
                                ✓ Lowercase letter
                              </div>
                              <div
                                className={
                                  passwordStrength.number
                                    ? 'text-green-600'
                                    : 'text-gray-400'
                                }
                              >
                                ✓ Number
                              </div>
                              <div
                                className={
                                  passwordStrength.special
                                    ? 'text-green-600'
                                    : 'text-gray-400'
                                }
                              >
                                ✓ Special character
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">
                            Confirm Password
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={e => setConfirmPassword(e.target.value)}
                              placeholder="Confirm your password"
                              className="pl-9 enhanced-field-frame"
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}

                    {!isNewUser && (
                      <TurnstileCaptcha onTokenChange={setCaptchaToken} />
                    )}

                    <Button
                      className="w-full btn-primary"
                      disabled={isAuthBusy || (!isNewUser && !captchaToken)}
                    >
                      {isAuthLoading('sign_in')
                        ? 'Please wait…'
                        : isNewUser
                          ? 'Create Account'
                          : 'Sign In'}
                    </Button>

                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setIsNewUser(!isNewUser)}
                      className="w-full text-sm cursor-pointer"
                    >
                      {isNewUser
                        ? 'Already have an account? Sign in'
                        : 'Need an account? Create one'}
                    </Button>
                  </form>
                )}
                {step === 'mfa_method_selection' && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {isLoginMfaChallenge && !isNewUser
                        ? 'Your primary method starts automatically. Choose another linked method if you need a fallback.'
                        : "Choose how you'd like to receive verification codes for two-factor authentication:"}
                    </p>

                    <div className="space-y-3">
                      {orderedMfaMethods.map(method => {
                        const meta = getMfaMethodMeta(method);
                        const available = isMethodAvailable(method);

                        return (
                          <label
                            key={method}
                            className={`flex items-start gap-3 p-4 border rounded-lg transition-colors ${
                              available
                                ? 'cursor-pointer hover:bg-muted/50'
                                : 'cursor-not-allowed opacity-50'
                            } ${
                              isLoginMfaChallenge &&
                              method === loginPrimaryMFAMethod
                                ? 'border-primary/40 bg-primary/5'
                                : ''
                            }`}
                          >
                            <input
                              type="radio"
                              name="mfaMethod"
                              value={method}
                              checked={selectedMFAMethod === method}
                              disabled={!available}
                              onChange={e =>
                                setSelectedMFAMethod(
                                  e.target.value as MFAMethod,
                                )
                              }
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                {meta.icon}
                                <span className="font-medium">
                                  {meta.title}
                                </span>
                                <Badge
                                  variant={meta.badgeVariant}
                                  className="text-xs"
                                >
                                  {getMethodBadge(method) ||
                                    meta.fallbackBadge}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {meta.description}
                              </p>
                            </div>
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
                        <TurnstileCaptcha onTokenChange={setCaptchaToken} />
                      </>
                    )}

                    {showEmailCaptcha && (
                      <TurnstileCaptcha onTokenChange={setCaptchaToken} />
                    )}

                    <Button
                      onClick={handleMFAMethodSelection}
                      className="w-full btn-primary"
                      disabled={
                        isAuthBusy ||
                        (showSmsPhoneInput && !captchaToken) ||
                        (showEmailCaptcha && !captchaToken)
                      }
                    >
                      {isAuthLoading('mfa_method')
                        ? isLoginMfaChallenge
                          ? 'Starting...'
                          : 'Setting up...'
                        : isNewUser
                          ? 'Create Account'
                          : isLoginMfaChallenge
                            ? 'Use This Method'
                            : 'Continue'}
                    </Button>
                  </div>
                )}
                {/* STEP 3: Authenticator Setup/Verify */}
                {(step === 'setupMfa' || step === 'verifyMfa') && (
                  <div className="space-y-4 text-center">
                    {!hasLinkedAuthenticator && qrCodeUrl ? (
                      <>
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStep('mfa_method_selection')}
                          className="flex items-center gap-1 mb-2"
                        >
                          <ArrowLeft className="h-4 w-4" /> Back
                        </Button> */}

                        <Alert>
                          <Smartphone className="h-4 w-4" />
                          <AlertDescription>
                            Scan this QR code with your authenticator app.
                          </AlertDescription>
                        </Alert>
                        <Image
                          src={qrCodeUrl}
                          alt="QR"
                          width={192}
                          height={192}
                          className="mx-auto"
                        />
                        <form onSubmit={handleVerifyMfa} className="space-y-3">
                          <Input
                            type="text"
                            value={mfaCode}
                            onChange={e =>
                              setMfaCode(
                                e.target.value.replace(/\D/g, '').slice(0, 6),
                              )
                            }
                            placeholder="Enter 6-digit code"
                            className="text-center tracking-widest text-lg"
                            required
                            maxLength={6}
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
                              : 'Verify & Complete Setup'}
                          </Button>
                        </form>
                      </>
                    ) : (
                      <>
                        <Alert>
                          <Smartphone className="h-4 w-4" />
                          <AlertDescription>
                            Open your authenticator app and enter the 6-digit
                            code for Orderly Affairs.
                          </AlertDescription>
                        </Alert>
                        <form onSubmit={handleVerifyMfa} className="space-y-3">
                          <Input
                            type="text"
                            value={mfaCode}
                            onChange={e =>
                              setMfaCode(
                                e.target.value.replace(/\D/g, '').slice(0, 6),
                              )
                            }
                            placeholder="Enter 6-digit code"
                            className="text-center tracking-widest text-lg"
                            required
                            maxLength={6}
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
                              : 'Verify & Complete Setup'}
                          </Button>
                        </form>
                      </>
                    )}

                    <Button
                      variant="link"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => {
                        setStep('mfa_method_selection');
                      }}
                    >
                      Choose another method
                    </Button>
                  </div>
                )}

                {/* STEP 4: Email Verification */}
                {step === 'verifyEmail' && (
                  <div className="space-y-4 text-center">
                    <Alert>
                      <Mail className="h-4 w-4" />
                      <AlertDescription>
                        {verificationSent
                          ? `A verification code has been sent to ${email}.`
                          : `We'll send a 6-digit verification code to ${email}.`}
                      </AlertDescription>
                    </Alert>

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
                          <TurnstileCaptcha onTokenChange={setCaptchaToken} />
                          <Button
                            onClick={handleSendEmailCode}
                            className="w-full btn-primary"
                            disabled={
                              isAuthBusy || !captchaToken
                            }
                          >
                            {isAuthLoading('send_email_code')
                              ? 'Sending…'
                              : 'Send Verification Code'}
                          </Button>
                        </div>
                      )
                    ) : (
                      <form onSubmit={handleVerifyEmail} className="space-y-3">
                        <Input
                          type="text"
                          value={emailCode}
                          onChange={e =>
                            setEmailCode(
                              e.target.value.replace(/\D/g, '').slice(0, 6),
                            )
                          }
                          placeholder="Enter 6-digit code"
                          className="text-center tracking-widest text-lg"
                          required
                          maxLength={6}
                        />
                        <Button
                          type="submit"
                          className="w-full btn-primary"
                          disabled={
                            isAuthLoading('verify_email') ||
                            emailCode.length !== 6 ||
                            attempts >= MAX_ATTEMPTS
                          }
                        >
                          {isAuthLoading('verify_email')
                            ? 'Verifying…'
                            : 'Verify & Continue'}
                        </Button>
                      </form>
                    )}

                    {verificationSent && (
                      <>
                        <Button
                          variant="link"
                          disabled={cooldown > 0 || !captchaToken}
                          onClick={handleResendEmail}
                        >
                          {cooldown > 0
                            ? `Resend in ${cooldown}s`
                            : 'Resend Code'}
                        </Button>

                        <TurnstileCaptcha onTokenChange={setCaptchaToken} />

                        {attempts > 0 && attempts < MAX_ATTEMPTS && (
                          <p className="text-xs text-muted-foreground">
                            Failed attempts: {attempts} / {MAX_ATTEMPTS}
                          </p>
                        )}
                      </>
                    )}
                    <Button
                      variant="link"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedMFAMethod('authenticator');
                        setStep('mfa_method_selection');
                      }}
                    >
                      Choose another method
                    </Button>
                  </div>
                )}
                {/* STEP: SMS Verification */}
                {step === 'verifySms' && (
                  <div className="space-y-4 text-center">
                    <Alert>
                      <MessageSquare className="h-4 w-4" />
                      <AlertDescription>
                        Enter the 6-digit code sent to your registered phone.
                      </AlertDescription>
                    </Alert>

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
                          : 'Verify & Continue'}
                      </Button>
                    </form>

                    <Button
                      variant="link"
                      disabled={cooldown > 0 || !captchaToken}
                      onClick={handleResendSms}
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                    </Button>

                    <TurnstileCaptcha onTokenChange={setCaptchaToken} />

                    <Button
                      type="button"
                      variant="link"
                      className="cursor-pointer"
                      onClick={() => setStep('mfa_method_selection')}
                    >
                      Choose another method
                    </Button>

                    {attempts > 0 && attempts < MAX_ATTEMPTS && (
                      <p className="text-xs text-muted-foreground">
                        Failed attempts: {attempts} / {MAX_ATTEMPTS}
                      </p>
                    )}
                  </div>
                )}

                
                {step === 'forgot_password' && (
                  <div className="space-y-4">
                    <Input
                      type="email"
                      value={resetEmail || email}
                      onChange={e => {
                        setResetEmail(e.target.value);
                        setResetEmailSent(false);
                      }}
                      placeholder="Enter your email"
                    />

                    <TurnstileCaptcha
                      onTokenChange={setCaptchaToken}
                      className="flex justify-center"
                    />

                    <Button
                      className="w-full btn-primary flex items-center justify-center"
                      onClick={handleRequestReset}
                      disabled={isAuthBusy || !resetEmail || !captchaToken}
                    >
                      {isAuthLoading('request_reset') && (
                        <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      )}

                      {isAuthLoading('request_reset')
                        ? 'Sending Reset Code...'
                        : resetEmailSent
                          ? 'Code Sent'
                          : 'Send Reset Code'}
                    </Button>

                    {resetEmailSent && (
                      <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md">
                        ✅ Reset code sent! Check your email.
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                        {error}
                      </div>
                    )}
                  </div>
                )}

                {step === 'reset_password' && (
                  <div className="space-y-4">
                    <TurnstileCaptcha onTokenChange={setCaptchaToken} />
                    {/* OTP */}
                    <Input
                      type="text"
                      placeholder="Enter OTP"
                      value={resetOtp}
                      onChange={e =>
                        setResetOtp(
                          e.target.value.replace(/\D/g, '').slice(0, 6),
                        )
                      }
                    />

                    {/* New Password */}
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="New Password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                      />

                      <button
                        type="button"
                        className="absolute right-3 top-2.5 text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    {/* Confirm Password */}
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                      />

                      <button
                        type="button"
                        className="absolute right-3 top-2.5 text-gray-500"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    {/* Password mismatch warning */}
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-red-500 text-xs">
                        Passwords do not match
                      </p>
                    )}

                    {/* Reset Button */}
                    <Button
                      className="w-full btn-primary"
                      onClick={handleResetPassword}
                      disabled={
                        isAuthBusy ||
                        !resetOtp ||
                        !newPassword ||
                        newPassword !== confirmPassword
                      }
                    >
                      {isAuthLoading('reset_password')
                        ? 'Resetting...'
                        : 'Reset Password'}
                    </Button>
                  </div>
                )}
                {step === 'plan_selection' && (
                  <div className="space-y-4 text-center">
                    <h2 className="text-xl font-bold">Choose Your Plan</h2>

                    <Button
                      variant={
                        selectedPlan === 'monthly' ? 'default' : 'outline'
                      }
                      className="w-full"
                      onClick={() => setSelectedPlan('monthly')}
                    >
                      Monthly — $9.95
                    </Button>

                    <Button
                      variant={
                        selectedPlan === 'yearly' ? 'default' : 'outline'
                      }
                      className="w-full"
                      onClick={() => setSelectedPlan('yearly')}
                    >
                      Yearly — $94.95 (Save 20%)
                    </Button>

                    <Button
                      className="w-full"
                      onClick={() => {
                        setIsTrial(false);
                        setStep('payment');
                      }}
                    >
                      Continue to Payment
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setIsTrial(true);
                        setStep('payment');
                      }}
                    >
                      Start 15-Day Free Trial
                    </Button>
                  </div>
                )}

                {step === 'payment' && (
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      isTrial={isTrial}
                      selectedPlan={selectedPlan}
                      router={router}
                    />
                  </Elements>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
        {/* Footer Notice */}
        <div className="mt-12 w-full bg-slate-100/40 rounded-2xl p-4 md:p-6 flex items-start gap-5 border border-slate-200/40 shadow-[0_40px_80px_-20px_rgba(30,41,59,0.12)]">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
            <ShieldIcon />
          </div>
          <p className="text-[9px] md:text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
            Secured by{' '}
            <span className="text-[#1e293b]">Bank-Level AES-256-GCM</span>{' '}
            encryption at rest. Vault data is transmitted over TLS and decrypted
            only during your authorized session.
          </p>
        </div>
      </div>
    </div>
  );
}
