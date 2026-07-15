import { createApi } from '@reduxjs/toolkit/query/react';
import { createSecureBaseQuery } from '@/libs/baseQueryWithReauth';

export const billingApi = createApi({
  reducerPath: 'billingApi',
  baseQuery: createSecureBaseQuery('/billing'),
  endpoints: builder => ({
    getStatus: builder.query<any, void>({
      query: () => '/status',
    }),

    createCustomer: builder.mutation<any, void>({
      query: () => ({
        url: '/create-customer',
        method: 'POST',
      }),
    }),

    setupIntent: builder.mutation<any, void>({
      query: () => ({
        url: '/setup-intent',
        method: 'POST',
      }),
    }),

    confirmCard: builder.mutation<any, { payment_method_id: string }>({
      query: body => ({
        url: '/confirm-card',
        method: 'POST',
        body,
      }),
    }),

    startSubscription: builder.mutation<
      any,
      {
        plan: 'monthly' | 'yearly';
        is_trial: boolean;
        trial_mode?: 'cardless' | 'card_on_file';
      }
    >({
      query: body => ({
        url: '/start-subscription',
        method: 'POST',
        body,
      }),
    }),

    setAutoRenew: builder.mutation<any, { enabled: boolean }>({
      query: body => ({
        url: '/auto-renew',
        method: 'POST',
        body,
      }),
    }),

    attachCardDuringTrial: builder.mutation<
      any,
      { payment_method_id: string }
    >({
      query: body => ({
        url: '/attach-card-during-trial',
        method: 'POST',
        body,
      }),
    }),

    cancelSubscription: builder.mutation<any, void>({
      query: () => ({
        url: '/cancel',
        method: 'POST',
      }),
    }),

    reactivateSubscription: builder.mutation<any, void>({
      query: () => ({
        url: '/reactivate',
        method: 'POST',
      }),
    }),

    changePlan: builder.mutation<any, { plan: 'monthly' | 'yearly' }>({
      query: body => ({
        url: '/change-plan',
        method: 'POST',
        body,
      }),
    }),

    getInvoices: builder.query<any, void>({
      query: () => '/invoices',
    }),

    pauseSubscription: builder.mutation<any, { resume_at?: string } | void>({
      query: body => ({
        url: '/pause',
        method: 'POST',
        body: body ?? {},
      }),
    }),

    resumeSubscription: builder.mutation<any, void>({
      query: () => ({
        url: '/resume',
        method: 'POST',
      }),
    }),

    portal: builder.mutation<{ url: string }, void>({
      query: () => ({
        url: '/portal',
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useGetStatusQuery,
  useCreateCustomerMutation,
  useSetupIntentMutation,
  useConfirmCardMutation,
  useStartSubscriptionMutation,
  useSetAutoRenewMutation,
  useAttachCardDuringTrialMutation,
  useCancelSubscriptionMutation,
  useReactivateSubscriptionMutation,
  useChangePlanMutation,
  useGetInvoicesQuery,
  usePauseSubscriptionMutation,
  useResumeSubscriptionMutation,
  usePortalMutation,
} = billingApi;
