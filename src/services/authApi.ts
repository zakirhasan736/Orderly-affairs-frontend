import { createApi } from '@reduxjs/toolkit/query/react';
import { createSecureBaseQuery } from '@/libs/baseQueryWithReauth';
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

export interface FamilyMemberPayload {
  email: string;
  full_name: string;
  relationship: string;
  phone_number?: string | null;
  access_level?: string;
  authorized_sections?: string[];
  portal_role?: string;
  master_password?: string | null;
}

export interface FamilyMemberResponse {
  id: string;
  email: string;
  full_name?: string;
  relationship?: string;
  phone_number?: string | null;
  access_level: string;
  authorized_sections: string[];
  access_type: 'family';
  portal_role: string;
  immediate_access: boolean;
  has_master_password?: boolean;
  master_password?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface CreateNextKinSingleResponse {
  message: string;
  email: string;
  relationship: string;
  owner: string;
  id: string;
  temp_password_sent: boolean;
  master_password?: string | null;
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
  portal_role?: string;
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
  has_master_password?: boolean;
  /** Owner-only: returned by GET /my-nextkin for access cards / print. */
  master_password?: string | null;
  card_storage_location?: string | null;
  key_bag_location?: string | null;
  documents_bag_location?: string | null;
  special_instructions?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type PortalRoleId =
  | 'viewer'
  | 'editor'
  | 'portal_manager'
  | 'admin'
  | 'super_admin';

export interface PortalRoleOption {
  id: PortalRoleId | string;
  label: string;
  description: string;
  can_write: boolean;
  can_upload: boolean;
  can_manage_family_access?: boolean;
  can_manage_nextkin?: boolean;
  can_manage_billing?: boolean;
  can_view_vault_settings?: boolean;
}

export interface SectionFootprintActor {
  user_id?: string;
  full_name?: string;
  email?: string;
  role?: string;
  portal_role?: string | null;
  portal_role_label?: string;
  source?: string;
}

export interface SectionFootprintLatest {
  section_id: string;
  section_key?: string;
  updated_at?: string;
  actor: SectionFootprintActor;
}

export interface SectionFootprintSubsectionLatest {
  section_id: string;
  section_key?: string;
  scope_id: string;
  subsection_id?: string;
  updated_at?: string;
  actor: SectionFootprintActor;
}

export interface SectionFootprintHistoryItem {
  id: string;
  section_id: string;
  section_key?: string;
  source?: string;
  scopes?: string[];
  created_at: string;
  actor: SectionFootprintActor;
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
  already_sent?: boolean;
}

export interface OtpSecurityPayload {
  captcha_token?: string;
  otp_session_id?: string;
  /** Signup OTP — backend skips Cloudflare Turnstile */
  flow?: 'signup' | 'login';
}

export interface SendEmailOtpRequest {
  email: string;
  captcha_token?: string;
  otp_session_id?: string;
  mfa_challenge_token?: string;
  /** Signup OTP — backend skips Cloudflare Turnstile */
  flow?: 'signup' | 'login';
}

export interface EmailOtpResponse {
  message: string;
  cooldown_seconds?: number;
  already_sent?: boolean;
}

export interface LoginResponse {
  message?: string;
  authenticated?: boolean;
  mfa_required?: boolean;
  method?: MFAMethod;
  mfa_methods?: Partial<MFAMethods>;
  otp_sent?: boolean;
  otp_error?: string;
  cooldown_seconds?: number;
  mfa_challenge_token?: string;
  phone?: string;
  role?: string;
  email?: string;
  billing_status?: string;
  requires_billing?: boolean;
}

export interface VerifyEmailCodeRequest {
  email: string;
  code: number;
  otp_session_id?: string;
  mfa_challenge_token?: string;
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
const authBaseQuery = createSecureBaseQuery('/auth');

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: async (args, api, extraOptions) => {
    const prepared = typeof args === 'string' ? { url: args } : { ...args };
    const sessionHeaders = otpSessionHeaders();
    const headers = new Headers(prepared.headers as HeadersInit | undefined);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    Object.entries(sessionHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
    return authBaseQuery(
      { ...prepared, headers, credentials: 'include' },
      api,
      extraOptions,
    );
  },
  tagTypes: ['NextKin', 'NextKinAccess', 'Family'],
  endpoints: builder => ({
    // Owner auth
    signup: builder.mutation({
      query: b => ({ url: '/signup', method: 'POST', body: b }),
    }),
    resumePendingSignup: builder.mutation({
      query: b => ({
        url: '/resume-pending-signup',
        method: 'POST',
        body: b,
      }),
    }),
    login: builder.mutation<LoginResponse, { email: string; password: string; captcha_token?: string; otp_session_id?: string }>({
      query: b => ({ url: '/login', method: 'POST', body: b }),
    }),
    ownerLogout: builder.mutation({
      query: () => ({ url: '/owner-logout', method: 'POST' }),
    }),
    // Password reset
    requestPasswordReset: builder.mutation<
      { message: string },
      { email: string; captcha_token?: string; otp_session_id?: string }
    >({
      query: body => ({
        url: '/request-password-reset',
        method: 'POST',
        body,
      }),
    }),

    resetPassword: builder.mutation<
      { message: string },
      {
        email: string;
        otp: string;
        new_password: string;
        captcha_token?: string;
      }
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
      { authenticated?: boolean; message: string },
      VerifySmsOtpRequest &
        OtpSecurityPayload & { mfa_challenge_token?: string }
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
    getPortalRoles: builder.query<{ roles: PortalRoleOption[] }, void>({
      query: () => ({ url: '/portal-roles', method: 'GET' }),
    }),
    getSectionFootprints: builder.query<
      {
        latest: SectionFootprintLatest[];
        latest_subsections?: SectionFootprintSubsectionLatest[];
        history: SectionFootprintHistoryItem[];
      },
      { limit?: number; section_id?: string } | void
    >({
      query: args => {
        const params = new URLSearchParams();
        if (args?.limit) params.set('limit', String(args.limit));
        if (args?.section_id) params.set('section_id', args.section_id);
        const qs = params.toString();
        return {
          url: qs ? `/section-footprints?${qs}` : '/section-footprints',
          method: 'GET',
        };
      },
      providesTags: ['Family'],
      keepUnusedDataFor: 15,
    }),
    createFamilyMember: builder.mutation<
      {
        message: string;
        email: string;
        id: string;
        portal_role: string;
        master_password?: string;
        temp_password_sent?: boolean;
      },
      FamilyMemberPayload
    >({
      query: body => ({ url: '/create-family', method: 'POST', body }),
      invalidatesTags: ['Family'],
    }),
    getMyFamily: builder.query<FamilyMemberResponse[], void>({
      query: () => ({ url: '/my-family', method: 'GET' }),
      providesTags: ['Family'],
    }),
    updateFamilyMember: builder.mutation<
      { message: string; family_id: string; password_email_sent?: boolean },
      { id: string; body: Partial<FamilyMemberPayload> }
    >({
      query: ({ id, body }) => ({
        url: `/update-family/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Family'],
    }),
    deleteFamilyMember: builder.mutation<{ message: string; deleted_id: string }, string>(
      {
        query: id => ({ url: `/delete-family/${id}`, method: 'DELETE' }),
        invalidatesTags: ['Family'],
      },
    ),
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
      {
        authenticated?: boolean;
        message: string;
        requires_billing?: boolean;
        billing_status?: string;
        role?: string;
        email?: string;
      },
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
      {
        method: MFAMethod;
        password?: string;
        mfa_challenge_token?: string;
        step_up_token?: string;
      }
    >({
      query: b => ({ url: '/mfa/disable', method: 'POST', body: b }),
    }),
    deleteAccount: builder.mutation<
      {
        success: boolean;
        message: string;
        summary?: Record<string, unknown>;
      },
      {
        password: string;
        confirm: string;
        mfa_challenge_token?: string;
        step_up_token?: string;
      }
    >({
      query: b => ({ url: '/delete-account', method: 'POST', body: b }),
    }),

    // Session helpers
    getSession: builder.query<
      {
        authenticated: boolean;
        role?: string;
        email?: string;
        owner_id?: string;
      },
      void
    >({
      query: () => ({ url: '/session', method: 'GET' }),
    }),
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
    reportOwnerDeceased: builder.mutation<
      ReportOwnerDeceasedResponse,
      { master_password: string; confirm: boolean }
    >({
      query: body => ({
        url: '/nextkin/report-owner-deceased',
        method: 'POST',
        body,
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
  useGetPortalRolesQuery,
  useGetSectionFootprintsQuery,
  useCreateFamilyMemberMutation,
  useGetMyFamilyQuery,
  useUpdateFamilyMemberMutation,
  useDeleteFamilyMemberMutation,
  useApproveNextKinAccessMutation,
  useUpdateNextKinMutation,
  useDeleteNextKinMutation,
  useGenerateMfaMutation,
  useLinkAuthenticatorMutation,
  useVerifyTotpMutation,
  useSendEmailOtpMutation,
  useVerifyEmailCodeMutation,
  useGetSessionQuery,
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
  useDeleteAccountMutation,
} = authApi;
