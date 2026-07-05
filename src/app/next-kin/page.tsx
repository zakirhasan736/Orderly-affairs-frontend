'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { NextOfKinLoginPage } from '@/components/NextOfKinLoginPage';
import { TurnstileCaptcha } from '@/components/TurnstileCaptcha';
import { useNextkinLoginMutation } from '@/services/authApi';
import { getOtpSessionId } from '@/utils/otpSession';
import { getSafeErrorMessage } from '@/utils/safeErrorMessage';

export default function NextKinLoginPageWrapper() {
  const router = useRouter();
  const [nextkinLogin] = useNextkinLoginMutation();
  const [captchaToken, setCaptchaToken] = useState('');

  const handleLoginSuccess = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    if (!captchaToken) {
      toast.error('Complete the security check before signing in');
      return;
    }

    try {
      const res = await nextkinLogin({
        email,
        master_password: password,
        captcha_token: captchaToken,
        otp_session_id: getOtpSessionId(),
      }).unwrap();

      if (!res.authenticated) {
        throw new Error('Session not established');
      }

      toast.success('Login successful');
      router.push('/next-kin/dashboard');
    } catch (err: unknown) {
      toast.error(getSafeErrorMessage(err, 'Login failed. Check your credentials.'));
    }
  };

  return (
    <>
      <div className="mx-auto mb-4 max-w-md px-4">
        <TurnstileCaptcha onTokenChange={setCaptchaToken} />
      </div>
      <NextOfKinLoginPage
        onLoginSuccess={handleLoginSuccess}
        onBackToOwner={() => router.push('/dashboard')}
        formData={{}}
      />
    </>
  );
}
