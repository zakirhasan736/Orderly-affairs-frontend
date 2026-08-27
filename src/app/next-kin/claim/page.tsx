'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@common/ui/button';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import {
  useCompleteNextKinClaimMutation,
  useStartNextKinClaimMutation,
} from '@/services/authApi';
import { getSafeErrorMessage } from '@/utils/safeErrorMessage';
import { markPortalSession } from '@/libs/secureFetch';

export default function NextKinClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#F6F8FA]">
          <Loader2 className="h-8 w-8 animate-spin text-[#213D59]" />
        </div>
      }
    >
      <NextKinClaimForm />
    </Suspense>
  );
}

function NextKinClaimForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(
    () => (searchParams.get('token') || '').trim(),
    [searchParams],
  );

  const [started, setStarted] = useState(false);
  const [name, setName] = useState('');
  const [emailMask, setEmailMask] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);

  const [startClaim, { isLoading: starting }] = useStartNextKinClaimMutation();
  const [completeClaim, { isLoading: completing }] =
    useCompleteNextKinClaimMutation();

  const preview = async () => {
    if (!token) {
      toast.error('This access link is missing a token');
      return;
    }
    try {
      const data = await startClaim({ token }).unwrap();
      setStarted(true);
      setName(data.full_name || '');
      setEmailMask(data.email || '');
    } catch (err) {
      toast.error(getSafeErrorMessage(err, 'This access link is invalid or expired'));
    }
  };

  const submit = async () => {
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await completeClaim({
        token,
        password,
        confirm_password: confirm,
      }).unwrap();
      markPortalSession();
      toast.success('Access opened. Complete verification next.');
      router.replace('/next-kin/dashboard');
    } catch (err) {
      toast.error(getSafeErrorMessage(err, 'Could not complete access'));
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F6F8FA] px-4 py-10">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-[#213D59]/10">
            <BrandLogo size={36} alt="" className="h-8 w-8" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#213D59]">Orderly Affairs</p>
            <p className="text-xs text-slate-500">One-time vault access</p>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#213D59] text-white">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-[#213D59]">
                Set your password
              </h1>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                After verification, this one-time link opens the kit. Files are
                view and download only. You can mark tasks complete, add notes,
                and deliver private messages.
              </p>
            </div>
          </div>

          {!started ? (
            <Button
              type="button"
              className="mt-2 w-full rounded-2xl"
              disabled={starting || !token}
              onClick={() => void preview()}
            >
              {starting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Continue
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {name ? <strong>{name}</strong> : 'Next of kin'}
                {emailMask ? ` · ${emailMask}` : ''}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="claim-password">New password</Label>
                <div className="relative">
                  <Input
                    id="claim-password"
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="rounded-xl pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                    onClick={() => setShow(v => !v)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                  >
                    {show ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="claim-confirm">Confirm password</Label>
                <Input
                  id="claim-confirm"
                  type={show ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="rounded-xl"
                  autoComplete="new-password"
                />
              </div>
              <Button
                type="button"
                className="w-full rounded-2xl"
                disabled={completing}
                onClick={() => void submit()}
              >
                {completing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Open kit access
              </Button>
              <p className="text-center text-xs text-[#7A8794]">
                <a
                  href="/instructions-for-next-of-kin"
                  className="font-medium text-[#213D59] underline"
                >
                  Instructions for next of kin
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
