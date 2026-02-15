'use client';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { NextOfKinLoginPage } from '@/components/NextOfKinLoginPage';
import { useNextkinLoginMutation } from '@/services/authApi';

export default function NextKinLoginPageWrapper() {
  const router = useRouter();
  const [nextkinLogin] = useNextkinLoginMutation();

  const handleLoginSuccess = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      const res = await nextkinLogin({
        email,
        master_password: password,
      }).unwrap();

      Cookies.set('nok_auth_token', res.access_token, {
        expires: 7,
        sameSite: 'strict',
      });

      toast.success('Login successful');
      router.push('/next-kin/dashboard');
    } catch (err: any) {
      toast.error(err?.data?.detail || 'Login failed');
    }
  };

  return (
    <NextOfKinLoginPage
      onLoginSuccess={handleLoginSuccess}
      onBackToOwner={() => router.push('/dashboard')}
      formData={{}} // NOT USED anymore
    />
  );
}
