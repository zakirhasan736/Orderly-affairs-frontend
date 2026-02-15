import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

export interface NextKinCreatePayload {
  email: string;
  full_name: string;
  relationship: string;
  phone_number?: string | null;
  access_level?: string;
  authorized_sections?: string[];
  immediate_access?: boolean;
  master_password?: string | null;
  password_card_generated?: boolean;
  card_storage_location?: string | null;
  special_instructions?: string | null;
}
export interface CreateNextKinSingleResponse {
  message: string;
  email: string;
  relationship: string;
  owner: string;
  id: string;
  temp_password_sent: boolean;
}
export interface CreateNextKinBulkItem {
  index: number;
  id?: string;
  email?: string;
  full_name?: string;
  relationship?: string;
  status: 'ok' | 'error';
  message?: string;
  error?: string;
}
export interface CreateNextKinBulkResponse { results: CreateNextKinBulkItem[] }

export interface NextKinAccessResponse {
  id: string;
  email: string;
  full_name?: string;
  relationship?: string;
  phone_number?: string | null;
  full_access: boolean;
  authorized_sections: 'all' | string[];
  access_level: string;
  immediate_access: boolean;
  owner_id: string;
  nextkin: {
    id: string;
    email: string;
    full_name?: string;
    relationship?: string;
  };
  password_card_generated?: boolean;
  card_storage_location?: string | null;
  special_instructions?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface AccessActionResponse {
  message: string;
  nextkin_email?: string;
  immediate_access?: boolean;
  updated?: number;
  emailed?: number;
  owner_id?: string;
}

const NOK_SECURED = new Set(['getMyNextKinAccess', 'nextkinLogout']);
const PUBLIC = new Set([
  'signup',
  'login',
  'nextkinLogin',
  'sendEmailOtp',
  'verifyEmailCode',
  'generateMfa',
  'linkAuthenticator',
  'verifyTotp',
]);

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL || '') + '/auth',
    credentials: 'include',
    prepareHeaders: (headers, api) => {
      if (!PUBLIC.has(api.endpoint)) {
        const token = NOK_SECURED.has(api.endpoint)
          ? Cookies.get('nok_auth_token')
          : Cookies.get('auth_token');
        if (token) headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['NextKin', 'NextKinAccess'],
  endpoints: builder => ({
    // Owner auth
    signup: builder.mutation({
      query: b => ({ url: '/signup', method: 'POST', body: b }),
    }),
    login: builder.mutation({
      query: b => ({ url: '/login', method: 'POST', body: b }),
    }),
    ownerLogout: builder.mutation({
      query: () => ({ url: '/owner-logout', method: 'POST' }),
    }),

    // NOK auth
    nextkinLogin: builder.mutation({
      query: b => ({ url: '/nextkin-login', method: 'POST', body: b }),
      invalidatesTags: ['NextKinAccess'],
    }),
    nextkinLogout: builder.mutation({
      query: () => ({ url: '/nextkin-logout', method: 'POST' }),
      invalidatesTags: ['NextKinAccess'],
    }),

    // Owner-only NOK management
    createNextKin: builder.mutation<
      CreateNextKinSingleResponse | CreateNextKinBulkResponse,
      NextKinCreatePayload | NextKinCreatePayload[]
    >({
      query: b => ({ url: '/create-nextkin', method: 'POST', body: b }),
      invalidatesTags: ['NextKin'],
    }),
    getMyNextKin: builder.query<NextKinAccessResponse[], void>({
      query: () => ({ url: '/my-nextkin', method: 'GET' }),
      providesTags: ['NextKin'],
    }),
    approveNextKinAccess: builder.mutation<AccessActionResponse, string>({
      query: id => ({
        url: `/approve-nextkin-access/${id}`,
        method: 'POST',
      }),
      invalidatesTags: ['NextKin', 'NextKinAccess'],
    }),

    revokeNextKinAccess: builder.mutation<AccessActionResponse, string>({
      query: id => ({ url: `/revoke-nextkin-access/${id}`, method: 'POST' }),
      invalidatesTags: ['NextKin', 'NextKinAccess'],
    }),
    revokeAllNextKinAccess: builder.mutation<AccessActionResponse, void>({
      query: () => ({ url: `/revoke-all-nextkin-access`, method: 'POST' }),
      invalidatesTags: ['NextKin', 'NextKinAccess'],
    }),
    approveAllNextKinAccess: builder.mutation<AccessActionResponse, void>({
      query: () => ({ url: `/approve-all-nextkin-access`, method: 'POST' }),
      invalidatesTags: ['NextKin', 'NextKinAccess'],
    }),
    updateNextKin: builder.mutation({
      query: ({
        nextkinId,
        body,
      }: {
        nextkinId: string;
        body: Record<string, any>;
      }) => ({
        url: `/update-nextkin/${nextkinId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['NextKin', 'NextKinAccess'],
    }),
    deleteNextKin: builder.mutation({
      query: (id: string) => ({
        url: `/delete-nextkin/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['NextKin', 'NextKinAccess'],
    }),

    // MFA/OTP shared
    verifyTotp: builder.mutation({
      query: b => ({ url: '/verify-totp', method: 'POST', body: b }),
    }),
    generateMfa: builder.mutation({
      query: b => ({ url: '/generate-mfa', method: 'POST', body: b }),
    }),
    linkAuthenticator: builder.mutation({
      query: b => ({ url: '/link-authenticator', method: 'POST', body: b }),
    }),
    sendEmailOtp: builder.mutation({
      query: b => ({ url: '/send-email', method: 'POST', body: b }),
    }),
    verifyEmailCode: builder.mutation({
      query: b => ({ url: '/verify-email', method: 'POST', body: b }),
    }),

    // Session helpers
    refreshToken: builder.mutation({
      query: () => ({ url: '/refresh-token', method: 'POST' }),
    }),
    getMe: builder.query({ query: () => ({ url: '/me', method: 'GET' }) }),

    // NOK self access
    getMyNextKinAccess: builder.query<NextKinAccessResponse, void>({
      query: () => ({ url: '/nextkin-access', method: 'GET' }),
      providesTags: ['NextKinAccess'],
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useNextkinLoginMutation,
  useOwnerLogoutMutation,
  useNextkinLogoutMutation,
  useCreateNextKinMutation,
  useGetMyNextKinQuery,
  useApproveNextKinAccessMutation,
  useUpdateNextKinMutation,
  useDeleteNextKinMutation,
  useGenerateMfaMutation,
  useLinkAuthenticatorMutation,
  useVerifyTotpMutation,
  useSendEmailOtpMutation,
  useVerifyEmailCodeMutation,
  useRefreshTokenMutation,
  useGetMeQuery,
  useRevokeNextKinAccessMutation,
  useRevokeAllNextKinAccessMutation,
  useApproveAllNextKinAccessMutation,
  useGetMyNextKinAccessQuery,
} = authApi;
