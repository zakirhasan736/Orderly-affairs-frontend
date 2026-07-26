'use client';

import { useState } from 'react';
import { AlertCircle, CreditCard, Shield } from 'lucide-react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';
import { Button } from '@/components/common/ui/button';
import { Alert, AlertDescription } from '@/components/common/ui/alert';
import {
  useCreateCustomerMutation,
  useSetupIntentMutation,
  useConfirmCardMutation,
  useChangePlanMutation,
  usePortalMutation,
  useGetStatusQuery,
  useStartSubscriptionMutation,
} from '@/services/billingApi';
import { getSafeErrorMessage } from '@/utils/safeErrorMessage';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
);

type Props = {
  message?: string | null;
  onResolved?: () => void;
};

function RepairPaymentInner({ message, onResolved }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const { data: status, refetch } = useGetStatusQuery();
  const [createCustomer] = useCreateCustomerMutation();
  const [setupIntent] = useSetupIntentMutation();
  const [confirmCard] = useConfirmCardMutation();
  const [changePlan] = useChangePlanMutation();
  const [startSubscription] = useStartSubscriptionMutation();
  const [portal] = usePortalMutation();
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveCardAndActivate = async () => {
    setError(null);
    setLoading(true);
    try {
      await createCustomer().unwrap();
      if (!stripe || !elements) throw new Error('Stripe not ready');
      const { client_secret } = await setupIntent().unwrap();
      const card = elements.getElement(CardElement);
      if (!card) throw new Error('Card field missing');

      const result = await stripe.confirmCardSetup(client_secret, {
        payment_method: { card },
      });
      if (result.error) throw new Error(result.error.message);
      if (!result.setupIntent?.payment_method) {
        throw new Error('Payment method not created');
      }

      await confirmCard({
        payment_method_id: result.setupIntent.payment_method as string,
      }).unwrap();

      if (status?.status === 'past_due' || status?.status === 'blocked' || status?.is_trial) {
        try {
          await changePlan({ plan }).unwrap();
        } catch {
          await startSubscription({ plan, is_trial: false }).unwrap();
        }
      } else {
        await startSubscription({ plan, is_trial: false }).unwrap();
      }

      toast.success('Payment updated — vault unlocked');
      await refetch();
      onResolved?.();
      window.location.assign('/dashboard');
    } catch (err: unknown) {
      setError(getSafeErrorMessage(err, 'Could not update payment'));
    } finally {
      setLoading(false);
    }
  };

  const openPortal = async () => {
    try {
      const res = await portal().unwrap();
      if (res?.url) window.location.assign(res.url);
    } catch (err: unknown) {
      toast.error(getSafeErrorMessage(err, 'Could not open billing portal'));
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-[20px] border border-[rgba(185,138,62,0.35)] bg-[var(--needs-you-soft)] p-6">
      <div className="flex items-start gap-3">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#b98a3e]" />
        <div>
          <h2 className="text-lg font-semibold text-[#213D59]">
            Vault access paused
          </h2>
          <p className="mt-1 text-[15px] text-[rgba(33, 61, 89,0.7)]">
            {message ||
              'Update your payment method or activate a plan to restore full access. Other vault features stay locked until billing is fixed.'}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant={plan === 'monthly' ? 'default' : 'outline'}
          onClick={() => setPlan('monthly')}
        >
          Monthly
        </Button>
        <Button
          type="button"
          variant={plan === 'yearly' ? 'default' : 'outline'}
          onClick={() => setPlan('yearly')}
        >
          Yearly
        </Button>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-800">
          <CreditCard className="h-4 w-4" />
          Card details
        </p>
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                fontSize: '16px',
                color: '#213D59',
                '::placeholder': { color: '#94a3b8' },
              },
            },
          }}
        />
      </div>

      <Button
        className="w-full"
        disabled={loading}
        onClick={() => void saveCardAndActivate()}
      >
        {loading ? 'Processing…' : 'Unlock vault with payment'}
      </Button>

      <Button type="button" variant="ghost" className="w-full" onClick={() => void openPortal()}>
        Open Stripe billing portal
      </Button>
    </div>
  );
}

export function BillingLockPanel({ message, onResolved }: Props) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4 md:p-8">
      <Elements stripe={stripePromise}>
        <RepairPaymentInner message={message} onResolved={onResolved} />
      </Elements>
    </div>
  );
}
