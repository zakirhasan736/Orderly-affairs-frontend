'use client';
import AuthWatcher from '@services/AuthWatcher';
import { BillingAccessGate } from '@/components/BillingAccessGate';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AuthWatcher>
        <Elements stripe={stripePromise}>
          <BillingAccessGate>
            <main className="">{children}</main>
          </BillingAccessGate>
        </Elements>
      </AuthWatcher>
    </div>
  );
}
