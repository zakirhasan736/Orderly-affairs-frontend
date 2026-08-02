// types/billing.ts
export type BillingPlanId =
  | 'monthly'
  | 'yearly'
  | 'essentials'
  | 'advantage';

export type PlanType = 'trial' | BillingPlanId;

export interface BillingRecord {
  id: string;
  date: string;
  amount: string;
  status: 'Paid' | 'Failed';
  method: string;
  invoiceUrl?: string;
}

export interface BillingInfo {
  plan: PlanType;
  isTrial: boolean;
  trialEndsAt?: string;
  nextBillingDate?: string;
  amount?: string;
  cardBrand?: string;
  last4?: string;
  history: BillingRecord[];
}
