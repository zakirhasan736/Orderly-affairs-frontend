'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { NextOfKinLoginPage } from '@/components/NextOfKinLoginPage';
import { TurnstileCaptcha } from '@/components/TurnstileCaptcha';
import {
  useNextkinLoginMutation,
  type LoginResponse,
} from '@/services/authApi';
import { getOtpSessionId } from '@/utils/otpSession';
import { getSafeErrorMessage } from '@/utils/safeErrorMessage';
import { parseAuthApiError } from '@/utils/authRateLimit';
import { markPortalSession } from '@/libs/secureFetch';

export default function NextKinLoginPageWrapper() {
  const router = useRouter();
  const [nextkinLogin] = useNextkinLoginMutation();
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaReady, setCaptchaReady] = useState(false);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const refreshCaptcha = useCallback(() => {
    setCaptchaToken('');
    setCaptchaReady(false);
    setCaptchaResetKey(k => k + 1);
  }, []);

  const handleLoginAttempt = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<LoginResponse> => {
    if (!captchaReady || !captchaToken) {
      toast.error('Complete the security check before signing in');
      throw new Error('Complete the security check before signing in');
    }

    try {
      return await nextkinLogin({
        email,
        master_password: password,
        captcha_token: captchaToken,
        otp_session_id: getOtpSessionId(),
      }).unwrap();
    } catch (err: unknown) {
      const parsed = parseAuthApiError(err, '');
      const message = getSafeErrorMessage(
        err,
        'Login failed. Check your email and password.',
      );
      refreshCaptcha();
      if (
        parsed.status === 400 &&
        /captcha|security check/i.test(parsed.message || message)
      ) {
        toast.error(
          'Security check expired. Complete the Cloudflare check again, then sign in.',
        );
      } else {
        toast.error(message);
      }
      throw new Error(message);
    }
  };

  const handleAuthenticated = async (res: LoginResponse) => {
    if (!res.authenticated) {
      throw new Error('Session not established');
    }
    // password held on NextOfKinLoginPage — unlock via session event
    toast.success('Login successful');
    if (res.access_type === 'family') {
      await markPortalSession();
      router.push('/dashboard');
      return;
    }
    router.push('/next-kin/dashboard');
  };

  return (
    <NextOfKinLoginPage
      onLoginSuccess={handleLoginAttempt}
      onAuthenticated={handleAuthenticated}
      onBackToOwner={() => router.push('/dashboard')}
      formData={{}}
      captchaReady={captchaReady}
      captchaSlot={
        <TurnstileCaptcha
          gateMode
          onTokenChange={setCaptchaToken}
          onReadyChange={setCaptchaReady}
          resetKey={captchaResetKey}
        />
      }
    />
  );
}
