'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { fetchSession, markPortalSession, nokLogout } from '@/libs/secureFetch';
import { collaboratorPortalMismatch } from '@/utils/portalLogin';

export default function NextKinLoginPageWrapper() {
  const router = useRouter();
  const [nextkinLogin] = useNextkinLoginMutation();
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaReady, setCaptchaReady] = useState(false);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  useEffect(() => {
    try {
      sessionStorage.setItem('oa_portal_kind', 'nextkin');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchSession().then(session => {
      if (cancelled || !session.authenticated) return;
      const accessType = String(session.access_type || '').toLowerCase();
      if (session.role === 'owner') {
        router.replace('/dashboard');
        return;
      }
      if (session.role === 'nextkin' && accessType === 'family') {
        router.replace('/dashboard');
        return;
      }
      if (session.role === 'nextkin') {
        router.replace('/next-kin/dashboard');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

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
        portal: 'nextkin',
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
    const mismatch = collaboratorPortalMismatch(res.access_type, 'nextkin');
    if (mismatch) {
      try {
        await nokLogout();
      } catch {
        /* ignore */
      }
      throw new Error(mismatch);
    }
    if (!res.authenticated) {
      throw new Error('Session not established');
    }
    try {
      sessionStorage.setItem('oa_portal_kind', 'nextkin');
    } catch {
      /* ignore */
    }
    await markPortalSession();
    toast.success('Login successful');
    router.replace('/next-kin/dashboard');
  };

  return (
    <NextOfKinLoginPage
      onLoginSuccess={handleLoginAttempt}
      onAuthenticated={handleAuthenticated}
      onBackToOwner={() => router.push('/')}
      expectedPortal="nextkin"
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
