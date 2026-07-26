'use client';

/**
 * Exact markup/spacing from provided desktop + mobile HTML.
 * Stripe Elements + billing APIs only where the static mocks had placeholders/CTAs.
 */

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import {
  useConfirmCardMutation,
  useCreateCustomerMutation,
  useSetupIntentMutation,
  useStartSubscriptionMutation,
} from '@/services/billingApi';
import { getSafeErrorMessage } from '@/utils/safeErrorMessage';

const PLAN_PRICES = {
  yearly: {
    label: 'Yearly plan',
    price: '$94.95',
    note: 'Billed once a year · save about 20%',
  },
  monthly: {
    label: 'Monthly plan',
    price: '$9.95',
    note: 'Pay monthly · 1-year minimum commitment',
  },
} as const;

const TRIAL_DAYS = 14;

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function formatLongDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

function formatTrialEndDate(days = TRIAL_DAYS) {
  return formatLongDate(addDays(new Date(), days));
}

function formatTrialEndShort(days = TRIAL_DAYS) {
  return formatShortDate(addDays(new Date(), days));
}

const STRIPE_STYLE = {
  base: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#213D59',
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
    letterSpacing: '0.04em',
    '::placeholder': { color: '#5a6b80' },
  },
  invalid: { color: '#b4483f' },
} as const;

function goToDashboard(router: ReturnType<typeof useRouter>) {
  if (typeof window !== 'undefined') {
    window.location.assign('/dashboard');
    return;
  }
  router.replace('/dashboard');
}

type Props = {
  isTrial: boolean;
  trialMode: 'cardless' | 'card_on_file';
  selectedPlan: 'monthly' | 'yearly';
  router: ReturnType<typeof useRouter>;
  onBack: () => void;
  onSwitchToCardless: () => void;
};

export function StartTrialCheckout({
  isTrial,
  trialMode,
  selectedPlan,
  router,
  onBack,
  onSwitchToCardless,
}: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [createCustomer] = useCreateCustomerMutation();
  const [setupIntent] = useSetupIntentMutation();
  const [confirmCard] = useConfirmCardMutation();
  const [startSubscription] = useStartSubscriptionMutation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardReady, setCardReady] = useState({
    number: false,
    expiry: false,
    cvc: false,
  });

  const needsCardNow = !isTrial || trialMode === 'card_on_file';
  const stripeReady = Boolean(stripe && elements);
  const canPay =
    !needsCardNow ||
    (stripeReady && cardReady.number && cardReady.expiry && cardReady.cvc);

  const plan = PLAN_PRICES[selectedPlan];
  const trialEndShort = formatTrialEndShort();
  const trialEndFull = formatTrialEndDate();
  const dueToday = isTrial ? '$0.00' : plan.price;
  const isYearly = selectedPlan === 'yearly';

  const title = isTrial ? 'Start your trial' : 'Secure checkout';
  const subtitle = isTrial
    ? needsCardNow
      ? 'Add a card now and access continues without a gap when the trial ends.'
      : 'No card needed today. You can add payment anytime in settings.'
    : isYearly
      ? 'You’re starting the yearly plan and saving about 20%.'
      : 'You’re starting monthly billing at $9.95 — 1-year minimum commitment.';

  const authChargeNote = isTrial
    ? isYearly
      ? `Nothing is charged today. We authorise $0 to check the card is valid, then bill ${plan.price} on ${trialEndFull} (yearly).`
      : `Nothing is charged today. We authorise $0 to check the card is valid, then bill ${plan.price} on ${trialEndFull}, then ${plan.price}/month.`
    : isYearly
      ? `You’ll be charged ${plan.price} today for one year of access.`
      : `You’ll be charged ${plan.price} today, then ${plan.price} each month.`;

  const mobileDueNote = isTrial
    ? isYearly
      ? `Trial runs to ${trialEndShort}. First charge ${plan.price} on ${trialEndFull}, then yearly.`
      : `Trial runs to ${trialEndShort}. First charge ${plan.price} on ${trialEndFull}.`
    : isYearly
      ? `Billed once a year · save about 20%.`
      : plan.note;

  const ctaLabel = loading
    ? 'Please wait…'
    : needsCardNow && !canPay
      ? 'Loading card form…'
      : isTrial
        ? needsCardNow
          ? 'Start your trial'
          : 'Start cardless trial'
        : 'Subscribe now';

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await createCustomer().unwrap();

      if (needsCardNow) {
        if (!stripe || !elements) {
          throw new Error(
            'Secure card form is still loading. Please wait a moment.',
          );
        }
        const { client_secret } = await setupIntent().unwrap();
        const card = elements.getElement(CardNumberElement);
        if (!card) throw new Error('Card element not found');

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
      }

      await startSubscription({
        plan: selectedPlan,
        is_trial: isTrial,
        ...(isTrial ? { trial_mode: trialMode } : {}),
      }).unwrap();

      goToDashboard(router);
    } catch (err: unknown) {
      setError(getSafeErrorMessage(err, 'Payment failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const ctaStyle: CSSProperties = {
    width: '100%',
    height: 52,
    marginTop: 20,
    border: 0,
    borderRadius: 26,
    background: '#213d59',
    color: '#fff',
    font: "500 15.5px 'Manrope', sans-serif",
    cursor: loading || !canPay ? 'not-allowed' : 'pointer',
    opacity: loading || !canPay ? 0.55 : 1,
  };

  const linkStyle: CSSProperties = {
    border: 0,
    background: 'transparent',
    padding: 0,
    font: 'inherit',
    color: '#2b5a8c',
    cursor: 'pointer',
    textDecoration: 'none',
  };

  const stripeFields = (
    <div className="stc-stripe">
      <div className="stc-stripe__number">
        {!stripeReady ? (
          <span style={{ fontSize: 13.5, color: '#5a6b80' }}>
            Loading secure card form…
          </span>
        ) : (
          <CardNumberElement
            options={{ showIcon: false, style: STRIPE_STYLE }}
            onReady={() => setCardReady(p => ({ ...p, number: true }))}
          />
        )}
      </div>
      <div className="stc-stripe__side">
        <div className="stc-stripe__expiry">
          {stripeReady ? (
            <CardExpiryElement
              options={{ style: STRIPE_STYLE }}
              onReady={() => setCardReady(p => ({ ...p, expiry: true }))}
            />
          ) : null}
        </div>
        <div className="stc-stripe__cvc">
          {stripeReady ? (
            <CardCvcElement
              options={{
                style: {
                  ...STRIPE_STYLE,
                  base: { ...STRIPE_STYLE.base, color: '#5a6b80' },
                },
              }}
              onReady={() => setCardReady(p => ({ ...p, cvc: true }))}
            />
          ) : null}
        </div>
      </div>
    </div>
  );

  const yellowWarning = (
    <section
      style={{
        marginTop: 16,
        background: '#fff3dd',
        border: '1px solid #9a7326',
        borderRadius: 16,
        padding: '20px 22px',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 15.5,
          fontWeight: 600,
          color: '#7a5a1c',
        }}
      >
        If you choose the cardless trial instead
      </p>
      <p
        style={{
          margin: '8px 0 0',
          fontSize: 14.5,
          lineHeight: 1.6,
          color: '#6d4d15',
        }}
      >
        No card needed today. You can add payment anytime in settings. When the
        trial ends without a card on file, vault access pauses until you add
        payment — nothing is deleted.
      </p>
    </section>
  );

  return (
    <div className="stc flex min-h-0 w-full max-w-[880px] flex-1 flex-col overflow-hidden bg-[#f5f8fc] text-[16px] text-[#213d59] lg:flex lg:flex-none lg:overflow-visible lg:bg-transparent">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4 lg:overflow-visible lg:p-[44px_52px]">
        {/* —— Desktop header (your HTML) —— */}
        <div className="hidden lg:block">
          <p
            style={{
              margin: 0,
              font: "500 11px 'IBM Plex Mono', monospace",
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#5a6b80',
            }}
          >
            Step 3 of 3
          </p>
          <h1
            style={{
              margin: '14px 0 0',
              font: "400 34px/1.2 'Poppins', 'Manrope', sans-serif",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: '12px 0 0',
              fontSize: 16.5,
              color: '#5a6b80',
              maxWidth: '54ch',
              textWrap: 'pretty',
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* —— Mobile order summary —— */}
        <div
          className="lg:hidden"
          style={{
            background: '#fff',
            border: '1px solid #7688a1',
            borderRadius: 16,
            padding: 16,
            marginBottom: 11,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ flex: 1, fontSize: 15.5, fontWeight: 600 }}>
              {plan.label}
            </span>
            <span
              style={{ font: "400 21px/1 'Poppins', 'Manrope', sans-serif" }}
            >
              {plan.price}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 10,
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid #7688a1',
            }}
          >
            <span style={{ flex: 1, fontSize: 14, color: '#5a6b80' }}>
              Due today
            </span>
            <span style={{ fontSize: 15.5, fontWeight: 600 }}>{dueToday}</span>
          </div>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 13,
              color: '#5a6b80',
              lineHeight: 1.5,
            }}
          >
            {mobileDueNote}
          </p>
        </div>

        {error ? (
          <p
            style={{
              margin: '0 0 11px',
              fontSize: 13,
              color: '#b4483f',
            }}
          >
            {error}
          </p>
        ) : null}

        {needsCardNow ? (
          <section
            className="stc-card"
            style={{
              marginTop: 26,
              background: '#fff',
              border: '1px solid #7688a1',
              borderRadius: 16,
              padding: '26px 28px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 18,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 600,
                  flex: 1,
                }}
              >
                Card details
              </h2>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: '#2b5a8c',
                  background: '#e7eef7',
                  borderRadius: 6,
                  padding: '4px 9px',
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path
                    d="M8 10V7.5a4 4 0 0 1 8 0V10"
                    strokeLinecap="round"
                  />
                </svg>
                Secured by Stripe
              </span>
            </div>

            {stripeFields}

            <p
              style={{
                margin: '12px 0 0',
                fontSize: 13.5,
                color: '#5a6b80',
              }}
            >
              Card fields are provided by Stripe. Do not refresh while they
              load.
            </p>

            {/* Always show $0 auth / charge note when collecting a card */}
            <div
              style={{
                marginTop: 20,
                padding: '15px 17px',
                borderRadius: 12,
                background: '#f5f8fc',
                display: 'flex',
                gap: 12,
              }}
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  background: '#e7eef7',
                  color: '#2b5a8c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                }}
                aria-hidden
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="m5 13 4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: 14.5,
                  lineHeight: 1.6,
                  color: '#33506e',
                }}
              >
                {authChargeNote}
              </p>
            </div>

            <button
              type="button"
              data-cy="checkout-submit"
              className="hidden lg:block"
              disabled={loading || !canPay}
              onClick={() => void handleSubmit()}
              style={ctaStyle}
            >
              {ctaLabel}
            </button>

            {isTrial ? (
              <p
                className="hidden lg:block"
                style={{
                  margin: '14px 0 0',
                  fontSize: 13.5,
                  color: '#5a6b80',
                  textAlign: 'center',
                }}
              >
                Or{' '}
                <button
                  type="button"
                  onClick={onSwitchToCardless}
                  style={linkStyle}
                >
                  go back and start without a card
                </button>
              </p>
            ) : (
              <p
                className="hidden lg:block"
                style={{
                  margin: '14px 0 0',
                  fontSize: 13.5,
                  color: '#5a6b80',
                  textAlign: 'center',
                }}
              >
                Or{' '}
                <button type="button" onClick={onBack} style={linkStyle}>
                  go back to plan selection
                </button>
              </p>
            )}
          </section>
        ) : (
          <section
            className="stc-card"
            style={{
              marginTop: 26,
              background: '#fff',
              border: '1px solid #7688a1',
              borderRadius: 16,
              padding: '26px 28px',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
              Cardless trial
            </h2>
            <p
              style={{
                margin: '12px 0 0',
                fontSize: 14.5,
                color: '#5a6b80',
                lineHeight: 1.6,
              }}
            >
              No card needed today. You can add payment anytime in settings.
              When the trial ends without a card on file, vault access pauses
              until you add payment — nothing is deleted.
            </p>
            <button
              type="button"
              data-cy="checkout-submit"
              className="hidden lg:block"
              disabled={loading || !canPay}
              onClick={() => void handleSubmit()}
              style={ctaStyle}
            >
              {ctaLabel}
            </button>
            <p
              className="hidden lg:block"
              style={{
                margin: '14px 0 0',
                fontSize: 13.5,
                color: '#5a6b80',
                textAlign: 'center',
              }}
            >
              Or{' '}
              <button type="button" onClick={onBack} style={linkStyle}>
                go back and add a card
              </button>
            </p>
          </section>
        )}

        {/* Yellow warning — always on secure payment / trial step */}
        {isTrial ? yellowWarning : null}
      </div>

      <div className="shrink-0 bg-[#f5f8fc] px-4 pb-[22px] lg:hidden">
        <button
          type="button"
          data-cy="checkout-submit-mobile"
          disabled={loading || !canPay}
          onClick={() => void handleSubmit()}
          style={{ ...ctaStyle, marginTop: 0 }}
        >
          {ctaLabel}
        </button>
        {isTrial && needsCardNow ? (
          <p
            style={{
              margin: '14px 0 0',
              fontSize: 13.5,
              color: '#5a6b80',
              textAlign: 'center',
            }}
          >
            Or{' '}
            <button
              type="button"
              onClick={onSwitchToCardless}
              style={linkStyle}
            >
              go back and start without a card
            </button>
          </p>
        ) : null}
      </div>
    </div>
  );
}
