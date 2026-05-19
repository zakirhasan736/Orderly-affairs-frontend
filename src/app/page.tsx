'use client';

import { useState, useEffect} from 'react';
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
import Cookies from 'js-cookie';
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
  useResumePendingSignupMutation,
} from '@/services/authApi';
import { Card, CardContent } from '@/components/common/ui/card';
import { Input } from '@/components/common/ui/input';
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

// ------------------------------
// Validation helpers
// ------------------------------
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const verifyTOTPCode = (code: string) => /^\d{6}$/.test(code);
function PaymentForm({
  isTrial,
  selectedPlan,
  router,
}: {
  isTrial: boolean;
  selectedPlan: 'monthly' | 'yearly';
  router: any;
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
      router.push('/dashboard');
    } catch (err: any) {
  const detail = err?.data?.detail;

  if (Array.isArray(detail)) {
    setError(detail.map(d => d.msg).join(', '));
  } else if (typeof detail === 'string') {
    setError(detail);
  } else {
    setError(err?.message || 'Payment failed. Please try again.');
  }
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
  const [hasLinkedAuthenticator, setHasLinkedAuthenticator] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

  const [smsSent, setSmsSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP UX
  const OTP_LENGTH = 6;
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [cooldown, setCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 5;

useEffect(() => {
  const autoSendEmailOtp = async () => {
    if (step !== 'verifyEmail') return;

    // Signup/login already sent email OTP from backend.
    if (verificationSent) return;

    // Only auto-send for existing-user manual email setup.
    if (isNewUser) return;

    try {
      setLoading(true);
      await sendEmailOtp({ email }).unwrap();
      setVerificationSent(true);
    } catch (err: any) {
      setError(err?.data?.detail || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  autoSendEmailOtp();
}, [step, verificationSent, email, sendEmailOtp, isNewUser]);

useEffect(() => {
  if (cooldown <= 0) return;

  const timer = setInterval(() => {
    setCooldown(prev => prev - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [cooldown]);

const handleOtpChange = (value: string, index: number) => {
  if (!/^\d?$/.test(value)) return;

  const next = [...otp];
  next[index] = value;
  setOtp(next);

  if (value && index < OTP_LENGTH - 1) {
    const nextInput = document.getElementById(`otp-${index + 1}`);
    nextInput?.focus();
  }
};

const handleOtpKeyDown = (
  e: React.KeyboardEvent<HTMLInputElement>,
  index: number,
) => {
  if (e.key === 'Backspace' && !otp[index] && index > 0) {
    const prevInput = document.getElementById(`otp-${index - 1}`);
    prevInput?.focus();
  }
};

const handleOtpPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
  const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

  if (!pasted) return;

  e.preventDefault();

  const next = Array(OTP_LENGTH).fill('');
  pasted.split('').forEach((digit, i) => {
    next[i] = digit;
  });

  setOtp(next);

  const lastIndex = Math.min(pasted.length - 1, OTP_LENGTH - 1);
  const lastInput = document.getElementById(`otp-${lastIndex}`);
  lastInput?.focus();
};
  // Inside LoginPage component
 const handleForgotPasswordClick = async () => {
   setError('');

   if (email && isValidEmail(email)) {
     setLoading(true);

     try {
       await requestPasswordReset({ email }).unwrap();
       setResetEmail(email);
       alert('Reset code sent. Check your email.');
       setStep('reset_password');
     } catch (err: any) {
       setError(err?.data?.detail || 'Failed to send reset code');
     } finally {
       setLoading(false);
     }
   } else {
     setStep('forgot_password');
   }
 };

 const handleRequestReset = async () => {
   setError('');
   setLoading(true);

   try {
     await requestPasswordReset({ email: resetEmail }).unwrap();
     setResetEmailSent(true);
     alert('Reset code sent. Check your email.');
     setStep('reset_password');
   } catch (err: any) {
     setError(err?.data?.detail || 'Failed to send reset code');
   } finally {
     setLoading(false);
   }
 };
const handleResetPassword = async () => {
  if (newPassword !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  setLoading(true);

  try {
    await resetPassword({
      email: resetEmail,
      otp: resetOtp,
      new_password: newPassword,
    }).unwrap();

    alert('Password reset successfully!');
    setStep('credentials');
  } catch (err: any) {
    setError(err?.data?.detail || 'Reset failed');
  } finally {
    setLoading(false);
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

    setLoading(true);

    const res = await login({ email, password }).unwrap();

    if (res.mfa_required && res.method === 'sms') {
      setSmsSent(true);
      setOtp(Array(OTP_LENGTH).fill(''));
      setAttempts(0);
      setStep('verifySms');
      return;
    }

    if (res.mfa_required && res.method === 'email') {
      setVerificationSent(false);
      setStep('verifyEmail');
      return;
    }

    if (res.mfa_required && res.method === 'authenticator') {
      setHasLinkedAuthenticator(true);
      setStep('verifyMfa');
      return;
    }

    Cookies.set('auth_token', res.access_token, {
      secure: true,
      sameSite: 'strict',
      path: '/',
    });

    router.push('/dashboard');
  } catch (err: any) {
    setError(err?.data?.detail || err.message || 'Authentication failed');
  } finally {
    setLoading(false);
  }
};

const handleMFAMethodSelection = async () => {
  setError('');
  setLoading(true);

  try {
    if (!selectedMFAMethod) {
      throw new Error('Select a verification method');
    }

    if (isNewUser) {
      if (selectedMFAMethod === 'sms' && !phoneNumber.trim()) {
        throw new Error(
          'Phone number is required for SMS MFA. Use format like +8801XXXXXXXXX',
        );
      }

      const signupPayload: {
        email: string;
        password: string;
        mfa_method: MFAMethod;
        phone_number?: string;
      } = {
        email,
        password,
        mfa_method: selectedMFAMethod,
      };

      if (selectedMFAMethod === 'sms') {
        signupPayload.phone_number = phoneNumber.trim();
      }

      const signupRes = await signup(signupPayload).unwrap();

      // ✅ NEW USER → AUTHENTICATOR
      if (selectedMFAMethod === 'authenticator') {
        setQrCodeUrl(signupRes.qrCodeUrl || '');
        setMfaSecret(signupRes.secret || '');
        setHasLinkedAuthenticator(false);
        setMfaCode('');
        setStep('setupMfa');
        return;
      }

      // ✅ NEW USER → EMAIL
      if (selectedMFAMethod === 'email') {
        setVerificationSent(true); // backend already sent it during signup
        setEmailCode('');
        setStep('verifyEmail');
        return;
      }

      // ✅ NEW USER → SMS
      if (selectedMFAMethod === 'sms') {
        setSmsSent(true); // backend already sent it during signup
        setOtp(Array(OTP_LENGTH).fill(''));
        setAttempts(0);
        setCooldown(30);
        setStep('verifySms');
        return;
      }
    }

    // =========================
    // EXISTING USER MFA SETUP
    // =========================
    if (selectedMFAMethod === 'authenticator') {
      const qr = await generateMfa({ email }).unwrap();
      setQrCodeUrl(qr.qrCodeUrl);
      setMfaSecret(qr.secret);
      setHasLinkedAuthenticator(false);
      setMfaCode('');
      setStep('setupMfa');
      return;
    }

    if (selectedMFAMethod === 'email') {
      setVerificationSent(false);
      setEmailCode('');
      setStep('verifyEmail');
      return;
    }

    if (selectedMFAMethod === 'sms') {
      throw new Error('SMS setup is currently available during signup only');
    }
  } catch (err: any) {
    const detail = err?.data?.detail || err?.message || 'Failed to continue';

    // ✅ PENDING SIGNUP ALREADY EXISTS → CONTINUE INSTEAD OF FAILING
    if (
      isNewUser &&
      typeof detail === 'string' &&
      detail.includes('Signup already started')
    ) {
    if (selectedMFAMethod === 'authenticator') {
      try {
        const resumeRes = await resumePendingSignup({ email }).unwrap();

        setQrCodeUrl(resumeRes.qrCodeUrl || '');
        setMfaSecret(resumeRes.secret || '');
        setHasLinkedAuthenticator(false);
        setMfaCode('');
        setError('');
        setStep('setupMfa');
        return;
      } catch (resumeErr: any) {
        setError(
          resumeErr?.data?.detail ||
            'Signup already started, but failed to restore QR code.',
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
    setLoading(false);
  }
};

const handleVerifyMfa = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    if (!verifyTOTPCode(mfaCode)) {
      throw new Error('Enter valid 6-digit code');
    }

    let res;

    if (hasLinkedAuthenticator) {
      res = await verifyTotp({ email, code: mfaCode }).unwrap();
    } else {
      res = await linkAuthenticator({
        email,
        code: mfaCode,
        secret: mfaSecret,
      }).unwrap();
    }

    Cookies.set('auth_token', res.access_token, {
      secure: true,
      sameSite: 'strict',
      path: '/',
    });

    if (isNewUser) {
      setStep('plan_selection');
    } else {
      router.push('/dashboard');
    }
  } catch (err: any) {
    setError(err?.data?.detail || err.message || 'Invalid verification code');
  } finally {
    setLoading(false);
  }
};

const handleVerifyEmail = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const code = parseInt(emailCode);
    if (isNaN(code)) throw new Error('Enter valid code');

    const res = await verifyEmailCode({ email, code }).unwrap();

    Cookies.set('auth_token', res.access_token, {
      secure: true,
      sameSite: 'strict',
      path: '/',
    });

    if (isNewUser) {
      setStep('plan_selection');
    } else {
      router.push('/dashboard');
    }
  } catch (err: any) {
    setError(err?.data?.detail || err.message || 'Verification failed');
  } finally {
    setLoading(false);
  }
};

const handleVerifySms = async (e: React.FormEvent) => {
  e.preventDefault();
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

  setLoading(true);

  try {
  const res = await verifySmsOtp({
    email,
    code: smsCode,
  }).unwrap();

    setAttempts(0);

    Cookies.set('auth_token', res.access_token, {
      secure: true,
      sameSite: 'strict',
      path: '/',
    });

    if (isNewUser) {
      setStep('plan_selection');
    } else {
      router.push('/dashboard');
    }
  } catch (err: any) {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    setError(
      nextAttempts >= MAX_ATTEMPTS
        ? 'Too many failed attempts. Try again later.'
        : err?.data?.detail || 'Invalid SMS code',
    );
  } finally {
    setLoading(false);
  }
};

const handleResendSms = async () => {
  if (cooldown > 0) return;

  try {
    setError('');

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/resend-sms-mfa`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.detail || 'Failed to resend OTP');
    }

    setCooldown(30);
    setOtp(Array(OTP_LENGTH).fill(''));
  } catch (err: any) {
    setError(err?.message || 'Failed to resend OTP');
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
                    ? 'Choose Security Method'
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
                    ? 'Select your preferred two-factor authentication method'
                    : step === 'setupMfa'
                      ? 'Complete your security setup'
                      : 'Enter the code to verify your identity'}
          </p>
        </div>
        <Card className="glass-card shadow-[0_40px_80px_-20px_rgba(30,41,59,0.12)] border border-slate-100">
          <CardContent className="px-6 pt-6 md:pt-9">
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
                Back
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
                          disabled={loading}
                        >
                          {loading && (
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

                    <Button className="w-full btn-primary" disabled={loading}>
                      {loading
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
                      Choose how you'd like to receive verification codes for
                      two-factor authentication:
                    </p>

                    <div className="space-y-3">
                      <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <input
                          type="radio"
                          name="mfaMethod"
                          value="authenticator"
                          checked={selectedMFAMethod === 'authenticator'}
                          onChange={e =>
                            setSelectedMFAMethod(e.target.value as MFAMethod)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Smartphone className="h-4 w-4 text-primary" />
                            <span className="font-medium">
                              Authenticator App
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              Most Secure
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Use Google Authenticator, Authy, or similar apps.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <input
                          type="radio"
                          name="mfaMethod"
                          value="email"
                          checked={selectedMFAMethod === 'email'}
                          onChange={e =>
                            setSelectedMFAMethod(e.target.value as MFAMethod)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Mail className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">
                              Email Verification
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Convenient
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Receive codes via email.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <input
                          type="radio"
                          name="mfaMethod"
                          value="sms"
                          checked={selectedMFAMethod === 'sms'}
                          onChange={e =>
                            setSelectedMFAMethod(e.target.value as MFAMethod)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">
                              SMS / Text Message
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Medium
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Receive verification codes via SMS.
                          </p>
                        </div>
                      </label>
                    </div>

                    {selectedMFAMethod === 'sms' && (
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Mobile Number</Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={phoneNumber}
                          onChange={e => setPhoneNumber(e.target.value)}
                          placeholder="+8801XXXXXXXXX"
                        />
                        <p className="text-xs text-muted-foreground">
                          Use full international format with country code.
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleMFAMethodSelection}
                      className="w-full btn-primary"
                      disabled={loading}
                    >
                      {loading
                        ? 'Setting up…'
                        : isNewUser
                          ? 'Create Account'
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
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {mfaSecret}
                        </code>
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
                            disabled={loading || mfaCode.length !== 6}
                          >
                            {loading
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
                            disabled={loading || mfaCode.length !== 6}
                          >
                            {loading
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
                      onClick={() => setStep('verifyEmail')}
                    >
                      Try email verification instead
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
                      // <Button
                      //   onClick={handleSendEmailCode}
                      //   className="w-full btn-primary"
                      //   disabled={loading}
                      // >
                      //   Send Verification Code
                      // </Button>
                      <div className="flex items-center justify-center py-4">
                        <span className="h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          Sending verification code...
                        </span>
                      </div>
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
                          disabled={loading || emailCode.length !== 6}
                        >
                          {loading ? 'Verifying…' : 'Verify & Continue'}
                        </Button>
                      </form>
                    )}
                    <Button
                      variant="link"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => setStep('setupMfa')}
                    >
                      Try authenticator app instead
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
                      <div
                        className="flex justify-center gap-2"
                        onPaste={handleOtpPaste}
                      >
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={1}
                            value={digit}
                            onChange={e =>
                              handleOtpChange(e.target.value, index)
                            }
                            onKeyDown={e => handleOtpKeyDown(e, index)}
                            className="w-10 h-12 text-center text-lg border rounded-md"
                          />
                        ))}
                      </div>

                      <Button
                        type="submit"
                        className="w-full btn-primary"
                        disabled={
                          loading ||
                          otp.join('').length !== 6 ||
                          attempts >= MAX_ATTEMPTS
                        }
                      >
                        {loading ? 'Verifying…' : 'Verify & Continue'}
                      </Button>
                    </form>

                    <Button
                      variant="link"
                      disabled={cooldown > 0}
                      onClick={handleResendSms}
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
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

                    <Button
                      className="w-full btn-primary flex items-center justify-center"
                      onClick={handleRequestReset}
                      disabled={loading || !resetEmail}
                    >
                      {loading && (
                        <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      )}

                      {resetEmailSent ? 'Code Sent' : 'Sending Reset Code...'}
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
                        loading ||
                        !resetOtp ||
                        !newPassword ||
                        newPassword !== confirmPassword
                      }
                    >
                      {loading ? 'Resetting...' : 'Reset Password'}
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
            <span className="text-[#1e293b]">Bank-Level AES-256</span>{' '}
            encryption. Your data is decrypted locally on your device only
            during active vault sessions.
          </p>
        </div>
      </div>
    </div>
  );
}