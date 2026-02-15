import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

export const billingApi = createApi({
  reducerPath: 'billingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL || '') + '/billing',
    prepareHeaders: headers => {
      const token = Cookies.get('auth_token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
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

    confirmCard: builder.mutation<
      { message: string },
      { payment_method_id: string }
    >({
      query: body => ({
        url: '/confirm-card',
        method: 'POST',
        body,
      }),
    }),

    startSubscription: builder.mutation<
      any,
      { plan: 'monthly' | 'yearly'; is_trial: boolean }
    >({
      query: body => ({
        url: '/start-subscription',
        method: 'POST',
        body,
      }),
    }),

    changePlan: builder.mutation<any, { plan: 'monthly' | 'yearly' }>({
      query: body => ({
        url: '/change-plan',
        method: 'POST',
        body,
      }),
    }),

    getInvoices: builder.query<any[], void>({
      query: () => '/invoices',
    }),
    pauseSubscription: builder.mutation<any, void>({
      query: body => ({
        url: '/pause',
        method: 'POST',
        body,
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
  useChangePlanMutation,
  useGetInvoicesQuery,
  useStartSubscriptionMutation,
  usePauseSubscriptionMutation,
  useResumeSubscriptionMutation,
  usePortalMutation,
} = billingApi;
