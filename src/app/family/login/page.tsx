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
import { fetchSession, markPortalSession } from '@/libs/secureFetch';

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

  // Prefer NOK cookies for E2EE unlock / refresh before MFA completes.
  useEffect(() => {
    try {
      sessionStorage.setItem('oa_portal_kind', 'family');
    } catch {
      /* ignore */
    }
  }, []);

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
    await markPortalSession();

    const session = await fetchSession();
    const welcome = buildWelcomeMessage({
      fullName: res.full_name ?? session.full_name,
      email: res.email ?? session.email,
      returning: res.returning_user ?? session.returning_user,
    });

    let accessType = String(res.access_type || session.access_type || '').toLowerCase();

    if (accessType === 'family') {
      try {
        sessionStorage.setItem('oa_portal_kind', 'family');
      } catch {
        /* ignore */
      }
      const { isE2eeUnlocked } = await import('@/libs/e2ee/unlock');
      if (!isE2eeUnlocked()) {
        toast.warning(
          `${welcome}. Vault encryption is locked — ask the owner to re-save your family access password if sections will not open.`,
        );
      } else {
        toast.success(welcome);
      }
      // Soft navigate so an unlocked DEK survives into the dashboard.
      router.replace('/dashboard');
      return;
    }
    toast.success(welcome);
    router.replace('/next-kin/dashboard');
  };

  return (
    <NextOfKinLoginPage
      onLoginSuccess={handleLoginAttempt}
      onAuthenticated={handleAuthenticated}
      onBackToOwner={() => router.push('/login')}
      formData={{}}
      titleOverride="Family collaborator sign-in"
      subtitleOverride="Use the email invite from the kit owner. This is your own session — signing in as the owner does not open this access."
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
