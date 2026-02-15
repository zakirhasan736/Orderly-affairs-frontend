'use client';
import AuthWatcher from '@services/AuthWatcher';
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
      {/* <Navbar /> */}
      <AuthWatcher>
        <Elements stripe={stripePromise}>
          <main className="">{children}</main>
        </Elements>
      </AuthWatcher>
    </div>
  );
}
