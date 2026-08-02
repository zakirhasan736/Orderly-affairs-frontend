/**
 * Signup / billing plan catalog (display only).
 * Stripe price IDs live on the backend (.env) — swap anytime without changing UI copy.
 */

/** Current signup plan — annual only. */
export type SubscriptionPlanId = 'yearly';

/** Legacy plan ids still accepted by the API during migration. */
export type LegacyPlanId = 'monthly' | 'essentials' | 'advantage';

export type BillingPlanId = SubscriptionPlanId | LegacyPlanId;

export type PlanFeature = {
  label: string;
  value: string;
};

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  title: string;
  /** Charged amount shown large — e.g. $199 */
  amount: string;
  /** e.g. / year */
  period: string;
  /** Exact charged amount (what order summary uses) */
  annualPrice: string;
  /** Struck-through list price */
  listPrice: string;
  /** e.g. 17 */
  discountPercent: number;
  /** Short line under the price */
  description: string;
  badge: string;
  /** Order-summary label */
  label: string;
  /** Order-summary note */
  note: string;
  features: PlanFeature[];
};

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> =
  {
    yearly: {
      id: 'yearly',
      title: 'Annual',
      amount: '$199',
      period: '/ year',
      annualPrice: '$199',
      listPrice: '$240',
      discountPercent: 17,
      description: 'Limited-time offer · billed annually after your free trial.',
      badge: '17% off',
      label: 'Annual plan',
      note: 'Limited-time $199/year (was $240)',
      features: [
        { label: 'Family Member Access', value: '5' },
        { label: 'Next of Kin Access', value: '5' },
        { label: 'Inbox Autopilot', value: '5 email addresses' },
        { label: 'AI Answers', value: 'Unlimited' },
        { label: 'Encrypted Vault', value: 'Yes' },
        { label: 'SecureLinks', value: 'Yes' },
        { label: 'Intelligent Reminders', value: 'Yes' },
        { label: 'Access Permissions', value: 'Full permissions' },
        { label: 'Priority Support', value: 'Chat and Email' },
        { label: 'Storage', value: '50 GB' },
      ],
    },
  };

export const DEFAULT_SUBSCRIPTION_PLAN: SubscriptionPlanId = 'yearly';

export const SUBSCRIPTION_PLAN_LIST: SubscriptionPlan[] = [
  SUBSCRIPTION_PLANS.yearly,
];

export function getSubscriptionPlan(
  _planId?: BillingPlanId | string | null,
): SubscriptionPlan {
  return SUBSCRIPTION_PLANS.yearly;
}

export function normalizeBillingPlanId(
  _planId?: BillingPlanId | string | null,
): SubscriptionPlanId {
  return 'yearly';
}
