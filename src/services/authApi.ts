import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import { otpSessionHeaders } from '@/utils/otpSession';

export interface NextKinCreatePayload {
  email: string;
  full_name: string;
  relationship: string;
  phone_number?: string | null;
  access_level?: string;
  authorized_sections?: string[];
  immediate_access?: boolean;
  nok_letter_received?: boolean;
  master_password?: string | null;
  password_card_generated?: boolean;
  card_storage_location?: string | null;
  key_bag_location?: string | null;
  documents_bag_location?: string | null;
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

export interface NextKinOwnerSummary {
  id: string;
  email?: string;
  full_name?: string;
  status: 'alive' | 'deceased' | string;
}

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
  access_timing?: 'immediate' | 'upon_death' | string;
  nok_letter_received?: boolean;
  owner_id: string;
  owner?: NextKinOwnerSummary;
  nextkin: {
    id: string;
    email: string;
    full_name?: string;
    relationship?: string;
  };
  password_card_generated?: boolean;
  card_storage_location?: string | null;
  key_bag_location?: string | null;
  documents_bag_location?: string | null;
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

export interface ReportOwnerDeceasedResponse {
  status: 'deceased';
  already_reported: boolean;
  message: string;
  upon_death_granted?: number;
}
// SMS OTP
export interface SendSmsOtpRequest {
  email: string;
  phone_number?: string; // optional → only required if not saved
}

export interface VerifySmsOtpRequest {
  email: string;
  code: string;
}

export interface SmsOtpResponse {
  message: string;
  phone_number?: string;
  phone?: string;
  requires_phone?: boolean;
  cooldown_seconds?: number;
}

export interface OtpSecurityPayload {
  captcha_token?: string;
  otp_session_id?: string;
}

export interface SendEmailOtpRequest {
  email: string;
  captcha_token?: string;
  otp_session_id?: string;
}

export interface EmailOtpResponse {
  message: string;
  cooldown_seconds?: number;
}

export interface LoginResponse {
  message?: string;
  access_token?: string;
  mfa_required?: boolean;
  method?: MFAMethod;
  mfa_methods?: Partial<MFAMethods>;
  otp_sent?: boolean;
  otp_error?: string;
  cooldown_seconds?: number;
  mfa_challenge_token?: string;
  phone?: string;
}

export interface VerifyEmailCodeRequest {
  email: string;
  code: number;
  otp_session_id?: string;
}
export type MFAMethod = 'authenticator' | 'email' | 'sms';

export type MFAMethods = Record<MFAMethod, boolean>;

export interface OwnerMeResponse {
  email: string;
  phone?: string | null;
  role: string;
  mfa_enabled: boolean;
  primary_mfa?: MFAMethod | null;
  mfa_methods: Partial<MFAMethods>;
}
const NOK_SECURED = new Set([
  'getMyNextKinAccess',
  'nextkinLogout',
  'reportOwnerDeceased',
]);
const PUBLIC = new Set([
  'signup',
  'login',
  'nextkinLogin',
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
      const sessionHeaders = otpSessionHeaders();
      Object.entries(sessionHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
      return headers;
    },
  }),
  tagTypes: ['NextKin', 'NextKinAccess'],
  endpoints: builder => ({
    // Owner auth
    signup: builder.mutation({
      query: b => ({ url: '/signup', method: 'POST', body: b }),
    }),
    resumePendingSignup: builder.mutation({
      query: b => ({ url: '/resume-pending-signup', method: 'POST', body: b }),
    }),
    login: builder.mutation<LoginResponse, { email: string; password: string }>({
      query: b => ({ url: '/login', method: 'POST', body: b }),
    }),
    ownerLogout: builder.mutation({
      query: () => ({ url: '/owner-logout', method: 'POST' }),
    }),
    // Password reset
    requestPasswordReset: builder.mutation<
      { message: string },
      { email: string }
    >({
      query: body => ({
        url: '/request-password-reset',
        method: 'POST',
        body,
      }),
    }),

    resetPassword: builder.mutation<
      { message: string },
      { email: string; otp: string; new_password: string }
    >({
      query: body => ({
        url: '/reset-password',
        method: 'POST',
        body,
      }),
    }),
    // ==========================
    // 📱 SMS OTP
    // ==========================
    sendSmsOtp: builder.mutation<SmsOtpResponse, SendSmsOtpRequest>({
      query: body => ({
        url: '/send-sms-otp',
        method: 'POST',
        body,
      }),
    }),

    verifySmsOtp: builder.mutation<
      { access_token: string; message: string },
      VerifySmsOtpRequest & OtpSecurityPayload
    >({
      query: body => ({
        url: '/verify-sms-otp',
        method: 'POST',
        body,
      }),
    }),
    startSmsMfa: builder.mutation<
      SmsOtpResponse,
      { email: string; phoneNumber?: string } & OtpSecurityPayload & {
          mfa_challenge_token?: string;
        }
    >({
      query: body => ({
        url: '/start-sms-mfa',
        method: 'POST',
        body,
      }),
    }),
    startEmailMfa: builder.mutation<
      EmailOtpResponse,
      SendEmailOtpRequest & { mfa_challenge_token?: string }
    >({
      query: body => ({
        url: '/start-email-mfa',
        method: 'POST',
        body,
      }),
    }),
    resendSmsMfa: builder.mutation<
      SmsOtpResponse,
      { email: string } & OtpSecurityPayload
    >({
      query: body => ({
        url: '/resend-sms-mfa',
        method: 'POST',
        body,
      }),
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
        body: object;
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
    sendEmailOtp: builder.mutation<EmailOtpResponse, SendEmailOtpRequest>({
      query: b => ({ url: '/send-email', method: 'POST', body: b }),
    }),
    verifyEmailCode: builder.mutation<
      { access_token: string; message: string },
      VerifyEmailCodeRequest
    >({
      query: b => ({ url: '/verify-email', method: 'POST', body: b }),
    }),
    disableMfaMethod: builder.mutation<
      {
        message: string;
        mfa_enabled: boolean;
        primary_mfa?: MFAMethod | null;
        mfa_methods: MFAMethods;
      },
      { method: MFAMethod }
    >({
      query: b => ({ url: '/mfa/disable', method: 'POST', body: b }),
    }),

    // Session helpers
    refreshToken: builder.mutation({
      query: () => ({ url: '/refresh-token', method: 'POST' }),
    }),
    getMe: builder.query<OwnerMeResponse, void>({
      query: () => ({ url: '/me', method: 'GET' }),
    }),

    // NOK self access
    getMyNextKinAccess: builder.query<NextKinAccessResponse, void>({
      query: () => ({ url: '/nextkin-access', method: 'GET' }),
      providesTags: ['NextKinAccess'],
    }),
    reportOwnerDeceased: builder.mutation<ReportOwnerDeceasedResponse, void>({
      query: () => ({
        url: '/nextkin/report-owner-deceased',
        method: 'POST',
      }),
      invalidatesTags: ['NextKinAccess'],
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
  useReportOwnerDeceasedMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useSendSmsOtpMutation,
  useVerifySmsOtpMutation,
  useStartSmsMfaMutation,
  useStartEmailMfaMutation,
  useResendSmsMfaMutation,
  useResumePendingSignupMutation,
  useDisableMfaMethodMutation,
} = authApi;
