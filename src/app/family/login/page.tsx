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
import { buildWelcomeMessage } from '@/utils/welcomeMessage';
import { fetchSession, markPortalSession, nokLogout } from '@/libs/secureFetch';
import { collaboratorPortalMismatch } from '@/utils/portalLogin';

/**
 * Family collaborator sign-in — separate cookie session from the owner.
 * Lands on the owner dashboard with granted area permissions.
 */
export default function FamilyLoginPage() {
  const router = useRouter();
  const [nextkinLogin] = useNextkinLoginMutation();
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaReady, setCaptchaReady] = useState(false);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  useEffect(() => {
    try {
      sessionStorage.setItem('oa_portal_kind', 'family');
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
        email: email.trim(),
        master_password: password,
        captcha_token: captchaToken,
        otp_session_id: getOtpSessionId(),
        portal: 'family',
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
    const mismatch = collaboratorPortalMismatch(res.access_type, 'family');
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
    await markPortalSession();

    const session = await fetchSession();
    const welcome = buildWelcomeMessage({
      fullName: res.full_name ?? session.full_name,
      email: res.email ?? session.email,
      returning: res.returning_user ?? session.returning_user,
    });

    try {
      sessionStorage.setItem('oa_portal_kind', 'family');
    } catch {
      /* ignore */
    }
    toast.success(welcome);
    router.replace('/dashboard');
  };

  return (
    <NextOfKinLoginPage
      onLoginSuccess={handleLoginAttempt}
      onAuthenticated={handleAuthenticated}
      onBackToOwner={() => router.push('/')}
      expectedPortal="family"
      formData={{}}
      titleOverride="Family collaborator sign-in"
      subtitleOverride="Use the email invite from the Vault owner. This is your own session. Signing in as the owner does not open this access."
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
